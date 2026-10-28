const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { auditHook, parseEvent, changedSpecs, violations, editTool } = require('./test-policy.cjs');

try {
  const event = parseEvent(fs.readFileSync(0, 'utf8'));
  auditHook('postToolUse', event.name);
  if (!editTool.test(event.name)) {
    process.stdout.write('{}');
  } else {
    const files = changedSpecs(event).filter(file => fs.existsSync(file));
    const issues = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      issues.push(...violations(text));
      if (/\.[cm]?js$/.test(file)) {
        const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', timeout: 3000 });
        if (syntax.status !== 0) issues.push('Edited JavaScript spec has a syntax error.');
      }
    }
    process.stdout.write(JSON.stringify({ additionalContext: files.length
      ? `QA Mart post-edit lint: ${files.length} spec(s) checked. ${issues.length ? [...new Set(issues)].join(' ') + ' Correct these before running.' : 'PASS: no focused tests, hard waits, or JavaScript syntax errors.'}`
      : 'QA Mart post-edit lint: no spec paths found; run the project lint command before claiming validation.' }));
  }
} catch {
  process.stdout.write(JSON.stringify({ additionalContext: 'QA Mart post-edit lint failed to validate input. Run the focused lint manually; do not claim a pass.' }));
}