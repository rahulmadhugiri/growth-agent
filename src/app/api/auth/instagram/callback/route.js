import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import app from '../../../../../lib/firebase';

const db = getFirestore(app);

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback';

// Handle the OAuth callback from Instagram
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('state'); // We'll pass user ID in state parameter

    if (!code) {
      const error = searchParams.get('error') || 'No authorization code provided';
      const errorReason = searchParams.get('error_reason') || 'unknown';
      const errorDescription = searchParams.get('error_description') || 'No details available';
      
      console.error(`Instagram OAuth error: ${error}, reason: ${errorReason}, description: ${errorDescription}`);
      
      // Redirect to the dashboard with error
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent(errorDescription)}`);
    }

    if (!userId) {
      console.error('No user ID provided in state parameter');
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=Authentication%20failed:%20Invalid%20state`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for token:', errorText);
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent('Failed to authenticate with Instagram')}`);
    }

    const { access_token, user_id } = await tokenResponse.json();

    if (!access_token) {
      console.error('No access token returned from Instagram');
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent('Instagram did not provide an access token')}`);
    }

    // Get user details from Instagram
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${access_token}`);
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Failed to fetch user details:', errorText);
      return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent('Failed to fetch Instagram user details')}`);
    }
    
    const userData = await userResponse.json();

    // Save the connection to Firestore
    await setDoc(doc(collection(db, 'sources')), {
      userId,
      type: 'connectors',
      connectorId: 'instagram',
      name: `Instagram - ${userData.username || user_id}`,
      icon: '📷',
      connectorStatus: 'connected',
      connectorData: {
        instagramUserId: userData.id || user_id,
        username: userData.username,
        accountType: userData.account_type,
        accessToken: access_token,
        connectedAt: new Date().toISOString()
      },
      embedded: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Redirect back to the dashboard with success
    return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&success=true`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/dashboard?section=connectors&error=${encodeURIComponent(error.message || 'Unknown error occurred')}`);
  }
}
