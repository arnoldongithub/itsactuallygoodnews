// /api/summarize.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    // Step 1: Extract article content (use Mercury Parser or similar)
    const mercuryRes = await fetch(`https://mercury.postlight.com/parser?url=${url}`, {
      headers: {
        'x-api-key': process.env.MERCURY_API_KEY
      }
    });
    const data = await mercuryRes.json();
    const articleText = data.content;

    // Step 2: Send to HuggingFace BART
    const hfRes = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: articleText })
    });

    const result = await hfRes.json();
    const summary = result[0]?.summary_text || 'No summary available.';

    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ error: 'Summarization failed', details: err.message });
  }
}
