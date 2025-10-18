import { NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../../../../lib/firebase';

const db = getFirestore(app);

// Get TikTok profile data using stored access token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find TikTok connector for this user
    const q = query(
      collection(db, 'sources'),
      where('userId', '==', userId),
      where('type', '==', 'connectors'),
      where('connectorId', '==', 'tiktok')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'No TikTok account connected for this user' },
        { status: 404 }
      );
    }
    
    // Get the first TikTok connector
    const connectorDoc = querySnapshot.docs[0];
    const connector = connectorDoc.data();
    
    const { accessToken } = connector.connectorData;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No TikTok access token found' },
        { status: 401 }
      );
    }
    
    // Fetch user data from TikTok API
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'profile_deep_link', 'is_verified', 'follower_count', 'following_count', 'likes_count']
      })
    });
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('TikTok API error:', errorData);
      
      // Check if token expired
      if (errorData.error?.code === 'access_token_expired') {
        // In production, implement token refresh logic here
        return NextResponse.json(
          { error: 'Access token expired. Please reconnect your TikTok account.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch TikTok profile' },
        { status: userResponse.status }
      );
    }
    
    const userData = await userResponse.json();
    
    if (!userData.data || !userData.data.user) {
      return NextResponse.json(
        { error: 'TikTok returned an unexpected response format' },
        { status: 500 }
      );
    }
    
    const user = userData.data.user;
    
    // Return the profile data
    return NextResponse.json({
      displayName: user.display_name,
      username: user.display_name, // TikTok API doesn't provide username separately
      avatarUrl: user.avatar_url,
      profileUrl: user.profile_deep_link,
      isVerified: user.is_verified,
      followers: user.follower_count,
      following: user.following_count,
      likes: user.likes_count
    });
  } catch (error) {
    console.error('TikTok profile fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch TikTok profile data' },
      { status: 500 }
    );
  }
}
