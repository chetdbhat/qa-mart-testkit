---
name: bug-report-writer
description: "Use when a QA Mart test fails or a tester requests a reproducible defect report, including flaky-test triage, sanitized evidence, and expected versus actual behavior."
---
# QA Mart Bug Report Writer

1. Read the spec, exact command, target, browser/version, and sanitized error. Separate product failure from tooling, network, or an unverified assertion.
2. Reproduce in a fresh context if execution is authorized. Do not repeat order submission or destructive actions. A failure that cannot be reproduced is still a finding, not a confirmed root cause.
3. Remove tokens, cookies, passwords, customer addresses, and storage-state files from attachments. Do not upload traces without review.
4. Use this report structure:

```text
Title: [QM-FLOW-ID] User-visible failure
Environment: target, build if known, browser, timestamp
Preconditions: public demo / isolated context / chosen product
Steps: minimal numbered actions
Expected: assertion tied to an observed contract
Actual: observed result and sanitized error
Reproduction: attempts/failures (or unexecuted)
Impact and severity: explain user impact, not just test failure
Evidence: sanitized file paths and focused command
Suspected cause: label hypothesis, with next discriminating check
```

Return a draft only. Do not create a GitHub issue or transmit attachments without approval.