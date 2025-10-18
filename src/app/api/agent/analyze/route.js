import { NextResponse } from 'next/server';

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const COMPLETION_MODEL =
  process.env.OPENAI_COMPLETIONS_MODEL || 'gpt-4o-mini';
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_CHAT_URL =
  process.env.OPENAI_CHAT_COMPLETIONS_URL ||
  'https://api.openai.com/v1/chat/completions';

const PINECONE_HOST =
  process.env.PINECONE_INDEX_HOST ||
  'https://growth-agent-wzpymxc.svc.aped-4627-b74a.pinecone.io';
const PINECONE_TOP_K = Number(process.env.PINECONE_ANALYZE_TOP_K || 40);
const PINECONE_SCORE_THRESHOLD = Number(
  process.env.PINECONE_ANALYZE_SCORE_THRESHOLD || 0.35
);
const MAX_SELECTED_MATCHES = Number(
  process.env.PINECONE_ANALYZE_SELECTION_LIMIT || 80
);
const CHUNK_SIZE = Number(process.env.ANALYZE_CHUNK_SIZE || 8);
const MAX_SNIPPET_CHARS = Number(process.env.ANALYZE_SNIPPET_CHARS || 700);
const MAX_PARTIALS = Number(process.env.ANALYZE_MAX_PARTIALS || 12);

const MODE_CONFIG = {
  discover: {
    defaultQuestion:
      'Without assuming prior knowledge, analyze this dataset and summarize the main topics, recurring ideas, and content types.',
    anchors: [
      'Overall summary of Mintlify content',
      'Product documentation overview',
      'Case studies for Mintlify customers',
      'Mintlify blog posts overview',
      'Wall of love testimonials from Mintlify users',
      'Mintlify marketing site value propositions'
    ],
    chunkSystemPrompt:
      'You help audit a documentation corpus. For each snippet, capture concrete facts about topics, recurring ideas, product areas, audience types, and page formats. Respond with 4-6 bullet points focusing strictly on the provided material—no speculation.',
    finalSystemPrompt:
      'You are summarizing a documentation corpus for a product team. Using only the collected notes, produce:\n1. **Overview** – 2-3 sentences covering the big picture.\n2. **Common Content Types** – bullet list of the most frequent page/section types.\n3. **Core Themes** – numbered list of 5-10 themes or concepts that define the dataset.\nAvoid repeating the same descriptive phrase in multiple sections. Keep the tone factual. Do not invent details not present in the notes.',
    pineconeTopK: 50
  },
  value: {
    defaultQuestion:
      'Extract value propositions, differentiation, and emotional appeal from the dataset.',
    anchors: [
      'Mintlify value propositions',
      'Mintlify customer success outcomes',
      'Mintlify marketing copy',
      'Mintlify differentiators',
      'Testimonials about Mintlify',
      'Mintlify product benefits'
    ],
    chunkSystemPrompt:
      'You analyze product marketing content. From each snippet, extract statements that showcase value, differentiation, proof points, or emotional appeal. Provide 4-6 bullet points highlighting concrete benefits or positioning angles, quoting short phrases when useful.',
    finalSystemPrompt:
      'You are producing a marketing insight summary. Using only the collected notes, deliver:\n1. **Value Proposition Summary** – short paragraph synthesizing key outcomes and benefits.\n2. **Top 5 Positioning Angles** – numbered list where each item names the angle and cites supporting evidence from the notes. Surface at least one concrete metric or quantified impact if the notes contain it.\n3. **Supporting Proof Points** – bullet list of short quotes or data points (max 5) that could be reused in copy.\nAvoid repeating identical phrasing across sections. Do not invent claims. Quote directly where possible.',
    pineconeTopK: 60
  },
  story: {
    defaultQuestion:
      "Craft a concise narrative describing Mintlify's product, audience, and differentiation.",
    anchors: [
      'Mintlify customer stories',
      'Mintlify product narrative',
      'Mintlify target audience',
      'Why teams choose Mintlify',
      'Mintlify marketing campaign messaging',
      'Quotes about Mintlify experience'
    ],
    chunkSystemPrompt:
      'You curate marketing story material. Pull out information about audience, problems solved, unique advantages, and emotional tone. Provide 4-6 bullet points emphasizing vivid quotes or narrative beats.',
    finalSystemPrompt:
      'You are writing a concise story for a marketing campaign using only the supplied notes. Produce:\n1. **Narrative Summary** – ~3 sentences covering who it is for, what it does, why it matters, and what makes it unique. Consolidate repeated praise about design into a single mention such as “beautiful, code-native documentation platform.” If you mention being a partner rather than a vendor, follow it immediately with the emotional impact (e.g., “fostering a sense of partnership and trust”).\n2. **Key Messages** – 3-5 bullets capturing the core storyline elements without repeating the same descriptor twice.\n3. **Reusable Quotes** – up to 5 short quotes or paraphrased lines that could appear in copy. Append the quote’s source name (e.g., Docs, Wall of Love) or URL host when available.\nStay faithful to the notes. Quote directly when possible.',
    pineconeTopK: 60
  }
};

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function truncateText(text = '', maxLength = MAX_SNIPPET_CHARS) {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
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

  const fragments = Object.values(metadata)
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

  return fragments.join('\n');
}

