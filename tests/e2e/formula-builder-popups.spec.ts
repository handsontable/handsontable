import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import type { Locator } from '@playwright/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// The autocomplete and function help popups, and the error indicator. Themes: the popups are
// themed surfaces laid out against the editor. Bundles: the suggestions and the error values come
// from HyperFormula, which the plain UMD leg loads externally. Engines: real key presses drive the
// listbox and its ARIA state.
test.describe('formulaBuilder autocomplete popup', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SU');
  });

  test('typing a function prefix opens the suggestions listbox the editor controls', async() => {
    await expect(grid.suggestions).toBeVisible();
    await expect(grid.suggestions).toHaveAccessibleName('Formula suggestions');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.editorInput).toHaveAttribute('aria-expanded', 'true');
    await expect(grid.editorInput).toHaveAttribute('aria-controls', await grid.suggestions.getAttribute('id') ?? '');

    const first = grid.suggestionOptions.first();

    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(grid.editorInput).toHaveAttribute('aria-activedescendant', await first.getAttribute('id') ?? '');
    // Every option contains the typed text, and the prefix matches come first.
    const labels = await grid.suggestionOptions.allInnerTexts();

    expect(labels.length).toBeGreaterThan(1);
    expect(labels[0]).toMatch(/^SU/);
    for (const label of labels) {
      expect(label).toContain('SU');
    }
  });

  test('ArrowDown moves the active option, and Enter inserts it with the function help open', async({ page }) => {
    await expect(grid.suggestions).toBeVisible();

    const second = grid.suggestionOptions.nth(1);
    const secondId = await second.getAttribute('id');
    const secondLabel = (await second.innerText()).trim();

    await page.keyboard.press('ArrowDown');
    await expect(grid.editorInput).toHaveAttribute('aria-activedescendant', secondId ?? '');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(grid.suggestionOptions.first()).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toHaveValue(`=${secondLabel}()`);
    // Enter took the suggestion: the edit is still open, on the same cell.
    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
    await expect(grid.suggestions).toBeHidden();
    await expect(grid.editorInput).toHaveAttribute('aria-expanded', 'false');
    // The caret sits inside the parentheses, so the function help shows the picked function.
    await expect(grid.fnHelp).toBeVisible();
    await expect(grid.fnHelp.locator('.hfe-fn-help__name')).toHaveText(secondLabel);
  });

  test('Tab inserts the active suggestion instead of committing the edit', async({ page }) => {
    await expect(grid.suggestions).toBeVisible();

    const firstLabel = (await grid.suggestionOptions.first().innerText()).trim();

    await page.keyboard.press('Tab');
    await expect(grid.editorInput).toHaveValue(`=${firstLabel}()`);
    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
  });

  test('typing an opening parenthesis shows the function help for that function', async({ page }) => {
    await page.keyboard.type('M(');
    await expect(grid.editorInput).toHaveValue('=SUM()');
    await expect(grid.fnHelp).toBeVisible();
    await expect(grid.fnHelp.locator('.hfe-fn-help__name')).toHaveText('SUM');

    // Escape closes the help first, and a second one cancels the edit.
    await page.keyboard.press('Escape');
    await expect(grid.fnHelp).toBeHidden();
    expect(await grid.editorOpened()).toBe(true);
    await page.keyboard.press('Escape');
    await expect(grid.cell(3, 1)).toBeFocused();
    expect(await grid.sourceAt(3, 1)).toBe('');
  });
});

// Engine-neutral: a DOM placement, so not tagged for the other engines.
test.describe('formulaBuilder docked suggestions popup', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  test('popups.suggestions.container docks the listbox into the host element', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'popups-host');

    await grid.goto();
    await expect(grid.suggestionsHost.getByRole('listbox')).toHaveCount(0);

    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SU');

    await expect(grid.suggestionsHost.getByRole('listbox', { name: 'Formula suggestions' })).toBeVisible();
    await expect(grid.suggestions).toHaveCount(1);
    await expect(grid.editorInput).toHaveAttribute('aria-expanded', 'true');
  });
});

// Engine-neutral: attributes written on render, so not tagged for the other engines.
test.describe('formulaBuilder error indicator', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  test('an error result marks the cell, and a later plain value clears the mark from the same element', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.setDataAt(3, 2, '=1/0');

    const cell = grid.cell(3, 2);

    await expect(cell).toHaveText('#DIV/0!');
    await expect(cell).toHaveAttribute('data-hfe-error', '#DIV/0!');
    await expect(cell).toHaveAttribute('aria-invalid', 'true');

    // Hold the element itself: the grid recycles it on the next draw.
    const element = await cell.elementHandle();

    await grid.setDataAt(3, 2, 5);
    await expect(cell).toHaveText('5');
    await expect.poll(() => element!.evaluate(el => ({
      testId: el.getAttribute('data-testid'),
      connected: el.isConnected,
      error: el.getAttribute('data-hfe-error'),
      invalid: el.getAttribute('aria-invalid'),
    }))).toEqual({ testId: 'cell-3-2', connected: true, error: null, invalid: null });
  });

  test('with ariaTags: false the error mark stays and aria-invalid is not written', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'no-aria');

    await grid.goto();
    await grid.setDataAt(0, 2, '=1/0');

    const cell = grid.cell(0, 2);

    await expect(cell).toHaveAttribute('data-hfe-error', '#DIV/0!');
    await expect(cell).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(cell).not.toHaveAttribute('role', /.*/);
  });
});

