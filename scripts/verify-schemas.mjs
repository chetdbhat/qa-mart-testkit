import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const ajv = new Ajv2020({ strict: false, validateFormats: false });
for (const name of ['plugin', 'mcp']) {
  const file = `${name}.json`;
  const document = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
  const response = await fetch(document.$schema, { signal: AbortSignal.timeout(20000) });
  assert.ok(response.ok, `Cannot fetch official schema: ${response.status}`);
  const schema = await response.json();
  const validate = ajv.compile(schema);
  assert.ok(validate(document), JSON.stringify(validate.errors));
  console.log(`PASS: ${file} conforms to its official Agent Plugins 1.0 JSON schema`);
}