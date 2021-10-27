import Handsontable from 'handsontable';

const columnSorting = Handsontable.plugins.ColumnSorting;

columnSorting.clearSort();

columnSorting.getSortConfig();
columnSorting.getSortConfig(0);

const sortConfig0 = columnSorting.getSortConfig(0);

if (typeof sortConfig0 !== 'undefined' && !Array.isArray(sortConfig0)) {
  sortConfig0.column;
  sortConfig0.sortOrder;
}

const sortConfigs = columnSorting.getSortConfig();

if (Array.isArray(sortConfigs)) {
  sortConfigs[0].column;
  sortConfigs[0].sortOrder;
}

columnSorting.setSortConfig({ column: 0, sortOrder: 'asc' });
columnSorting.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
columnSorting.setSortConfig([]);

columnSorting.isSorted();

columnSorting.sort({ column: 0, sortOrder: 'asc' });
