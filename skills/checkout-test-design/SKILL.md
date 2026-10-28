---
name: checkout-test-design
description: "Use when designing or generating QA Mart cart, bag, shipping, totals, or checkout validation tests; defines safe pre-submit boundaries and money assertions."
---
# QA Mart Checkout Test Design

1. Establish the approved target and inspect the current bag/checkout page. Map visible roles, labels, prices, and any stable data-testid to evidence. Never assume a route or tax rule.
2. Select a flow from [the coverage matrix](../../docs/flows.md). Include the flow ID in the test title.
3. Use a fresh browser context. Add one observed product, change its quantity, and assert line total and subtotal with integer minor units, not floating-point equality. Observe shipping/tax rules before asserting grand totals.
4. Cover empty bag, quantity boundaries, removal, required shipping fields, and malformed email/postcode only where the current UI supports them. Avoid state shared with other tests.
5. Login via the public demo-fill control if required. Do not store auth state or credentials in reports.
6. Never submit an order or invoke a real payment. Checkout validation tests stop before Place order/Pay/Confirm purchase. If the UI has no safe validation boundary, report it as blocked rather than click.
7. Generate web-first assertions; run only the focused spec. Capture sanitized failure evidence. Report unexecuted cases honestly.

Output: flow ID, preconditions, observed locators, Given/When/Then cases, assertions, cleanup, and execution evidence.