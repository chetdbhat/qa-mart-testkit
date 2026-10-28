# QA Mart Testkit

Installable GitHub Copilot Agent Plugins 1.0 bundle for https://qamart.vercel.app.
Protects login validation, bag quantity/totals, and checkout pre-submit validation.
Requires Node.js 22+, npm, Copilot CLI with Agent Plugins 1.0 support, and internet access.
Use the Copilot harness in VS Code; other harnesses may not load client-specific components.

## Install

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

After publishing, install with `copilot plugin install OWNER/qa-mart-testkit`.
For marketplace distribution: `copilot plugin marketplace add OWNER/qa-mart-testkit`, then `copilot plugin install qa-mart-testkit@qamart-qa`.
Replace OWNER with the actual publishing account. No remote repository is claimed until publishing succeeds.

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
With Git installed and this folder initialized as a repository:

```powershell
git add .
git commit -m "Add QA Mart Copilot testing plugin"
gh repo create qa-mart-testkit --public --source . --push
gh repo view --json url --jq .url
```

Review staged files first. Share the returned repository URL in class chat manually.
See docs/evidence.md for exact verified results and remaining submission gates.