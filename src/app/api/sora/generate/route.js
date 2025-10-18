import { NextResponse } from 'next/server';

const OPENAI_API_URL =
  process.env.OPENAI_SORA_BASE_URL || 'https://api.openai.com/v1';
const DEFAULT_SORA_MODEL =
  process.env.OPENAI_SORA_MODEL || 'sora-2';
const POLL_INTERVAL_MS = Number(process.env.SORA_POLL_INTERVAL_MS || 5000);
const MAX_POLL_ATTEMPTS = Number(process.env.SORA_MAX_POLL_ATTEMPTS || 60); // 5 minutes at 5 second intervals

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function buildRequestBody(prompt, orientationHint) {
  const finalPrompt = `${prompt}\n\n${orientationHint}`;
  const body = {
    model: process.env.OPENAI_SORA_MODEL || DEFAULT_SORA_MODEL,
    prompt: finalPrompt
  };
  
  // Duration is now handled separately with the 'seconds' parameter
  return body;
}

function extractVideoUrl(job) {
  if (!job || typeof job !== 'object') return null;

  // CRITICAL: Sora API returns video URL in data array: response.data[0].url
  if (Array.isArray(job.data) && job.data.length > 0 && job.data[0]?.url) {
    return job.data[0].url;
  }

  // Check top-level url fields
  if (job.url) return job.url;
  if (job.videoUrl) return job.videoUrl;
  if (job.video_url) return job.video_url;
  if (job.download_url) return job.download_url;
  if (job.video?.download_url) return job.video.download_url;
  if (job.video?.url) return job.video.url;

  if (job.assets?.video?.download_url) return job.assets.video.download_url;
  if (job.assets?.video?.url) return job.assets.video.url;

  if (Array.isArray(job.assets)) {
    for (const asset of job.assets) {
      if (!asset) continue;
      if (asset.type === 'video' || asset.mime_type?.includes('video')) {
        if (asset.download_url) return asset.download_url;
        if (asset.url) return asset.url;
      }
    }
  }

  if (Array.isArray(job.output)) {
    for (const item of job.output) {
      if (!item) continue;
      if (item.url) return item.url;
      if (Array.isArray(item.content)) {
        for (const part of item.content) {
          if (!part) continue;
          if (part.type === 'video' && part.url) return part.url;
          if (part.asset_url) return part.asset_url;
        }
      }
    }
  }

  if (Array.isArray(job.files)) {
    for (const file of job.files) {
      if (!file) continue;
      if (file.url) return file.url;
      if (file.download_url) return file.download_url;
    }
  }

  return null;
}

