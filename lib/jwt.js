'use strict';

// Minimal HS256 JWT helpers using Node's built-in crypto (no dependencies).
const crypto = require('crypto');

const HEADER = { alg: 'HS256', typ: 'JWT' };

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function hmac(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

/** Sign a payload, adding iat and exp (iat + ttlSeconds). */
function sign(payload, secret, ttlSeconds) {
  const iat = nowSec();
  const body = { ...payload, iat, exp: iat + ttlSeconds };
  const data = b64url(JSON.stringify(HEADER)) + '.' + b64url(JSON.stringify(body));
  return data + '.' + hmac(data, secret);
}

/** Returns the payload, or null for malformed, tampered, or expired tokens. */
function verify(token, secret, now = nowSec()) {
  if (typeof token !== 'string' || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;

  if (!safeEqual(s, hmac(h + '.' + p, secret))) return null;

  try {
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
    if (header.alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time compare of sha256(input) against an expected hex digest. */
function checkPassword(input, expectedSha256Hex) {
  if (typeof input !== 'string' || typeof expectedSha256Hex !== 'string') return false;
  const actual = crypto.createHash('sha256').update(input, 'utf8').digest();
  const expected = Buffer.from(expectedSha256Hex.trim().toLowerCase(), 'hex');
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

module.exports = { sign, verify, checkPassword };
