import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType, NumericCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { ManualRowMove } from 'handsontable/plugins/manualRowMove';
import { ManualColumnMove } from 'handsontable/plugins/manualColumnMove';
import { NestedRows } from 'handsontable/plugins/nestedRows';
import { conditions, registerCondition } from 'handsontable/plugins/filters/conditionRegisterer';
import { registerOperation } from 'handsontable/plugins/filters/logicalOperationRegisterer';

registerCellType(CheckboxCellType);
registerCellType(NumericCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(TrimRows);
registerPlugin(ManualRowMove);
registerPlugin(ManualColumnMove);
registerPlugin(NestedRows);
registerPlugin(Filters);

/**
 * Parity battery for the filter column read. Every assertion is a hardcoded expectation, so the
 * file is green on unpatched develop and on any patch that preserves behavior. Nothing here
 * imports a symbol that only a patch provides.
 */
describe('Filters -> column read parity', () => {
  const BIG_ROWS = 500;
  // rows 0,5,10.. -> '10'; 1,6.. -> '9'; 2,7.. -> '100'; 3,8.. -> '2'; 4,9.. -> '20'
  const CYCLE = ['10', '9', '100', '2', '20'];

  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a 500-row grid whose viewport paints only a handful of rows, so most rows carry no
   * stored cell meta.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildBigGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: BIG_ROWS }, (_, row) => [CYCLE[row % 5], `B${row}`]),
      filters: true,
      width: 200,
      height: 100,
      colWidths: 50,
      rowHeights: 23,
      autoColumnSize: false,
      autoRowSize: false,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot;
  }

  /**
   * Builds a small grid over an explicit dataset.
   *
   * @param {Array} data The dataset.
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(data, overrides = {}) {
    hot = new Handsontable(container, {
      data,
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot;
  }

  describe('stored per-cell meta', () => {
    it('should let a built-in condition read the stored `type` of the few rows that carry one', () => {
      // `gt` branches on `dataRow.meta.type === 'numeric'`: with the numeric type the input is
      // parsed and the comparison is numeric ('10' > 9), without it the comparison is a string one
      // ('10' > '9' is false). So the surviving set names exactly the rows whose STORED meta
      // reached the condition.
      const filters = buildBigGrid({
        cell: [
          { row: 400, col: 0, type: 'numeric' },
          { row: 402, col: 0, type: 'numeric' },
        ],
      }).getPlugin('filters');

      expect(hot.getCellsMeta().length).toBeLessThan(BIG_ROWS);

      filters.addCondition(0, 'gt', ['9']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['10', '100']);
      expect(hot.getDataAtCol(1)).toEqual(['B400', 'B402']);
    });

    it('should let a built-in condition read a stored `locale` on the few rows that carry one', () => {
      // `contains` lowercases through `dataRow.meta.locale`. Turkish lowercases `I` to a dotless
      // `ı`, so only a row whose stored meta carries that locale fails to contain a plain `i`.
      const filters = buildGrid([['TITLE'], ['TITLE'], ['TITLE']], {
        cell: [{ row: 1, col: 0, locale: 'tr-TR' }],
      }).getPlugin('filters');

      filters.addCondition(0, 'contains', ['it']);
      filters.filter();

      expect(hot.getData().length).toBe(2);
      expect(hot.toPhysicalRow(0)).toBe(0);
      expect(hot.toPhysicalRow(1)).toBe(2);
    });
  });

  describe('valueGetter', () => {
    it('should read a column-level `valueGetter` for every row', () => {
      const seen = [];
      const filters = buildBigGrid({
        columns: [
          {
            data: 0,
            valueGetter: (value, visualRow, visualCol) => {
              seen.push([visualRow, visualCol, value]);

              return value === '2' ? 'matched' : `raw-${value}`;
            },
          },
          { data: 1 },
        ],
      }).getPlugin('filters');

      seen.length = 0;
      filters.addCondition(0, 'eq', ['matched']);
      filters.filter();

      const readDuringFilter = seen.filter(([row]) => row === 400 || row === 403);

      expect(readDuringFilter).toContainEqual([400, 0, '10']);
      expect(readDuringFilter).toContainEqual([403, 0, '2']);
      // 100 of the 500 rows hold '2'.
      expect(hot.getDataAtCol(0).length).toBe(100);
      expect(hot.getDataAtCol(0)[0]).toBe('matched');
    });

    it('should read a per-cell `valueGetter` on a column that declares none', () => {
      const filters = buildBigGrid({
        cell: [{ row: 401, col: 0, valueGetter: () => 'special' }],
      }).getPlugin('filters');

      filters.addCondition(0, 'eq', ['special']);
      filters.filter();

      expect(hot.getDataAtCol(1)).toEqual(['B401']);
    });
  });

  describe('user-registered predicates', () => {
    const RETAINING_CONDITION = 'parity_retaining_condition';
    const RETAINING_OPERATION = 'parity_retaining_operation';

    let retained;

    beforeAll(() => {
      registerCondition(RETAINING_CONDITION, (dataRow) => {
        retained.push(dataRow);

        return true;
      }, { name: 'Retaining (parity)', inputsCount: 0 });

      registerOperation(RETAINING_OPERATION, 'Retaining operation (parity)', (columnConditions, dataRow) => {
        retained.push(dataRow);

        return columnConditions.every(c => c.func(dataRow));
      });
    });

    beforeEach(() => {
      retained = [];
    });

    it('should hand a condition registered by the application its own object per row', () => {
      const filters = buildBigGrid().getPlugin('filters');

      filters.addCondition(0, RETAINING_CONDITION, []);
      filters.filter();

      expect(retained.length).toBe(BIG_ROWS);
      expect(new Set(retained).size).toBe(BIG_ROWS);
      expect(new Set(retained.map(({ meta }) => meta)).size).toBe(BIG_ROWS);
      expect(retained[0].value).toBe('10');
      expect(retained[400].value).toBe('10');
      expect(retained[400].row).toBe(400);
    });

    it('should hand an operation registered by the application its own object per row', () => {
      const filters = buildBigGrid().getPlugin('filters');

      // Built-in conditions only - the OPERATION is the application code here.
      filters.addCondition(0, 'contains', ['1'], RETAINING_OPERATION);
      filters.filter();

      expect(retained.length).toBe(BIG_ROWS);
      expect(new Set(retained).size).toBe(BIG_ROWS);
      expect(new Set(retained.map(({ meta }) => meta)).size).toBe(BIG_ROWS);
      // '10' and '100' contain '1'; 200 of the 500 rows.
      expect(hot.getDataAtCol(0).length).toBe(200);
    });

    it('should hand an overridden built-in its own object per row when a built-in negation ' +
      'delegates to it', () => {
      // `not_contains` is a library built-in, but it resolves `contains` from the registry at CALL
      // time, so an application that overrode `contains` runs its own code inside a stack that
      // looks entirely built-in from the outside.
      const originalContains = conditions.contains.condition;
      const originalDescriptor = conditions.contains.descriptor;

      try {
        registerCondition('contains', (dataRow) => {
          retained.push(dataRow);

          return false;
        }, { ...originalDescriptor });

        const filters = buildBigGrid().getPlugin('filters');

        filters.addCondition(0, 'not_contains', ['zzz']);
        filters.filter();

        expect(retained.length).toBe(BIG_ROWS);
        expect(new Set(retained).size).toBe(BIG_ROWS);
        expect(new Set(retained.map(({ meta }) => meta)).size).toBe(BIG_ROWS);
        expect(retained[0].value).toBe('10');
        expect(retained[400].value).toBe('10');
        expect(retained[400].row).toBe(400);
      } finally {
        registerCondition('contains', originalContains, originalDescriptor);
      }
    });
  });

  describe('modifyData', () => {
    it('should run the hook per row and feed the modified value to the conditions', () => {
      const calls = [];
      const filters = buildBigGrid().getPlugin('filters');

      hot.addHook('modifyData', (physicalRow, physicalColumn, valueHolder, ioMode) => {
        if (ioMode !== 'get' || physicalColumn !== 0) {
          return;
        }

        calls.push(physicalRow);

        if (physicalRow === 400) {
          valueHolder.value = 'sentinel';
        }
      });

      calls.length = 0;
      filters.addCondition(0, 'eq', ['sentinel']);
      filters.filter();

      expect(calls.filter(row => row === 400).length).toBeGreaterThan(0);
      expect(hot.getDataAtCol(1)).toEqual(['B400']);
    });
  });

  describe('index mappers', () => {
    const DATA = [['Apple', 1], ['Banana', 2], ['Cherry', 3], ['Date', 4], ['Elderberry', 5]];

    it('should filter alongside trimRows', () => {
      const filters = buildGrid(DATA.map(row => row.slice()), {
        trimRows: [1, 3],
      }).getPlugin('filters');

      filters.addCondition(0, 'contains', ['e']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry', 'Elderberry']);
    });

    it('should filter alongside hiddenRows', () => {
      const filters = buildGrid(DATA.map(row => row.slice()), {
        hiddenRows: { rows: [0, 2] },
      }).getPlugin('filters');

      filters.addCondition(0, 'contains', ['e']);
      filters.filter();

      expect(hot.getData().map(([name]) => name)).toEqual(['Apple', 'Cherry', 'Date', 'Elderberry']);
    });

    it('should filter after a manual row move', () => {
      const filters = buildGrid(DATA.map(row => row.slice()), {
        manualRowMove: true,
      }).getPlugin('filters');

      hot.getPlugin('manualRowMove').moveRow(4, 0);
      hot.render();

      filters.addCondition(0, 'contains', ['e']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Elderberry', 'Apple', 'Cherry', 'Date']);
    });

    it('should filter after a manual column move', () => {
      const filters = buildGrid(DATA.map(row => row.slice()), {
        manualColumnMove: true,
      }).getPlugin('filters');

      hot.getPlugin('manualColumnMove').moveColumn(1, 0);
      hot.render();

      // `addCondition` takes a VISUAL column index, and the names now sit at visual index 1.
      filters.addCondition(1, 'contains', ['e']);
      filters.filter();

      expect(hot.getDataAtCol(1)).toEqual(['Apple', 'Cherry', 'Date', 'Elderberry']);
    });

    it('should keep the pinned rows out of the filter when filterFixedRows is off', () => {
      const filters = buildGrid(DATA.map(row => row.slice()), {
        fixedRowsTop: 1,
        fixedRowsBottom: 1,
        filters: { filterFixedRows: false },
      }).getPlugin('filters');

      filters.addCondition(0, 'contains', ['zzz']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Elderberry']);
    });

    it('should stay correct across row and column alters while a filter is active', () => {
      const filters = buildGrid(DATA.map(row => row.slice())).getPlugin('filters');

      filters.addCondition(0, 'contains', ['e']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry', 'Date', 'Elderberry']);

      hot.alter('insert_row_above', 1, 1);
      filters.filter();

      // The blank row does not contain `e`, so the re-run drops it again.
      expect(hot.getDataAtCol(0)).toEqual(['Apple', 'Cherry', 'Date', 'Elderberry']);

      // Visual row 0 is `Apple`; removing it must not shift the survivors of the other rows.
      hot.alter('remove_row', 0, 1);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Cherry', 'Date', 'Elderberry']);

      hot.alter('insert_col_start', 0, 1);
      filters.filter();

      // The condition follows the column it was put on, which is now at visual index 1.
      expect(hot.getDataAtCol(1)).toEqual(['Cherry', 'Date', 'Elderberry']);

      hot.alter('remove_col', 0, 1);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Cherry', 'Date', 'Elderberry']);
    });

    it('should narrow later columns to the rows the earlier ones left', () => {
      const filters = buildGrid([
        ['a', 'x'], ['a', 'y'], ['b', 'x'], ['b', 'y'], ['a', 'x'],
      ]).getPlugin('filters');

      filters.addCondition(0, 'eq', ['a']);
      filters.addCondition(1, 'eq', ['x']);
      filters.filter();

      expect(hot.getData()).toEqual([['a', 'x'], ['a', 'x']]);
      expect(hot.toPhysicalRow(0)).toBe(0);
      expect(hot.toPhysicalRow(1)).toBe(4);
    });
  });

  describe('nestedRows', () => {
    it('should filter a nested dataset', () => {
      const filters = buildGrid([
        {
          name: 'Parent A',
          __children: [{ name: 'Child A1' }, { name: 'Child A2' }],
        },
        {
          name: 'Parent B',
          __children: [{ name: 'Child B1' }],
        },
      ], {
        nestedRows: true,
        columns: [{ data: 'name' }],
      }).getPlugin('filters');

      filters.addCondition(0, 'contains', ['child a']);
      filters.filter();

      expect(hot.getDataAtCol(0)).toEqual(['Child A1', 'Child A2']);
    });
  });

  describe('the filter-by-value list', () => {
    it('should offer the unique values of the column', () => {
      const filters = buildGrid([
        ['Apple'], ['Banana'], ['Apple'], ['Cherry'], ['Banana'],
      ]).getPlugin('filters');

      const list = filters._getValueListDataAtColumn(0);

      expect(list.map(({ value }) => value)).toEqual([
        'Apple', 'Banana', 'Apple', 'Cherry', 'Banana',
      ]);
      expect(new Set(list.map(({ meta }) => meta)).size).toBe(5);
    });

    it('should offer the values of the rows the EARLIER columns left, not its own', () => {
      const filters = buildGrid([
        ['a', 'x'], ['a', 'y'], ['b', 'x'], ['b', 'y'],
      ]).getPlugin('filters');

      filters.addCondition(0, 'eq', ['a']);
      filters.addCondition(1, 'eq', ['x']);
      filters.filter();

      // Column 1 sits second in the stack, so its list is narrowed by column 0 only - its own
      // condition must not remove `y` from the list (issue #12226).
      expect(filters._getValueListDataAtColumn(1).map(({ value }) => value)).toEqual(['x', 'y']);
    });

    it('should publish one meta object per entry', () => {
      const filters = buildBigGrid().getPlugin('filters');

      filters.addCondition(0, 'contains', ['1']);
      filters.filter();

      const list = filters._getValueListDataAtColumn(0);

      expect(list.length).toBe(BIG_ROWS);
      expect(new Set(list.map(({ meta }) => meta)).size).toBe(BIG_ROWS);
    });
  });

  describe('getDataMapAtColumn', () => {
    it('should publish plain `{row, meta, value}` objects with an own meta each', () => {
      const filters = buildBigGrid().getPlugin('filters');
      const data = filters.getDataMapAtColumn(0);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(BIG_ROWS);
      expect(Object.keys(data[400])).toEqual(['row', 'meta', 'value']);
      expect(data[400].row).toBe(400);
      expect(data[400].value).toBe('10');
      expect(new Set(data.map(({ meta }) => meta)).size).toBe(BIG_ROWS);
      expect(data[400].meta.row).toBe(400);
      expect(data[400].meta.col).toBe(0);
      expect(data[400].meta.visualRow).toBe(400);
      expect(data[400].meta.visualCol).toBe(0);
    });

    it('should read only the given physical rows, in the given order', () => {
      const filters = buildBigGrid().getPlugin('filters');
      const data = filters.getDataMapAtColumn(0, [4, 1]);

      expect(data.map(({ row }) => row)).toEqual([4, 1]);
      expect(data.map(({ value }) => value)).toEqual(['20', '9']);
    });

    it('should return an empty array for a read with no rows, whatever the column index', () => {
      const filters = buildBigGrid().getPlugin('filters');

      // Nothing to read, so the column is never resolved – not even an index that names no column.
      expect(filters.getDataMapAtColumn(0, [])).toEqual([]);
      expect(filters.getDataMapAtColumn(-1, [])).toEqual([]);
      expect(filters.getDataMapAtColumn(null, [])).toEqual([]);
    });
  });
});
