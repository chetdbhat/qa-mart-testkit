import { cpSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const output = path.join(root, '.artifacts', 'dist', manifest.name);
mkdirSync(output, { recursive: true });
const entries = ['plugin.json', 'mcp.json', 'package.json', 'package-lock.json', 'playwright.config.mjs', 'README.md', 'com.github.copilot', 'skills', 'scripts', 'tests', 'docs', '.github/plugin'];
for (const entry of entries) {
  if (existsSync(path.join(root, entry))) cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
cpSync(path.join(root, 'package-lock.json'), path.join(output, 'npm-shrinkwrap.json'));
console.log(`Distribution prepared: ${output}`);