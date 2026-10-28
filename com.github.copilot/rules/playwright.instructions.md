---
name: qamart-playwright
description: "Apply when writing or reviewing QA Mart browser tests, locators, assertions, and test fixtures."
applyTo: "**/*.spec.{ts,js,mjs},**/playwright.config.*"
---
# QA Mart Browser Contract

- Default target: https://qamart.vercel.app. An alternate target must be an explicitly approved non-production deployment.
- Protect QM-AUTH-001 (customer login), QM-CART-001 (bag quantity/removal), and QM-CHECKOUT-001 (checkout validation before submission).
- Inspect the live accessibility tree or source first. Prefer getByRole with accessible name, then getByLabel, then an observed data-testid. Never invent test IDs or use generated CSS classes, nth-child, or XPath.
- Use Playwright web-first expect assertions, isolated browser contexts, and semantic test names containing the flow ID.
- No waitForTimeout, sleeps, test.only, describe.only, force clicks, swallowed failures, or retry inflation. Do not mask app bugs with mocks.
- Assert outcomes: logged-in identity, bag quantity and computed totals, or a specific checkout validation message. Visibility of the home page alone is not login proof.
- Configure forbidOnly and capture trace/screenshot on failure. Report the exact command, target, passed/failed/skipped counts, and evidence path.