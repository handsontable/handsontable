import { test, expect } from '../fixtures/test';
import { NestedHeadersEmptyGroupHeaderRolePage } from '../fixtures/pages/NestedHeadersEmptyGroupHeaderRolePage';

/**
 * A `nestedHeaders` group row shorter than the column count leaves a header cell with no label over
 * every column it does not cover. As a column header such a cell has an empty name, which a screen
 * reader reads for every cell below it and axe reports as `empty-table-header`. Nested headers turn
 * it into a plain cell (`role="gridcell"`, no `scope`) when `ariaTags` is on, and a recycled header
 * that gets a label is a column header again.
 *
 * Fixture header layout (visual columns in brackets):
 *   level 0:  Info [0] | Details [1-4] | Extra [5] | (no label) [6] [7] [8] [9]
 *   level 1:  L0 ... L9
 */

const LABELED_TOP_COLUMNS = [0, 1, 5];
const UNLABELED_TOP_COLUMNS = [6, 7, 8, 9];
const ALL_COLUMNS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

test.describe('nested headers: a group cell with no label', () => {
  test('is a plain cell, while every labeled header stays a column header', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersEmptyGroupHeaderRolePage(page, theme, bundle);

    await grid.goto();

    for (const column of UNLABELED_TOP_COLUMNS) {
      const header = grid.header(0, column);

      await expect(header).toHaveText('');
      await expect(header).toHaveAttribute('role', 'gridcell');
      await expect(header).not.toHaveAttribute('scope');
    }

    for (const column of LABELED_TOP_COLUMNS) {
      await expect(grid.header(0, column)).toHaveAttribute('role', 'columnheader');
      await expect(grid.header(0, column)).toHaveAttribute('scope', 'col');
    }

    for (const column of ALL_COLUMNS) {
      await expect(grid.header(1, column)).toHaveAttribute('role', 'columnheader');
      await expect(grid.header(1, column)).toHaveAttribute('scope', 'col');
    }

    await expect(grid.headerOverlay().getByRole('columnheader', { name: 'Info', exact: true })).toHaveCount(1);
    await expect(grid.headerOverlay().getByRole('columnheader', { name: 'Details', exact: true })).toHaveCount(1);
    await expect(grid.headerOverlay().getByRole('columnheader', { name: 'Extra', exact: true })).toHaveCount(1);
    await expect(grid.headerOverlay().getByRole('gridcell')).toHaveCount(UNLABELED_TOP_COLUMNS.length);
    await expect(grid.columnHeaders()).toHaveCount(LABELED_TOP_COLUMNS.length + ALL_COLUMNS.length);
    await expect(grid.namelessColumnHeaders()).toHaveCount(0);
  });

  test('turns back into a column header once a settings update gives it a label, and back again', async({
    page, theme, bundle,
  }) => {
    const grid = new NestedHeadersEmptyGroupHeaderRolePage(page, theme, bundle);

    await grid.goto();
    await expect(grid.header(0, 6)).toHaveAttribute('role', 'gridcell');
    await expect(grid.header(0, 7)).toHaveAttribute('role', 'gridcell');

    await grid.setTopHeaderRow(['Info', { label: 'Details', colspan: 4 }, 'Extra', 'More', { label: 'Tail', colspan: 3 }]);

    await expect(grid.header(0, 6)).toHaveText('More');
    await expect(grid.header(0, 6)).toHaveAttribute('role', 'columnheader');
    await expect(grid.header(0, 6)).toHaveAttribute('scope', 'col');
    await expect(grid.header(0, 7)).toHaveText('Tail');
    await expect(grid.header(0, 7)).toHaveAttribute('role', 'columnheader');
    await expect(grid.header(0, 7)).toHaveAttribute('scope', 'col');
    await expect(grid.header(0, 7)).toHaveAttribute('colspan', '3');
    await expect(grid.headerOverlay().getByRole('columnheader', { name: 'More', exact: true })).toHaveCount(1);
    await expect(grid.headerOverlay().getByRole('columnheader', { name: 'Tail', exact: true })).toHaveCount(1);
    await expect(grid.headerOverlay().getByRole('gridcell')).toHaveCount(0);
    await expect(grid.namelessColumnHeaders()).toHaveCount(0);

    await grid.setTopHeaderRow(['Info', { label: 'Details', colspan: 4 }, 'Extra']);

    for (const column of UNLABELED_TOP_COLUMNS) {
      await expect(grid.header(0, column)).toHaveText('');
      await expect(grid.header(0, column)).toHaveAttribute('role', 'gridcell');
      await expect(grid.header(0, column)).not.toHaveAttribute('scope');
    }

    await expect(grid.namelessColumnHeaders()).toHaveCount(0);
  });

  test('stays a column header when its label is markup only or it reaches the cells, and an authored empty group is a plain cell', async({
    page, theme, bundle,
  }) => {
    const grid = new NestedHeadersEmptyGroupHeaderRolePage(page, theme, bundle);

    await grid.goto();
    await grid.setHeaderRows([
      [
        { label: '', colspan: 2 },
        { label: `<img src="${PIXEL}" alt="Q1">`, colspan: 3 },
        'Extra',
        { label: '', rowspan: 2 },
        { label: '<i aria-hidden="true" class="icon"></i>', colspan: 2 },
      ],
      ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', '', 'L7', 'L8', 'L9'],
    ]);

    await expect(grid.header(0, 0)).toHaveAttribute('colspan', '2');
    await expect(grid.header(0, 0)).toHaveAttribute('role', 'gridcell');
    await expect(grid.header(0, 0)).not.toHaveAttribute('scope');

    await expect(grid.header(0, 2)).toHaveText('');
    await expect(grid.header(0, 2)).toHaveAttribute('role', 'columnheader');
    await expect(grid.header(0, 2)).toHaveAttribute('scope', 'col');
    await expect(grid.headerOverlay().getByRole('columnheader', { name: 'Q1', exact: true })).toHaveCount(1);

    await expect(grid.header(0, 6)).toHaveAttribute('rowspan', '2');
    await expect(grid.header(0, 6)).toHaveText('');
    await expect(grid.header(0, 6)).toHaveAttribute('role', 'columnheader');
    await expect(grid.header(0, 6)).toHaveAttribute('scope', 'col');

    await expect(grid.header(0, 7)).toHaveAttribute('colspan', '2');
    await expect(grid.header(0, 7).locator('i.icon')).toBeAttached();
    await expect(grid.header(0, 7)).toHaveAttribute('role', 'gridcell');
    await expect(grid.header(0, 7)).not.toHaveAttribute('scope');
    await expect(grid.header(0, 9)).toHaveAttribute('role', 'gridcell');
  });

  test('gets no role when ariaTags is off', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersEmptyGroupHeaderRolePage(page, theme, bundle);

    await grid.goto({ aria: 'off' });

    for (const column of UNLABELED_TOP_COLUMNS) {
      await expect(grid.header(0, column)).toBeAttached();
      await expect(grid.header(0, column)).not.toHaveAttribute('role');
    }

    await expect(grid.header(0, 1)).toHaveText('Details');
    await expect(grid.header(0, 1)).not.toHaveAttribute('role');
  });
});
