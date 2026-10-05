import { test, expect } from '../fixtures/test';
import { FixedColumnsEndPluginsPage, type Box } from '../fixtures/pages/FixedColumnsEndPluginsPage';

/**
 * How the plugins that draw spans treat the frozen end columns: NestedHeaders (a group that crosses the
 * master/end line is continued by the end clone), CollapsibleColumns (no toggle for a group that touches the end
 * band) and MergeCells (the end clone draws the part of a merge that crosses the line).
 *
 * Grid of the fixture: 12 columns, 72 px wide, 500 x 300 px viewport, row and column headers.
 */
const TOLERANCE = 2;
const COLUMN_WIDTH = 72;
const END_CORNER = 'ht_clone_top_inline_end_corner';

const near = (actual: number, expected: number) => Math.abs(actual - expected) <= TOLERANCE;

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';
  const startEdge = (box: Box) => (rtl ? box.right : box.left);
  const endEdge = (box: Box) => (rtl ? box.left : box.right);

  test.describe(`fixedColumnsEnd and NestedHeaders (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPluginsPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPluginsPage(page, theme, bundle);
    });

    test('continues a group that crosses the line on the end clone, with the columns left in the band', async () => {
      // The band holds columns 8 to 11. Group C spans 7 to 9, so two of its columns (8 and 9) are in the band.
      await grid.goto({ scenario: 'nested', rtl, fixedColumnsEnd: 4 });

      const groups = (await grid.headers(END_CORNER, 0)).filter(header => !header.hiddenHeader);

      expect(groups.map(({ text, colspan }) => ({ text, colspan }))).toEqual([
        { text: 'C', colspan: 2 },
        { text: 'D', colspan: 2 },
      ]);

      // The continuation sits over exactly the two columns it covers.
      const labels = await grid.headers(END_CORNER, 1);
      const span = groups[0].box;

      expect(labels.map(label => label.text)).toEqual(['c8', 'c9', 'c10', 'c11']);
      expect(near(startEdge(span), startEdge(labels[0].box)), 'span start edge').toBe(true);
      expect(near(endEdge(span), endEdge(labels[1].box)), 'span end edge').toBe(true);
    });

    test('continues a group that crosses the line with a single column when one column is in the band', async () => {
      await grid.goto({ scenario: 'nested', rtl, fixedColumnsEnd: 3 });

      const groups = (await grid.headers(END_CORNER, 0)).filter(header => !header.hiddenHeader);

      expect(groups.map(({ text, colspan }) => ({ text, colspan }))).toEqual([
        { text: 'C', colspan: 1 },
        { text: 'D', colspan: 2 },
      ]);
    });

    test('shows the label of a group that crosses the line on the end clone only', async () => {
      await grid.goto({ scenario: 'nested', rtl, fixedColumnsEnd: 4 });
      // Bring the group's own columns into the master, so the top clone draws its cell.
      await grid.scrollTo({ left: 10_000 });

      const groupOf = async (cloneClass: string) => (await grid.headers(cloneClass, 0)).find(header => header.text === 'C');

      await expect.poll(async () => (await groupOf('ht_clone_top'))?.hiddenHeaderText, 'the top clone hides the label')
        .toBe(true);
      await expect.poll(async () => (await groupOf(END_CORNER))?.hiddenHeaderText, 'the end clone shows the label')
        .toBe(false);
    });

    test('leaves a group that stays out of the band untouched on the top clone', async () => {
      await grid.goto({ scenario: 'nested', rtl, fixedColumnsEnd: 3 });

      const top = await grid.headers('ht_clone_top', 0);
      const group = top.find(header => header.text === 'B');

      expect(group, 'the top clone draws the group').toBeDefined();
      expect(group?.hiddenHeaderText).toBe(false);
    });

    test('hides no label on the top clone without frozen end columns', async () => {
      await grid.goto({ scenario: 'nested', rtl, fixedColumnsEnd: 0 });
      await grid.scrollTo({ left: 10_000 });

      const top = await grid.headers('ht_clone_top', 0);

      expect(top.filter(header => header.text === 'C').map(header => header.hiddenHeaderText)).toEqual([false]);
    });
  });

  test.describe(`fixedColumnsEnd and CollapsibleColumns (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPluginsPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPluginsPage(page, theme, bundle);
    });

    test('gives every collapsible group a toggle when no column is frozen at the end', async () => {
      // The control of the cases below: the toggles exist on this path.
      await grid.goto({ scenario: 'collapsible', rtl, fixedColumnsEnd: 0 });
      await grid.scrollTo({ left: 10_000 });

      const owners = await grid.indicatorOwners('ht_clone_top');

      expect(owners).toContain('D');
      expect(owners).toContain('E');
    });

    test('gives no toggle to a group that crosses the line or lies inside the band', async () => {
      // Band: columns 9 to 11. D (7 to 9) crosses the line, E (10 to 11) lies inside it.
      await grid.goto({ scenario: 'collapsible', rtl, fixedColumnsEnd: 3 });
      // Bring the groups next to the band into the master, so the top clone draws them.
      await grid.scrollTo({ left: 10_000 });

      const owners = await grid.indicatorOwners('ht_clone_top');

      expect(owners).not.toContain('D');
      expect(owners).not.toContain('E');
      // The group fully outside the band keeps its toggle.
      expect(owners).toContain('C');
    });

    test('draws no toggle on the end clone, not even on the continuation cell of a crossing group', async () => {
      await grid.goto({ scenario: 'collapsible', rtl, fixedColumnsEnd: 3 });

      // The continuation exists (control), and carries no toggle.
      const continuation = (await grid.headers(END_CORNER, 0)).find(header => header.text === 'D');

      expect(continuation?.hiddenHeader).toBe(false);
      expect(await grid.indicatorCount(END_CORNER)).toBe(0);
      expect(await grid.indicatorCount('ht_clone_inline_end')).toBe(0);
    });

    test('keeps the toggle of a group that ends right before the band', async () => {
      // Band: columns 10 and 11. D (7 to 9) is fully outside now, E (10 to 11) is inside.
      await grid.goto({ scenario: 'collapsible', rtl, fixedColumnsEnd: 2 });
      await grid.scrollTo({ left: 10_000 });

      const owners = await grid.indicatorOwners('ht_clone_top');

      expect(owners).toContain('D');
      expect(owners).not.toContain('E');
      expect(await grid.indicatorCount(END_CORNER)).toBe(0);
    });
  });

  for (const virtualized of [false, true]) {
    test.describe(`fixedColumnsEnd and MergeCells, virtualized ${virtualized ? 'on' : 'off'} (${direction})`,
      { tag: '@core' }, () => {
        let grid: FixedColumnsEndPluginsPage;

        test.beforeEach(async ({ page, theme, bundle }) => {
          grid = new FixedColumnsEndPluginsPage(page, theme, bundle);
          await grid.goto({ scenario: 'merge', rtl, virtualized });
        });

        const inside = (box: Box, band: Box) => box.left >= band.left - TOLERANCE && box.right <= band.right + TOLERANCE;

        test('renders a merge that lies inside the band as one cell with its own spans', async () => {
          // Merge A: rows 2 and 3, columns 10 and 11 (the last two columns of the band).
          const anchor = await grid.endBandCell(2, 10);
          const band = await grid.endBandBox();

          expect(anchor.hidden).toBe(false);
          expect({ colspan: anchor.colspan, rowspan: anchor.rowspan, text: anchor.text })
            .toEqual({ colspan: 2, rowspan: 2, text: 'R3C11' });
          expect(near(anchor.box.right - anchor.box.left, 2 * COLUMN_WIDTH), 'width').toBe(true);
          expect(inside(anchor.box, band), 'inside the band').toBe(true);
          // The covered cells are hidden, not drawn a second time.
          expect((await grid.endBandCell(2, 11)).hidden).toBe(true);
          expect((await grid.endBandCell(3, 10)).hidden).toBe(true);
        });

        test('renders the part of a merge that crosses the line from the first end column', async () => {
          // Merge B: rows 5 and 6, columns 8 to 10. Its anchor (column 8) is in the master, columns 9 and 10 are
          // in the band, so the end clone draws a continuation over those two.
          const continuation = await grid.endBandCell(5, 9);
          const band = await grid.endBandBox();
          const firstColumn = await grid.endBandCell(7, 9);

          expect(continuation.hidden, 'continuation is drawn').toBe(false);
          expect({ colspan: continuation.colspan, rowspan: continuation.rowspan, text: continuation.text })
            .toEqual({ colspan: 2, rowspan: 2, text: 'R6C9' });
          // It starts on the first end column and covers the two columns of the merge that are in the band.
          expect(near(startEdge(continuation.box), startEdge(firstColumn.box)), 'starts on the first end column')
            .toBe(true);
          expect(near(continuation.box.right - continuation.box.left, 2 * COLUMN_WIDTH), 'width').toBe(true);
          expect(inside(continuation.box, band), 'never beyond the band').toBe(true);
          // The rest of the merge in the band is covered.
          expect((await grid.endBandCell(5, 10)).hidden).toBe(true);
          expect((await grid.endBandCell(6, 9)).hidden).toBe(true);
          expect((await grid.endBandCell(6, 10)).hidden).toBe(true);
        });

        test('keeps the master drawing the merge from its anchor when the master shows it', async () => {
          await grid.scrollTo({ left: 10_000 });

          const anchor = await grid.cell(5, 8);

          expect(anchor.clone).toBe('master');
          expect(anchor.text).toBe('R6C9');
          expect({ colspan: anchor.colspan, rowspan: anchor.rowspan }).toEqual({ colspan: 3, rowspan: 2 });
        });
      });
  }
}
