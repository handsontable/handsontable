import { test, expect } from '../fixtures/test';
import { TextEllipsisLineClampPage, type CellMeasure } from '../fixtures/pages/TextEllipsisLineClampPage';

/**
 * `textEllipsis` as a number (PRO-192): `n >= 2` clamps a cell's text to `n` lines. Every long cell
 * of the fixture needs four or more lines in its 150px column, so a clamp is only real when the
 * measured wrapper is exactly `n` line heights tall AND its content overflows that box.
 */

/** How many whole lines the clamp wrapper shows, or `0` when there is no wrapper. */
const clampedLines = (m: CellMeasure): number => (
  m.hasWrapper ? Math.round((m.wrapperClientHeight as number) / m.lineHeight) : 0
);

/** Sub-pixel layout differs per theme, so geometry is compared within one pixel. */
const expectNear = (actual: number, expected: number): void => {
  expect(Math.abs(actual - expected), `${actual} should be within 1px of ${expected}`).toBeLessThanOrEqual(1);
};

/** The wrapper is `n` lines tall, its text is taller than that box, and the cell carries the mode class. */
const expectClamped = (m: CellMeasure, lines: number): void => {
  expect(m.hasWrapper).toBe(true);
  expect(m.clampVar).toBe(String(lines));
  expect(m.classes).toContain('htTextLineClamp');
  expectNear(m.wrapperClientHeight as number, lines * m.lineHeight);
  expect(m.wrapperScrollHeight as number).toBeGreaterThan(m.wrapperClientHeight as number);
};

