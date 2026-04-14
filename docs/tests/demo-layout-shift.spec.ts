import { expect, test } from '@playwright/test';

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

const DEMO_URL = '/javascript-data-grid/demo/';

async function getDemoLayoutSnapshot(page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector('#hot-example-example');
    const preview = wrapper?.querySelector('.hot-example-preview');
    const toolbar = wrapper?.querySelector('.hot-example-toolbar');
    const holder = document.querySelector('#example .handsontable .ht_master .wtHolder');
    const heading = document.querySelector('#find-the-code-on-github');

    const toRect = (el) => {
      if (!el) {
        return null;
      }

      const r = el.getBoundingClientRect();

      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        width: r.width,
        height: r.height,
      };
    };

    return {
      scrollY: window.scrollY,
      wrapper: toRect(wrapper),
      preview: toRect(preview),
      toolbar: toRect(toolbar),
      holder: toRect(holder),
      heading: toRect(heading),
    };
  });
}

test('demo layout remains stable for visible interactions after scroll', async({ page, baseURL }) => {
  await page.goto(`${baseURL}${DEMO_URL}`);
  await page.waitForSelector('#example .handsontable .ht_master .wtHolder');

  const beforeScroll = await getDemoLayoutSnapshot(page);

  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(200);

  // Use a row that exists in the virtualized viewport after scrolling.
  const editedCell = page.locator('#example .handsontable .ht_master tbody tr').nth(4).locator('td').nth(1);

  await expect(editedCell).toBeVisible();

  const beforeEdit = await getDemoLayoutSnapshot(page);
  const beforeEditCellBox = await editedCell.boundingBox();

  await editedCell.dblclick();
  await page.keyboard.type('layout-shift-check');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  const afterEdit = await getDemoLayoutSnapshot(page);
  const afterEditCellBox = await editedCell.boundingBox();

  // Deterministic assertions — no page jump and no wrapper collapse/expand.
  expect(beforeEdit.scrollY).toBeGreaterThan(0);
  expect(afterEdit.scrollY).toBe(beforeEdit.scrollY);

  expect(afterEdit.wrapper?.height).toBeCloseTo(beforeEdit.wrapper?.height ?? 0, 3);
  expect(afterEdit.preview?.height).toBeCloseTo(beforeEdit.preview?.height ?? 0, 3);
  expect(afterEdit.toolbar?.top).toBeCloseTo(beforeEdit.toolbar?.top ?? 0, 3);
  expect(afterEdit.heading?.top).toBeCloseTo(beforeEdit.heading?.top ?? 0, 3);

  expect(afterEditCellBox?.y ?? 0).toBeCloseTo(beforeEditCellBox?.y ?? 0, 3);
  expect(beforeScroll.wrapper?.height).toBeCloseTo(afterEdit.wrapper?.height ?? 0, 3);
});
