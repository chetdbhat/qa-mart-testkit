import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = fileURLToPath(new URL('../scripts/', import.meta.url));
function invoke(script, event) {
  const result = spawnSync(process.execPath, [path.join(scripts, script)], { input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
const base = { cwd: process.cwd(), toolName: 'create', toolArgs: {} };

test('opt-in hook audit records lifecycle and tool metadata without tool arguments', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'qamart-audit-'));
  try {
    for (const script of ['guard-tool.cjs', 'lint-edits.cjs']) {
      const result = spawnSync(process.execPath, [path.join(scripts, script)], {
        input: JSON.stringify({ ...base, toolName: 'view', toolArgs: { content: 'sensitive-fixture-not-to-log' } }),
        encoding: 'utf8', env: { ...process.env, QAMART_HOOK_AUDIT_DIR: directory }
      });
      assert.equal(result.status, 0, result.stderr);
      JSON.parse(result.stdout);
    }
    const raw = readFileSync(path.join(directory, 'hooks.jsonl'), 'utf8');
    const entries = raw.trim().split('\n').map(line => JSON.parse(line));
    assert.deepEqual(entries.map(entry => entry.hook), ['preToolUse', 'postToolUse']);
    assert.ok(entries.every(entry => entry.tool === 'view' && entry.timestamp));
    assert.ok(!raw.includes('sensitive-fixture-not-to-log'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('pre hook blocks focused tests in create, edit, and patch payloads', () => {
  for (const toolName of ['create', 'edit', 'apply_patch', 'Write', 'Edit']) {
    assert.equal(invoke('guard-tool.cjs', { ...base, toolName, toolArgs: { content: "test.only('bad', () => {});" } }).permissionDecision, 'deny');
  }
});
test('pre hook preserves normal permissions for harmless writes and read-only search', () => {
  assert.deepEqual(invoke('guard-tool.cjs', { ...base, toolArgs: { content: "test('safe', () => {});" } }), {});
  assert.deepEqual(invoke('guard-tool.cjs', { ...base, toolName: 'rg', toolArgs: { pattern: 'test.only(' } }), {});
});
test('pre hook permits removal of focused tests but denies newly added focused patch lines', () => {
  assert.deepEqual(invoke('guard-tool.cjs', { ...base, toolName: 'edit', toolArgs: { old_str: "test.only('old', () => {});", new_str: "test('old', () => {});" } }), {});
  assert.deepEqual(invoke('guard-tool.cjs', { ...base, toolName: 'apply_patch', toolArgs: { input: "*** Update File: cart.spec.mjs\n-test.only('old', () => {});\n+test('old', () => {});" } }), {});
  assert.equal(invoke('guard-tool.cjs', { ...base, toolName: 'apply_patch', toolArgs: { input: "*** Update File: cart.spec.mjs\n+test.only('bad', () => {});" } }).permissionDecision, 'deny');
});
test('pre hook handles snake-case and string-encoded args', () => {
  assert.equal(invoke('guard-tool.cjs', { cwd: process.cwd(), tool_name: 'Write', tool_input: JSON.stringify({ content: 'describe . only (' }) }).permissionDecision, 'deny');
});
test('pre hook denies malformed input without echoing sensitive payloads', () => {
  assert.equal(invoke('guard-tool.cjs', '{broken').permissionDecision, 'deny');
});
test('post hook lints actual edited specs, recognizes patch paths, and reports syntax failures', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'qamart hooks '));
  try {
    const file = path.join(cwd, 'cart.spec.mjs');
    writeFileSync(file, "test('cart', async () => { await page.waitForTimeout(100); });");
    assert.match(invoke('lint-edits.cjs', { cwd, toolName: 'edit', toolArgs: { path: file } }).additionalContext, /Hard waits/);
    writeFileSync(file, 'const broken = ;');
    assert.match(invoke('lint-edits.cjs', { cwd, toolName: 'apply_patch', toolArgs: { input: `*** Update File: ${file}\n` } }).additionalContext, /syntax error/);
    writeFileSync(file, "console.log('safe');");
    assert.match(invoke('lint-edits.cjs', { cwd, toolName: 'edit', toolArgs: { path: file } }).additionalContext, /PASS/);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
test('post hook rejects workspace escapes and ignores non-edit tools', () => {
  assert.match(invoke('lint-edits.cjs', { ...base, toolName: 'edit', toolArgs: { path: '../escape.spec.mjs' } }).additionalContext, /failed to validate/);
  assert.deepEqual(invoke('lint-edits.cjs', { ...base, toolName: 'view' }), {});
});