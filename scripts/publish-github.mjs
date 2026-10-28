import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const repositoryName = 'qa-mart-testkit';
const description = 'QA Mart Copilot testing plugin: scoped agents, Playwright, skills, prompts, and safety hooks.';
const roots = ['.gitignore', '.github/plugin', 'plugin.json', 'mcp.json', 'package.json', 'package-lock.json', 'playwright.config.mjs', 'README.md', 'com.github.copilot', 'skills', 'scripts', 'tests', 'docs'];
const entries = [];
const secret = /\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

function collect(relative) {
  const absolute = path.join(root, relative);
  const stat = lstatSync(absolute);
  assert.ok(!stat.isSymbolicLink(), `Refusing symlink: ${relative}`);
  assert.ok(!path.relative(realpathSync(root), realpathSync(absolute)).startsWith('..'), 'Source escapes workspace');
  if (stat.isDirectory()) {
    for (const child of readdirSync(absolute)) collect(path.join(relative, child));
    return;
  }
  const buffer = readFileSync(absolute);
  assert.ok(!buffer.includes(0), `Refusing binary file: ${relative}`);
  const content = buffer.toString('utf8');
  assert.ok(!secret.test(content), `Possible credential/private key in ${relative}; publication stopped`);
  entries.push({ path: relative.split(path.sep).join('/'), mode: '100644', type: 'blob', content });
}
for (const relative of roots) {
  assert.ok(existsSync(path.join(root, relative)), `Missing source: ${relative}`);
  collect(relative);
}
entries.sort((first, second) => first.path.localeCompare(second.path));
assert.ok(entries.every(entry => !/(?:^|\/)(?:\.env(?:\.|$)|node_modules|\.artifacts|test-results|playwright-report|\.playwright-mcp)(?:\/|$)/.test(entry.path)));
console.log(`Source allowlist: ${entries.length} text files, ${entries.reduce((total, entry) => total + Buffer.byteLength(entry.content), 0)} bytes`);
console.log(entries.map(entry => entry.path).join('\n'));

function api(endpoint, method = 'GET', body) {
  const args = ['api', '--method', method, endpoint];
  if (body !== undefined) args.push('--input', '-');
  const result = spawnSync(process.platform === 'win32' ? 'gh.exe' : 'gh', args, {
    cwd: root,
    input: body === undefined ? undefined : JSON.stringify(body),
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 8 * 1024 * 1024
  });
  assert.equal(result.status, 0, `GitHub ${method} ${endpoint} failed: ${result.stderr || result.error?.message}`);
  return JSON.parse(result.stdout);
}

const user = api('user');
const owner = user.login;
const repository = `${owner}/${repositoryName}`;
console.log(`Authenticated destination: https://github.com/${repository}`);
if (!process.argv.includes('--publish')) {
  console.log('DRY RUN ONLY: no repository or commit created. Pass --publish to publish this allowlist.');
  process.exit(0);
}

const published = process.argv.includes('--update')
  ? api(`repos/${repository}`)
  : api('user/repos', 'POST', { name: repositoryName, description, private: false, auto_init: true });
assert.equal(published.owner.login, owner);
assert.equal(published.name, repositoryName);
assert.equal(published.private, false);
const branch = published.default_branch;
assert.ok(branch);
if (process.argv.includes('--update')) {
  const existing = api(`repos/${repository}/contents/plugin.json?ref=${encodeURIComponent(branch)}`);
  const existingManifest = JSON.parse(Buffer.from(existing.content, 'base64').toString('utf8'));
  assert.equal(existingManifest.name, repositoryName, 'Refusing to update an unrelated repository');
}
const head = api(`repos/${repository}/git/ref/heads/${encodeURIComponent(branch)}`);
const base = api(`repos/${repository}/git/commits/${head.object.sha}`);
const tree = api(`repos/${repository}/git/trees`, 'POST', { base_tree: base.tree.sha, tree: entries });
const commit = api(`repos/${repository}/git/commits`, 'POST', {
  message: process.argv.includes('--update') ? 'Update verified QA Mart plugin and submission evidence' : 'Publish QA Mart Copilot testing plugin with verified evidence',
  tree: tree.sha,
  parents: [head.object.sha]
});
api(`repos/${repository}/git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', { sha: commit.sha, force: false });
const verified = api(`repos/${repository}/git/ref/heads/${encodeURIComponent(branch)}`);
assert.equal(verified.object.sha, commit.sha);
const remote = api(`repos/${repository}/contents/plugin.json?ref=${commit.sha}`);
assert.deepEqual(JSON.parse(Buffer.from(remote.content, 'base64').toString('utf8')), JSON.parse(readFileSync(path.join(root, 'plugin.json'), 'utf8')));
const proof = { timestamp: new Date().toISOString(), repository: published.html_url, branch, commit: commit.sha, fileCount: entries.length, method: 'Authenticated GitHub Git Data API; no local Git dependency', files: entries.map(entry => entry.path) };
mkdirSync(path.join(root, '.artifacts'), { recursive: true });
writeFileSync(path.join(root, '.artifacts/publish-proof.json'), JSON.stringify(proof, null, 2));
console.log(`PUBLISHED AND VERIFIED: ${published.html_url}/commit/${commit.sha}`);