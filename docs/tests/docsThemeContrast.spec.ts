import { test, expect, type Page } from '@playwright/test';

/**
 * Docs theme contrast and forced-colors cues:
 * - WCAG 1.4.3: code block line numbers stand 4.5:1 from the code background.
 * - WCAG 1.4.11: the example text fields have an edge that stands 3:1 from the page.
 * - WCAG 1.4.1: in forced colors, the current breadcrumb and the current table of
 *   contents entry differ from the other links by more than color.
 */

const THEMES = ['light', 'dark'] as const;
const FIELD_PAGES = [
  '/javascript-data-grid/accessibility/',
  '/javascript-data-grid/focus-scopes/',
];
const CODE_PAGE = '/javascript-data-grid/rows-sorting/';
const NAV_PAGE = '/javascript-data-grid/rows-sorting/';
const CURRENT_TOC_ENTRY = 'starlight-toc a[aria-current="true"]';

test.beforeEach(async({ page, baseURL }) => {
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
 * Opens a docs page in the given color theme.
 */
async function openIn(page: Page, baseURL: string | undefined, path: string, theme: typeof THEMES[number]) {
  await page.goto(`${baseURL}${path}`);
  await page.evaluate((selectedTheme) => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, theme);
}

/**
 * Returns the contrast ratio between a color of the first visible element that
 * matches `foreground` and the opaque background behind its closest `background`
 * ancestor (or itself). Colors are resolved through a canvas, so `oklch()` and
 * `color-mix()` values compare as the sRGB the screen shows.
 */
async function contrastOf(page: Page, foreground: string, property: 'color' | 'borderTopColor' | 'outlineColor', background: string) {
  return page.evaluate(({ foregroundSelector, colorProperty, backgroundSelector }) => {
    const toRgb = (color: string) => {
      const canvas = document.createElement('canvas');

      canvas.width = 1;
      canvas.height = 1;

      const context = canvas.getContext('2d')!;

      context.fillStyle = '#fff';
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);

      return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const luminance = ([red, green, blue]: number[]) => {
      const [r, g, b] = [red, green, blue].map((channel) => {
        const value = channel / 255;

        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });

      return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    };
    const opaqueBackground = (element: Element | null): string => {
      let node = element;

      while (node) {
        const color = getComputedStyle(node).backgroundColor;

        if (color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color)) {
          return color;
        }

        node = node.parentElement;
      }

      return getComputedStyle(document.documentElement).backgroundColor || '#fff';
    };
    const foregroundElement = [...document.querySelectorAll(foregroundSelector)]
      .find(element => element.getBoundingClientRect().width > 0)!;
    const backgroundElement = foregroundElement.closest(backgroundSelector)!;
    const front = luminance(toRgb(getComputedStyle(foregroundElement)[colorProperty]));
    const back = luminance(toRgb(opaqueBackground(backgroundElement)));

    return (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
  }, { foregroundSelector: foreground, colorProperty: property, backgroundSelector: background });
}

for (const theme of THEMES) {
  test(`code block line numbers stand 4.5:1 from the code background in the ${theme} theme`, async({ page, baseURL }) => {
    await openIn(page, baseURL, CODE_PAGE, theme);
    await expect(page.locator('.expressive-code .ln').filter({ visible: true }).first()).toBeVisible();

    expect(await contrastOf(page, '.expressive-code .ln', 'color', 'pre')).toBeGreaterThanOrEqual(4.5);
  });

  for (const path of FIELD_PAGES) {
    test(`example text fields on ${path} have an edge that stands 3:1 from the page in the ${theme} theme`, async({ page, baseURL }) => {
      await openIn(page, baseURL, path, theme);
      await expect(page.locator('.placeholder-input').filter({ visible: true }).first()).toBeVisible();

      expect(await contrastOf(page, '.placeholder-input', 'borderTopColor', '.placeholder-input'))
        .toBeGreaterThanOrEqual(3);
    });

    test(`a focused example text field on ${path} draws an outline that stands 3:1 from the page in the ${theme} theme`, async({ page, baseURL }) => {
      await openIn(page, baseURL, path, theme);

      const field = page.locator('.placeholder-input').filter({ visible: true }).first();

      await field.focus();
      await expect(field).toBeFocused();
      await expect(field).toHaveCSS('outline-style', 'solid');
      await expect(field).toHaveCSS('outline-width', '2px');

      expect(await contrastOf(page, '.placeholder-input', 'outlineColor', '.placeholder-input'))
        .toBeGreaterThanOrEqual(3);
    });
  }
}

/**
 * Reads the cue of the current entry of a table of contents and where the text
 * of the current entry and of a non-current entry at the same level starts.
 */
async function tocEntryCues(page: Page, currentSelector: string) {
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(page.locator(currentSelector).first()).toBeAttached();

  return page.evaluate((selector) => {
    const textStart = (element: Element) => {
      const range = document.createRange();

      range.selectNodeContents(element);

      return Math.round(range.getClientRects()[0].left);
    };
    const current = [...document.querySelectorAll(selector)]
      .find(link => link.getBoundingClientRect().width > 0)!;
    const other = [...current.closest('li')!.parentElement!.children]
      .map(item => item.querySelector(':scope > a'))
      .find(link => link && !link.hasAttribute('aria-current') && link.getBoundingClientRect().width > 0)!;
    const style = getComputedStyle(current);

    return {
      weight: style.fontWeight,
      border: style.borderInlineStartWidth,
      textStart: textStart(current),
      otherTextStart: textStart(other),
    };
  }, currentSelector);
}

test('in forced colors, the current table of contents entry keeps its text in line with the others', async({ page, baseURL }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await openIn(page, baseURL, NAV_PAGE, 'light');

  const cues = await tocEntryCues(page, CURRENT_TOC_ENTRY);

  expect(cues.border).toBe('3px');
  expect(cues.textStart).toBe(cues.otherTextStart);
});

test('in forced colors, the current mobile table of contents entry keeps a non-color cue in line with the others', async({ page, baseURL }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.emulateMedia({ forcedColors: 'active' });
  await openIn(page, baseURL, NAV_PAGE, 'light');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(page.locator(CURRENT_TOC_ENTRY).first()).toBeAttached();
  await page.locator('.mobile-toc-toggle').click();
  await expect(page.locator('.mobile-toc-panel')).toBeVisible();

  const cues = await tocEntryCues(page, '.mobile-toc-panel nav a[aria-current="true"]');

  expect(cues.weight).toBe('700');
  expect(cues.border).toBe('3px');
  expect(cues.textStart).toBe(cues.otherTextStart);
});

/**
 * Reads the font weight and the inline-start border width of the current and of
 * a non-current link in the breadcrumb and in the table of contents.
 */
async function navigationCues(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(page.locator(CURRENT_TOC_ENTRY).first()).toBeAttached();

  return page.evaluate((currentTocSelector) => {
    const cue = (element: Element) => {
      const style = getComputedStyle(element);

      return { weight: style.fontWeight, border: style.borderInlineStartWidth };
    };
    const tocCurrent = [...document.querySelectorAll(currentTocSelector)]
      .find(link => link.getBoundingClientRect().width > 0)!;
    const tocOther = [...tocCurrent.closest('ul')!.querySelectorAll('a')]
      .find(link => !link.hasAttribute('aria-current'))!;

    return {
      breadcrumbCurrent: cue(document.querySelector('.hot-breadcrumbs__current')!),
      breadcrumbOther: cue(document.querySelector('.hot-breadcrumbs__home')!),
      tocCurrent: cue(tocCurrent),
      tocOther: cue(tocOther),
    };
  }, CURRENT_TOC_ENTRY);
}

test('in forced colors, the current breadcrumb and table of contents entry keep a non-color cue', async({ page, baseURL }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await openIn(page, baseURL, NAV_PAGE, 'light');

  const cues = await navigationCues(page);

  expect(cues.breadcrumbCurrent.weight).toBe('700');
  expect(cues.breadcrumbOther.weight).not.toBe('700');
  expect(cues.tocCurrent.weight).toBe('700');
  expect(cues.tocCurrent.border).toBe('3px');
  expect(cues.tocOther.weight).not.toBe('700');
  expect(cues.tocOther.border).toBe('1px');
});

test('without forced colors, the breadcrumb and table of contents keep their normal look', async({ page, baseURL }) => {
  await openIn(page, baseURL, NAV_PAGE, 'light');

  const cues = await navigationCues(page);

  expect(cues.breadcrumbCurrent.weight).toBe(cues.breadcrumbOther.weight);
  expect(cues.tocCurrent.weight).toBe(cues.tocOther.weight);
  expect(cues.tocCurrent.border).toBe('1px');
});
