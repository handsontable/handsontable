import { test, expect as baseExpect, type Locator, type Page } from '@playwright/test';

const expect = baseExpect.configure({ timeout: 15000 });

const CODE_BLOCK = '.expressive-code pre';
const TABLE_WRAPPER = '.table-container';

const FORMULA_BUILDER = '/javascript-data-grid/formula-builder/';
const ROWS_SORTING = '/javascript-data-grid/rows-sorting/';
const MIGRATION_GUIDE = '/vue-data-grid/migration-from-17.1-to-18.0/';

const EXAMPLE_DUMPS = [
  {
    title: 'the Redux store dump',
    path: '/react-data-grid/redux/',
    selector: '#redux-preview',
    key: 'ArrowRight',
    axis: 'x',
  },
  {
    title: 'the Vuex store dump',
    path: '/vue-data-grid/vue-vuex/',
    selector: '#vuex-preview pre',
    key: 'ArrowDown',
    axis: 'y',
  },
  {
    title: 'the Pinia store dump',
    path: '/vue-data-grid/vue-pinia/',
    selector: '#pinia-preview pre',
    key: 'ArrowDown',
    axis: 'y',
  },
] as const;

/**
 * At 1280px the page shows the table of contents beside the content, which leaves a 630px content
 * column. At 1150px the table of contents is gone and the column is 816px wide, so a block between
 * those two widths overflows in the first viewport and fits in the second.
 */
const NARROW_COLUMN_VIEWPORT = { width: 1280, height: 720 };
const WIDE_COLUMN_VIEWPORT = { width: 1150, height: 720 };

const RESIZED_BLOCKS = [
  {
    title: 'a Markdown table',
    path: FORMULA_BUILDER,
    headingId: 'autocomplete-and-popups',
    selector: TABLE_WRAPPER,
    name: 'Table: Autocomplete and popups',
  },
  {
    title: 'a code block',
    path: ROWS_SORTING,
    headingId: 'sort-data-programmatically',
    selector: CODE_BLOCK,
    name: 'Code: Sort data programmatically',
  },
] as const;

const PAGES_WITH_SCROLLABLE_BLOCKS = [
  FORMULA_BUILDER,
  '/javascript-data-grid/xlsx-engine/',
  ROWS_SORTING,
  '/javascript-data-grid/api/filters/',
  '/javascript-data-grid/recipes/accessibility/aria-grid/',
  MIGRATION_GUIDE,
  ...EXAMPLE_DUMPS.map(dump => dump.path),
];

type Axis = 'x' | 'y';

/**
 * Opens a docs page and waits until its examples have rendered, so that no block changes size afterward.
 */
async function openDocsPage(page: Page, baseURL: string | undefined, path: string) {
  await page.goto(`${baseURL}${path}`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);
  await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });
}

/**
 * Lists the blocks that sit between a heading and the next heading of the page, as indexes among every
 * block of that kind in the main content. A block is listed when its horizontal overflow equals `overflowing`.
 */
