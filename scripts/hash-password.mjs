// Prints the sha256 hex of a password for the ADMIN_PASSWORD_HASH env var.
// Usage: node scripts/hash-password.mjs "your-password"
import { createHash } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}

console.log(createHash('sha256').update(password, 'utf8').digest('hex'));
