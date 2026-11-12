'use strict';

// POST /api/admin/login  body: { "password": string }
// Env: ADMIN_PASSWORD_HASH (sha256 hex), JWT_SECRET (min 32 chars)
const { sign, checkPassword } = require('../../lib/jwt');

const TTL_SECONDS = 8 * 60 * 60; // 8 hours (Req 2.2)
const FAIL_DELAY_MS = 400; // slows brute force attempts

function readPassword(body) {
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return null; }
  }
  return body && typeof body.password === 'string' ? body.password : null;
}

async function handler(req, res, { delayMs = FAIL_DELAY_MS } = {}) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.JWT_SECRET;
  if (!hash || !secret || secret.length < 32) {
    console.error('Admin login: ADMIN_PASSWORD_HASH or JWT_SECRET missing/too short');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const password = readPassword(req.body);
  if (password === null || !checkPassword(password, hash)) {
    await new Promise((r) => setTimeout(r, delayMs));
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = sign({ sub: 'admin' }, secret, TTL_SECONDS);
  const exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).exp;
  return res.status(200).json({ token, exp });
}

module.exports = handler;
