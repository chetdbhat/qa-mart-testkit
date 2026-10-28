import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.resolve(process.argv[2] || process.cwd());
const instructions = ['playwright.instructions.md', 'safety.instructions.md'].map(name => {
  const content = readFileSync(path.join(root, 'com.github.copilot/rules', name), 'utf8');
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
});
const destination = path.join(target, '.github/copilot-instructions.md');
const combined = '# QA Mart Team Instructions\n\n' + instructions.join('\n\n') + '\n';
mkdirSync(path.dirname(destination), { recursive: true });
if (existsSync(destination)) {
  assert.equal(readFileSync(destination, 'utf8'), combined, 'Existing workspace instructions differ; merge manually. Nothing was overwritten.');
  console.log('PASS: identical QA Mart workspace instructions already present');
} else {
  writeFileSync(destination, combined, { flag: 'wx' });
  console.log(`PASS: installed QA Mart workspace rules at ${destination}`);
}