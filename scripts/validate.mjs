import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('plugin.json', root), 'utf8'));
assert.equal(manifest.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
assert.equal(manifest.name, 'chetanbhat');
assert.ok(manifest.extensions['com.github.copilot']);
const packageJson = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'));
const marketplace = JSON.parse(readFileSync(new URL('.github/plugin/marketplace.json', root), 'utf8'));
assert.equal(packageJson.name, manifest.name);
assert.equal(lock.name, manifest.name);
assert.equal(lock.packages[''].name, manifest.name);
assert.equal(marketplace.plugins[0].name, manifest.name);
assert.equal(packageJson.version, manifest.version);
assert.equal(lock.version, manifest.version);
assert.equal(lock.packages[''].version, manifest.version);
assert.equal(marketplace.plugins[0].version, manifest.version);
for (const dependency of Object.values(lock.packages)) {
	if (dependency.resolved) {
		assert.equal(new URL(dependency.resolved).origin, 'https://registry.npmjs.org', 'Dependencies must install from public npm');
		assert.ok(dependency.integrity);
	}
}
console.log(`PASS: version ${manifest.version} metadata and integrity-pinned public npm lockfile`);
const components = [
	['rules', 'com.github.copilot/rules', '.instructions.md'],
	['prompts', 'com.github.copilot/commands', '.prompt.md'],
	['agents', 'com.github.copilot/agents', '.agent.md']
];
for (const [label, directory, suffix] of components) {
	const files = readdirSync(new URL(directory, root)).filter(file => file.endsWith(suffix));
	assert.equal(files.length, 2, `Expected two ${label}`);
	for (const file of files) {
		const content = readFileSync(new URL(`${directory}/${file}`, root), 'utf8');
		const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		assert.ok(frontmatter, `Missing frontmatter: ${file}`);
		const data = parse(frontmatter[1]);
		assert.ok(data.description?.length > 20, `Weak description: ${file}`);
		if (label === 'rules') assert.ok(data.applyTo);
		if (label === 'agents') assert.ok(data.tools?.length && !data.tools.includes('*'));
	}
	console.log(`PASS: 2 ${label} with parsed YAML metadata`);
}
const skills = readdirSync(new URL('skills/', root));
assert.equal(skills.length, 2);
for (const skill of skills) {
	const content = readFileSync(new URL(`skills/${skill}/SKILL.md`, root), 'utf8');
	const data = parse(content.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
	assert.equal(data.name, skill);
	assert.match(data.description, /Use when/);
}
const mcp = JSON.parse(readFileSync(new URL('mcp.json', root), 'utf8'));
assert.equal(mcp.$schema, 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json');
assert.equal(Object.keys(mcp.mcpServers).length, 2);
const hooks = JSON.parse(readFileSync(new URL('com.github.copilot/hooks/hooks.json', root), 'utf8'));
assert.equal(hooks.version, 1);
assert.deepEqual(Object.keys(hooks.hooks).sort(), ['postToolUse', 'preToolUse']);
for (const entries of Object.values(hooks.hooks)) {
	for (const hook of entries) {
		const script = hook.command.match(/\$\{PLUGIN_ROOT\}\/([^" ]+)/)?.[1];
		assert.ok(script && existsSync(new URL(script, root)), 'Hook script missing');
	}
}
console.log('PASS: 2 skills, 2 MCP servers, 2 executable hooks; Agent Plugins 1.0 layout');