test.describe('textEllipsis line clamp', () => {
  test('clamps to n lines and keeps the full text, and the row is shorter than an unclamped row', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    // One column; row 1 opts out through cell meta, so rows 0 and 1 hold the same text.
    await grid.goto({ columns: [{ textEllipsis: 2 }] }, { '1,0': { textEllipsis: false } });

    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    const clamped = await grid.measure(0, 0);
    const control = await grid.measure(1, 0);

    expectClamped(clamped, 2);
    expect(await grid.longText()).toBe(clamped.text);

    // Positive control: the same text without the option wraps over four or more lines.
    expect(control.hasWrapper).toBe(false);
    expect(control.classes).not.toContain('htTextLineClamp');
    expect(control.rowHeight).toBeGreaterThanOrEqual(4 * control.lineHeight);
    expect(clamped.rowHeight).toBeLessThan(control.rowHeight);
    // The unclamped text needs four or more lines against the clamp's two, and the cell chrome
    // (padding, borders) is the same in both rows, so they differ by at least two lines of text.
    expect(control.rowHeight - clamped.rowHeight).toBeGreaterThanOrEqual(2 * control.lineHeight - 1);
  });

  test('a changed number, cell meta and `false` all re-render the row at the right height', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ columns: [{ textEllipsis: 2 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    const two = await grid.measure(0, 0);

    await grid.updateSettings({ columns: [{ textEllipsis: 4 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(4);

    const four = await grid.measure(0, 0);

    expectClamped(four, 4);
    expectNear(four.rowHeight - two.rowHeight, 2 * four.lineHeight);

    // Cell meta written at runtime wins over the column, then a render applies it.
    await grid.setCellMetaAndRender(0, 0, 'textEllipsis', 3);
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(3);

    const three = await grid.measure(0, 0);

    expectClamped(three, 3);
    expectNear(three.rowHeight - two.rowHeight, three.lineHeight);

    // Removing the option removes the wrapper and the row returns to its full wrapping height.
    await grid.setCellMetaAndRender(0, 0, 'textEllipsis', false);
    await grid.updateSettings({ columns: [{ textEllipsis: false }] });
    await expect.poll(async() => (await grid.measure(0, 0)).hasWrapper).toBe(false);

    const off = await grid.measure(0, 0);

    expect(off.classes).not.toContain('htTextLineClamp');
    expect(off.text).toBe(await grid.longText());
    expect(off.rowHeight).toBeGreaterThanOrEqual(4 * off.lineHeight);
    expect(off.rowHeight).toBeGreaterThan(four.rowHeight);
  });

  test('cascades grid, column and cell level, the nearest one winning', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto(
      { textEllipsis: 3, columns: [{}, { textEllipsis: 2 }, { textEllipsis: false }] },
      { '1,0': { textEllipsis: 4 }, '1,2': { textEllipsis: 2 } }
    );

    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(3);

    // Grid level reaches a column that sets nothing.
    expectClamped(await grid.measure(0, 0), 3);
    // Column level beats grid level.
    expectClamped(await grid.measure(0, 1), 2);
    // Column `false` beats the grid number.
    expect((await grid.measure(0, 2)).hasWrapper).toBe(false);
    // Cell level beats both the grid level and the column's.
    expectClamped(await grid.measure(1, 0), 4);
    expectClamped(await grid.measure(1, 2), 2);
  });

  test('ignores 0, negatives and fractions, and treats 1 and true as the single-line ellipsis', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ columns: [{ textEllipsis: 2 }] }, { '1,0': { textEllipsis: false } });
    await expect.poll(async() => clampedLines(await grid.measure(2, 0))).toBe(2);

    // The short row is the one-line reference height.
    const oneLine = (await grid.measure(4, 0)).rowHeight;
    const fullHeight = (await grid.measure(1, 0)).rowHeight;

    // Control: with `2` the row is shorter than the full wrap, so the next equalities are not vacuous.
    expect((await grid.measure(2, 0)).rowHeight).toBeLessThan(fullHeight);

    for (const invalid of [0, -1, 2.5]) {
      await grid.updateSettings({ columns: [{ textEllipsis: invalid }] });
      await expect.poll(async() => (await grid.measure(2, 0)).hasWrapper, `textEllipsis: ${invalid}`).toBe(false);

      const measured = await grid.measure(2, 0);

      expect(measured.classes, `textEllipsis: ${invalid}`).not.toContain('htTextLineClamp');
      expect(measured.classes, `textEllipsis: ${invalid}`).not.toContain('htTextEllipsis');
      expectNear(measured.rowHeight, fullHeight);
    }

    for (const single of [1, true]) {
      await grid.updateSettings({ columns: [{ textEllipsis: single }] });
      await expect.poll(async() => (await grid.measure(2, 0)).classes, `textEllipsis: ${single}`)
        .toContain('htTextEllipsis');

      const measured = await grid.measure(2, 0);

      expect(measured.hasWrapper, `textEllipsis: ${single}`).toBe(false);
      expect(measured.classes, `textEllipsis: ${single}`).not.toContain('htTextLineClamp');
      expectNear(measured.rowHeight, oneLine);
    }
  });

  test('`wordWrap: false` wins over a number and renders one line with an ellipsis', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ wordWrap: true, columns: [{ textEllipsis: 3 }] });
    await expect.poll(async() => clampedLines(await grid.measure(2, 0))).toBe(3);

    const oneLine = (await grid.measure(4, 0)).rowHeight;

    expect((await grid.measure(2, 0)).rowHeight).toBeGreaterThan(oneLine);

    await grid.updateSettings({ wordWrap: false });
    await expect.poll(async() => (await grid.measure(2, 0)).hasWrapper).toBe(false);

    const measured = await grid.measure(2, 0);

    expect(measured.classes).toContain('htTextEllipsis');
    expect(measured.classes).not.toContain('htTextLineClamp');
    expectNear(measured.rowHeight, oneLine);
  });

  test('opens the editor with the full text, saves and cancels, and the cell stays clamped', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);
    const longText = await (async() => {
      await grid.goto({ columns: [{ textEllipsis: 2 }] });

      return grid.longText();
    })();

    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    await grid.openEditorWithKeyboard(0, 0);
    await expect(grid.editor).toHaveValue(longText);

    const saved = `${longText} Edited.`;

    await grid.editor.fill(saved);
    await page.keyboard.press('Enter');
    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.dataAt(0, 0)).toBe(saved);

    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);
    expectClamped(await grid.measure(0, 0), 2);
    expect((await grid.measure(0, 0)).text).toBe(saved);
    await expect(grid.wrapper(0, 0)).toHaveCount(1);

    // Escape discards what was typed and restores the saved value. Saving moved the selection down
    // one row, so the arrow key brings it back without a second click on the same cell.
    await page.keyboard.press('ArrowUp');
    await grid.openEditorFromSelection();
    await expect(grid.editor).toHaveValue(saved);
    await grid.editor.fill('discarded');
    await page.keyboard.press('Escape');
    await expect.poll(() => grid.isEditorOpen()).toBe(false);

    expect(await grid.dataAt(0, 0)).toBe(saved);
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);
    expectClamped(await grid.measure(0, 0), 2);
    await expect(grid.wrapper(0, 0)).toHaveCount(1);
  });

  test('keeps the master and every overlay on one row height with frozen rows and columns', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ textEllipsis: 2, fixedRowsTop: 1, fixedColumnsStart: 1 });
    await expect.poll(async() => clampedLines(await grid.measure(0, 1))).toBe(2);

    for (const row of [0, 1]) {
      const heights = await grid.rowHeightsAcrossOverlays(row);
      const names = Object.keys(heights);

      // Row 0 sits in the top clone and the corner, row 1 in the inline-start clone: at least two
      // overlays must have rendered it, or the equality below measures nothing.
      expect(names.length, `overlays holding row ${row}: ${names.join(', ')}`).toBeGreaterThanOrEqual(2);

      for (const name of names) {
        expectNear(heights[name], heights.master);
      }

      // The shared height is the clamped one: two lines of text, not the four-plus line wrap.
      const lineHeight = (await grid.measure(row, 1)).lineHeight;

      expect(heights.master, `row ${row}`).toBeLessThan(4 * lineHeight);
    }
  });

  test('clamps in an RTL grid', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ layoutDirection: 'rtl', columns: [{ textEllipsis: 2 }] }, { '1,0': { textEllipsis: false } });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    const clamped = await grid.measure(0, 0);
    const control = await grid.measure(1, 0);

    expectClamped(clamped, 2);
    expect(control.hasWrapper).toBe(false);
    expect(clamped.rowHeight).toBeLessThan(control.rowHeight);
  });

  test('keeps an autoLink anchor inside the wrapper of a clamped cell', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);
    const text = 'The quick brown fox jumps over https://example.com/some/path the lazy dog while seven wizards ' +
      'quietly box jugs of mellow honey beside a crooked river bank at dawn today';

    await grid.goto({ autoLink: true, columns: [{ textEllipsis: 2 }] });
    await grid.setDataAt(0, 0, text);

    await expect(grid.wrapper(0, 0).locator('a')).toHaveCount(1);
    await expect(grid.wrapper(0, 0).locator('a')).toHaveAttribute('href', 'https://example.com/some/path');
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);
    expectClamped(await grid.measure(0, 0), 2);
  });

  test('keeps one arrow in a clamped autocomplete cell across redraws, inside the cell', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ columns: [{ type: 'autocomplete', source: ['a', 'b'], textEllipsis: 2 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);
    await expect(grid.arrows(0, 0)).toHaveCount(1);

    // The text renderer removes whatever sits beside the wrapper, and the autocomplete renderer adds
    // the arrow back after it, so a second draw must neither duplicate nor lose the arrow.
    await grid.render();
    await grid.render();
    await expect(grid.arrows(0, 0)).toHaveCount(1);
    expectClamped(await grid.measure(0, 0), 2);

    const boxes = await grid.cell(0, 0).evaluate((td) => {
      const arrow = td.querySelector('.htAutocompleteArrow')!.getBoundingClientRect();
      const cell = td.getBoundingClientRect();

      return { arrowInside: arrow.left >= cell.left - 1 && arrow.right <= cell.right + 1 };
    });

    expect(boxes.arrowInside).toBe(true);

    // An empty clamped cell keeps a line of height instead of collapsing around an empty wrapper.
    await grid.setDataAt(0, 0, '');
    await expect(grid.arrows(0, 0)).toHaveCount(1);
    expect((await grid.measure(0, 0)).rowHeight).toBeGreaterThanOrEqual((await grid.measure(0, 0)).lineHeight);
  });

  test('drops the wrapper when the renderer changes, and clamps again when it changes back', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ columns: [{ textEllipsis: 2 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    // The `html` renderer draws its own markup and ignores a number, so no wrapper may be left behind.
    await grid.updateSettings({ columns: [{ renderer: 'html', textEllipsis: 2 }] });
    await expect(grid.wrapper(0, 0)).toHaveCount(0);
    expect((await grid.measure(0, 0)).hasWrapper).toBe(false);

    await grid.updateSettings({ columns: [{ renderer: 'text', textEllipsis: 2 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);
    expectClamped(await grid.measure(0, 0), 2);
  });

  test('follows number changes under `renderMode: "onChange"`', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ renderMode: 'onChange', columns: [{ textEllipsis: 2 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    // The mode skips cells it cannot prove changed, so each change has to reach the cell through meta.
    await grid.setCellMetaAndRender(0, 0, 'textEllipsis', 4);
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(4);

    await grid.setCellMetaAndRender(0, 0, 'textEllipsis', false);
    await expect.poll(async() => (await grid.measure(0, 0)).hasWrapper).toBe(false);
  });

  test('sizes a clamped row to its lines when `autoRowSize` measures the rows', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ autoRowSize: true, columns: [{ textEllipsis: 2 }] }, { '1,0': { textEllipsis: false } });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    const clamped = await grid.measure(0, 0);
    const control = await grid.measure(1, 0);

    expect(control.hasWrapper).toBe(false);
    // The ghost table measures the clamped cell with the same wrapper, so the row keeps its two lines.
    expect(control.rowHeight - clamped.rowHeight).toBeGreaterThanOrEqual(2 * control.lineHeight - 1);
    expect(clamped.rowHeight).toBeLessThan(4 * clamped.lineHeight);
  });

  test('copies and stores the full untruncated text', async({ page, theme, bundle }) => {
    const grid = new TextEllipsisLineClampPage(page, theme, bundle);

    await grid.goto({ columns: [{ textEllipsis: 2 }] });
    await expect.poll(async() => clampedLines(await grid.measure(0, 0))).toBe(2);

    const longText = await grid.longText();

    expect(longText.length).toBeGreaterThan(140);
    expect(await grid.dataAt(0, 0)).toBe(longText);
    expect(await grid.copyableAt(0, 0)).toBe(longText);
    // The DOM holds all of it too: the clamp is presentation only.
    expect((await grid.measure(0, 0)).text).toBe(longText);
  });
});
