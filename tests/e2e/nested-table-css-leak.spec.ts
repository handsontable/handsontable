import { type Locator, type Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';

/**
 * Issue #4363 — Handsontable must not leak its cell styling into content a
 * user renders inside a cell, and the scoping must not break the grid's own
 * in-cell chrome or measurements.
 *
 * The page under test is served inline via `page.route()` (no committed
 * fixture file): a grid where cell (0, 1) hosts a user-rendered `<table>`
 * (tall enough to auto-expand its row) and column 2 is the grid's own
 * checkbox column. The host page carries the kind of global CSS the grid
 * must coexist with (`input { min-height: … }`).
 *
 * Four guarantees, each a real-browser check:
 *  1. Grid cell styling (box-sizing, borders) does not reach the nested
 *     table's cells.
 *  2. The grid still styles its own cells.
 *  3. A tall custom-rendered cell keeps the inline-start row-header overlay
 *     pixel-aligned with the grid body — guards the row-height measurement
 *     path: cell CSS is scoped to `table.htCore`, so the `stylesHandler`
 *     box-sizing probe must also be an `htCore` table or `areCellsBorderBox()`
 *     flips and rows mis-measure.
 *  4. The normalize split is exact: the grid's own checkbox `<input>` (the one
 *     element the grid renders inside a cell) keeps the `min-height` normalize
 *     against host CSS, while a user's in-cell `<input>` keeps the host CSS.
 */

const FIXTURE_URL = '/nested-table-css-leak-fixture.html';

/**
 * The inline page: stylesheets and the dist bundle are loaded from the static
 * server (same assets a committed fixture would use); only the HTML shell is
 * synthesized. `theme` comes from the Playwright project matrix (a literal
 * from a fixed set — never user input).
 */
const BUNDLE_FILES: Record<string, string> = {
  umd: 'handsontable.js',
  'full-min': 'handsontable.full.min.js',
};

/**
 * Resolves the bundle file for the active project, 1:1 with the Puppeteer legs.
 * An unknown value throws instead of falling back — a project-config typo must
 * be one red leg, never a silently mislabeled green one (the same fail-loud
 * rule the committed fixtures follow).
 *
 * @param {string} bundle The `bundle` option from the active Playwright project.
 * @returns {string} The dist file name to load.
 */
function bundleFile(bundle: string): string {
  const file = BUNDLE_FILES[bundle];

  if (!file) {
    throw new Error(`Unknown bundle value: ${JSON.stringify(bundle)}`);
  }

  return file;
}

function fixtureHtml(theme: string, bundle: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Handsontable e2e inline fixture — nested table in a cell (#4363)</title>
  <link rel="stylesheet" href="/handsontable/styles/handsontable.min.css">
  <link rel="stylesheet" href="/handsontable/styles/ht-theme-${theme}.min.css">
  <style>
    body { font-family: sans-serif; margin: 1rem; }
    /* Host-page global rule the grid must not let leak into its own checkbox input,
       while a user's in-cell input must keep it (#4363). */
    input { min-height: 40px; }
    /* A table a user renders inside a cell, with its OWN box model. It never sets
       box-sizing, so a border-box reading on its cells is a leak from the grid. Its
       explicit border + padding also make the host row auto-expand, which exercises
       the oversized-row height measurement (the row-header-alignment guard). */
    .nested-user-table { border-collapse: collapse; }
    .nested-user-table td { border: 2px solid #008000; padding: 6px; }
  </style>
</head>
<body>
  <div id="grid" data-testid="grid"></div>
  <script src="/handsontable/dist/${bundleFile(bundle)}"></script>
  <script>
    const container = document.querySelector('[data-testid="grid"]');

    container.className = 'ht-theme-${theme}';

    // Stamp data cells so specs hook cells unambiguously.
    const testIdRenderer = function(instance, td, row, col, prop, value, cellProperties) {
      Handsontable.renderers.TextRenderer.apply(this, arguments);
      td.setAttribute('data-testid', 'cell-' + row + '-' + col);
    };

    // Renders a bare user <table> inside the cell — tall enough to force the host row
    // to auto-expand. One of its cells holds a user <input> (host CSS must win there).
    const nestedTableRenderer = function(instance, td, row, col, prop, value, cellProperties) {
      td.setAttribute('data-testid', 'cell-' + row + '-' + col);
      td.innerHTML = '';
      const t = document.createElement('table');

      t.className = 'nested-user-table';
      t.innerHTML =
        '<tbody>' +
        '<tr><td data-testid="nested-cell">Mo</td><td>Tu</td></tr>' +
        '<tr><td><input data-testid="nested-input"></td><td>2</td></tr>' +
        '<tr><td>3</td><td>4</td></tr>' +
        '</tbody>';
      td.appendChild(t);

      return td;
    };

    new Handsontable(container, {
      data: [
        ['Alice', null, true],
        ['Bob', 'plain', false],
        ['Carol', 'plain', true],
      ],
      colHeaders: ['Name', 'Nested', 'Done'],
      columns: [
        { renderer: testIdRenderer },
        { renderer: testIdRenderer },
        { type: 'checkbox' },
      ],
      rowHeaders: true,
      rowHeights: 90,
      colWidths: [120, 220, 120],
      cells(row, col) {
        if (row === 0 && col === 1) {
          return { renderer: nestedTableRenderer };
        }

        return {};
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
  </script>
</body>
</html>`;
}

test.describe('nested table in a cell (#4363)', () => {
  let page: Page;

  test.beforeEach(async({ page: activePage, theme, bundle }) => {
    page = activePage;
    await page.route(`**${FIXTURE_URL}`, route => route.fulfill({
      contentType: 'text/html',
      body: fixtureHtml(theme, bundle),
    }));
    await page.goto(FIXTURE_URL);
    await expect(cell(0, 1)).toBeVisible();
    await expect(nestedCell()).toBeVisible();
  });

  /** The grid data cell (visual row/col) in the master overlay. */
  function cell(row: number, col: number): Locator {
    return page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** A `<td>` inside the user's nested table (never a grid cell). */
  function nestedCell(): Locator {
    return page.locator('.ht_master').getByTestId('nested-cell');
  }

  /** Read a computed style property off a locator's element. */
  function computedStyle(locator: Locator, property: string): Promise<string> {
    return locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
  }

  /** The vertical gap (px) between a row header's bottom edge and its data row's bottom edge. */
  async function rowHeaderBottomGap(row: number): Promise<number> {
    const header = await page
      .locator('.ht_clone_inline_start .htCore tbody tr')
      .nth(row)
      .locator('th[role="rowheader"]')
      .boundingBox();
    const dataCell = await cell(row, 1).boundingBox();

    if (!header || !dataCell) {
      throw new Error(`Missing bounding box for row ${row}`);
    }

    return Math.abs((header.y + header.height) - (dataCell.y + dataCell.height));
  }

  test('grid cell styling does not leak into the nested table', async() => {
    // The nested table never sets `box-sizing`, so a `border-box` reading is the grid's
    // cell rule leaking in. Before the fix this read 'border-box'.
    expect(await computedStyle(nestedCell(), 'box-sizing')).toBe('content-box');
    // The nested table's own box model is fully respected (not overridden by the grid).
    expect(await computedStyle(nestedCell(), 'border-top-width')).toBe('2px');
    expect(await computedStyle(nestedCell(), 'padding')).toBe('6px');
  });

  test('the grid keeps styling its own cells', async() => {
    // The scoping must not be so tight that real grid cells lose their styling.
    const ownCell = cell(1, 0);

    expect(await computedStyle(ownCell, 'box-sizing')).toBe('border-box');
    expect(await computedStyle(ownCell, 'border-bottom-style')).toBe('solid');
  });

  test('row headers stay aligned with an auto-expanded custom-content row', async() => {
    // Row 0 is taller than the default (it holds the nested table), forcing the
    // oversized-row measurement path. The row-header overlay must track it.
    expect(await rowHeaderBottomGap(0)).toBeLessThanOrEqual(1);
    // Rows below the tall one must not accumulate the drift either.
    expect(await rowHeaderBottomGap(1)).toBeLessThanOrEqual(1);
  });

  test('input normalize splits exactly between grid chrome and user content', async() => {
    // The grid's own checkbox input must keep the `min-height` normalize, so the
    // host page's `input { min-height: 40px }` cannot inflate it (and its row).
    const checkboxInput = page.locator('.ht_master input.htCheckboxRendererInput').first();

    await expect(checkboxInput).toBeVisible();
    expect(await computedStyle(checkboxInput, 'min-height')).not.toBe('40px');

    const checkboxBox = await checkboxInput.boundingBox();

    expect(checkboxBox).not.toBeNull();
    expect(checkboxBox!.height).toBeLessThan(30);

    // A user's in-cell input is user content — the host rule must keep applying to it.
    expect(await computedStyle(page.getByTestId('nested-input'), 'min-height')).toBe('40px');
  });
});

const GHOST_FIXTURE_URL = '/nested-headers-ghost-fixture.html';

/**
 * The NestedHeaders ghost measuring table lives for one synchronous block: it is
 * appended to `<body>`, measured, and removed before control returns. So the page
 * snapshots its computed `box-sizing` from an `appendChild` wrapper installed
 * before the grid is created — the only point at which the real, plugin-built
 * element is observable.
 */
function ghostFixtureHtml(theme: string, bundle: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Handsontable e2e inline fixture — nested headers ghost table (#4363)</title>
  <link rel="stylesheet" href="/handsontable/styles/handsontable.min.css">
  <link rel="stylesheet" href="/handsontable/styles/ht-theme-${theme}.min.css">
  <style>
    body { font-family: sans-serif; margin: 1rem; }
    /* The host-page reset the grid's own normalize has to survive — Bootstrap and
       friends ship exactly this. */
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="grid" data-testid="grid"></div>
  <script src="/handsontable/dist/${bundleFile(bundle)}"></script>
  <script>
    window.__ghostBoxSizing = [];

    // Snapshot every ghost measuring table at the moment it enters the DOM.
    const originalAppendChild = document.body.appendChild.bind(document.body);

    document.body.appendChild = function(node) {
      const appended = originalAppendChild(node);

      if (node.classList && node.classList.contains('htGhostTable')) {
        const ghostTable = node.querySelector('table');

        if (ghostTable) {
          window.__ghostBoxSizing.push(getComputedStyle(ghostTable).boxSizing);
        }
      }

      return appended;
    };

    const container = document.querySelector('[data-testid="grid"]');

    container.className = 'ht-theme-${theme}';

    new Handsontable(container, {
      data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
      nestedHeaders: [
        ['A', { label: 'B group', colspan: 2 }],
        ['A sub', 'B sub', 'C sub'],
      ],
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  </script>
</body>
</html>`;
}

test.describe('nested headers ghost table under a host reset (#4363)', () => {
  test('the ghost measuring table keeps the grid box-sizing normalize', async({ page, theme, bundle }) => {
    await page.route(`**${GHOST_FIXTURE_URL}`, route => route.fulfill({
      contentType: 'text/html',
      body: ghostFixtureHtml(theme, bundle),
    }));
    await page.goto(GHOST_FIXTURE_URL);
    await expect(page.locator('.ht_master .htCore tbody tr').first()).toBeVisible();

    // The ghost container carries `handsontable` and `htGhostTable` on the SAME element and is
    // appended to `<body>`, so a descendant-combinator scope (`.handsontable :where(.htGhostTable)`)
    // misses it and the host `* { box-sizing: border-box }` wins. Before the fix this read
    // 'border-box'.
    const snapshots = await page.evaluate(() => (window as unknown as {
      __ghostBoxSizing: string[];
    }).__ghostBoxSizing);

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots.every(value => value === 'content-box')).toBe(true);
  });
});
