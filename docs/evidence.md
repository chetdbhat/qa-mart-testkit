# Capstone Evidence

Validation date: 2026-10-28. Target: https://qamart.vercel.app, discovered public QA Mart sandbox.
No project URL or source was provided. Confirm that this is the cohort's intended deployment.

Published repository: https://github.com/chetdbhat/qa-mart-testkit
Current package update: 1.0.1. Authentication and live agent verification were completed after the initial blocked attempt.

## Verified

| Check | Result | Evidence |
| --- | --- | --- |
| Six component types | PASS | 2 YAML-parsed instructions, 2 prompts, 2 skills, 2 tool-scoped agents, 2 MCP servers, 2 executable hooks |
| Official JSON schemas | PASS, exit 0 | plugin.json and mcp.json validated against the published Agent Plugins 1.0 schemas with Ajv |
| Real CLI installation | PASS, exit 0 | Copilot CLI 1.0.104 installed qa-mart-testkit 1.0.0 into a fresh COPILOT_HOME; inventory reports enabled |
| Independent setup | PASS | Fresh temporary workspace and installed-plugin directory; independent npm ci, no source node_modules dependency |
| Hook behavior | 8 passed, 0 failed, exit 0 | Focused-test guards, legitimate removal, input validation, post-edit lint, path containment, and metadata-only audit with no tool arguments |
| Real cart test | PASS | Add Mech Keys 75, check bag, quantity increase/decrease, exact line/subtotal arithmetic in integer cents |
| Real login boundary | PASS | Email/password required, empty values invalid, malformed email invalid, public demo-fill control available; no credentials submitted |
| Real checkout boundary | PASS | Empty bag, six required delivery/contact fields, malformed email invalid; no order submitted |
| First clean-installed browser suite | 3 passed, 0 failed, 0 skipped, exit 0 | npm run verify:clean, Chromium; recorded run 36.4 seconds, zero configured retries |
| Latest clean-installed browser suite | FAIL, exit 1 | 2 passed (login/checkout), 1 failed (cart click left Bag 0). Do not represent the historical green run as the latest result |
| Final explicitly scoped clean demo | PASS, exit 0 | npm run verify:clean:validation: 7 hook tests and 2 real login/checkout boundary specs passed; 29.5-second browser run. Cart excluded by explicit scope, not fixed or skipped silently |
| Playwright MCP | PASS, real tool calls | MCP handshake, 25 tools discovered, navigate to QA Mart, snapshot contains Mech Keys 75, browser closed |
| Microsoft Learn MCP | PASS, real tool call | MCP handshake, 3 tools discovered, microsoft_docs_search returned a result |
| Skill and command discovery | PASS | CLI skill inventory lists both skills and both named slash commands as enabled plugin components |
| Always-on rule fallback | PASS | setup-workspace.mjs generated a native .github/copilot-instructions.md in a fresh workspace; copilot instruction list discovers it. Native plugin-rule injection remains unverified |
| Default-profile install | PASS, exit 0 | Curated plugin installed for the current user as well as the isolated test profile |
| Editor diagnostics | PASS | No diagnostics in scripts, specs, and Copilot component folders at validation time |
| Public npm portability | PASS | 98 lockfile URLs normalized to HTTPS public npm; independent npm ci succeeded with integrity hashes retained |
| Authenticated review prompt | PASS, exit 0 | qa-mart-testkit:qamart-planner completed /review-flaky-test, read both rules and bug-report skill directly, made zero edits; 4 preToolUse and 4 postToolUse events |
| Authenticated generator prompt | PASS, exit 0 | qa-mart-testkit:qamart-generator used real checkout browser tools and generated an isolated runnable spec via /gen-smoke-tests; 7 preToolUse and 6 postToolUse events |
| Plugin-generated real tests | 7 passed, 0 failed, exit 0 | Six required contact/delivery cases plus malformed email; real QA Mart Chromium run, 46.2 seconds; no order submission |
| GitHub publication | PASS | Authenticated Git Data API commit verified against remote manifest; no local Git dependency for publishing |
| Published-repository installation | PASS, exit 0 | chetdbhat/qa-mart-testkit installed and enabled in a separate COPILOT_HOME using checksum-verified portable Git; initial remote version 1.0.0 |
| Final public marketplace install | PASS, exit 0 | Fresh COPILOT_HOME registered chetdbhat/qa-mart-testkit as qamart-qa, then installed qa-mart-testkit@qamart-qa; CLI inventory confirmed version 1.0.1 enabled |

