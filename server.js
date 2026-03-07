const express = require('express');
const https = require('https');
const app = express();

// Allow requests from any origin (your Nova.ia frontend)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'nova-ia-proxy' }));

// OpenAI proxy — streams the response back
app.post('/openai', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });

  const body = JSON.stringify(req.body);

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    // Copy all headers (including streaming headers)
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      try { res.setHeader(k, v); } catch {}
    });
    // Stream directly
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) res.status(502).json({ error: err.message });
  });

  proxyReq.write(body);
  proxyReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nova.ia proxy running on port ${PORT}`));
