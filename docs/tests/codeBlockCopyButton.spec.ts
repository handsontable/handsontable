import { test, expect } from '@playwright/test';

async function resolveCssColor(page, value: string): Promise<string> {
  return page.evaluate((colorValue) => {
    const element = document.createElement('div');

    element.style.backgroundColor = colorValue;
    document.body.appendChild(element);

    const resolvedColor = getComputedStyle(element).backgroundColor;

    element.remove();

    return resolvedColor;
  }, value);
}

test('code-block copy button has distinct light-theme hover and copied states', async({ page, baseURL }) => {
  await page.goto(`${baseURL}/react-data-grid/bundle-size/`);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForLoadState('domcontentloaded');

  const codeBlock = page.locator('.expressive-code figure').first();
  const copyButton = codeBlock.locator('.copy button');

  await expect(codeBlock).toBeVisible();

  const restingButtonBackground = await resolveCssColor(page, 'var(--sl-color-gray-5)');
  const restingButtonBorder = await resolveCssColor(page, 'var(--sl-color-gray-4)');
  const hoverButtonBackground = await resolveCssColor(page, 'var(--sl-color-gray-6)');
  const hoverButtonBorder = await resolveCssColor(page, 'var(--sl-color-gray-3)');

  await codeBlock.hover();
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toHaveCSS('opacity', '1');
  await expect(copyButton).toHaveCSS('background-color', restingButtonBackground);
  await expect(copyButton).toHaveCSS('border-color', restingButtonBorder);

  await copyButton.hover();
  await expect(copyButton).toHaveCSS('background-color', hoverButtonBackground);
  await expect(copyButton).toHaveCSS('border-color', hoverButtonBorder);

  await copyButton.click();
  await expect(copyButton).toHaveClass(/copied/);
  await page.mouse.move(0, 0);
  await expect(copyButton).toHaveCSS('opacity', '1');
});
