import { NextResponse } from 'next/server';

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback';

// Start the Instagram OAuth process
export async function GET(request) {
  if (!INSTAGRAM_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Instagram Client ID is not configured.' },
      { status: 500 }
    );
  }

  // Create Instagram authorization URL
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;

  // Return the URL for the client to redirect to
  return NextResponse.json({ authUrl });
}
