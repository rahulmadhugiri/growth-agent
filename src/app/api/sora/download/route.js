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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server.' },
        { status: 500 }
      );
    }

    // Only add auth headers if it's an OpenAI URL
    const isOpenAIUrl = targetUrl.includes('openai.com') || targetUrl.includes('api.openai.com');
    const headers = isOpenAIUrl ? {
      Authorization: `Bearer ${apiKey}`,
      'OpenAI-Beta': 'video'
    } : {};

    console.log('Sora download proxy fetching:', {
      url: targetUrl.substring(0, 100),
      isOpenAIUrl,
      hasAuth: !!headers.Authorization
    });

    const externalResponse = await fetch(targetUrl, {
      method: 'GET',
      headers
    });

    console.log('Sora download proxy response:', {
      status: externalResponse.status,
      contentType: externalResponse.headers.get('content-type'),
      contentLength: externalResponse.headers.get('content-length')
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
    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      externalResponse.headers.get('content-type') || 'application/octet-stream'
    );
    responseHeaders.set('Cache-Control', 'no-store');

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Sora download proxy failed:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to proxy Sora download right now. Please try again later.'
      },
      { status: 500 }
    );
  }
}
