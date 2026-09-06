/**
 * Netlify Serverless Function: verify-turnstile
 * Endpoint: POST /.netlify/functions/verify-turnstile
 *
 * Canonical server-side Cloudflare Turnstile siteverify
 */

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const token = payload.token || payload['cf-turnstile-response'];

    if (!token || typeof token !== 'string' || token.length > 2048) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Token Turnstile tidak valid' })
      };
    }

    let secretKey = process.env.TURNSTILE_SECRET;
    if (!secretKey) {
      try {
        const envPath = require('path').resolve(__dirname, '../../.env');
        if (require('fs').existsSync(envPath)) {
          const envContent = require('fs').readFileSync(envPath, 'utf8');
          const m = envContent.match(/TURNSTILE_SECRET=([^\r\n]+)/);
          if (m) secretKey = m[1].trim();
        }
      } catch (e) {}
    }
    const clientIp = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'])) || '';

    const params = new URLSearchParams({
      secret: secretKey,
      response: token
    });
    if (clientIp) params.append('remoteip', clientIp);

    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10000)
    });

    if (!cfRes.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Gagal menghubungi server Cloudflare' })
      };
    }

    const cfData = await cfRes.json();
    if (cfData.success) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, hostname: cfData.hostname })
      };
    } else {
      console.warn('Turnstile siteverify rejected:', cfData['error-codes']);
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, errors: cfData['error-codes'] })
      };
    }
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
