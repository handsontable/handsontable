import { test, expect, type Page } from '@playwright/test';

/**
 * WCAG 1.4.1 Use of Color: a link in running text must differ from the text
 * around it by more than color. Prose links and the docs assistant's answer
 * links were underlined on hover only, so at rest color was the only cue.
 */

const PAGE = '/javascript-data-grid/accessibility/';
const THEMES = ['light', 'dark'] as const;
const PROSE_LINKS = '.sl-markdown-content p a:not(.source-code-link):not(:where(.not-content *))';

test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || 'http://localhost');

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: url.hostname,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ?? '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
  await page.addInitScript(() => {
    localStorage.setItem('hot-docs-chat-open', 'false');
  });
});

/**
 * Opens the guide page in the given color theme.
 */
async function openIn(page: Page, baseURL: string | undefined, theme: typeof THEMES[number]): Promise<void> {
  await page.goto(`${baseURL}${PAGE}`);
  await page.evaluate((selectedTheme) => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, theme);
  await expect(page.locator(PROSE_LINKS).first()).toBeVisible();
}

/**
 * Reads the text decoration line and color of an element.
 */
async function decorationOf(page: Page, selector: string, index = 0) {
  return page.locator(selector).nth(index).evaluate((element) => {
    const style = getComputedStyle(element);

    return { line: style.textDecorationLine, color: style.textDecorationColor, text: style.color };
  });
}

for (const theme of THEMES) {
  test(`underlines every prose link at rest in the ${theme} theme`, async ({ page, baseURL }) => {
    await openIn(page, baseURL, theme);

    const lines = await page.locator(PROSE_LINKS).evaluateAll(
      links => links.map(link => getComputedStyle(link).textDecorationLine),
    );

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter(line => line !== 'underline')).toEqual([]);
  });

  test(`keeps the prose link underline on hover in the ${theme} theme`, async ({ page, baseURL }) => {
    await openIn(page, baseURL, theme);

    const atRest = await decorationOf(page, PROSE_LINKS);

    await page.locator(PROSE_LINKS).first().hover();

    const hovered = await decorationOf(page, PROSE_LINKS);

    expect(hovered.line).toBe('underline');
    expect(hovered.color).toBe(hovered.text);
    expect(hovered.color).not.toBe(atRest.color);
  });

  test(`turns the underline of a link wrapping inline code to the text color on hover in the ${theme} theme`, async ({ page, baseURL }) => {
    await openIn(page, baseURL, theme);
    await page.evaluate(() => {
      const paragraph = document.createElement('p');

      paragraph.innerHTML = 'Set the <a href="#" id="code-link"><code>columnSorting</code></a> option.';
      document.querySelector('.sl-markdown-content')!.prepend(paragraph);
    });

    const codeLink = page.locator('#code-link');
    const atRest = await decorationOf(page, '#code-link');

    expect(atRest.line).toBe('underline');

    await codeLink.hover();

    const hovered = await decorationOf(page, '#code-link');

    expect(hovered.line).toBe('underline');
    expect(hovered.color).toBe(hovered.text);
  });

  test(`underlines docs assistant answer links at rest in the ${theme} theme`, async ({ page, baseURL }) => {
    await openIn(page, baseURL, theme);
    await page.evaluate(() => {
      const body = document.createElement('div');

      body.className = 'da-assistant-body';
      body.innerHTML = '<p>See the <a href="#">accessibility guide</a> for details.</p>';
      document.body.append(body);
    });

    const answerLink = page.locator('.da-assistant-body a');

    await expect(answerLink).not.toHaveCSS('text-underline-offset', 'auto');
    await expect(answerLink).toHaveCSS('text-decoration-line', 'underline');
  });
}

test('leaves link cards without an underline', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/javascript-data-grid/`);

  const cards = page.locator('.sl-markdown-content .ht-link-card a');

  test.skip(await cards.count() === 0, 'no link card on the page');

  expect((await decorationOf(page, '.sl-markdown-content .ht-link-card a')).line).toBe('none');
});
