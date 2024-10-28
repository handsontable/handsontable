import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  multiColumnSorting: true,
});
new Handsontable(document.createElement('div'), {
  multiColumnSorting: {
    sortEmptyCells: true,
    indicator: true,
    headerAction: true,
    compareFunctionFactory(sortOrder, columnMeta) {
      return (a: any, b: any) => columnMeta.type === 'text' && sortOrder === 'asc' ? -1 : 1;
    },
    initialConfig: {
      column: 1,
      sortOrder: 'asc'
    }
  }
});
new Handsontable(document.createElement('div'), {
  multiColumnSorting: {
    initialConfig: [
      {
        column: 1,
        sortOrder: 'desc'
      },
      {
        column: 3,
        sortOrder: 'asc'
      }
    ]
  }
});

const plugin = hot.getPlugin('multiColumnSorting');

plugin.clearSort();
plugin.getSortConfig();
plugin.getSortConfig(0);

const sortConfig0 = plugin.getSortConfig(0);

if (typeof sortConfig0 !== 'undefined' && !Array.isArray(sortConfig0)) {
  sortConfig0.column;
  sortConfig0.sortOrder;
}

const sortConfigs = plugin.getSortConfig();

if (Array.isArray(sortConfigs)) {
  sortConfigs[0].column;
  sortConfigs[0].sortOrder;
}

plugin.setSortConfig({ column: 0, sortOrder: 'asc' });
plugin.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
plugin.setSortConfig([]);

const isSorted: boolean = plugin.isSorted();

plugin.sort({ column: 0, sortOrder: 'asc' });
plugin.sort([{ column: 1, sortOrder: 'desc' }, { column: 2, sortOrder: 'asc' }]);
