import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase-admin';

// Using server-specific Firebase initialization

// Get Instagram media (recent posts) using stored access token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
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
    
    // Get the Instagram connector
    const connectorDoc = querySnapshot.docs[0];
    const connector = connectorDoc.data();
    
    const { accessToken } = connector.connectorData;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No Instagram access token found' },
        { status: 401 }
      );
    }
    
    // First get user's media IDs
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id&limit=${limit}&access_token=${accessToken}`
    );
    
    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.json();
      console.error('Instagram media API error:', errorData);
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch Instagram media' },
        { status: mediaResponse.status }
      );
    }
    
    const mediaData = await mediaResponse.json();
    
    if (!mediaData.data || !mediaData.data.length) {
      return NextResponse.json({ posts: [] });
    }
    
    // Get detailed data for each media item
    const mediaIds = mediaData.data.map(item => item.id);
    const mediaDetailsPromises = mediaIds.map(async (mediaId) => {
      const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count';
      const mediaDetailResponse = await fetch(
        `https://graph.instagram.com/${mediaId}?fields=${fields}&access_token=${accessToken}`
      );
      
      if (!mediaDetailResponse.ok) {
        console.error(`Failed to fetch details for media ${mediaId}`);
        return null;
      }
      
      return await mediaDetailResponse.json();
    });
    
    const mediaDetailsResults = await Promise.all(mediaDetailsPromises);
    const validMediaDetails = mediaDetailsResults.filter(item => item !== null);
    
    return NextResponse.json({
      posts: validMediaDetails.map(post => ({
        id: post.id,
        caption: post.caption,
        mediaType: post.media_type,
        mediaUrl: post.media_url || post.thumbnail_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        likes: post.like_count || 0,
        comments: post.comments_count || 0
      }))
    });
  } catch (error) {
    console.error('Instagram media fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Instagram media data' },
      { status: 500 }
    );
  }
}
