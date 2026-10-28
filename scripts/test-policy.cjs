const fs = require('node:fs');
const path = require('node:path');

const focused = /\b(?:test|it|describe)\s*\.\s*only\s*\(/;
const hardWait = /\bwaitForTimeout\s*\(|\b(?:sleep|Start-Sleep)\b/;
const specPath = /\.(?:spec|test)\.[cm]?[jt]sx?$/i;
const editTool = /(?:^|\/)(?:create|edit|apply_patch|str_replace_editor|write|Write|Edit|create_file|replace_string_in_file|multi_replace_string_in_file)$/;

function parseEvent(raw) {
  const event = JSON.parse(raw);
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Invalid event');
  const name = event.toolName ?? event.tool_name;
  if (typeof name !== 'string' || typeof event.cwd !== 'string') throw new Error('Missing event fields');
  let args = event.toolArgs ?? event.tool_input ?? {};
  if (typeof args === 'string') args = JSON.parse(args);
  return { name, args, cwd: path.resolve(event.cwd) };
}

function violations(text) {
  const issues = [];
  if (focused.test(text)) issues.push('Focused tests are forbidden; remove .only.');
  if (hardWait.test(text)) issues.push('Hard waits are forbidden; use web-first assertions.');
  return issues;
}

function proposedText(args) {
  const patch = args.input ?? args.patch ?? args.diff;
  if (typeof patch === 'string') {
    return patch.split(/\r?\n/).filter(line => line.startsWith('+') && !line.startsWith('+++')).map(line => line.slice(1)).join('\n');
  }
  const values = [];
  for (const [key, value] of Object.entries(args)) {
    if (/^(?:content|contents|file_text|new_str|new_string|newString|newText|replacement|text)$/.test(key) && typeof value === 'string') values.push(value);
    else if (Array.isArray(value)) values.push(...value.filter(item => item && typeof item === 'object').map(proposedText));
  }
  return values.join('\n');
}

function changedSpecs(event) {
  const args = event.args;
  const candidates = [args.path, args.filePath, args.file_path, args.filename];
  const patch = args.input ?? args.patch ?? args.diff ?? '';
  for (const match of String(patch).matchAll(/^\*\*\* (?:Add|Update) File:\s*(.+)$/gm)) candidates.push(match[1].trim());
  return [...new Set(candidates.filter(value => typeof value === 'string' && specPath.test(value)))].map(value => {
    const absolute = path.resolve(event.cwd, value);
    const relative = path.relative(event.cwd, absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Edited spec is outside workspace');
    if (fs.existsSync(absolute)) {
      const real = fs.realpathSync(absolute);
      const realRelative = path.relative(fs.realpathSync(event.cwd), real);
      if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) throw new Error('Spec symlink escapes workspace');
    }
    return absolute;
  });
}

module.exports = { parseEvent, violations, proposedText, changedSpecs, focused, specPath, editTool };