// A keyboard user reaches an error cell, hears its message (the cell's accessible description), opens
// the error popup with the focus, and closes it with Escape. Engines: real keys and focus.
test.describe('formulaBuilder error message by keyboard', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('the error cell describes its message, and Escape closes the popup the focus opened', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.setDataAt(3, 2, '=FOO(1)');
    await grid.expectCell(3, 2, '#NAME?');

    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('ArrowRight');

    const cell = grid.cell(3, 2);

    await expect(cell).toBeFocused();
    await expect(cell).toHaveAttribute('aria-invalid', 'true');
    // The description carries the code and the engine's message, not only the code the cell shows.
    await expect(cell).toHaveAttribute('aria-description', /^#NAME\? — .+/);
    await expect(grid.errorPopup).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(grid.errorPopup).toBeHidden();
    await expect(cell).toBeFocused();
  });
});


/**
 * The WCAG contrast ratio of an element's text against what is painted under it: the background
 * colors and the `::before` tints (the grid draws a selected range as one) of the element and its
 * ancestors, composited down to the first opaque layer.
 *
 * @param {Locator} locator The element holding the text.
 * @returns {Promise<number>} The ratio, or `0` while a color cannot be read (poll it).
 */
function textContrast(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    type Rgba = [number, number, number, number];
    const parse = (value: string): Rgba | null => {
      const srgb = value.match(/color\(srgb ([^)]+)\)/);
      const rgb = value.match(/rgba?\(([^)]+)\)/);
      const parts = (srgb ?? rgb)?.[1].split(/[\s,/]+/).filter(Boolean).map(Number);

      if (!parts) {
        return null;
      }

      const scale = srgb ? 255 : 1;

      return [parts[0] * scale, parts[1] * scale, parts[2] * scale, parts[3] ?? 1];
    };
    const layers: Rgba[] = [];

    for (let node: Element | null = element; node; node = node.parentElement) {
      const before = getComputedStyle(node, '::before');
      const tint = parse(before.backgroundColor);
      const background = parse(getComputedStyle(node).backgroundColor);

      if (tint && before.content !== 'none') {
        layers.push([tint[0], tint[1], tint[2], tint[3] * Number(before.opacity)]);
      }

      if (background && background[3] > 0) {
        layers.push(background);
      }

      if (background?.[3] === 1) {
        break;
      }
    }

    const backdrop = layers.reduceRight<Rgba>((under, top) => [
      top[0] * top[3] + under[0] * (1 - top[3]),
      top[1] * top[3] + under[1] * (1 - top[3]),
      top[2] * top[3] + under[2] * (1 - top[3]),
      1,
    ], [255, 255, 255, 1]);
    const luminance = (color: Rgba) => {
      const channel = (value: number) => {
        const unit = value / 255;

        return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
      };

      return (0.2126 * channel(color[0])) + (0.7152 * channel(color[1])) + (0.0722 * channel(color[2]));
    };
    const text = parse(getComputedStyle(element).color);

    if (!text) {
      return 0;
    }

    const [lighter, darker] = [luminance(text), luminance(backdrop)].sort((first, second) => second - first);

    return (lighter + 0.05) / (darker + 0.05);
  });
}

// WCAG 1.4.3: the two text colors the plugin's tokens set that measured below 4.5:1 on the light
// themes (named expressions on the active suggestion row, error text inside a selected range).
test.describe('formulaBuilder text contrast', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  test('a named expression on the active suggestion row reaches 4.5:1', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: 'formulas'): { engine: { addNamedExpression(name: string, expression: string): void } } };
    }).hot.getPlugin('formulas').engine.addNamedExpression('SUMMARY', '=1'));
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SUMM');

    const named = page.locator('.hfe-suggestions__item--active.hfe-suggestions__item--named .hfe-suggestions__item-label > span:last-child');

    await expect(named).toHaveText('SUMMARY');
    await expect.poll(() => textContrast(named)).toBeGreaterThanOrEqual(4.5);
  });

  test('error text in a cell of a selected range reaches 4.5:1', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.setDataAt(3, 0, '=1/0');
    await page.evaluate(() => (window as unknown as {
      hot: { selectCell(row: number, col: number, toRow: number, toCol: number): void };
    }).hot.selectCell(1, 0, 3, 2));

    const cell = grid.cell(3, 0);

    await expect(cell).toHaveClass(/\barea\b/);
    await expect(cell).toHaveAttribute('data-hfe-error', '#DIV/0!');
    await expect.poll(() => textContrast(cell)).toBeGreaterThanOrEqual(4.5);
  });
});
