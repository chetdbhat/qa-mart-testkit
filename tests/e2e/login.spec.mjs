import { test, expect } from '@playwright/test';

test('QM-AUTH-001 sign-in requires email and password without transmitting credentials', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sign in to QAMart' })).toBeVisible();
  const email = page.getByRole('textbox', { name: 'Email address', exact: true });
  const password = page.getByRole('textbox', { name: 'Password', exact: true });
  await expect(email).toHaveAttribute('required', '');
  await expect(password).toHaveAttribute('required', '');
  await expect(email).toHaveValue('');
  await expect(password).toHaveValue('');
  expect(await email.evaluate(element => element.validity.valueMissing)).toBe(true);
  expect(await password.evaluate(element => element.validity.valueMissing)).toBe(true);
  await email.fill('not-an-email');
  expect(await email.evaluate(element => element.validity.typeMismatch)).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Fill demo credentials', exact: true })).toBeVisible();
});