Machine-local proof: `.artifacts/clean-install-proof.json`, `.artifacts/last-clean-install-attempt.json`, and `.artifacts/mcp-proof.json`. Read the scope field; a validation-only run does not cover cart.
The clean-install proof records the temporary installed path; its HTML report is under that path's playwright-report directory.
Raw reports, traces, browser caches, local paths, and credentials are not published as repository content.
Additional local proof: `.artifacts/live-verification/proof.json`, `.artifacts/live-generation/proof.json`, and `.artifacts/publish-proof.json`. Sanitized counts are recorded here; raw model transcripts remain ignored.

## Observed Limitations

- Initial whole-page load waits stalled on remote resources. Navigation uses domcontentloaded plus web-first assertions; retries remain zero. One checkout run timed out during a field read, then passed unchanged in isolation and clean-installed runs. The latest clean run exposed a cart failure; the overall runtime gate needs signoff, not PASS.
- A diagnostic catalog filter did not reduce 8 articles after entering Mech Keys 75, including after the load event. A separate navigation returned ERR_EMPTY_RESPONSE. The simple load-readiness hypothesis was not supported. Root cause is unconfirmed; no hard waits, forced clicks, skipped tests, or inflated retries were introduced. The diagnostic filter is not a cart precondition in the delivered spec.
- The public demo-fill/sign-in exploration did not redirect or show an alert. Positive authentication is not verified; no credential values were saved. The included auth spec tests validation only.
- An exploratory bag-to-checkout navigation showed an empty order summary. Cart persistence through checkout is unverified and is not covered by the empty-checkout boundary spec.
- The runner and pinned MCP need different browser builds. Both setup commands are in the README. The clean install reused this machine's downloaded browser cache; this is a fresh-folder/profile test, not a second physical machine.
- A later diagnostic confirmed HTTP 200 nonempty JavaScript responses and React bindings on the search input while filtering remained unresponsive. Missing script downloads were not observed in that probe. The external storefront failure remains open; it was not hidden by skipping or weakening cart assertions.

## Remaining Limitations

1. **Native rule injection and editor UI**: CLI lists both agents, skills, commands, and MCP servers. Both rule files were read in live authenticated demos. Automatic native plugin-rule injection and VS Code picker/panel rendering remain manually unverified for this client version. The opt-in setup-workspace helper provides verified always-on workspace instructions without overwriting existing rules.
2. **Class chat**: no class-chat integration is available. Share https://github.com/chetdbhat/qa-mart-testkit manually.
3. **Current cart regression**: preserve and triage the failing add-to-bag assertion against the approved deployment. Login/checkout validation and 7 newly generated checkout tests passed, but the full cart-inclusive suite is not green.
4. **Normal-profile update lock**: VS Code held the existing user plugin directory open during a refresh. New isolated installs work. Close sessions using the old plugin before updating that copy; no user processes were terminated.

## Finish The Live Demo

Install the published plugin with Git available, reload VS Code in the Copilot harness, and check the editor customization panels.
Run `npm run verify:live` and `npm run verify:live:generate` to reproduce both authenticated prompts, live hooks, and real generated checkout tests.
Use the workspace instruction helper if this client does not inject native plugin rules. Keep the cart regression visible and share the public repository URL in class chat.

## Draft Cart Defect

Title: [QM-CART-001] Add-to-bag click leaves the displayed bag count at zero.
Environment: public QA Mart sandbox, Chromium, isolated browser context, 2026-10-28.
Preconditions: fresh context; Mech Keys 75 visible in catalog; no account or payment data.
Steps: open storefront; locate the article by its exact product heading; click its Add to bag button; observe the named Bag control.
Expected: Bag 1 and a shopping-bag line for Mech Keys 75, consistent with earlier successful runs.
Actual: Bag 0 remains and the focused assertion times out. A separate filter probe also left all 8 products visible; one navigation returned ERR_EMPTY_RESPONSE.
Reproduction: reproduced in the latest full clean-installed suite and a focused rerun; earlier runs passed. Frequency and root cause are unconfirmed.
Impact: customer may be unable to add a product; high impact if reproducible outside this test environment.
Evidence: local cart spec screenshot, trace.zip, error-context.md; do not upload without sanitization.
Next discriminating check: repeat one manual interaction in an ordinary browser on the same deployment and compare script/network errors. Investigate client readiness and network conditions without masking the failed cart assertion.

## Reproduce

```powershell
npm ci
npx playwright install chromium
npx --yes @playwright/mcp@0.0.83 install-browser chrome-for-testing
npm run validate
npm test
npm run verify:mcp
npm run verify:clean
npm run verify:clean:validation
npm run verify:live
npm run verify:live:generate
npm run package:plugin
```