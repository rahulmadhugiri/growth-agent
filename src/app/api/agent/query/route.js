import { NextResponse } from 'next/server';

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const COMPLETION_MODEL =
  process.env.OPENAI_COMPLETIONS_MODEL || 'gpt-4o-mini';
const PINECONE_TOP_K = Number(process.env.PINECONE_TOP_K || 20);
const PINECONE_SCORE_THRESHOLD = Number(
  process.env.PINECONE_SCORE_THRESHOLD || 0.35
);

const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_CHAT_URL =
  process.env.OPENAI_CHAT_COMPLETIONS_URL ||
  'https://api.openai.com/v1/chat/completions';

const DEFAULT_PINECONE_HOST =
  'https://growth-agent-wzpymxc.svc.aped-4627-b74a.pinecone.io';

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function inferSourceType(metadata = {}, fallbackUrl = '') {
  const rawType =
    metadata.pageType ||
    metadata.type ||
    metadata.category ||
    metadata.section ||
    metadata.group;

  if (typeof rawType === 'string' && rawType.trim()) {
    return rawType.trim();
  }

  const url = (metadata.url || fallbackUrl || '').toLowerCase();

  if (!url) return null;
  if (url.includes('wall-of-love')) return 'Wall of Love';
  if (url.includes('/customers/')) return 'Customer story';
  if (url.includes('/docs')) return 'Docs';
  if (url.includes('/blog')) return 'Blog';
  if (url.includes('/changelog')) return 'Changelog';
  if (url.includes('/oss')) return 'OSS Program';
  if (url.includes('/switch')) return 'Marketing';
  if (url.includes('/startups')) return 'Startups';
  return null;
}

function extractChunkText(metadata = {}) {
  const preferredKeys = [
    'text',
    'content',
    'chunk',
    'body',
    'pageContent',
    'raw',
    'snippet',
    'summary',
    'description',
    'value'
  ];

  for (const key of preferredKeys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const entityKeys = [
    'customers',
    'customer',
    'companies',
    'company',
    'clients',
    'brands',
    'testimonials',
    'quotes',
    'names',
    'title',
    'headline'
  ];

  for (const key of entityKeys) {
    const value = metadata[key];
    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .join('; ');
      if (joined) return joined;
    } else if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  // Fallback: concatenate any string-like metadata values
  const stringFragments = Object.values(metadata)
    .map((value) => {
      if (typeof value === 'string') return value.trim();
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean);

  return stringFragments.join('\n');
}

function buildContextString(matches) {
  const scoredMatches = matches.filter(
    (match) => typeof match?.score === 'number'
  );

  const highConfidence = scoredMatches.filter(
    (match) => match.score >= PINECONE_SCORE_THRESHOLD
  );

  const selected =
    highConfidence.length > 0
      ? highConfidence
      : scoredMatches.slice(0, Math.max(3, Math.min(5, PINECONE_TOP_K)));

  const contextEntries = selected
    .map((match, index) => {
      const text = extractChunkText(match.metadata);
      if (!text) return null;

      const sourceLabel =
        match.metadata?.title ||
        match.metadata?.heading ||
        match.metadata?.source ||
        match.metadata?.url ||
        null;

      const headerPieces = [
        `Chunk ${index + 1}`,
        sourceLabel ? `Source: ${sourceLabel}` : null,
        `Score: ${match.score?.toFixed ? match.score.toFixed(3) : match.score}`
      ].filter(Boolean);

      return `${headerPieces.join(' • ')}\n${text}`.trim();
    })
    .filter(Boolean);

  return contextEntries.join('\n\n');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const question = (body?.question || body?.query || '').trim();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    const openAiKey = requireEnv('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    const pineconeKey = requireEnv(
      'PINECONE_API_KEY',
      process.env.PINECONE_API_KEY
    );
    const pineconeHost =
      process.env.PINECONE_INDEX_HOST || DEFAULT_PINECONE_HOST;
    requireEnv('PINECONE_INDEX_HOST', pineconeHost);

    // 1. Embed the user's question
    const embedResponse = await fetch(OPENAI_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        input: question,
        model: EMBEDDING_MODEL
      })
    });

    if (!embedResponse.ok) {
      const errorPayload = await embedResponse.json().catch(() => ({}));
      console.error('OpenAI embedding error:', errorPayload);
      return NextResponse.json(
        {
          error: 'Failed to generate embedding for your question.',
          details: errorPayload?.error?.message || null
        },
        { status: 502 }
      );
    }

    const embedJson = await embedResponse.json();
    const embedding = embedJson?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      return NextResponse.json(
        { error: 'Embedding response was not in the expected format.' },
        { status: 502 }
      );
    }

    // 2. Query Pinecone for relevant context
    const pineconeResponse = await fetch(`${pineconeHost}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': pineconeKey
      },
      body: JSON.stringify({
        vector: embedding,
        topK: PINECONE_TOP_K,
        includeMetadata: true
      })
    });

    if (!pineconeResponse.ok) {
      const pineconeError = await pineconeResponse.json().catch(() => ({}));
      console.error('Pinecone query error:', pineconeError);
      return NextResponse.json(
        {
          error: 'Failed to retrieve relevant context from Pinecone.',
          details: pineconeError?.message || null
        },
        { status: 502 }
      );
    }

    const pineconeJson = await pineconeResponse.json();
    const matches = pineconeJson?.matches || [];

    const contextString = buildContextString(matches);

    if (!contextString) {
      return NextResponse.json({
        answer:
          "I couldn't find enough information in the knowledge base to answer that. Try adding more sources or asking a broader question.",
        sources: [],
        usage: {
          pineconeMatches: matches.length
        }
      });
    }

    // 3. Generate concise answer using the retrieved context
    const chatResponse = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: COMPLETION_MODEL,
        temperature: 0.1,
        max_tokens: 250,
        messages: [
          {
            role: 'system',
            content:
              'You answer questions using only the provided context. If the context does not contain the answer, clearly say you do not have enough information. When the user asks for lists (e.g., “who”, “which”, “what are”) respond with concise bullet points that explicitly name the entities from the context. Never invent information.'
          },
          {
            role: 'user',
            content: `Context:\n${contextString}\n\nQuestion: ${question}`
          }
        ]
      })
    });

    if (!chatResponse.ok) {
      const chatError = await chatResponse.json().catch(() => ({}));
      console.error('OpenAI chat error:', chatError);
      return NextResponse.json(
        {
          error: 'Failed to generate an answer.',
          details: chatError?.error?.message || null
        },
        { status: 502 }
      );
    }

    const chatJson = await chatResponse.json();
    const answer =
      chatJson?.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate an answer. Please try again.";

    const formattedSources = matches
      .filter((match) => typeof match?.score === 'number')
      .sort((a, b) => b.score - a.score)
      .map((match) => ({
        id: match.id,
        score: match.score,
        text: extractChunkText(match.metadata) || null,
        title:
          match.metadata?.title ||
          match.metadata?.heading ||
          match.metadata?.source ||
          null,
        url: match.metadata?.url || null,
        type: inferSourceType(match.metadata, match.metadata?.url || null)
      }));

    return NextResponse.json({
      answer,
      sources: formattedSources,
      usage: {
        pineconeMatches: matches.length,
        embedModel: EMBEDDING_MODEL,
        completionModel: COMPLETION_MODEL
      }
    });
  } catch (error) {
    console.error('Agent query route failed:', error);
    console.log("Operation result:", JSON.stringify(operation, null, 2));

    return NextResponse.json(
      {
        error:
          'Unexpected error while processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}
