import { test, expect } from '../fixtures/test';
import { MergeCellsFrozenBottomEndPage } from '../fixtures/pages/MergeCellsFrozenBottomEndPage';

/**
 * A merged block that crosses the `fixedRowsBottom` line inside the `fixedColumnsEnd` columns. The bottom end
 * corner renders only the frozen bottom rows and only the end columns, so it never holds the block's origin,
 * the same as the bottom clone does not (DEV-176). Its first row has to carry the span, clamped to the corner's
 * rows and columns, or every covered cell is hidden and the row slides out of its columns.
 *
 * The fixture has 10 rows and 10 columns: `fixedRowsBottom: 2` freezes rows 8 and 9, `fixedColumnsEnd: 3`
 * freezes columns 7, 8 and 9. The band keeps one column that no block covers: a clone whose columns a block covers
 * ALL of has rows with no displayed cell, and those collapse (a separate limit, see the plugin's AGENTS.md).
 */
const END_CORNER = 'ht_clone_bottom_inline_end_corner';
const FROZEN_ROWS = [8, 9];

interface Shape {
  name: string;
  block: { row: number, col: number, rowspan: number, colspan: number };
  /**
   * The span the bottom end corner is expected to carry on row 8: the block clamped to the band's columns.
   */
  carrier: { col: number, colspan: string };
  /**
   * The first end column of the block, where the inline-end clone draws the continuation.
   */
  endClone: { col: number, colspan: string, text: string };
  /**
   * Whether the end clones draw the selection outline of the block. They do for a block anchored in the band.
   */
  drawsOutlineInEndClones: boolean;
}

const SHAPES: Shape[] = [
  {
    name: 'inside the end columns',
    block: { row: 6, col: 8, rowspan: 4, colspan: 2 },
    carrier: { col: 8, colspan: '2' },
    endClone: { col: 8, colspan: '2', text: 'R7C9' },
    drawsOutlineInEndClones: true,
  },
  {
    name: 'from the master columns into the end columns',
    block: { row: 6, col: 5, rowspan: 4, colspan: 3 },
    carrier: { col: 7, colspan: '1' },
    endClone: { col: 7, colspan: '1', text: 'R7C6' },
    drawsOutlineInEndClones: false,
  },
];

for (const direction of ['ltr', 'rtl'] as const) {
  test.describe(`merged cell across fixedRowsBottom and fixedColumnsEnd (${direction})`, () => {
    let grid: MergeCellsFrozenBottomEndPage;

    test.beforeEach(async ({ page, theme }) => {
      grid = new MergeCellsFrozenBottomEndPage(page, theme);
      await grid.goto();
    });

    for (const mode of ['default', 'virtualized']) {
      for (const shape of SHAPES) {
        test.describe(`${mode}, block ${shape.name}`, () => {
          const { block } = shape;
          const blockColumns = Array.from({ length: block.colspan }, (_, index) => block.col + index);
          const init = () => grid.initGrid({
            layoutDirection: direction,
            fixedRowsBottom: 2,
            fixedColumnsEnd: 3,
            // Fixed sizes: the themes pad the cells differently, and a column or a row at the edge of the
            // viewport is not rendered on every theme.
            colWidths: 50,
            width: 620,
            height: 600,
            mergeCells: mode === 'virtualized' ? { virtualized: true, cells: [block] } : [block],
          });

          test('carries the span on the first frozen row of the bottom end corner', async () => {
            await init();

            await expect.poll(() => grid.cloneCell(END_CORNER, 8, shape.carrier.col))
              .toEqual({ displayed: true, rowspan: '2', colspan: shape.carrier.colspan, text: '' });
            // The carrier covers the next frozen row, which is hidden in the corner.
            expect((await grid.cloneCell(END_CORNER, 9, shape.carrier.col))?.displayed).toBe(false);
            await expect.poll(() => grid.offsetFromHeader(END_CORNER, 8, shape.carrier.col)).toBe(0);
          });

          test('keeps every other frozen cell under its own header', async () => {
            await init();
            await expect.poll(() => grid.cloneCell(END_CORNER, 8, shape.carrier.col)).not.toBeNull();

            for (const row of FROZEN_ROWS) {
              for (const cloneClass of ['ht_clone_bottom', END_CORNER]) {
                for (const col of await grid.displayedColumns(cloneClass, row)) {
                  const isBlockCarrier = row === 8 && col === shape.carrier.col;

                  if (!blockColumns.includes(col) || isBlockCarrier) {
                    expect(await grid.offsetFromHeader(cloneClass, row, col), `${cloneClass} ${row}/${col}`)
                      .toBe(0);
                  }
                }
              }
            }

            // The corner keeps the columns of the band that the block does not cover.
            for (const col of [7, 8, 9].filter(bandColumn => !blockColumns.includes(bandColumn))) {
              for (const row of FROZEN_ROWS) {
                await expect.poll(() => grid.offsetFromHeader(END_CORNER, row, col)).toBe(0);
              }
            }
          });

          test('keeps drawing the block in the inline-end clone and in the master', async () => {
            await init();

            await expect.poll(() => grid.cloneCell('ht_clone_inline_end', block.row, shape.endClone.col))
              .toEqual({
                displayed: true,
                rowspan: String(block.rowspan),
                colspan: shape.endClone.colspan,
                text: shape.endClone.text,
              });
            await expect.poll(() => grid.offsetFromHeader('ht_clone_inline_end', block.row, shape.endClone.col))
              .toBe(0);

            if (block.col < 7) {
              // The origin is in the master's own columns: the master draws the whole block.
              await expect.poll(() => grid.cloneCell('ht_master', block.row, block.col))
                .toEqual({
                  displayed: true,
                  rowspan: String(block.rowspan),
                  colspan: String(block.colspan),
                  text: `R7C${block.col + 1}`,
                });
            }
          });

          // A block anchored in the master gets no outline from the end clones (a separate limit, see AGENTS.md).
          if (shape.drawsOutlineInEndClones) {
            test('draws one outline, with no edge on the freeze lines, for the selected block', async () => {
              await init();
              await grid.selectCells(block.row, block.col, block.row, block.col);

              await expect.poll(async () => (await grid.mergedBlockSelection(block.row, block.col)).fillHandles.length)
                .toBe(1);

              const { edgesInside, outline, fillHandles } = await grid.mergedBlockSelection(block.row, block.col);

              expect(edgesInside).toEqual([]);
              expect(outline).toEqual({
                top: Array(block.colspan).fill(true),
                bottom: Array(block.colspan).fill(true),
                left: Array(block.rowspan).fill(true),
                right: Array(block.rowspan).fill(true),
              });
              // The handle sits on the block's bottom-end corner.
              expect(Math.abs(fillHandles[0].dx)).toBeLessThanOrEqual(4);
              expect(Math.abs(fillHandles[0].dy)).toBeLessThanOrEqual(4);
            });
          }
        });
      }
    }
  });
}
