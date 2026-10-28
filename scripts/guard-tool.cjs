const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { parseEvent, proposedText, focused, specPath, editTool } = require('./test-policy.cjs');

function deny(reason) {
  process.stdout.write(JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: reason }));
}

try {
  const event = parseEvent(fs.readFileSync(0, 'utf8'));
  const text = JSON.stringify(event.args);
  if (editTool.test(event.name) && focused.test(proposedText(event.args))) {
    deny('QA Mart guard: test.only/describe.only/it.only would hide coverage.');
  } else if (/^(?:bash|powershell|Bash|run_in_terminal)$/.test(event.name) && /\bgit\s+(?:-[^\s]+\s+)*commit\b/.test(text)) {
    const files = spawnSync('git', ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], { cwd: event.cwd, encoding: 'utf8', timeout: 5000 });
    if (files.status !== 0) {
      deny('QA Mart guard: cannot inspect staged tests; commit requires manual verification.');
    } else {
      const blocked = files.stdout.split('\0').filter(file => specPath.test(file)).some(file => {
        const content = spawnSync('git', ['show', `:${file}`], { cwd: event.cwd, encoding: 'utf8', timeout: 3000 });
        if (content.status !== 0) throw new Error('Cannot read staged spec');
        return focused.test(content.stdout);
      });
      if (blocked) deny('QA Mart guard: staged tests contain .only.');
      else process.stdout.write('{}');
    }
  } else {
    process.stdout.write('{}');
  }
} catch {
  deny('QA Mart guard: invalid input or policy check failed; review the operation manually.');
}