async function embedText(openAiKey, text) {
  const response = await fetch(OPENAI_EMBEDDING_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: EMBEDDING_MODEL
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Failed to generate embedding for analysis.'
    );
  }

  const payload = await response.json();
  return payload?.data?.[0]?.embedding;
}

async function queryPinecone(pineconeKey, vector, topK) {
  const response = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': pineconeKey
    },
    body: JSON.stringify({
      vector,
      topK,
      includeMetadata: true
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.message || 'Failed to retrieve relevant context from Pinecone.'
    );
  }

  const payload = await response.json();
  return payload?.matches || [];
}

function dedupeMatches(matchesArray) {
  const byId = new Map();
  for (const match of matchesArray) {
    if (!match?.id) continue;
    const existing = byId.get(match.id);
    if (!existing || (match.score || 0) > (existing.score || 0)) {
      byId.set(match.id, match);
    }
  }
  return Array.from(byId.values());
}

function selectMatches(matches, limit = MAX_SELECTED_MATCHES) {
  const sorted = [...matches].sort((a, b) => (b.score || 0) - (a.score || 0));
  return sorted.slice(0, limit);
}

function buildSourceList(matches, limit = 10) {
  const byUrl = new Map();
  for (const match of matches) {
    const url = match.metadata?.url || match.id;
    if (!url) continue;
    const existing = byUrl.get(url);
    if (!existing || (match.score || 0) > (existing.score || 0)) {
      byUrl.set(url, {
        id: match.id,
        title:
          match.metadata?.title ||
          match.metadata?.heading ||
          match.metadata?.source ||
          'Source',
        url: match.metadata?.url || null,
        score: match.score || null,
        type: inferSourceType(match.metadata, match.metadata?.url || null)
      });
    }
  }
  return Array.from(byUrl.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

function chunkArray(array, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function formatChunkForPrompt(chunk) {
  return chunk
    .map((match, index) => {
      const text = truncateText(
        extractChunkText(match.metadata || {}) || match.metadata?.raw || ''
      );
      const title =
        match.metadata?.title ||
        match.metadata?.heading ||
        match.metadata?.source ||
        'Untitled';
      const url = match.metadata?.url || 'N/A';
      const score =
        typeof match.score === 'number'
          ? match.score.toFixed(3)
          : String(match.score ?? '');

      return `Snippet ${index + 1}:
Title: ${title}
URL: ${url}
Score: ${score}
Text: ${text}`;
    })
    .join('\n\n');
}

async function summarizeChunk(openAiKey, chunk, systemPrompt) {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: COMPLETION_MODEL,
      temperature: 0.1,
      max_tokens: 350,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formatChunkForPrompt(chunk) }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Failed to summarize corpus chunk.'
    );
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

async function synthesizeFinal(openAiKey, partialSummaries, systemPrompt) {
  const trimmedPartials = partialSummaries
    .map((summary) => summary.trim())
    .filter(Boolean)
    .slice(0, MAX_PARTIALS);

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: COMPLETION_MODEL,
      temperature: 0.1,
      max_tokens: 750,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: trimmedPartials
            .map((summary, index) => `Chunk Summary ${index + 1}:\n${summary}`)
            .join('\n\n')
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Failed to synthesize final summary.'
    );
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

async function collectMatches({
  modeConfig,
  question,
  openAiKey,
  pineconeKey
}) {
  const prompts = new Set([question, ...modeConfig.anchors]);
  const embeddings = await Promise.all(
    Array.from(prompts).map((prompt) => embedText(openAiKey, prompt))
  );

  const allMatches = [];
  for (const vector of embeddings) {
    if (!vector) continue;
    const matches = await queryPinecone(
      pineconeKey,
      vector,
      modeConfig.pineconeTopK || PINECONE_TOP_K
    );
    const filtered = matches.filter(
      (match) => (match.score || 0) >= PINECONE_SCORE_THRESHOLD
    );
    allMatches.push(...(filtered.length ? filtered : matches));
  }

  return dedupeMatches(allMatches);
}

function countUniqueQuotes(text = '') {
  if (!text) return 0;
  const regex = /“([^”]+)”|"([^"]+)"/g;
  const quotes = new Set();
  let match;
  while ((match = regex.exec(text))) {
    const captured = match[1] || match[2];
    if (captured) {
      quotes.add(captured.trim());
    }
  }
  return quotes.size;
}

