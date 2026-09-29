import Handsontable from 'handsontable';
import type { AvailableConditions, AvailableConditionsRule } from 'handsontable/plugins/filters';

// `availableConditions` is checked at both levels: in `FiltersSettings` and in the per-column
// `FiltersColumnSettings`. The exported types are what a user annotates a value with.
const allowList: AvailableConditionsRule = ['eq', 'gt', '---------', 'between'];
const exclusion: AvailableConditionsRule = { exclude: ['not_between'] };
const perType: AvailableConditions = {
  numeric: { exclude: ['not_between'] },
  text: ['contains', 'begins_with'],
};

// A `readonly` array works too; the plugin never changes the lists it is given.
const readonlyNames = ['eq', 'neq'] as const;

Handsontable(document.createElement('div'), {
  filters: {
    availableConditions: { text: readonlyNames, numeric: { exclude: readonlyNames } },
  },
  columns: [{ filters: { availableConditions: readonlyNames } }],
});

// @ts-expect-error - `exclude` holds condition names, not one name.
const badExclusion: AvailableConditionsRule = { exclude: 'not_between' };

// @ts-expect-error - a per-type key must be a data type with its own list; `dropdown` uses `text`.
const badDataType: AvailableConditions = { numeric: ['gt'], dropdown: ['eq'] };

Handsontable(document.createElement('div'), {
  filters: {
    availableConditions: perType,
  },
  columns: [
    { filters: { availableConditions: allowList } },
    { filters: { availableConditions: exclusion } },
  ],
});

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

// Grid level. Since 19.0 the object form is `FiltersSettings`, not a bare `object`, so the
// sub-options are checked: each `@ts-expect-error` below fails the run if its error goes away.
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

const filtersSettings: Handsontable.plugins.Filters.Settings = { searchMode: 'apply' };

Handsontable(document.createElement('div'), { filters: filtersSettings });

Handsontable(document.createElement('div'), {
  // @ts-expect-error - `filterFixedRows` is a boolean
  filters: { filterFixedRows: 'nope' },
});

Handsontable(document.createElement('div'), {
  // @ts-expect-error - `searchMode` is `'show'` or `'apply'`
  filters: { searchMode: 'hide' },
});

Handsontable(document.createElement('div'), {
  // @ts-expect-error - an unknown key is rejected, so a misspelled option no longer compiles
  filters: { filterFixedRow: false },
});

// A value read into a `string` is wider than the option accepts; `as const` is the documented fix
// (migration guide 18.1 -> 19.0, section 23).
const widenedConfig = { searchMode: 'apply' };
const literalConfig = { searchMode: 'apply' } as const;

// @ts-expect-error - `string` is not assignable to `'show' | 'apply'`
Handsontable(document.createElement('div'), { filters: widenedConfig });
Handsontable(document.createElement('div'), { filters: literalConfig });

// The per-column switch. `false` hides the filter UI, and an object carries `availableConditions`
// only, so the type is `boolean | FiltersColumnSettings`.
Handsontable(document.createElement('div'), {
  columns: [
    { filters: false },
    { filters: true },
    {},
  ],
});

Handsontable(document.createElement('div'), {
  columns: [
    // @ts-expect-error - the grid-level object is ignored per column, so it does not compile there
    { filters: { filterFixedRows: false } },
  ],
});

Handsontable(document.createElement('div'), {
  columns: [
    // @ts-expect-error - a wrong type is rejected per column as well
    { filters: 12345 },
  ],
});

Handsontable(document.createElement('div'), {
  columns: [
    // @ts-expect-error - a per-column `availableConditions` is checked like the grid-level one
    { filters: { availableConditions: 'eq' } },
  ],
});

const columnFilters: Handsontable.plugins.Filters.ColumnSettings = { availableConditions: ['eq'] };

Handsontable(document.createElement('div'), { columns: [{ filters: columnFilters }] });

// Reading is wider than writing: cell meta inherits the grid-level object through the prototype
// chain, so `CellMeta['filters']` keeps the grid type while `columns` accepts only a boolean or an
// object with `availableConditions`.
const cellFilters = hot.getCellMeta(0, 0).filters;

if (typeof cellFilters === 'object') {
  const cellSearchMode: 'show' | 'apply' | undefined = cellFilters.searchMode;
}

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
