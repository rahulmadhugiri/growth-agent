import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing required query parameter: url' },
        { status: 400 }
      );
    }

    const apiKey = process.env.VEO_API_KEY;
    const url = new URL(targetUrl);

    if (apiKey && !url.searchParams.has('key')) {
      url.searchParams.set('key', apiKey);
    }

    const externalResponse = await fetch(url.toString(), {
      method: 'GET'
    });

    if (!externalResponse.ok) {
      const text = await externalResponse.text().catch(() => null);
      return NextResponse.json(
        {
          error:
            text ||
            `Failed to download asset (status ${externalResponse.status}).`
        },
        { status: externalResponse.status || 502 }
      );
    }

    const arrayBuffer = await externalResponse.arrayBuffer();
    const headers = new Headers();
    headers.set(
      'Content-Type',
      externalResponse.headers.get('content-type') || 'application/octet-stream'
    );
    headers.set('Cache-Control', 'no-store');

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Veo download proxy failed:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to proxy Veo download right now. Please try again later.'
      },
      { status: 500 }
    );
  }
}