function ensureDownloadFlag(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('download')) {
      parsed.searchParams.set('download', '1');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function pollJob(jobId, apiKey) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    let job = null;
    let lastError = null;

    const endpoints = [
      `${OPENAI_API_URL}/operations/${jobId}`,
      `${OPENAI_API_URL}/videos/${jobId}`
    ];

    for (const url of endpoints) {
      const statusResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'video'
        }
      });

      if (statusResponse.ok) {
        try {
          job = await statusResponse.json();
        } catch (parseError) {
          lastError = parseError;
          continue;
        }
        break;
      }
      const errorPayload = await statusResponse.json().catch(() => ({}));
      lastError =
        errorPayload?.error?.message ||
        `Failed to fetch Sora job status from ${url}`;
    }

    if (!job) {
      if (lastError) {
        throw new Error(lastError);
      }
      throw new Error('Failed to retrieve Sora job status from OpenAI.');
    }

    // Log polling progress
    const elapsedSeconds = attempt * (POLL_INTERVAL_MS / 1000);
    console.log(`Sora polling (${elapsedSeconds}s): status=${job.status}, progress=${job.progress || 'N/A'}`);


    if (job.status === 'succeeded' || job.status === 'completed') {
      console.log('Sora job completed, checking for video URL. Job object keys:', Object.keys(job));
      
      const videoUrl = extractVideoUrl(job);
      if (videoUrl) {
        console.log('Found video URL in job response:', videoUrl.substring(0, 100));
        return { videoUrl: ensureDownloadFlag(videoUrl), job };
      }
      
      console.log('No video URL found in job response, trying multiple endpoints');
      
      // Try multiple possible endpoints to retrieve the video
      const possibleEndpoints = [
        `${OPENAI_API_URL}/videos/${jobId}/content`,
        `${OPENAI_API_URL}/videos/${jobId}/file`,
        `${OPENAI_API_URL}/videos/${jobId}`,
        `${OPENAI_API_URL}/files/${jobId}/content`,
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          
          const videoResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'OpenAI-Beta': 'video',
              'Accept': 'video/mp4, application/json'
            }
          });
          
          console.log(`  Response: ${videoResponse.status} ${videoResponse.statusText}, Content-Type: ${videoResponse.headers.get('content-type')}`);
          
          if (videoResponse.ok) {
            const contentType = videoResponse.headers.get('content-type') || '';
            
            // If it returns video data directly
            if (contentType.includes('video')) {
              console.log('✓ Found video endpoint:', endpoint);
              return { videoUrl: endpoint, job };
            }
            
            // If it returns JSON
            if (contentType.includes('json')) {
              try {
                const videoData = await videoResponse.json();
                console.log('  JSON structure:', Object.keys(videoData));
                
                // Check for data array
                if (videoData.data && Array.isArray(videoData.data) && videoData.data[0]?.url) {
                  const url = videoData.data[0].url;
                  console.log('✓ Found video URL in data array:', url.substring(0, 100));
                  return { videoUrl: ensureDownloadFlag(url), job };
                }
                
                // Try to extract URL
                const extractedUrl = extractVideoUrl(videoData);
                if (extractedUrl) {
                  console.log('✓ Found video URL via extraction:', extractedUrl.substring(0, 100));
                  return { videoUrl: ensureDownloadFlag(extractedUrl), job };
                }
              } catch (jsonErr) {
                console.warn('  Failed to parse JSON:', jsonErr.message);
              }
            }
          }
        } catch (err) {
          console.log(`  Error: ${err.message}`);
        }
      }
      
      // If all attempts fail, return without URL
      console.log('All video retrieval attempts failed, returning without URL');
      return { videoUrl: null, job };
    }

    if (
      job.status === 'failed' ||
      job.status === 'cancelled' ||
      job.status === 'rejected'
    ) {
      throw new Error(
        job.error?.message ||
          'The Sora generation job failed. Please adjust your prompt and try again.'
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  const timeoutMinutes = Math.round((MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 60000);
  throw new Error(
    `Sora video generation timed out after ${timeoutMinutes} minutes. The video may still be processing. Please try again or check your OpenAI dashboard.`
  );
}

export async function POST(request) {
  try {
    const { prompt, duration } = await request.json();
    const trimmedPrompt = (prompt || '').trim();

    if (!trimmedPrompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    const apiKey = requireEnv('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    const model = process.env.OPENAI_SORA_MODEL || DEFAULT_SORA_MODEL;
    const orientationHint =
      process.env.SORA_PORTRAIT_HINT ||
      'Please render the video in a vertical 9:16 portrait composition suitable for mobile.';

    const requestBody = buildRequestBody(trimmedPrompt, orientationHint);
    requestBody.model = model;
    
    // Handle duration parameter - Sora API only accepts specific string values: '4', '8', or '12'
    if (duration) {
      // Convert to number for comparison, but send as string
      const durationSeconds = Number(duration);
      if (!isNaN(durationSeconds)) {
        // Map the requested duration to the closest allowed value
        let allowedValue = '4';
        
        if (durationSeconds >= 10) {
          allowedValue = '12';
        } else if (durationSeconds >= 6) {
          allowedValue = '8';
        }
        
        requestBody.seconds = allowedValue;
        console.log(`Setting video length to ${allowedValue} seconds (requested: ${durationSeconds})`);
      }
    } else if (process.env.SORA_DURATION_SECONDS) {
      // Fall back to env var if available
      const envDuration = process.env.SORA_DURATION_SECONDS;
      // Ensure it's one of the allowed values
      if (['4', '8', '12'].includes(envDuration)) {
        requestBody.seconds = envDuration;
      } else {
        // Default to '4' if not a valid value
        requestBody.seconds = '4';
      }
      console.log(`Using video length of ${requestBody.seconds} seconds`);
    } else {
      // Default to 4 seconds if not specified
      requestBody.seconds = '4';
      console.log('Using default length of 4 seconds');
    }

    const createResponse = await fetch(
      `${OPENAI_API_URL}/videos`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'video'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!createResponse.ok) {
      let errorPayload = {};
      try {
        errorPayload = await createResponse.json();
      } catch {
        // ignore parsing errors
      }
      console.error('Sora create error:', errorPayload);
      return NextResponse.json(
        {
          error:
            errorPayload?.error?.message ||
            'Failed to start Sora video generation. Please try again.'
        },
        { status: createResponse.status || 502 }
      );
    }

    const createPayload = await createResponse.json();
    const jobId =
      createPayload?.id ||
      createPayload?.job?.id ||
      createPayload?.data?.id;

    if (!jobId) {
      const immediateUrl = extractVideoUrl(createPayload);
      if (immediateUrl) {
        return NextResponse.json({
          videoUrl: ensureDownloadFlag(immediateUrl),
          jobId: null
        });
      }

      return NextResponse.json(
        {
          error:
            'Unexpected response from Sora. No job identifier or video URL was provided.'
        },
        { status: 502 }
      );
    }

    const { videoUrl, job } = await pollJob(jobId, apiKey);

    console.log('Sora generation completed:', {
      jobId,
      hasVideoUrl: !!videoUrl,
      videoUrl: videoUrl ? videoUrl.substring(0, 100) + '...' : null,
      jobStatus: job?.status
    });

    return NextResponse.json({
      videoUrl,
      jobId,
      rawJob: videoUrl ? undefined : job
    });
  } catch (error) {
    console.error('Sora generation route failed:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Unable to generate video with Sora right now. Please try again later.'
      },
      { status: 500 }
    );
  }
}
