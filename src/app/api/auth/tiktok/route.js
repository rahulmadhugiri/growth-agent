import { NextResponse } from 'next/server';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback';

// Start the TikTok OAuth process
export async function GET(request) {
  if (!TIKTOK_CLIENT_KEY) {
    return NextResponse.json(
      { error: 'TikTok Client Key is not configured.' },
      { status: 500 }
    );
  }

  // Create TikTok authorization URL
  // Scopes include: user.info.basic, video.list, video.upload
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user.info.basic,video.list&response_type=code&state=state`;

  // Return the URL for the client to redirect to
  return NextResponse.json({ authUrl });
}
