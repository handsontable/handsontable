import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import type { Locator } from '@playwright/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// The autocomplete and function help popups, and the error indicator. Themes: the popups are
// themed surfaces laid out against the editor. Bundles: the suggestions and the error values come
// from HyperFormula, which the plain UMD leg loads externally. Engines: real key presses drive the
// listbox and its ARIA state. The accent test pins the matched letters, the chip and the paren match
// to `--ht-accent-color`, so their contrast is the theme accent's: below 4.5:1 on horizon and classic,
// owned by the horizon and classic theme contrast tasks.
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

  test('the matched letters, the active argument chip and the paren match use the theme accent', async({ page }) => {
    const accent = await grid.accentColor();

    expect(accent).not.toBe('rgba(0, 0, 0, 0)');
    await expect(grid.suggestions.locator('.hfe-suggestions__match').first()).toHaveCSS('color', accent);

    await page.keyboard.type('M(');
    await expect(grid.fnHelp.locator('.hfe-fn-help__arg--active')).toHaveCSS('background-color', accent);

    const parenMatch = grid.inlineEditor.locator('.hfe-token--paren-match').first();

    await expect(parenMatch).toBeVisible();

    const tint = await designColor(
      parenMatch,
      'backgroundColor',
      'color-mix(in srgb, var(--ht-accent-color) calc(var(--hfe-selection-opacity) * 100%), transparent)',
    );

    expect(tint.expected).not.toBe('rgba(0, 0, 0, 0)');
    expect(tint.painted).toBe(tint.expected);
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
 * The color an element paints for a property, beside the color the design value resolves to in the same
 * place: a probe inside the element, where the theme class and its color scheme apply. The popups
 * re-render while they settle, so the read is retried until it lands on an element in the document.
 *
 * @param {Locator} locator The painted element.
 * @param {'color' | 'backgroundColor' | 'borderTopColor'} property The property the element paints.
 * @param {string} value The design value as a CSS color.
 * @returns {Promise<{ painted: string, expected: string }>}
 */
async function designColor(
  locator: Locator,
  property: 'color' | 'backgroundColor' | 'borderTopColor',
  value: string,
): Promise<{ painted: string, expected: string }> {
  let read: { painted: string, expected: string } | null = null;

  await expect.poll(async() => {
    read = await locator.evaluate((element, [name, design]) => {
      if (!element.isConnected) {
        return null;
      }

      const probe = document.createElement('span');

      probe.style.color = design;
      element.appendChild(probe);

      const expected = getComputedStyle(probe).color;

      probe.remove();

      return { painted: getComputedStyle(element)[name as 'color'], expected };
    }, [property, value]).catch(() => null);

    return read;
  }).not.toBeNull();

  return read!;
}

/**
 * The design's own colors for the formula editor, which the plugin leaves to hyperformula-ui's
 * defaults: the light value, then the dark one.
 */
const DESIGN = {
  fnUnknown: 'light-dark(#ea580c, #fdba74)',
  sheet: 'light-dark(#64748b, #7c8694)',
  highlight: 'light-dark(#f7f7f9, #000000)',
  error: 'light-dark(#fa4d56, #fa4d56)',
  refs: [
    'light-dark(#007bff, #0a84ff)',
    'light-dark(#ff9500, #ff9d0a)',
    'light-dark(#af52de, #bf5af2)',
    'light-dark(#30d158, #34c759)',
    'light-dark(#ff2d54, #ff375f)',
    'light-dark(#30b0c7, #40c8e0)',
    'light-dark(#5856d6, #5e5ce6)',
    'light-dark(#a2855e, #ac8e68)',
  ],
};

const THEME_FOREGROUND = 'var(--ht-foreground-color)';

/**
 * The WCAG contrast ratio of an element's text against what is painted under it: the background colors
 * and the `::before` tints (the grid draws a selected range as one) of the element and its ancestors,
 * composited down to the first opaque layer.
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

test.describe('formulaBuilder design colors', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  // eslint-disable-next-line no-restricted-syntax -- DEV-3989: the design's named expression color measures 4.45:1 on the active row
  test.fixme('a named expression on the active suggestion row reaches 4.5:1', async({ page, theme, bundle }) => {
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

  // eslint-disable-next-line no-restricted-syntax -- DEV-3989: the design's error color measures 3.35:1 on white
  test.fixme('error text in a cell of a selected range reaches 4.5:1', async({ page, theme, bundle }) => {
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

  test('a named expression and the active suggestion row use the design colors', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: 'formulas'): { engine: { addNamedExpression(name: string, expression: string): void } } };
    }).hot.getPlugin('formulas').engine.addNamedExpression('SUMMARY', '=1'));
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SUMM');

    const row = page.locator('.hfe-suggestions__item--active.hfe-suggestions__item--named');
    const named = row.locator('.hfe-suggestions__item-label > span:last-child');

    await expect(named).toHaveText('SUMMARY');

    const label = await designColor(named, 'color', DESIGN.sheet);
    const highlight = await designColor(row, 'backgroundColor', DESIGN.highlight);

    expect(label.painted).toBe(label.expected);
    expect(highlight.painted).toBe(highlight.expected);
  });

  test('error text in a cell uses the design error color', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.setDataAt(3, 0, '=1/0');

    const cell = grid.cell(3, 0);

    await expect(cell).toHaveAttribute('data-hfe-error', '#DIV/0!');

    const error = await designColor(cell, 'color', DESIGN.error);

    expect(error.painted).toBe(error.expected);
  });

  test('the references use the design reference palette', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.setDataAt(3, 0, '=A1+B1+C1+A2+B2+C2+A3+B3');
    await grid.selectCellByApi(3, 0);

    for (const [index, value] of DESIGN.refs.entries()) {
      const mark = grid.formulaBar.locator(`.hfe-ref-mark[data-ref-index="${index}"]`).first();

      await expect(mark).toBeVisible();

      const color = await designColor(mark, 'color', value);

      expect(color.painted, `reference ${index}`).toBe(color.expected);
    }
  });

  test('the plain formula tokens follow the theme text color and the rest use the design colors', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SUM(1,"a")+NOPE(2)');

    const expected: [string, string][] = [
      ['fn', THEME_FOREGROUND],
      ['num', THEME_FOREGROUND],
      ['str', THEME_FOREGROUND],
      ['op', THEME_FOREGROUND],
      ['sep', THEME_FOREGROUND],
      ['paren', THEME_FOREGROUND],
      ['fn-unknown', DESIGN.fnUnknown],
    ];

    for (const [kind, value] of expected) {
      const token = grid.inlineEditor.locator(`.hfe-token--${kind}`).first();

      await expect(token).toBeVisible();

      const color = await designColor(token, 'color', value);

      expect(color.painted, kind).toBe(color.expected);
    }
  });

  test('the keyboard row is framed in the theme border color', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SU');

    await expect(grid.suggestions).toBeVisible();

    const row = page.locator('.hfe-suggestions__kbd-row');

    await expect(row).toBeVisible();

    const border = await designColor(row, 'borderTopColor', 'var(--ht-border-color, transparent)');

    expect(border.expected).not.toBe('rgba(0, 0, 0, 0)');
    expect(border.painted).toBe(border.expected);
  });

  // The bar's rings are drawn like the selected cell's border, so a focused bar reads like a selected
  // cell. Their contrast is the theme's `--ht-cell-selection-border-color` (2.45:1 on horizon), owned by
  // the grid-wide focus ring contrast task. The ring is inset, so the text must also start past it.
  test('the bar editor\'s focus ring matches the selection border and leaves the text clear', async({
    page, theme, bundle,
  }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCellByApi(0, 2);

    const selectionBorder = await grid.selectionBorderColor();

    expect(selectionBorder).not.toBeNull();

    await grid.openBarEditor();
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.barEditor).toHaveCSS('outline-color', selectionBorder!);

    const layout = await grid.barEditor.evaluate((editor) => {
      const style = getComputedStyle(editor);
      const text = editor.querySelector('.hfe-overlay')!;
      const walker = editor.ownerDocument.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      const range = editor.ownerDocument.createRange();
      const node = walker.nextNode()!;

      range.setStart(node, 0);
      range.setEnd(node, 1);

      return {
        ringInnerEdge: editor.getBoundingClientRect().left - parseFloat(style.outlineOffset),
        ringWidth: parseFloat(style.outlineWidth),
        textStart: range.getBoundingClientRect().left,
      };
    });

    expect(layout.textStart).toBeGreaterThanOrEqual(layout.ringInnerEdge);
    expect(layout.ringWidth).toBeGreaterThan(0);
  });

  test('the address box\'s focus ring matches the selection border', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCellByApi(0, 2);

    const selectionBorder = await grid.selectionBorderColor();

    expect(selectionBorder).not.toBeNull();

    await grid.addressInput.click();
    await expect(grid.addressInput).toBeFocused();
    await expect(grid.addressInput).toHaveCSS('outline-style', 'solid');
    await expect(grid.addressInput).toHaveCSS('outline-color', selectionBorder!);
  });
});
