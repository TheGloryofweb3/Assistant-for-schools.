/**
 * Vercel Serverless Function — /api/chat
 *
 * This replaces the old Express server. Vercel runs this on-demand in the
 * cloud, so it works whether or not any laptop/phone is turned on.
 *
 * The Groq API key lives in Vercel's Environment Variables (set in the
 * Vercel dashboard), never in this file and never in the frontend.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Simple in-memory rate limit per IP (resets whenever the function cold-starts,
// which is fine for basic abuse protection on a free tier).
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  hits.set(ip, entry);
  return entry.count > MAX_PER_WINDOW;
}

module.exports = async (req, res) => {
  // CORS — allow the frontend to call this from any origin (tighten later if you want).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = req.headers['x-forwarded-for'] || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Set it in Vercel → Project → Settings → Environment Variables.' });
    return;
  }

  const { messages, model = 'llama-3.3-70b-versatile', stream = true, temperature = 0.7 } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, stream, temperature }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      res.status(groqRes.status).json({ error: 'Groq API error', detail: errText });
      return;
    }

    if (stream && groqRes.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = groqRes.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await groqRes.json();
      res.status(200).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