function blockIndexesBelow(page: Page, headingId: string, selector: string, overflowing: boolean) {
  return page.evaluate(({ id, blockSelector, wantOverflow }) => {
    const main = document.querySelector('main');
    const heading = document.getElementById(id);

    if (!main || !heading) {
      return [];
    }

    const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const nextHeading = headings[headings.indexOf(heading) + 1];

    return [...main.querySelectorAll(blockSelector)].flatMap((block, index) => {
      const isAfterHeading = (heading.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      const isBeforeNextHeading = !nextHeading
        || (nextHeading.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
      const isOverflowing = block.scrollWidth > block.clientWidth;

      return isAfterHeading && isBeforeNextHeading && isOverflowing === wantOverflow ? [index] : [];
    });
  }, { id: headingId, blockSelector: selector, wantOverflow: overflowing });
}

/**
 * Finds the blocks of one kind below a heading and fails when the page holds fewer than `count` of them.
 */
async function blocksBelow(
  page: Page,
  headingId: string,
  selector: string,
  { overflowing, count }: { overflowing: boolean, count: number },
): Promise<Locator[]> {
  await expect.poll(async() => (await blockIndexesBelow(page, headingId, selector, overflowing)).length)
    .toBeGreaterThanOrEqual(count);

  const indexes = await blockIndexesBelow(page, headingId, selector, overflowing);

  return indexes.map(index => page.locator('main').locator(selector).nth(index));
}

/**
 * Reads how far the content of a block reaches past its box on one axis.
 */
function overflowOf(block: Locator, axis: Axis) {
  return block.evaluate((element, scrollAxis) => (scrollAxis === 'x'
    ? element.scrollWidth - element.clientWidth
    : element.scrollHeight - element.clientHeight), axis);
}

/**
 * Reads the scroll offset of a block on one axis.
 */
function scrollOffsetOf(block: Locator, axis: Axis) {
  return block.evaluate((element, scrollAxis) => (scrollAxis === 'x' ? element.scrollLeft : element.scrollTop), axis);
}

/**
 * Asserts that a scrolling block is in the Tab order and is exposed as a named region.
 */
async function expectNamedTabStop(block: Locator) {
  await expect(block).toHaveAttribute('tabindex', '0');
  await expect(block).toHaveAttribute('role', 'region');
  await expect(block).toHaveAccessibleName(/\S/);
}

/**
 * Asserts that an arrow key scrolls the block that has the focus.
 */
async function expectArrowKeyToScroll(page: Page, block: Locator, key: string, axis: Axis) {
  await block.focus();
  await expect(block).toBeFocused();
  expect(await scrollOffsetOf(block, axis)).toBe(0);
  await page.keyboard.press(key);
  await expect.poll(() => scrollOffsetOf(block, axis)).toBeGreaterThan(0);
}

/**
 * Reads the accessible name the author gave to every region of the main content, in document order.
 */
function regionNames(page: Page) {
  return page.locator('main [role="region"]').evaluateAll(regions => regions.map((region) => {
    const labelledBy = (region.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
    const referenced = labelledBy.map(id => document.getElementById(id)?.textContent ?? '').join(' ');

    return (referenced.trim() || region.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  }));
}

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
});

test.describe('Markdown tables', () => {
  test('a table wider than its column is a named Tab stop that ArrowRight scrolls', async({ page, baseURL }) => {
    await openDocsPage(page, baseURL, FORMULA_BUILDER);

    const [table] = await blocksBelow(page, 'autocomplete-and-popups', TABLE_WRAPPER, { overflowing: true, count: 1 });

    await expectNamedTabStop(table);
    await expect(page.getByRole('region', { name: 'Table: Autocomplete and popups', exact: true })).toHaveCount(1);
    await expectArrowKeyToScroll(page, table, 'ArrowRight', 'x');
  });

  test('a table that fits its column is not a Tab stop', async({ page, baseURL }) => {
    await openDocsPage(page, baseURL, FORMULA_BUILDER);

    const [wideTable] = await blocksBelow(page, 'autocomplete-and-popups', TABLE_WRAPPER, { overflowing: true, count: 1 });
    const [fittingTable] = await blocksBelow(page, 'configuration-options', TABLE_WRAPPER, { overflowing: false, count: 1 });

    await expect(wideTable).toHaveAttribute('tabindex', '0');
    await expect(fittingTable).not.toHaveAttribute('tabindex');
    await expect(fittingTable).not.toHaveAttribute('role');
  });

  test('a second wide table below the same heading gets a numbered name', async({ page, baseURL }) => {
    await openDocsPage(page, baseURL, MIGRATION_GUIDE);

    const [first, second] = await blocksBelow(
      page, 'replace-other-removed-plugin-types', TABLE_WRAPPER, { overflowing: true, count: 2 }
    );

    await expectNamedTabStop(first);
    await expectNamedTabStop(second);
    await expect(first).toHaveAccessibleName('Table: Replace other removed plugin types');
    await expect(second).toHaveAccessibleName('Table 2: Replace other removed plugin types');
  });
});

test.describe('Code blocks', () => {
  test('a code block wider than its column is a named Tab stop that ArrowRight scrolls', async({ page, baseURL }) => {
    await openDocsPage(page, baseURL, ROWS_SORTING);

    const [codeBlock] = await blocksBelow(page, 'configure-sorting', CODE_BLOCK, { overflowing: true, count: 1 });

    await expectNamedTabStop(codeBlock);
    await expect(page.getByRole('region', { name: 'Code: Configure sorting', exact: true })).toHaveCount(1);
    await expectArrowKeyToScroll(page, codeBlock, 'ArrowRight', 'x');
  });

  test('a second wide code block below the same heading gets a numbered name', async({ page, baseURL }) => {
    await openDocsPage(page, baseURL, MIGRATION_GUIDE);

    const [first, second] = await blocksBelow(page, 'replace-detailedsettings', CODE_BLOCK, { overflowing: true, count: 2 });

    await expectNamedTabStop(first);
    await expectNamedTabStop(second);
    await expect(first).toHaveAccessibleName('Code: Replace DetailedSettings');
    await expect(second).toHaveAccessibleName('Code 2: Replace DetailedSettings');
  });
});

test.describe('Viewport changes', () => {
  RESIZED_BLOCKS.forEach(({ title, path, headingId, selector, name }) => {
    test(`${title} stops being a Tab stop when it fits and gets the same name back when it overflows again`, async({
      page, baseURL,
    }) => {
      await page.setViewportSize(NARROW_COLUMN_VIEWPORT);
      await openDocsPage(page, baseURL, path);

      const [block] = await blocksBelow(page, headingId, selector, { overflowing: true, count: 1 });

      await expectNamedTabStop(block);
      await expect(block).toHaveAccessibleName(name);

      await page.setViewportSize(WIDE_COLUMN_VIEWPORT);
      await expect.poll(() => overflowOf(block, 'x')).toBe(0);
      await expect(block).not.toHaveAttribute('tabindex');
      await expect(block).not.toHaveAttribute('role');
      await expect(block).not.toHaveAttribute('aria-label');

      await page.setViewportSize(NARROW_COLUMN_VIEWPORT);
      await expect.poll(() => overflowOf(block, 'x')).toBeGreaterThan(0);
      await expectNamedTabStop(block);
      await expect(block).toHaveAccessibleName(name);
    });
  });
});

test.describe('Store dumps in the examples', () => {
  EXAMPLE_DUMPS.forEach(({ title, path, selector, key, axis }) => {
    test(`${title} is a named Tab stop that ${key} scrolls`, async({ page, baseURL }) => {
      await openDocsPage(page, baseURL, path);

      const dump = page.locator(selector);

      await expect(dump).toBeVisible();
      await expect.poll(() => overflowOf(dump, axis)).toBeGreaterThan(0);
      await expectNamedTabStop(dump);
      await expectArrowKeyToScroll(page, dump, key, axis);
    });
  });
});

test.describe('Region names', () => {
  PAGES_WITH_SCROLLABLE_BLOCKS.forEach((path) => {
    test(`every scrolling region on ${path} has a name no other region shares`, async({ page, baseURL }) => {
      await openDocsPage(page, baseURL, path);

      await expect.poll(async() => {
        const names = await regionNames(page);

        return {
          hasRegions: names.length > 0,
          unnamed: names.filter(name => name === '').length,
          repeated: [...new Set(names.filter((name, index) => name !== '' && names.indexOf(name) !== index))],
        };
      }).toEqual({ hasRegions: true, unnamed: 0, repeated: [] });
    });
  });
});
