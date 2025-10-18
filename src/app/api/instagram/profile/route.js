import { NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../../../../lib/firebase';

const db = getFirestore(app);

// Get Instagram profile data using stored access token
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

    // Find Instagram connector for this user
    const q = query(
      collection(db, 'sources'),
      where('userId', '==', userId),
      where('type', '==', 'connectors'),
      where('connectorId', '==', 'instagram')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'No Instagram account connected for this user' },
        { status: 404 }
      );
    }
    
    // Get the first Instagram connector (should only be one per user)
    const connectorDoc = querySnapshot.docs[0];
    const connector = connectorDoc.data();
    
    const { accessToken, instagramUserId } = connector.connectorData;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No Instagram access token found' },
        { status: 401 }
      );
    }
    
    // Fetch user profile from Instagram API
    const fields = 'id,username,media_count,account_type,biography';
    const profileResponse = await fetch(`https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`);
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('Instagram API error:', errorData);
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch Instagram profile' },
        { status: profileResponse.status }
      );
    }
    
    const profileData = await profileResponse.json();
    
    // For followers/following counts, we need to use the Facebook Graph API
    // which requires a Business or Creator account and additional permissions
    // For this demo, we'll return the profile data we can access
    return NextResponse.json({
      username: profileData.username,
      accountType: profileData.account_type,
      posts: profileData.media_count,
      bio: profileData.biography,
      id: profileData.id
    });
  } catch (error) {
    console.error('Instagram profile fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Instagram profile data' },
      { status: 500 }
    );
  }
}
