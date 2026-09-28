import { test, expect } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/';
const THREE_COLUMN_VIEWPORTS = [800, 1021, 1152, 1213, 1278, 1279];
const DEFAULT_VIEWPORTS = [799, 1280];

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

  for (const width of THREE_COLUMN_VIEWPORTS) {
    test(`keeps three aligned cards per row at ${width}px`, async({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${baseURL}${PAGE_PATH}`);

      const grids = page.locator('.ht-card-grid--cols-3');
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
          gridBorders: [
            gridStyles.borderTopWidth,
            gridStyles.borderRightWidth,
            gridStyles.borderBottomWidth,
            gridStyles.borderLeftWidth,
          ],
          cardsHaveCollapsedBorder: cards.every((card) => {
            const cardStyles = getComputedStyle(card);

            return cardStyles.borderTopWidth === '0px' &&
              cardStyles.borderRightWidth === '1px' &&
              cardStyles.borderBottomWidth === '1px' &&
              cardStyles.borderLeftWidth === '0px';
          }),
        };
      }));

      expect(measurements).toEqual(measurements.map(measurement => ({
        cardCount: measurement.cardCount,
        columns: 3,
        columnGap: '0px',
        rowGap: '0px',
        rowCount: Math.ceil(measurement.cardCount / 3),
        widthDifference: measurement.widthDifference,
        titleFontSize: '14px',
        gridBorders: ['1px', '0px', '0px', '1px'],
        cardsHaveCollapsedBorder: true,
      })));
      for (const measurement of measurements) {
        expect(measurement.widthDifference).toBeLessThan(1);
      }

      const singleCardMeasurements = await page.locator('.ht-card-grid').evaluateAll((elements) => elements
        .filter(grid => grid.children.length === 1 &&
          grid.firstElementChild?.classList.contains('ht-link-card'))
        .map((grid) => {
          const card = grid.firstElementChild;
          const gridStyles = getComputedStyle(grid);
          const cardStyles = getComputedStyle(card);

          return {
            activeColumns: gridStyles.gridTemplateColumns
              .split(' ')
              .filter(columnWidth => parseFloat(columnWidth) > 0)
              .length,
            cardWidth: card.getBoundingClientRect().width,
            gridWidth: grid.getBoundingClientRect().width,
            titleFontSize: getComputedStyle(grid.querySelector('.title')).fontSize,
            gridBorders: [
              gridStyles.borderTopWidth,
              gridStyles.borderRightWidth,
              gridStyles.borderBottomWidth,
              gridStyles.borderLeftWidth,
            ],
            cardBorders: [
              cardStyles.borderTopWidth,
              cardStyles.borderRightWidth,
              cardStyles.borderBottomWidth,
              cardStyles.borderLeftWidth,
            ],
          };
        }));

      expect(singleCardMeasurements).toEqual(singleCardMeasurements.map(measurement => ({
        activeColumns: 1,
        cardWidth: measurement.cardWidth,
        gridWidth: measurement.gridWidth,
        titleFontSize: '16px',
        gridBorders: ['1px', '0px', '0px', '1px'],
        cardBorders: ['0px', '1px', '1px', '0px'],
      })));
      expect(singleCardMeasurements.every(measurement =>
        measurement.cardWidth / measurement.gridWidth > 0.99
      )).toBe(true);
    });
  }

  for (const width of DEFAULT_VIEWPORTS) {
    test(`keeps the default card styling at ${width}px`, async({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${baseURL}${PAGE_PATH}`);

      const grid = page.locator('.ht-card-grid--cols-3').first();
      await expect(grid).toBeVisible();
      await expect(grid).toHaveCSS('column-gap', '0px');
      await expect(grid.locator('.title').first()).toHaveCSS('font-size', '16px');
    });
  }
});
