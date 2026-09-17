import Handsontable from 'handsontable';

interface ColumnConditions {
  column: number;
  operation: string;
  conditions: { name: string; args: unknown[] }[];
}

const hot = Handsontable(document.createElement('div'), {
  filters: true,
});

Handsontable(document.createElement('div'), {
  filters: {
    searchMode: 'show',
  }
});

Handsontable(document.createElement('div'), {
  filters: {
    searchMode: 'apply',
  }
});

// Grid level. NOTE: `filters` is declared `boolean | object`, so nothing here checks the VALUE of a
// sub-option - a planted `filterFixedRows: 'nope'` compiles. These pin the shape a user writes, not
// its type. Making them able to fail means giving `filters` a real interface, which is a breaking
// type change (an unknown key inside an object literal would stop compiling) and belongs in its own
// task. The same already applies to `searchMode` above.
Handsontable(document.createElement('div'), {
  filters: {
    filterFixedRows: false,
  }
});

Handsontable(document.createElement('div'), {
  filters: {
    searchMode: 'show',
    filterFixedRows: true,
  }
});

// The per-column switch. This one DOES check the type: `ColumnSettings['filters']` is
// `boolean | object | undefined`, so a wrong type is a compile error. Only `false` is read there -
// an object is accepted by the type and ignored at runtime, with a console warning.
Handsontable(document.createElement('div'), {
  columns: [
    { filters: false },
    { filters: true },
    {},
  ],
});

const filters = hot.getPlugin('filters');

filters.enablePlugin();
filters.disablePlugin();
filters.isEnabled();
filters.addCondition(1, 'eq', [2]);
filters.addCondition(1, 'eq', [2], 'conjunction');
filters.removeConditions(1);
filters.clearConditions(1);
filters.importConditions([
  {
    column: 1,
    operation: 'conjunction',
    conditions: [
      {
        name: 'eq',
        args: [2],
      },
    ],
  },
]);
filters.filter();
filters.getDataMapAtColumn(1);
filters.destroy();

const conditions: ColumnConditions[] = filters.exportConditions();
const selectedColumn = filters.getSelectedColumn();

if (selectedColumn !== null) {
  const selectedColumnPhysicalIndex: number = selectedColumn.physicalIndex;
  const selectedColumnVisualIndex: number = selectedColumn.visualIndex;
}
