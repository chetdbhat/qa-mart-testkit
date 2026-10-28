import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const root = process.env.QAMART_PLUGIN_ROOT || process.cwd();
const config = JSON.parse(readFileSync(path.join(root, 'mcp.json'), 'utf8'));
const proof = { timestamp: new Date().toISOString(), target: 'https://qamart.vercel.app', servers: [] };
for (const [name, server] of Object.entries(config.mcpServers)) {
  const client = new Client({ name: 'qamart-plugin-verifier', version: '1.0.0' });
  const transport = server.type === 'stdio'
    ? new StdioClientTransport({ command: server.command, args: server.args, stderr: 'inherit' })
    : new StreamableHTTPClientTransport(new URL(server.url));
  try {
    console.log(`Checking ${name}: connecting`);
    await client.connect(transport, { timeout: 90000 });
    console.log(`Checking ${name}: listing tools`);
    const listed = await client.listTools();
    const names = listed.tools.map(tool => tool.name);
    assert.ok(names.length > 0);
    if (name === 'qamart-browser') {
      console.log(`Checking ${name}: navigating to approved sandbox`);
      assert.ok(names.includes('browser_navigate') && names.includes('browser_snapshot'));
      const navigation = await client.callTool({ name: 'browser_navigate', arguments: { url: 'https://qamart.vercel.app' } }, undefined, { timeout: 60000 });
      assert.ok(!navigation.isError, JSON.stringify(navigation));
      const snapshot = await client.callTool({ name: 'browser_snapshot', arguments: {} }, undefined, { timeout: 30000 });
      assert.ok(!snapshot.isError);
      assert.match(JSON.stringify(snapshot), /Mech Keys 75/);
      await client.callTool({ name: 'browser_close', arguments: {} }, undefined, { timeout: 15000 });
    } else {
      assert.ok(names.includes('microsoft_docs_search'));
      const result = await client.callTool({ name: 'microsoft_docs_search', arguments: { query: 'Playwright testing locators' } }, undefined, { timeout: 30000 });
      assert.ok(!result.isError);
    }
    proof.servers.push({ name, status: 'PASS', tools: names });
    console.log(`PASS: ${name}: initialized, ${names.length} tools listed, real tool call completed`);
  } finally {
    console.log(`Closing ${name}`);
    await client.close();
  }
}
mkdirSync('.artifacts', { recursive: true });
writeFileSync('.artifacts/mcp-proof.json', JSON.stringify(proof, null, 2));