# QA Mart Coverage Matrix

Target discovered during capstone: https://qamart.vercel.app (public training sandbox).
The requested project was not supplied; confirm this is your cohort's deployment before using private accounts.

| ID | Priority | Safe contract | Negative/boundary cases |
| --- | --- | --- | --- |
| QM-AUTH-001 | P0 | /login offers public demo fill; valid demo login shows authenticated account state | Invalid login shows a specific error; required fields prevent submit; no secrets logged |
| QM-CART-001 | P0 | Add observed catalog product; bag contains product; quantity changes computed line/subtotal; removal restores empty state | Empty bag, minimum quantity, reload persistence if specified |
| QM-CHECKOUT-001 | P0 | Nonempty bag reaches shipping/checkout; required fields expose validation before order submission | Malformed email/postcode, missing address, displayed shipping/total consistency |

Each test uses a new browser context. No real payment, order placement, admin data changes, or account creation.
Only mark a contract verified after an actual observed outcome. Do not infer selectors or arithmetic rules from this matrix.