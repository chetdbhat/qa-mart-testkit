import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(path.join(tmpdir(), 'qamart-clean-'));
const home = path.join(temporary, 'copilot-home');
const workspace = path.join(temporary, 'fresh-workspace');
mkdirSync(workspace);
const env = { ...process.env, COPILOT_HOME: home };
const copilot = process.platform === 'win32' ? 'copilot.exe' : 'copilot';
const npm = process.env.npm_execpath;
assert.ok(npm, 'Run via npm run verify:clean so the exact npm CLI is available.');
const commands = [];
function run(command, args, cwd = workspace) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 240000, maxBuffer: 8 * 1024 * 1024 });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  commands.push({ executable: path.basename(command), args, exitCode: result.status, timestamp: new Date().toISOString() });
  mkdirSync(path.join(root, '.artifacts'), { recursive: true });
  writeFileSync(path.join(root, '.artifacts/last-clean-install-attempt.json'), JSON.stringify({ home, workspace, commands }, null, 2));
  assert.equal(result.status, 0, `Command failed: ${command} ${args.join(' ')} (${result.error?.message || result.status})`);
  return result.stdout;
}
run(process.execPath, [path.join(root, 'scripts/build-dist.mjs')], root);
const source = path.join(root, '.artifacts/dist/qa-mart-testkit');
run(copilot, ['plugin', 'install', source]);
const inventory = JSON.parse(run(copilot, ['plugin', 'list', '--json']));
assert.ok(inventory.some(plugin => plugin.name === 'qa-mart-testkit' && plugin.enabled));
function findPlugin(directory, depth = 0) {
  if (depth > 6) return;
  if (existsSync(path.join(directory, 'plugin.json'))) return directory;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const result = findPlugin(path.join(directory, entry.name), depth + 1);
      if (result) return result;
    }
  }
}
const installed = findPlugin(path.join(home, 'installed-plugins'));
assert.ok(installed && !installed.startsWith(source));
assert.ok(!existsSync(path.join(installed, 'node_modules')), 'Clean plugin must not bundle local dependencies');
run(process.execPath, [path.join(installed, 'scripts/setup-workspace.mjs'), workspace]);
const discoveredInstructions = JSON.parse(run(copilot, ['instruction', 'list', '--json']));
assert.match(JSON.stringify(discoveredInstructions), /copilot-instructions\.md/);
run(process.execPath, [npm, 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], installed);
run(process.execPath, ['scripts/validate.mjs'], installed);
run(process.execPath, [npm, 'test'], installed);
const selection = process.argv.includes('--validation-only') ? ['tests/e2e/login.spec.mjs', 'tests/e2e/checkout.spec.mjs'] : [];
run(process.execPath, [npm, 'run', selection.length ? 'demo:validation' : 'demo'], installed);
const report = JSON.parse(readFileSync(path.join(installed, 'test-results/results.json'), 'utf8'));
const evidence = { timestamp: new Date().toISOString(), home, workspace, installed, inventory, instructionDiscovery: discoveredInstructions, scope: selection.length ? 'login and checkout validation only; cart excluded explicitly' : 'full suite', e2e: report.stats, target: 'https://qamart.vercel.app', exitCode: 0 };
mkdirSync(path.join(root, '.artifacts'), { recursive: true });
writeFileSync(path.join(root, '.artifacts/clean-install-proof.json'), JSON.stringify(evidence, null, 2));
console.log(`PASS: clean install, isolated dependencies, hooks and real QA Mart tests from ${installed}`);