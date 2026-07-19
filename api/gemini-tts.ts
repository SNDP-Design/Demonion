import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_MODEL_FALLBACK_ORDER = [
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceName = 'Kore', preferredModel = 'gemini-3.5-flash', clientApiKey } = req.body || {};

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  // Read backend GEMINI_API_KEY from process.env (or fallback to client provided key if passed)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || clientApiKey;

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured on server' 
    });
  }

  const startIdx = GEMINI_MODEL_FALLBACK_ORDER.indexOf(preferredModel);
  const modelsToTry = startIdx >= 0
    ? [...GEMINI_MODEL_FALLBACK_ORDER.slice(startIdx), ...GEMINI_MODEL_FALLBACK_ORDER.slice(0, startIdx)]
    : GEMINI_MODEL_FALLBACK_ORDER;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `Narrate the following text clearly: ${text}` }]
            }
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName
                }
              }
            }
          }
        })
      });

      if (!apiRes.ok) {
        console.warn(`[Backend Gemini TTS] Model ${model} returned ${apiRes.status}. Trying next model...`);
        continue;
      }

      const data = await apiRes.json();
      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (inlineData && inlineData.data) {
        return res.status(200).json({
          success: true,
          mimeType: inlineData.mimeType || 'audio/wav',
          audioBase64: inlineData.data,
          modelUsed: model
        });
      }
    } catch (err) {
      console.warn(`[Backend Gemini TTS] Model ${model} fetch exception:`, err);
    }
  }

  return res.status(500).json({ 
    error: 'All Gemini API models in fallback sequence failed to generate audio.' 
  });
}
