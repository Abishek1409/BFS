'use strict';

// GET /api/admin/verify  header: Authorization: Bearer <token>
const { verify } = require('../../lib/jwt');

function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('Admin verify: JWT_SECRET missing');
    return res.status(500).json({ valid: false, error: 'Server not configured' });
  }

  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  const match = typeof auth === 'string' && auth.match(/^Bearer\s+(.+)$/i);
  const payload = match ? verify(match[1].trim(), secret) : null;

  if (!payload || payload.sub !== 'admin') {
    return res.status(401).json({ valid: false });
  }
  return res.status(200).json({ valid: true, exp: payload.exp });
}

module.exports = handler;
