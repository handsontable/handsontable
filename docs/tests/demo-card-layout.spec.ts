import { test, expect } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/';
const ISSUE_VIEWPORTS = [1021, 1152, 1213, 1278];

test.describe('Introduction demo-card layout', () => {
  test.beforeEach(async({ page, baseURL }) => {
    const url = new URL(baseURL?.toString() || '');
    const extractedDomain = url.hostname;

    await page.context().addCookies([
      {
        name: 'CookieConsent',
        value: '-2',
        domain: extractedDomain,
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
        value: process.env.PASS_COOKIE ? process.env.PASS_COOKIE : '',
        domain: 'dev.handsontable.com',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  });

  for (const width of ISSUE_VIEWPORTS) {
    test(`keeps three aligned cards per row at ${width}px`, async({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${baseURL}${PAGE_PATH}`);

      const grids = page.locator('.ht-card-grid:has(> .ht-link-card:nth-child(3))');
      await expect(grids.first()).toBeVisible();

      const measurements = await grids.evaluateAll((elements) => elements.map((grid) => {
        const cards = [...grid.children];
        const rowPositions = new Set(
          cards.map(card => Math.round(card.getBoundingClientRect().y * 100) / 100)
        );
        const widths = cards.map(card => card.getBoundingClientRect().width);
        const gridStyles = getComputedStyle(grid);

        return {
          cardCount: cards.length,
          columns: gridStyles.gridTemplateColumns.split(' ').length,
          columnGap: gridStyles.columnGap,
          rowGap: gridStyles.rowGap,
          rowCount: rowPositions.size,
          widthDifference: Math.max(...widths) - Math.min(...widths),
          titleFontSize: getComputedStyle(grid.querySelector('.title')).fontSize,
        };
      }));

      expect(measurements.length).toBeGreaterThan(0);
      expect(measurements.every(measurement =>
        measurement.columns === 3 &&
        measurement.columnGap === '16px' &&
        measurement.rowGap === '16px' &&
        measurement.rowCount === Math.ceil(measurement.cardCount / 3) &&
        measurement.widthDifference < 0.01 &&
        measurement.titleFontSize === '14px'
      )).toBe(true);

      const singleCardMeasurements = await page.locator('.ht-card-grid').evaluateAll((elements) => elements
        .filter(grid => grid.children.length === 1 &&
          grid.firstElementChild?.classList.contains('ht-link-card'))
        .map((grid) => {
          const card = grid.firstElementChild;
          const gridStyles = getComputedStyle(grid);

          return {
            activeColumns: gridStyles.gridTemplateColumns
              .split(' ')
              .filter(columnWidth => parseFloat(columnWidth) > 0)
              .length,
            cardWidth: card.getBoundingClientRect().width,
            gridWidth: grid.getBoundingClientRect().width,
          };
        }));

      expect(singleCardMeasurements.length).toBeGreaterThan(0);
      expect(singleCardMeasurements.every(measurement =>
        measurement.activeColumns === 1 &&
        measurement.cardWidth / measurement.gridWidth > 0.99
      )).toBe(true);
    });
  }

  test('keeps the default card styling outside the medium breakpoint', async({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseURL}${PAGE_PATH}`);

    const grid = page.locator('.ht-card-grid:has(> .ht-link-card)').first();
    await expect(grid).toBeVisible();
    await expect(grid).toHaveCSS('column-gap', '0px');
    await expect(grid.locator('.title').first()).toHaveCSS('font-size', '16px');
  });
});
