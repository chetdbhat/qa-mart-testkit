import { test, expect } from '@playwright/test';

test('QM-CART-001 adds a product and recalculates quantity and subtotal', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const product = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Mech Keys 75', exact: true }) });
  await expect(product).toBeVisible();
  const unitText = await product.locator('strong').innerText();
  const price = unitText.match(/^\$(\d+)\.(\d{2})$/);
  expect(price, 'Observed USD price must have exactly two decimal places').not.toBeNull();
  const unitCents = Number(price[1]) * 100 + Number(price[2]);
  const doubled = `$${Math.floor(unitCents * 2 / 100)}.${String(unitCents * 2 % 100).padStart(2, '0')}`;

  await product.getByRole('button', { name: 'Add to bag +' }).click();
  await expect(page.getByRole('button', { name: 'Bag 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bag 1', exact: true }).click();
  const bag = page.getByRole('complementary', { name: 'Shopping bag' });
  await expect(bag.getByText('Mech Keys 75', { exact: true })).toBeVisible();
  const amounts = bag.locator('strong').filter({ hasText: /^\$/ });
  await expect(amounts).toHaveText([unitText, unitText]);

  await bag.getByRole('button', { name: 'Increase quantity', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bag 2', exact: true })).toBeVisible();
  await expect(amounts).toHaveText([doubled, doubled]);

  await bag.getByRole('button', { name: 'Decrease quantity', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bag 1', exact: true })).toBeVisible();
  await expect(amounts).toHaveText([unitText, unitText]);
  await page.screenshot({ path: test.info().outputPath('cart-verified.png') });
});