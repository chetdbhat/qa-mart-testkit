import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const lockPath = new URL('package-lock.json', root);
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
let normalized = 0;
for (const entry of Object.values(lock.packages)) {
  if (!entry.resolved) continue;
  const resolved = new URL(entry.resolved);
  if (resolved.hostname.includes('internal-verdaccio')) {
    resolved.protocol = 'https:';
    resolved.hostname = 'registry.npmjs.org';
    resolved.port = '';
    entry.resolved = resolved.href;
    normalized += 1;
  }
  assert.equal(new URL(entry.resolved).origin, 'https://registry.npmjs.org', 'Lockfile must use the public npm registry');
  assert.ok(entry.integrity, 'Pinned dependency must retain an integrity hash');
}
lock.version = manifest.version;
lock.packages[''].version = manifest.version;
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
console.log(`PASS: normalized ${normalized} registry URLs; pinned versions and integrity hashes retained; version ${manifest.version}`);