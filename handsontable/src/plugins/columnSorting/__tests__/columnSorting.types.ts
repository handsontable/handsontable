import Handsontable from 'handsontable';

const columnSorting = Handsontable.plugins.ColumnSorting;

columnSorting.clearSort();

columnSorting.getSortConfig();
columnSorting.getSortConfig(0);

const sortConfig0 = columnSorting.getSortConfig(0);

if (typeof sortConfig0 !== 'undefined') {
  sortConfig0.column;
  sortConfig0.sortOrder;
}

const sortConfigs = columnSorting.getSortConfig();

sortConfigs[0].column;
sortConfigs[0].sortOrder;

columnSorting.setSortConfig();
columnSorting.setSortConfig({ column: 0, sortOrder: 'asc' });
columnSorting.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
columnSorting.setSortConfig([]);

columnSorting.isSorted();

columnSorting.sort();
columnSorting.sort({ column: 0, sortOrder: 'asc' });
