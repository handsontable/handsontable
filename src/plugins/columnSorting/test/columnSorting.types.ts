import * as Handsontable from 'handsontable';

const columnSorting = Handsontable.plugins.ColumnSorting;

columnSorting.clearSort();

columnSorting.getSortConfig();
columnSorting.getSortConfig(0);

columnSorting.setSortConfig();
columnSorting.setSortConfig({ column: 0, sortOrder: 'asc' });
columnSorting.setSortConfig([{ column: 0, sortOrder: 'asc' }]);

columnSorting.isSorted();

columnSorting.sort();
columnSorting.sort({ column: 0, sortOrder: 'asc' });
