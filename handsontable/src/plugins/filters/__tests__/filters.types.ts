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

// `filterValueComparator` orders the "Filter by value" list. It cascades like any other option:
// set once for every column at the grid level, or per column inside `columns`.
Handsontable(document.createElement('div'), {
  filters: true,
  filterValueComparator: (a: unknown, b: unknown) => String(a).localeCompare(String(b)),
});

const PRIORITY = ['Critical', 'High', 'Medium', 'Low'];

Handsontable(document.createElement('div'), {
  filters: true,
  columns: [
    {
      filterValueComparator: (a: unknown, b: unknown) =>
        PRIORITY.indexOf(a as string) - PRIORITY.indexOf(b as string),
    },
    { filterValueComparator: undefined },
    {},
  ],
});

// @ts-expect-error – an ordered list is not a comparator; write a function that ranks by it instead
Handsontable(document.createElement('div'), { filterValueComparator: PRIORITY });

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

// The option is declared with property syntax, so under `strictFunctionTypes` it is checked
// contravariantly and a NARROWED parameter type is not assignable. `unknown` is the conservative
// choice (narrowing the published signature later would be breaking), and this pins the constraint
// so it is a documented trade rather than something the first customer discovers.
Handsontable(document.createElement('div'), {
  // @ts-expect-error - parameters must be `unknown`; a narrowed signature is not assignable
  filterValueComparator: (a: string, b: string) => a.localeCompare(b),
});
