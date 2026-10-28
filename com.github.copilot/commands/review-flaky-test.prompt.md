---
name: review-flaky-test
description: "Diagnose a flaky QA Mart test from a spec, failure output, and trace without weakening its business assertions."
agent: qamart-planner
argument-hint: "Spec path and sanitized failure or trace path"
---
Review the supplied QA Mart test and failure evidence. Read [Playwright rules](../rules/playwright.instructions.md), [safety rules](../rules/safety.instructions.md), and the [bug-report-writer skill](../../skills/bug-report-writer/SKILL.md) directly; do not glob the workspace to find them.
Identify whether the cause is locator ambiguity, asynchronous state, shared test data, environment failure, or a product defect.
Return findings ordered by severity with file references, observed evidence, and a minimal proposed correction.
Do not edit files or execute shell commands. Never recommend hard waits, increased retries, test skipping, force clicks, or assertion removal.
If evidence is insufficient, name the single next discriminating check. Draft a sanitized defect report only when evidence supports a product bug.