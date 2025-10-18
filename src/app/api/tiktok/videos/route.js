import { NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../../../../lib/firebase';

const db = getFirestore(app);

// Get TikTok videos using stored access token
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
    
    // Get the TikTok connector
    const connectorDoc = querySnapshot.docs[0];
    const connector = connectorDoc.data();
    
    const { accessToken } = connector.connectorData;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No TikTok access token found' },
        { status: 401 }
      );
    }
    
    // Fetch videos from TikTok API
    const videosResponse = await fetch('https://open.tiktokapis.com/v2/video/list/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: ['id', 'title', 'cover_image_url', 'share_url', 'video_description', 'create_time', 'duration', 'height', 'width', 'view_count', 'like_count', 'comment_count', 'share_count'],
        max_count: limit
      })
    });
    
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error('TikTok videos API error:', errorData);
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch TikTok videos' },
        { status: videosResponse.status }
      );
    }
    
    const videosData = await videosResponse.json();
    
    if (!videosData.data || !videosData.data.videos) {
      return NextResponse.json({ videos: [] });
    }
    
    // Format and return the videos
    const formattedVideos = videosData.data.videos.map(video => ({
      id: video.id,
      title: video.title || '',
      description: video.video_description || '',
      coverUrl: video.cover_image_url,
      shareUrl: video.share_url,
      createdAt: video.create_time,
      duration: video.duration,
      dimensions: {
        height: video.height,
        width: video.width
      },
      stats: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0
      }
    }));
    
    return NextResponse.json({ videos: formattedVideos });
  } catch (error) {
    console.error('TikTok videos fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch TikTok videos' },
      { status: 500 }
    );
  }
}
