import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import app from '../../../../../lib/firebase';

const db = getFirestore(app);

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback';

// Handle the OAuth callback from TikTok
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Should be validated in production
    
    // Extract userId from state (in production, use a secure state management system)
    // For demo, we're using the state directly as userId
    const userId = state;
    
    if (!code) {
      const error = searchParams.get('error') || 'No authorization code provided';
      const errorDescription = searchParams.get('error_description') || 'No details available';
      
      console.error(`TikTok OAuth error: ${error}, description: ${errorDescription}`);
      
      // Redirect to the dashboard with error
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent(errorDescription)}`);
    }

    if (!userId) {
      console.error('No user ID provided in state parameter');
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=Authentication%20failed:%20Invalid%20state`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for token:', errorText);
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent('Failed to authenticate with TikTok')}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, open_id } = tokenData;

    if (!access_token) {
      console.error('No access token returned from TikTok');
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent('TikTok did not provide an access token')}`);
    }

    // Get user info from TikTok
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name']
      })
    });
    
    let userData = { open_id };
    
    if (userResponse.ok) {
      const userInfo = await userResponse.json();
      if (userInfo.data && userInfo.data.user) {
        userData = {
          ...userData,
          displayName: userInfo.data.user.display_name,
          avatarUrl: userInfo.data.user.avatar_url
        };
      }
    } else {
      console.warn('Failed to fetch TikTok user info');
    }

    // Save the connection to Firestore
    await setDoc(doc(collection(db, 'sources')), {
      userId,
      type: 'connectors',
      connectorId: 'tiktok',
      name: `TikTok - ${userData.displayName || open_id}`,
      icon: '📱',
      connectorStatus: 'connected',
      connectorData: {
        tiktokUserId: open_id,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        accessToken: access_token,
        refreshToken: refresh_token,
        connectedAt: new Date().toISOString()
      },
      embedded: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Redirect back to the dashboard with success
    return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&success=true`);
  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent(error.message || 'Unknown error occurred')}`);
  }
}
