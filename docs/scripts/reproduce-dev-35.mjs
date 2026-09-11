import { chromium } from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4321/docs';
const widths = [1021, 1100, 1151, 1152, 1213, 1277, 1278];
const applyProposedSizing = process.env.DEV_35_PROPOSED === '1';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ height: 900, width: widths[0] });

try {
  const measurements = [];

  for (const width of widths) {
    await page.setViewportSize({ height: 900, width });
    await page.goto(`${baseUrl}/javascript-data-grid/`, { waitUntil: 'domcontentloaded' });

    if (applyProposedSizing) {
      await page.addStyleTag({
        content: `
          @media (min-width: 800px) and (max-width: 1279px) {
            .ht-card-grid:has(> .ht-link-card:nth-child(3)) {
              grid-template-columns: repeat(3, calc((100% - 32px) / 3));
              gap: 16px;
            }

            .ht-link-card .title {
              font-size: 14px;
            }
          }
        `,
      });
    }

    measurements.push(await page.evaluate(() => {
      const firstGrid = document.querySelector('.ht-card-grid');
      const contentPanel = document.querySelector('.content-panel');
      const cards = firstGrid ? [...firstGrid.children] : [];
      const rowPositions = new Set(
        cards.map(card => Math.round(card.getBoundingClientRect().y * 100) / 100)
      );

      return {
        viewportWidth: window.innerWidth,
        contentWidth: contentPanel?.getBoundingClientRect().width ?? null,
        rightSidebarDisplay: getComputedStyle(document.querySelector('.right-sidebar')).display,
        columns: firstGrid ? getComputedStyle(firstGrid).gridTemplateColumns : null,
        cardCount: cards.length,
        rowCount: rowPositions.size,
        cardWidths: cards.map(card => Math.round(card.getBoundingClientRect().width * 10) / 10),
      };
    }));
  }

  console.log(JSON.stringify({
    page: `${baseUrl}/javascript-data-grid/`,
    mode: applyProposedSizing ? 'proposed-sizing' : 'current',
    measurements,
  }, null, 2));
} finally {
  await browser.close();
}
