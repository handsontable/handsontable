import { test, expect as baseExpect, type Locator, type Page } from '@playwright/test';

const expect = baseExpect.configure({ timeout: 15000 });

const CODE_BLOCK = '.expressive-code pre';
const TABLE_WRAPPER = '.table-container';

const FORMULA_BUILDER = '/javascript-data-grid/formula-builder/';
const ROWS_SORTING = '/javascript-data-grid/rows-sorting/';
const MIGRATION_GUIDE = '/vue-data-grid/migration-from-17.1-to-18.0/';
const API_FILTERS = '/javascript-data-grid/api/filters/';

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

type Axis = 'x' | 'y';

/**
 * Opens a docs page. It does not wait for the examples of the page: each assertion waits for its own block.
 */
async function openDocsPage(page: Page, baseURL: string | undefined, path: string) {
  await page.goto(`${baseURL}${path}`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);
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

/**
 * Asserts that a block is not in the Tab order and carries no region role or name.
 */
async function expectNoTabStop(block: Locator) {
  await expect(block).not.toHaveAttribute('tabindex');
  await expect(block).not.toHaveAttribute('role');
  await expect(block).not.toHaveAttribute('aria-label');
}

/**
 * Asserts that a block stops being a Tab stop when the viewport makes it fit, and gets the same name back
 * when it overflows again.
 */
async function expectResizeToToggleTabStop(page: Page, block: Locator, name: string) {
  await expect(block).toHaveAccessibleName(name);

  await page.setViewportSize(WIDE_COLUMN_VIEWPORT);
  await expect.poll(() => overflowOf(block, 'x')).toBe(0);
  await expectNoTabStop(block);

  await page.setViewportSize(NARROW_COLUMN_VIEWPORT);
  await expect.poll(() => overflowOf(block, 'x')).toBeGreaterThan(0);
  await expectNamedTabStop(block);
  await expect(block).toHaveAccessibleName(name);
}

/**
 * Asserts that every region of the main content has a name and that no two regions share one.
 */
async function expectUniqueRegionNames(page: Page) {
  await expect.poll(async() => {
    const names = await regionNames(page);

    return {
      hasRegions: names.length > 0,
      unnamed: names.filter(name => name === '').length,
      repeated: [...new Set(names.filter((name, index) => name !== '' && names.indexOf(name) !== index))],
    };
  }).toEqual({ hasRegions: true, unnamed: 0, repeated: [] });
}

test.describe('Markdown tables', () => {
  test('a wide table is a named Tab stop that ArrowRight scrolls, and only while it overflows', async({
    page, baseURL,
  }) => {
    await page.setViewportSize(NARROW_COLUMN_VIEWPORT);
    await openDocsPage(page, baseURL, FORMULA_BUILDER);

    const [wideTable] = await blocksBelow(page, 'autocomplete-and-popups', TABLE_WRAPPER, { overflowing: true, count: 1 });
    const [fittingTable] = await blocksBelow(page, 'configuration-options', TABLE_WRAPPER, { overflowing: false, count: 1 });

    await test.step('the wide table is a named Tab stop', async() => {
      await expectNamedTabStop(wideTable);
      await expect(page.getByRole('region', { name: 'Table: Autocomplete and popups', exact: true })).toHaveCount(1);
    });

    await test.step('a table that fits its column is not a Tab stop', async() => {
      await expectNoTabStop(fittingTable);
    });

    await test.step('every region of the page has its own name', async() => {
      await expectUniqueRegionNames(page);
    });

    await test.step('ArrowRight scrolls the focused table', async() => {
      await expectArrowKeyToScroll(page, wideTable, 'ArrowRight', 'x');
    });

    await test.step('the table is a Tab stop only while it overflows', async() => {
      await expectResizeToToggleTabStop(page, wideTable, 'Table: Autocomplete and popups');
    });
  });
});

test.describe('Code blocks', () => {
  test('a wide code block is a named Tab stop that ArrowRight scrolls, and only while it overflows', async({
    page, baseURL,
  }) => {
    await page.setViewportSize(NARROW_COLUMN_VIEWPORT);
    await openDocsPage(page, baseURL, ROWS_SORTING);

    const [codeBlock] = await blocksBelow(page, 'configure-sorting', CODE_BLOCK, { overflowing: true, count: 1 });
    const [resizedBlock] = await blocksBelow(
      page, 'sort-data-programmatically', CODE_BLOCK, { overflowing: true, count: 1 }
    );

    await test.step('the wide code block is a named Tab stop', async() => {
      await expectNamedTabStop(codeBlock);
      await expect(page.getByRole('region', { name: 'Code: Configure sorting', exact: true })).toHaveCount(1);
    });

    await test.step('the source code blocks of an example above it take no number', async() => {
      const [afterExamples] = await blocksBelow(
        page, 'set-an-initial-multi-column-sort-order', CODE_BLOCK, { overflowing: true, count: 1 }
      );

      await expect(afterExamples).toHaveAccessibleName('Code: Set an initial multi-column sort order');
    });

    await test.step('every region of the page has its own name', async() => {
      await expectUniqueRegionNames(page);
    });

    await test.step('ArrowRight scrolls the focused code block', async() => {
      await expectArrowKeyToScroll(page, codeBlock, 'ArrowRight', 'x');
    });

    await test.step('a code block is a Tab stop only while it overflows', async() => {
      await expectNamedTabStop(resizedBlock);
      await expectResizeToToggleTabStop(page, resizedBlock, 'Code: Sort data programmatically');
    });
  });

  test('a code block below an API heading is named without the controls of the heading', async({ page, baseURL }) => {
    await openDocsPage(page, baseURL, API_FILTERS);

    await expect(page.locator('main').locator(`${CODE_BLOCK}[role="region"]`).first()).toHaveAccessibleName(/\S/);

    const names = await regionNames(page);

    expect(names.filter(name => /Ask AI|Source code/.test(name))).toEqual([]);
    await expectUniqueRegionNames(page);
  });
});

test.describe('Repeated headings', () => {
  test('blocks below the same heading get numbered names, and no two regions of the page share one', async({
    page, baseURL,
  }) => {
    await openDocsPage(page, baseURL, MIGRATION_GUIDE);

    await test.step('a second wide table below a heading gets a numbered name', async() => {
      const [first, second] = await blocksBelow(
        page, 'replace-other-removed-plugin-types', TABLE_WRAPPER, { overflowing: true, count: 2 }
      );

      await expectNamedTabStop(first);
      await expectNamedTabStop(second);
      await expect(first).toHaveAccessibleName('Table: Replace other removed plugin types');
      await expect(second).toHaveAccessibleName('Table 2: Replace other removed plugin types');
    });

    await test.step('a second wide code block below a heading gets a numbered name', async() => {
      const [first, second] = await blocksBelow(
        page, 'replace-detailedsettings', CODE_BLOCK, { overflowing: true, count: 2 }
      );

      await expectNamedTabStop(first);
      await expectNamedTabStop(second);
      await expect(first).toHaveAccessibleName('Code: Replace DetailedSettings');
      await expect(second).toHaveAccessibleName('Code 2: Replace DetailedSettings');
    });

    await test.step('every region of the page has its own name', async() => {
      await expectUniqueRegionNames(page);
    });
  });
});

test.describe('Store dumps in the examples', () => {
  EXAMPLE_DUMPS.forEach(({ title, path, selector, key, axis }) => {
    test(`${title} is a named Tab stop that ${key} scrolls`, async({ page, baseURL }) => {
      await openDocsPage(page, baseURL, path);

      const dump = page.locator(selector);

      await expect(dump).toBeVisible({ timeout: 30000 });
      await expect.poll(() => overflowOf(dump, axis), { timeout: 30000 }).toBeGreaterThan(0);
      await expectNamedTabStop(dump);
      await expectUniqueRegionNames(page);
      await expectArrowKeyToScroll(page, dump, key, axis);
    });
  });
});
