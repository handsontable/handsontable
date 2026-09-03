import { test, expect } from '../fixtures/test';
import { RowHeaderBorderOwnershipPage } from '../fixtures/pages/RowHeaderBorderOwnershipPage';

/**
 * Issue #6673. With row headers on, the first data column rendered 1px narrower than every other
 * column. `td:first-of-type` was given an inline-start border on top of the inline-end border every
 * cell carries, and `box-sizing: border-box` took both out of the same `col` width - so
 * `colWidths: 75` produced a 73px content box in column 0 against 74px everywhere else. The
 * selector matched the first `td` whether or not a row header `th` preceded it.
 *
 * The row header answered by dropping its own inline-end border at scroll offset 0 so the seam did
 * not double, and the engine then widened the row header by 1px the moment the grid scrolled
 * (`correctHeaderWidth`), with matching compensations in the scroll targets, the hider width and
 * the column calculators. So the table changed width by being scrolled.
 *
 * The gridline between the row header and column 0 now belongs to the row header at every scroll
 * position, and no cell standing behind a row header draws an inline-start border. Every column then
 * has the same content width, and the row header's width no longer depends on the scroll position.
 *
 * All of this is geometry, so none of it can be checked in jsdom, where every size reads as zero.
 * The legacy `colWidth()` helper cannot see it either: it reads `offsetWidth`, which includes the
 * borders and therefore returns the declared width for every column, bug or no bug.
 */
test.describe('Row header border ownership', () => {
  let grid: RowHeaderBorderOwnershipPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RowHeaderBorderOwnershipPage(page, theme, bundle);
    await grid.goto();
  });

  test('gives every column the same content width when row headers are enabled', async () => {
    const declared = await grid.declaredColumnWidth();
    const widths = await grid.bodyCellContentWidths('row-headers', 4);

    // The reported symptom: this used to read [73, 74, 74, 74].
    expect(widths).toEqual([declared - 1, declared - 1, declared - 1, declared - 1]);
  });

  test('lets the row header own the gridline between itself and the first column', async () => {
    // Exactly one border draws the seam. A missing seam and a doubled one are both failures, which
    // is why both sides are asserted rather than just the cell's.
    expect(await grid.borders(grid.rowHeaderCell('row-headers'))).toEqual({ start: 1, end: 1 });
    expect(await grid.borders(grid.firstBodyCell('row-headers'))).toEqual({ start: 0, end: 1 });
  });

  test('lets the corner header own the same gridline in the header row', async () => {
    expect(await grid.borders(grid.cornerHeaderCell('row-headers'))).toEqual({ start: 1, end: 1 });
    expect(await grid.borders(grid.firstColumnHeaderCell('row-headers'))).toEqual({ start: 0, end: 1 });
  });

  test('keeps the row header width and the scroll range unchanged by a horizontal scroll', async () => {
    const before = await grid.horizontalMetrics('row-headers');

    await grid.scrollHorizontallyTo('rowHeaders', 'row-headers', 12);

    // The row header used to grow by 1px here, taking the whole table's width with it.
    expect(await grid.horizontalMetrics('row-headers')).toEqual(before);
  });

  test('keeps every column the same content width after a horizontal scroll', async () => {
    const declared = await grid.declaredColumnWidth();

    await grid.scrollHorizontallyTo('rowHeaders', 'row-headers', 12);

    const widths = await grid.bodyCellContentWidths('row-headers', 4);

    expect(widths).toEqual([declared - 1, declared - 1, declared - 1, declared - 1]);
    expect(await grid.borders(grid.rowHeaderCell('row-headers'))).toEqual({ start: 1, end: 1 });
    expect(await grid.borders(grid.firstBodyCell('row-headers'))).toEqual({ start: 0, end: 1 });
  });

  test('applies the same ownership inside the frozen column clone', async () => {
    const declared = await grid.declaredColumnWidth();
    const frozenCell = grid.firstBodyCell('frozen', '.ht_clone_inline_start');

    expect(await grid.borders(grid.rowHeaderCell('frozen'))).toEqual({ start: 1, end: 1 });
    expect(await grid.borders(frozenCell)).toEqual({ start: 0, end: 1 });
    expect(await frozenCell.evaluate(cell => cell.clientWidth)).toBe(declared - 1);

    // The clone keeps rendering column 0 while the master scrolls past it, so the seam has to hold
    // in a state the master never shows. `manualColumnFreeze` used to override it here by hand.
    await grid.scrollHorizontallyTo('frozen', 'frozen', 12);

    expect(await grid.borders(grid.rowHeaderCell('frozen'))).toEqual({ start: 1, end: 1 });
    expect(await grid.borders(frozenCell)).toEqual({ start: 0, end: 1 });
  });

  test('mirrors the ownership onto the physical right in RTL', async () => {
    const declared = await grid.declaredColumnWidth();

    // The rules are written with logical properties, so RTL needs no mirror rule: the row header's
    // inline end resolves to its physical left, which is where the seam is in RTL.
    expect(await grid.physicalBorders(grid.rowHeaderCell('rtl'))).toEqual({ left: 1, right: 1 });
    expect(await grid.physicalBorders(grid.firstBodyCell('rtl'))).toEqual({ left: 1, right: 0 });

    const widths = await grid.bodyCellContentWidths('rtl', 4);

    expect(widths).toEqual([declared - 1, declared - 1, declared - 1, declared - 1]);
  });

  test('reaches the same verdict on every nested header level', async () => {
    const levels = await grid.headerLevelCount('nested');

    expect(levels).toBeGreaterThan(1);

    for (let level = 0; level < levels; level++) {
      expect(await grid.borders(grid.cornerHeaderCell('nested', level)))
        .toEqual({ start: 1, end: 1 });
      expect(await grid.borders(grid.firstColumnHeaderCell('nested', level)))
        .toEqual({ start: 0, end: 1 });
    }

    const declared = await grid.declaredColumnWidth();

    expect(await grid.bodyCellContentWidths('nested', 4))
      .toEqual([declared - 1, declared - 1, declared - 1, declared - 1]);
  });

  test('still publishes the legacy inner-border classes once the grid is scrolled', async () => {
    // The classes drive no geometry any more, but they are part of the public DOM and third-party
    // styling keys off them, so they are kept. `innerBorderLeft` is the pre-logical-properties
    // name and is still emitted alongside.
    expect(await grid.masterHasClass('row-headers', 'innerBorderInlineStart')).toBe(false);

    await grid.scrollHorizontallyTo('rowHeaders', 'row-headers', 12);

    expect(await grid.masterHasClass('row-headers', 'innerBorderInlineStart')).toBe(true);
    expect(await grid.masterHasClass('row-headers', 'innerBorderLeft')).toBe(true);
  });

  test('leaves the first column drawing the grid frame when there is no row header', async () => {
    const declared = await grid.declaredColumnWidth();
    const widths = await grid.bodyCellContentWidths('control', 4);

    // The deliberate limit of the fix, and the reason this case is pinned: with nothing in front of
    // it, column 0 is the first cell of its row and still carries the grid's own inline-start frame
    // inside its declared width. It stays 1px narrower than the rest, exactly as before.
    expect(await grid.borders(grid.firstBodyCell('control'))).toEqual({ start: 1, end: 1 });
    expect(widths).toEqual([declared - 2, declared - 1, declared - 1, declared - 1]);
  });
});
