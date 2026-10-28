import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
const scriptResponses = [];
page.on('response', response => {
  if (response.request().resourceType() === 'script') {
    scriptResponses.push((async () => {
      const body = await response.body();
      return { path: new URL(response.url()).pathname, status: response.status(), contentType: response.headers()['content-type'], bytes: body.length, looksLikeHtml: /^\s*</.test(body.toString('utf8', 0, 100)) };
    })().catch(error => ({ path: new URL(response.url()).pathname, error: error.message.slice(0, 160) })));
  }
});
page.on('pageerror', error => console.log('PAGE ERROR', error.name, error.message.slice(0, 180)));
page.on('requestfailed', request => console.log('REQUEST FAILED', new URL(request.url()).pathname, request.failure()?.errorText));
try {
  await page.goto('https://qamart.vercel.app', { waitUntil: 'domcontentloaded' });
  if (process.argv.includes('--readiness')) {
    console.log('READY STATE', await page.evaluate(() => document.readyState));
    console.log('CLIENT BINDINGS', await page.getByRole('textbox', { name: 'Search products', exact: true }).evaluate(element => ({ reactPropsPresent: Object.keys(element).some(key => key.startsWith('__reactProps$')), reactFiberPresent: Object.keys(element).some(key => key.startsWith('__reactFiber$')) })));
    console.log('SCRIPT PATHS', await page.locator('script[src]').evaluateAll(elements => elements.map(element => new URL(element.src).pathname)));
    await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('Mech Keys 75');
    try { await expect(page.getByRole('article')).toHaveCount(1, { timeout: 10000 }); } catch { console.log('FILTER DID NOT RESPOND'); }
    console.log('PRODUCT COUNT', await page.getByRole('article').count());
    try { await page.waitForLoadState('load', { timeout: 15000 }); } catch { console.log('LOAD EVENT NOT REACHED'); }
    await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('');
    await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('Mech Keys 75');
    try { await expect(page.getByRole('article')).toHaveCount(1); } catch { console.log('FILTER STILL UNRESPONSIVE AFTER LOAD'); }
    console.log('SCRIPT RESPONSES', JSON.stringify(await Promise.all(scriptResponses), null, 2));
    console.log('FINAL CLIENT BINDINGS', await page.getByRole('textbox', { name: 'Search products', exact: true }).evaluate(element => ({ reactPropsPresent: Object.keys(element).some(key => key.startsWith('__reactProps$')), reactFiberPresent: Object.keys(element).some(key => key.startsWith('__reactFiber$')) })));
  } else {
  const product = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Mech Keys 75', exact: true }) });
  await product.getByRole('button', { name: 'Add to bag +' }).click();
  await page.getByRole('button', { name: 'Bag 1', exact: true }).click();
  await page.getByRole('complementary', { name: 'Shopping bag' }).getByRole('link', { name: 'Continue to checkout' }).click();
  console.log('CHECKOUT URL', page.url());
  console.log('CHECKOUT\n' + await page.locator('body').ariaSnapshot());
  await page.goto('https://qamart.vercel.app/login');
  page.on('response', response => {
    if (response.url().includes('/api/')) console.log('API STATUS', new URL(response.url()).pathname, response.status());
  });
  await page.getByRole('button', { name: 'Fill demo credentials', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  try { await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 }); } catch { console.log('LOGIN DID NOT REDIRECT'); }
  console.log('LOGIN RESULT URL', page.url());
  console.log('HEADINGS', await page.getByRole('heading').allTextContents());
  console.log('ALERTS', await page.getByRole('alert').allTextContents());
  console.log('BUTTONS', await page.getByRole('button').allTextContents());
  }
} finally {
  await browser.close();
}