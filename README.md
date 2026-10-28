# QA Mart Testkit

Installable GitHub Copilot Agent Plugins 1.0 bundle for https://qamart.vercel.app.
Protects login validation, bag quantity/totals, and checkout pre-submit validation.
Requires Node.js 22+, npm, Git on PATH for remote installation, Copilot CLI with Agent Plugins 1.0 support, and internet access.
Use the Copilot harness in VS Code; other harnesses may not load client-specific components.

## Install

Published repository: https://github.com/chetdbhat/qa-mart-testkit

```powershell
copilot plugin install chetdbhat/qa-mart-testkit
```

From a downloaded or cloned copy, build the dependency-free distribution first:

```powershell
npm ci
npm run build:plugin
copilot plugin install "./.artifacts/dist/qa-mart-testkit"
copilot plugin list --json
```

CLI 1.0.104 did not enumerate native plugin rules here. For verified always-on project instructions, run `node scripts/setup-workspace.mjs "PATH/TO/QA-MART-WORKSPACE"` from this plugin folder, then `copilot instruction list --json` in that workspace. The helper combines the two packaged rule files and refuses to overwrite different existing instructions. Prompts and agents also explicitly request those rules.

VS Code discovers default-home CLI installs. Reload VS Code, select Copilot, then check agents, slash commands, skills, hooks, and MCP: List Servers.
An isolated COPILOT_HOME install is deliberately not registered in your normal VS Code profile.
Review executable hooks/MCP trust before enabling. Do not use blanket allow-all permissions.

Marketplace alternative: `copilot plugin marketplace add chetdbhat/qa-mart-testkit`, then `copilot plugin install qa-mart-testkit@qamart-qa`.
The current CLI warns that direct installs may be deprecated in a future release.

## Six Components

| Type | Included |
| --- | --- |
| Instructions | playwright.instructions.md, safety.instructions.md |
| Prompts | /gen-smoke-tests, /review-flaky-test |
| Skills | checkout-test-design, bug-report-writer |
| Agents | qamart-planner (read-only), qamart-generator (test edits + selected browser tools; no shell/eval) |
| MCP | pinned Playwright MCP, Microsoft Learn read-only docs MCP; neither needs an API key |
| Hooks | preToolUse rejects .only writes and checks staged specs before commits; postToolUse lints edited specs |

Portable skills and MCP use fixed root paths. Copilot discovers agents/commands/rules/hooks under `com.github.copilot`; do not add legacy top-level component paths to the manifest.
The marketplace catalog is at `.github/plugin/marketplace.json`.

## 60-Second Demo

1. Select qamart-planner and ask for QM-CART-001 cases from docs/flows.md.
2. Select qamart-generator; invoke `/gen-smoke-tests QM-CART-001`. Let it inspect the approved browser, then generate a spec. It cannot run shell commands; review its focused run command.
3. In a terminal, run `npx playwright test tests/e2e/checkout.spec.mjs`. Show the real required-field and email validation assertions. Run `npm run demo` separately to include the known cart regression; do not call the full suite green.
4. Invoke `/review-flaky-test tests/e2e/cart.spec.mjs` with a sanitized failure, or run `npm test` to demonstrate the hook rejecting a focused test without editing the real suite.

CLI agent IDs are qualified: `qa-mart-testkit:qamart-planner` and `qa-mart-testkit:qamart-generator`.
`npm run verify:live` verifies the authenticated review prompt and both lifecycle hooks in an isolated profile.
`npm run verify:live:generate` inspects real checkout, generates a spec in the ignored demo folder, and runs it. The recorded demo produced 7 passing tests without submitting an order.
Live proof and transcripts stay under `.artifacts/`; hook audit contains only timestamps, lifecycle names, and tool names, never arguments or results.

First-time test-runner browser setup: `npx playwright install chromium`.
The pinned MCP uses a separate build: `npx --yes @playwright/mcp@0.0.83 install-browser chrome-for-testing`.
Run `npm run validate` for YAML/component checks, `node scripts/verify-schemas.mjs` for official JSON schemas, `npm test` for hook behavior, and `npm run verify:mcp` for actual MCP handshakes and tool calls.
Run `npm run verify:clean` to install into a fresh OS temp directory, install dependencies independently, and execute tests from the installed plugin. Proof is written under `.artifacts/` (ignored).
Use `npm run verify:clean:validation` for an explicitly scoped login/checkout demo while the external cart regression is open. The proof records that scope; it is not a full-suite pass.
Run `npm run package:plugin` to create the distributable tarball.
The archive includes an npm shrinkwrap for reproducible `npm ci`; no node_modules, browser profile, credentials, or raw test reports are bundled.

## Safety And Limits

- No committed credentials, storage state, cookies, or API keys. Public demo credentials are read through the live fill control, never copied into specs.
- Tests never place an order, create accounts, mutate admin data, or invoke payment.
- Browser origin lists are defense in depth, not a sandbox; redirects and same-origin mutations still require normal approval and human review.
- Hooks use conservative source-pattern checks, not a security sandbox or a full TypeScript parser. They may flag examples/comments; arbitrary shell writes, aliases, obfuscation, and hook tampering are not fully prevented. Post-edit warnings cannot undo an edit. Copilot hook timeouts fall through to normal permissions.
- Staged commit protection requires Git on PATH. It denies the attempted commit if Git inspection fails. It is not a standalone Git pre-commit hook and cannot intercept commits outside Copilot.
- Report artifacts may contain sensitive application data; ignored traces/screenshots must be reviewed before sharing.
- Positive login, persisted checkout cart state, remote publishing, and UI picker discovery are only verified if recorded in docs/evidence.md. The included login/checkout specs validate safe required-field boundaries, not completed authentication or purchase.
- The latest sandbox run exposed an add-to-bag regression. The suite deliberately remains red for that failure; run `npx playwright test tests/e2e/login.spec.mjs tests/e2e/checkout.spec.mjs` to demo the previously confirmed non-submitting boundaries while triaging cart.

## Publish

Authenticate locally with `gh auth login`; never paste a token into chat or a file.
The repository was published through the authenticated GitHub Git Data API because local Git was initially unavailable. Review the allowlist with a non-writing dry run, then update the existing repository:

```powershell
node scripts/publish-github.mjs
node scripts/publish-github.mjs --publish --update
```

The publisher uploads only explicit source folders, rejects symlinks and obvious tokens/private keys, and verifies the remote commit and manifest. Review all source for other sensitive data before publishing; the pattern scan is not a full secret detector.
Share https://github.com/chetdbhat/qa-mart-testkit in class chat manually.
See docs/evidence.md for exact verified results and remaining submission gates.