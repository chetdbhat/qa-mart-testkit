import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const generate = process.argv.includes('--generate');
const output = path.join(root, generate ? '.artifacts/live-generation' : '.artifacts/live-verification');
const audit = path.join(output, 'audit');
mkdirSync(output, { recursive: true });
const env = { ...process.env, COPILOT_HOME: path.join(output, 'copilot-home'), QAMART_HOOK_AUDIT_DIR: audit };
const copilot = process.platform === 'win32' ? 'copilot.exe' : 'copilot';
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8', timeout: 600000, maxBuffer: 8 * 1024 * 1024 });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  assert.equal(result.status, 0, `Live verification command failed (${result.status}): ${result.error?.message || command}`);
}
run(process.execPath, [path.join(root, 'scripts/build-dist.mjs')]);
run(copilot, ['plugin', 'install', path.join(root, '.artifacts/dist/qa-mart-testkit')]);
const transcript = path.join(output, generate ? 'generation-session.md' : 'review-session.md');
const generatedDirectory = path.join(root, '.artifacts/generated');
mkdirSync(generatedDirectory, { recursive: true });
const generatedSpec = path.join(generatedDirectory, 'checkout-required.spec.mjs');
const available = generate ? ['view', 'create', 'edit', 'qamart-browser-browser_navigate', 'qamart-browser-browser_snapshot'] : ['view'];
const permissions = generate ? ['--allow-tool', `write(${generatedSpec})`, '--allow-tool', 'qamart-browser(browser_navigate)', '--allow-tool', 'qamart-browser(browser_snapshot)'] : [];
const prompt = generate
  ? '/gen-smoke-tests QM-CHECKOUT-001. Inspect only https://qamart.vercel.app/checkout using the browser navigate and snapshot tools. Read com.github.copilot/rules/playwright.instructions.md, com.github.copilot/rules/safety.instructions.md, skills/checkout-test-design/SKILL.md, and tests/e2e/checkout.spec.mjs directly. Generate one runnable JavaScript Playwright test at .artifacts/generated/checkout-required.spec.mjs only. Cover observed required contact/delivery inputs and invalid email without clicking Place demo order or submitting. Import test and expect from @playwright/test. No shell, glob, arbitrary browser evaluation, hard waits, retries, or tracked file edits. State that execution remains for the tester.'
  : '/review-flaky-test tests/e2e/cart.spec.mjs. Read exactly com.github.copilot/rules/playwright.instructions.md, com.github.copilot/rules/safety.instructions.md, skills/bug-report-writer/SKILL.md, and tests/e2e/cart.spec.mjs. No shell, edits, or glob. In five lines, distinguish the known Bag 0 failure from unverified causes and preserve all business assertions.';
run(copilot, [
  '--agent', generate ? 'qa-mart-testkit:qamart-generator' : 'qa-mart-testkit:qamart-planner',
  '--available-tools', ...available, '--allow-tool', 'view', ...permissions,
  '--disable-builtin-mcps', ...(!generate ? ['--disable-mcp-server', 'qamart-browser'] : []), '--disable-mcp-server', 'qamart-docs',
  '--trust-folder', '--log-dir', path.join(output, 'logs'), '--share', transcript,
  '-p', prompt
]);
assert.ok(existsSync(transcript), 'Authenticated prompt must produce a session transcript');
if (generate) {
  assert.ok(existsSync(generatedSpec), 'Generator did not create its scoped spec');
  writeFileSync(path.join(generatedDirectory, 'playwright.config.mjs'), "import config from '../../playwright.config.mjs';\nexport default { ...config, testDir: '.' };\n");
  assert.ok(process.env.npm_execpath, 'Invoke through npm run verify:live:generate');
  run(process.execPath, [process.env.npm_execpath, 'exec', '--', 'playwright', 'test', '--config', path.join(generatedDirectory, 'playwright.config.mjs')]);
}
const auditFile = path.join(audit, 'hooks.jsonl');
assert.ok(existsSync(auditFile), 'No live hook audit file was produced');
const events = readFileSync(auditFile, 'utf8').trim().split('\n').map(line => JSON.parse(line));
assert.ok(events.some(event => event.hook === 'preToolUse'), 'preToolUse did not fire');
assert.ok(events.some(event => event.hook === 'postToolUse'), 'postToolUse did not fire');
const proof = { timestamp: new Date().toISOString(), agent: generate ? 'qa-mart-testkit:qamart-generator' : 'qa-mart-testkit:qamart-planner', prompt: generate ? '/gen-smoke-tests' : '/review-flaky-test', generatedSpec: generate ? generatedSpec : undefined, exitCode: 0, preToolUse: events.filter(event => event.hook === 'preToolUse').length, postToolUse: events.filter(event => event.hook === 'postToolUse').length, transcript };
writeFileSync(path.join(output, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`PASS: authenticated ${proof.prompt}; ${proof.preToolUse} pre-tool and ${proof.postToolUse} post-tool lifecycle events verified`);