export async function POST(request) {
  try {
    const { question, mode: rawMode } = await request.json();
    const mode = (rawMode || 'discover').toLowerCase();
    const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.discover;
    const cleanedQuestion = (question || '').trim() || modeConfig.defaultQuestion;

    const openAiKey = requireEnv('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    const pineconeKey = requireEnv(
      'PINECONE_API_KEY',
      process.env.PINECONE_API_KEY
    );

    const allMatches = await collectMatches({
      modeConfig,
      question: cleanedQuestion,
      openAiKey,
      pineconeKey
    });

    if (allMatches.length === 0) {
      return NextResponse.json(
        {
          answer:
            "I couldn't gather enough relevant material from the knowledge base to complete that analysis. Try adding more sources or refining the dataset.",
          sources: [],
          mode
        },
        { status: 200 }
      );
    }

    const selected = selectMatches(allMatches);
    const chunks = chunkArray(selected, CHUNK_SIZE);

    const urlSet = new Set();
    const pageTypes = new Set();

    selected.forEach((match) => {
      const url = match.metadata?.url || match.id || null;
      if (url) urlSet.add(url);
      const type = inferSourceType(match.metadata, match.metadata?.url || null);
      if (type) {
        const normalized = type.toLowerCase().replace(/\s+/g, '-');
        pageTypes.add(normalized);
      }
    });

    const partialSummaries = [];
    for (const chunk of chunks) {
      const summary = await summarizeChunk(
        openAiKey,
        chunk,
        modeConfig.chunkSystemPrompt
      );
      if (summary) partialSummaries.push(summary);
    }

    const finalSummary = await synthesizeFinal(
      openAiKey,
      partialSummaries,
      modeConfig.finalSystemPrompt
    );

    const sources = buildSourceList(selected);
    const metadata = {
      urls_touched: urlSet.size,
      page_types: Array.from(pageTypes),
      unique_quotes: countUniqueQuotes(finalSummary),
      partials_compiled: partialSummaries.length
    };

    return NextResponse.json({
      answer: finalSummary || 'No summary generated.',
      sources,
      metadata,
      mode,
      usage: {
        analyzedSnippets: selected.length,
        partialSummaries: partialSummaries.length,
        model: COMPLETION_MODEL
      }
    });
  } catch (error) {
    console.error('Analyze route failed:', error);
    return NextResponse.json(
      {
        error:
          'Unable to complete the analysis right now. Please try again or refine the request.',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}
