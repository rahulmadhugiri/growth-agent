import { NextResponse } from 'next/server';

const VEO_API_BASE_URL =
  process.env.VEO_API_BASE_URL ||
  'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_VEO_MODEL =
  process.env.VEO_MODEL || 'veo-3.1-generate-preview';
const POLL_INTERVAL_MS = Number(process.env.VEO_POLL_INTERVAL_MS || 4000);
const MAX_POLL_ATTEMPTS = Number(process.env.VEO_MAX_POLL_ATTEMPTS || 20);

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function buildRequestBody(prompt, orientationHint) {
  const duration = process.env.VEO_DURATION_SECONDS
    ? Number(process.env.VEO_DURATION_SECONDS)
    : undefined;

  const finalPrompt = `${prompt}\n\n${orientationHint}`;

  const instance = {
    prompt: finalPrompt,
    ...(Number.isFinite(duration) && duration > 0
      ? { durationSeconds: duration }
      : {})
  };

  return {
    instances: [instance]
  };
}

function extractVideoUrlFromResponse(response) {
  if (!response || typeof response !== 'object') return null;

  const samples =
    response.generateVideoResponse?.generatedSamples ||
    response.generatedSamples;
  if (Array.isArray(samples)) {
    for (const sample of samples) {
      const videoCandidate =
        sample?.video ||
        sample?.content ||
        sample?.asset ||
        sample?.data;
      if (videoCandidate) {
        const nestedUrl =
          videoCandidate.uri ||
          videoCandidate.url ||
          videoCandidate.downloadUri ||
          videoCandidate.download_url;
        if (nestedUrl) return nestedUrl;
      }
    }
  }

  if (response.videoUri) return response.videoUri;
  if (response.video_url) return response.video_url;

  if (response.video && typeof response.video === 'object') {
    if (response.video.uri) return response.video.uri;
    if (response.video.url) return response.video.url;
    if (response.video.downloadUri) return response.video.downloadUri;
    if (response.video.download_url) return response.video.download_url;
  }

  if (Array.isArray(response.videos)) {
    for (const video of response.videos) {
      if (!video) continue;
      if (video.uri) return video.uri;
      if (video.url) return video.url;
      if (video.downloadUri) return video.downloadUri;
      if (video.download_url) return video.download_url;
    }
  }

  if (Array.isArray(response.assets)) {
    for (const asset of response.assets) {
      if (
        asset &&
        asset.type === 'VIDEO' &&
        (asset.uri || asset.url || asset.downloadUri || asset.download_url)
      ) {
        return asset.uri || asset.url || asset.downloadUri || asset.download_url;
      }
    }
  }

  return null;
}

function extractVideoUrlFromOperation(operation) {
  if (!operation) return null;

  const response =
    operation.response ||
    operation.result ||
    operation.output ||
    operation.payload;

  return extractVideoUrlFromResponse(response);
}

function ensureApiKey(url, apiKey) {
  if (!url || !apiKey) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('key')) {
      parsed.searchParams.set('key', apiKey);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function pollOperation(operationName, apiKey) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const pollUrl = `${VEO_API_BASE_URL}/${operationName}?key=${apiKey}`;
    const pollResponse = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!pollResponse.ok) {
      const errorPayload = await pollResponse.json().catch(() => ({}));
      throw new Error(
        errorPayload?.error?.message ||
          'Failed to retrieve Veo job status. Check your API key and model.'
      );
    }

    const operation = await pollResponse.json();

    if (operation.error) {
      throw new Error(
        operation.error?.message ||
          'The Veo generation job failed. Please adjust your prompt and try again.'
      );
    }

    if (operation.done) {
      const videoUrl = extractVideoUrlFromOperation(operation);
      if (!videoUrl) {
        return {
          videoUrl: null,
          operation
        };
      }

      return {
        videoUrl: ensureApiKey(videoUrl, apiKey),
        operation
      };
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    'Timed out while waiting for the Veo video to finish generating. Please try again.'
  );
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const trimmedPrompt = (prompt || '').trim();

    if (!trimmedPrompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    const apiKey = requireEnv('VEO_API_KEY', process.env.VEO_API_KEY);
    const model = process.env.VEO_MODEL || DEFAULT_VEO_MODEL;
    const orientationHint =
      process.env.VEO_PORTRAIT_HINT ||
      'Please render the video in a vertical 9:16 portrait composition suitable for mobile.';

    const requestBody = buildRequestBody(trimmedPrompt, orientationHint);
    const params = new URLSearchParams({ key: apiKey });

    const rawProject =
      process.env.VEO_PROJECT_NAME ||
      process.env.VEO_3_PROJECT_NAME ||
      process.env.VEO_PROJECT_ID;
    const location = process.env.VEO_LOCATION || 'us-central1';

    const baseRequestUrl = `${VEO_API_BASE_URL}/models/${encodeURIComponent(
      model
    )}:predictLongRunning?${params.toString()}`;

    const projectRequestUrl =
      rawProject &&
      `${VEO_API_BASE_URL}/${
        rawProject.startsWith('projects/')
          ? rawProject
          : `projects/${rawProject}`
      }/locations/${location}/models/${encodeURIComponent(
        model
      )}:predictLongRunning?${params.toString()}`;

    const triedEndpoints = [];

    async function postToEndpoint(url) {
      triedEndpoints.push(url);
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    }

    let createResponse = await postToEndpoint(baseRequestUrl);

    if (!createResponse.ok && projectRequestUrl && createResponse.status === 404) {
      // Attempt project-scoped endpoint if available.
      createResponse = await postToEndpoint(projectRequestUrl);
    }

    if (!createResponse.ok) {
      let errorPayload = {};
      try {
        errorPayload = await createResponse.json();
      } catch {
        // Some failures (like 404) return empty bodies. Keep payload empty.
      }
      console.error('Veo create error:', errorPayload);
      return NextResponse.json(
        {
          error:
            errorPayload?.error?.message ||
            `Failed to start Veo video generation (HTTP ${createResponse.status}). Please verify your API key, model, and project configuration.`,
          triedEndpoints
        },
        { status: createResponse.status || 502 }
      );
    }

    const createPayload = await createResponse.json();
    const operationName =
      createPayload?.name ||
      createPayload?.operation?.name ||
      createPayload?.metadata?.operationName;

    if (!operationName) {
      const immediateUrl = extractVideoUrlFromResponse(createPayload);
      if (immediateUrl) {
        return NextResponse.json({
          videoUrl: ensureApiKey(immediateUrl, apiKey),
          jobId: null
        });
      }

      return NextResponse.json(
        {
          error:
            'Unexpected response from Veo. No operation name or video URL was provided.'
        },
        { status: 502 }
      );
    }

    const { videoUrl, operation } = await pollOperation(operationName, apiKey);

    return NextResponse.json({
      videoUrl,
      jobId: operationName,
      rawOperation: videoUrl ? undefined : operation
    });
  } catch (error) {
    console.error('Veo generation route failed:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to generate video with Veo right now. Please try again later.'
      },
      { status: 500 }
    );
  }
}
