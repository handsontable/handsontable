// A Cloudflare Worker that holds the Jev API key and answers POST /api/classify.
// Any server that can keep a secret works the same way; only the framing differs.
//
// Request:  { type: 'noul' | 'score' | 'choice', prompt: string, options?: string[], row: object }
// Response: { value, confidence } for every type, plus `label` for score answers.
//
// Jev facts (https://docs.typesafe.ai/api, verified 2026-10-07):
// - POST https://api.typesafe.ai/v1/systemone with `Authorization: Bearer <key>`.
// - Body { model, state, questions }. `state` can be the row object. Type names are lowercase.
// - noul:   criteria optional           -> { type: 'noul', noul: 0..1 } (no confidence field)
// - choice: criteria { option: null }    -> { choice, probabilities, confidence }
// - score:  criteria [level, ...] (2-10) -> { score: 0..levels-1, legend, probabilities, confidence }
// - Errors: 400 invalid request, 401 bad key, 429 rate limit, 529 overloaded.

const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const JEV_MODEL = 'jev-latest';
const TYPES = new Set(['noul', 'score', 'choice']);
const MAX_ROW_BYTES = 4096;

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname !== '/api/classify') {
      return json({ error: 'Not found' }, 404);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    return classify(request, env);
  },
};

async function classify(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body must be JSON' }, 400);
  }

  const { type, prompt, options, row } = body ?? {};

  if (!TYPES.has(type) || typeof prompt !== 'string' || !prompt.trim()) {
    return json({ error: 'type must be noul, score, or choice, and prompt must be a string' }, 400);
  }

  if (!row || typeof row !== 'object' || JSON.stringify(row).length > MAX_ROW_BYTES) {
    return json({ error: `row must be an object under ${MAX_ROW_BYTES} bytes` }, 400);
  }

  const levels = Array.isArray(options) ? options.map(String) : [];
  const question = { type, instructions: prompt };

  if (type === 'choice') {
    question.criteria = Object.fromEntries(levels.map((option) => [option, null]));
  } else if (type === 'score') {
    question.criteria = levels;
  }

  const upstream = await fetch(JEV_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.JEV_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: JEV_MODEL, state: row, questions: { q: question } }),
  });

  if (!upstream.ok) {
    // Never forward the upstream body: it is not needed, and it must not leak.
    const status = upstream.status === 429 ? 429 : 502;

    return json({ error: 'Classifier request failed' }, status);
  }

  const { answers } = await upstream.json();

  return json(normalize(answers.q, levels));
}

// One shape for the grid, whatever Jev answered.
function normalize(answer, levels) {
  if (answer.type === 'noul') {
    // A single probability of "yes". Its distance from 0.5 is the confidence.
    return { value: round(answer.noul), confidence: round(Math.abs(2 * answer.noul - 1)) };
  }

  if (answer.type === 'score') {
    // `score` is a fractional position between the levels; normalize it to 0-1
    // and name the most likely level.
    const best = Object.entries(answer.probabilities).sort((a, b) => b[1] - a[1])[0][0];

    return {
      value: round(answer.score / Math.max(1, levels.length - 1)),
      confidence: round(answer.confidence),
      label: answer.legend?.[best] ?? levels[Number(best)],
    };
  }

  return { value: answer.choice, confidence: round(answer.confidence) };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

const round = (n) => Math.round(n * 1000) / 1000;
