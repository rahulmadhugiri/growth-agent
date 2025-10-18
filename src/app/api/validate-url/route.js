import { NextResponse } from 'next/server';

const TIMEOUT_MS = 7000;

function normalizeUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
    const url = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function probeUrl(url, signal) {
  try {
    const headResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal
    });

    if (headResponse.ok && headResponse.status < 400) {
      return headResponse;
    }

    // Some servers do not support HEAD; fall back to GET
    const getResponse = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal
    });

    // Stop reading the body if available; we only need status
    if (getResponse.body?.cancel) {
      try {
        await getResponse.body.cancel();
      } catch {
        // Ignore cancellation errors
      }
    }

    return getResponse;
  } catch (error) {
    throw error;
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
      return NextResponse.json(
        { valid: false, message: 'Enter a valid http(s) URL.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await probeUrl(normalizedUrl, controller.signal);
      clearTimeout(timeout);

      if (!response.ok || response.status >= 400) {
        return NextResponse.json(
          {
            valid: false,
            message: `The page responded with status ${response.status}.`
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        normalizedUrl,
        status: response.status,
        contentType: response.headers.get('content-type') || null
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { valid: false, message: 'Timed out while trying to reach the URL.' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { valid: false, message: 'We could not reach that URL.' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { valid: false, message: 'Invalid request payload.' },
      { status: 400 }
    );
  }
}
