---
name: gen-smoke-tests
description: "Generate and run evidence-backed Playwright smoke tests for QA Mart login, bag, and checkout validation."
agent: qamart-generator
argument-hint: "Flow ID or approved QA Mart base URL (default: public sandbox)"
---
Generate a QA Mart smoke test for the requested flow. Default to QM-CART-001 if unspecified.
Read [Playwright rules](../rules/playwright.instructions.md), [safety rules](../rules/safety.instructions.md), and the [checkout-test-design skill](../../skills/checkout-test-design/SKILL.md) directly before acting; do not glob the workspace to find them.
Inspect the real QA Mart page with qamart-browser; record observed role/label/test-id locators, do not guess.
Create an isolated Playwright spec in tests/e2e, using the existing config. If no runner exists, explain and add the minimal @playwright/test setup with forbidOnly.
Run the focused spec if a runner is available. If execution is unavailable, state that fact; do not claim a pass.
For checkout, stop before any order/payment submission. Report flow ID, target, assertions, execution counts, and sanitized evidence.