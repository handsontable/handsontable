import { test, expect } from '@playwright/test';

/*
 * Starlight spaces markdown blocks with a single rule in its `starlight.content`
 * layer: `.sl-markdown-content <block> + <block> { margin-top: var(--sl-content-gap-y) }`.
 * Its `starlight.reset` layer sets `* { margin: 0 }`, so the two layers must stay
 * in Starlight's declared order - reset first. When the order breaks, reset wins
 * and every gap between paragraphs, code blocks and lists collapses to zero on
 * every docs page, while unlayered heading margins keep working and hide the
 * breakage (DEV-2742). These assertions read the gap the reader actually sees.
 */

const PAGE = '/javascript-data-grid/batch-operations/';

/**
 * Production still ships the pre-fix cascade: the fix landed on `develop` only,
 * and `prod-docs/*` picks docs changes up separately. `docs-visual-tests.yml`
 * offers `https://handsontable.com/docs` as a dispatch target, so skip there
 * rather than failing a screenshot run over a known, separately tracked gap.
 * Remove this guard once the fix reaches the production docs branch.
 */
function isProductionDocs(baseURL: string | undefined): boolean {
  if (!baseURL) {
    return false;
  }

  try {
    return new URL(baseURL).hostname === 'handsontable.com';
  } catch {
    return false;
  }
}

/**
 * Resolves a CSS length token (for example `var(--sl-content-gap-y)`) to the
 * pixel value the page computes for it.
 */
async function resolveCssLength(page, value: string): Promise<string> {
  return page.evaluate((lengthValue) => {
    const element = document.createElement('div');

    element.style.marginTop = lengthValue;
    document.body.appendChild(element);

    const resolved = getComputedStyle(element).marginTop;

    element.remove();

    return resolved;
  }, value);
}

test.describe('markdown prose spacing', () => {
  test.skip(
    ({ baseURL }) => isProductionDocs(baseURL),
    'production docs do not carry the cascade-layer fix yet'
  );

  test('consecutive paragraphs keep the markdown content gap', async({ page, baseURL }) => {
    await page.goto(`${baseURL}${PAGE}`);

    const contentGap = await resolveCssLength(page, 'var(--sl-content-gap-y)');

    expect(parseFloat(contentGap)).toBeGreaterThan(0);

    const secondParagraph = page.locator('.sl-markdown-content p + p').first();

    await expect(secondParagraph).toBeVisible();
    await expect(secondParagraph).toHaveCSS('margin-top', contentGap);
  });

  test('a code block after a paragraph keeps the markdown content gap', async({ page, baseURL }) => {
    await page.goto(`${baseURL}${PAGE}`);

    const contentGap = await resolveCssLength(page, 'var(--sl-content-gap-y)');

    expect(parseFloat(contentGap)).toBeGreaterThan(0);

    const codeBlock = page.locator('.sl-markdown-content p + .expressive-code').first();

    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toHaveCSS('margin-top', contentGap);
  });
});
