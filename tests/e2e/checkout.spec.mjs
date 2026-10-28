import { test, expect } from '@playwright/test';

test('QM-CHECKOUT-001 empty checkout requires contact and delivery before submission', async ({ page }) => {
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Checkout test run.' })).toBeVisible();
  await expect(page.getByText('Your bag is empty. Head back to the shop and add something good.')).toBeVisible();
  for (const name of ['Email', 'First name', 'Last name', 'Address', 'City', 'Postal code']) {
    const input = page.getByRole('textbox', { name, exact: true });
    await expect(input).toHaveAttribute('required', '');
    expect(await input.evaluate(element => element.validity.valueMissing), `${name} must reject missing value`).toBe(true);
  }
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  await email.fill('invalid-email');
  expect(await email.evaluate(element => element.validity.typeMismatch)).toBe(true);
  await expect(page.getByRole('button', { name: 'Place demo order', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});