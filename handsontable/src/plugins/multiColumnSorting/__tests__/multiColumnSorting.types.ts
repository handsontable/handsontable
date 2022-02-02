import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const columnSorting = hot.getPlugin('multiColumnSorting');

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
columnSorting.sort([{ column: 1, sortOrder: 'desc' }, { column: 2, sortOrder: 'asc' }]);
