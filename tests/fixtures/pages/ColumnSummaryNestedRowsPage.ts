import { type Locator, expect } from '@playwright/test';
import { UndoGridPage } from './UndoGridPage';

/**
 * Page Object for a ColumnSummary over NestedRows, on the undo fixture
 * (tests/fixtures/demo/undo-grid.html).
 *
 * The grid is the ticket's scenario: a total row (physical row 0) over two leaves and a nested
 * subtotal row (physical row 3) over three leaves. The grid is built in the page, because a numeric
 * column needs its own renderer to carry the `cell-<row>-<col>` test id the fixture stamps on text
 * cells.
 */
export class ColumnSummaryNestedRowsPage extends UndoGridPage {
  /**
   * Rebuild the grid with the two summaries.
   *
   * @param includeSummaryResults Whether the total row counts the subtotal row's result too.
   */
  async initNestedSummaryGrid(includeSummaryResults: boolean): Promise<void> {
    await this.page.evaluate((includeResults) => {
      const numericRenderer = function(instance: any, td: HTMLElement, row: number, col: number) {
        // eslint-disable-next-line prefer-rest-params
        (window as any).Handsontable.renderers.NumericRenderer.apply(this, arguments);
        td.setAttribute('data-testid', `cell-${row}-${col}`);
      };

      window.initUndoGrid({
        data: [{
          name: 'Line 1 (total)',
          value: null,
          __children: [
            { name: 'Line 2', value: 5 },
            { name: 'Line 3', value: 6 },
            {
              name: 'Line 4 (subtotal)',
              value: null,
              __children: [
                { name: 'Line 5', value: 7 },
                { name: 'Line 6', value: 8 },
                { name: 'Line 7', value: 9 },
              ],
            },
          ],
        }],
        columns: [{ data: 'name' }, { data: 'value', type: 'numeric', renderer: numericRenderer }],
        colHeaders: ['name', 'value'],
        nestedRows: true,
        columnSummary: [
          { destinationRow: 3, destinationColumn: 1, type: 'sum', forceNumeric: true, ranges: [[4, 6]] },
          {
            destinationRow: 0,
            destinationColumn: 1,
            type: 'sum',
            forceNumeric: true,
            ranges: [[1, 3]],
            ...(includeResults ? { includeSummaryResults: true } : {}),
          },
        ],
      });
    }, includeSummaryResults);
    await expect(this.cell(0, 1)).toBeVisible();
  }

  /**
   * Rebuild the grid with `columnSummary` in the function form, the way the docs example builds it:
   * every parent gets a `sum` of its direct children with `includeSummaryResults`, and the endpoints
   * are worked out from the data tree in physical rows, so they do not depend on what is collapsed.
   */
  async initTreeSummaryGrid(): Promise<void> {
    await this.page.evaluate(() => {
      type Line = { name: string; value: number | null; __children?: Line[] };

      const numericRenderer = function(instance: any, td: HTMLElement, row: number, col: number) {
        // eslint-disable-next-line prefer-rest-params
        (window as any).Handsontable.renderers.NumericRenderer.apply(this, arguments);
        td.setAttribute('data-testid', `cell-${row}-${col}`);
      };
      const data: Line[] = [{
        name: 'Line 1 (total)',
        value: null,
        __children: [
          { name: 'Line 2', value: 5 },
          { name: 'Line 3', value: 6 },
          {
            name: 'Line 4 (subtotal)',
            value: null,
            __children: [
              { name: 'Line 5', value: 7 },
              { name: 'Line 6', value: 8 },
              { name: 'Line 7', value: 9 },
            ],
          },
        ],
      }];
      // Returns the number of rows `line` spans, itself and its descendants.
      const addEndpoints = (endpoints: object[], line: Line, physicalRow: number): number => {
        const ranges: number[][] = [];
        let nextRow = physicalRow + 1;

        (line.__children ?? []).forEach((child) => {
          ranges.push([nextRow, nextRow]);
          nextRow += addEndpoints(endpoints, child, nextRow);
        });

        if (ranges.length > 0) {
          endpoints.push({
            destinationRow: physicalRow,
            destinationColumn: 1,
            type: 'sum',
            forceNumeric: true,
            ranges,
            includeSummaryResults: true,
          });
        }

        return nextRow - physicalRow;
      };

      window.initUndoGrid({
        data,
        columns: [{ data: 'name' }, { data: 'value', type: 'numeric', renderer: numericRenderer }],
        colHeaders: ['name', 'value'],
        nestedRows: true,
        columnSummary() {
          const endpoints: object[] = [];
          let physicalRow = 0;

          data.forEach((line) => {
            physicalRow += addEndpoints(endpoints, line, physicalRow);
          });

          return endpoints;
        },
      });
    });
    await expect(this.cell(0, 1)).toBeVisible();
  }

  /**
   * The collapse/expand button of a row header, by visual row.
   */
  collapseButton(visualRow: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody tr').nth(visualRow).locator('.ht_nestingButton');
  }

  /**
   * Edit the value cell of a visual row the way a user does: select it, type, press Enter.
   */
  async typeValue(visualRow: number, value: number): Promise<void> {
    await this.page.evaluate(row => window.hot.selectCell(row, 1), visualRow);
    await this.page.keyboard.type(String(value));
    await this.page.keyboard.press('Enter');
  }
}
