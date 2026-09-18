import Handsontable from 'handsontable/base';
import { registerPlugin, Filters } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { registerCondition } from 'handsontable/plugins/filters/conditionRegisterer';
import { ColumnDataMap } from 'handsontable/plugins/filters/columnDataMap';

registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

/**
 * A condition registered through `registerCondition()` is user code. It may keep the `dataRow` it
 * was handed, or that row's `meta`, past its own synchronous call - nothing in the API says it may
 * not, and a condition that does would silently read another row if the scan reused one object.
 *
 * These cases pin the guarantee the scan owes such a condition: one `{row, meta, value}` object per
 * row, with that row's own cell meta.
 */
describe('Filters -> the dataRow a condition receives', () => {
  const ROWS_COUNT = 500;
  const CONDITION_NAME = 'retaining_condition_test';

  let container;
  let hot;
  let retained;

  beforeAll(() => {
    registerCondition(CONDITION_NAME, (dataRow) => {
      retained.push({
        dataRow,
        // Read at call time, so the two can be compared after the scan has moved on.
        valueAtCallTime: dataRow.value,
        classNameAtCallTime: dataRow.meta.className,
      });

      return true;
    }, { name: 'Retaining condition (test)', inputsCount: 0 });
  });

  beforeEach(() => {
    retained = [];
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid whose rows sit far below anything a 100px viewport paints, so most of them carry
   * no stored cell meta and the scan has to resolve one for them.
   *
   * @returns {object} The Handsontable instance.
   */
  function buildGrid() {
    hot = new Handsontable(container, {
      data: Array.from({ length: ROWS_COUNT }, (_, row) => [`A${row + 1}`, `B${row + 1}`]),
      filters: true,
      width: 200,
      height: 100,
      colWidths: 50,
      rowHeights: 23,
      autoColumnSize: false,
      autoRowSize: false,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  it('should hand every row its own object, holding that row\'s own value and meta', () => {
    const filters = buildGrid().getPlugin('filters');

    hot.setCellMeta(300, 0, 'className', 'marked-300');
    hot.setCellMeta(301, 0, 'className', 'marked-301');

    // The guard this whole optimization rests on: most rows of the scan store no meta, so the scan
    // must create one for them - and that is where a shared object would be handed out.
    expect(hot.getCellsMeta().length).toBeLessThan(ROWS_COUNT);

    filters.addCondition(0, CONDITION_NAME, []);
    filters.filter();

    expect(retained.length).toBe(ROWS_COUNT);

    // One object per row. A reused cursor collapses this to 1.
    expect(new Set(retained.map(({ dataRow }) => dataRow)).size).toBe(ROWS_COUNT);
    // One cell meta per row. A shared re-stamped meta collapses this to the stored-meta count + 1.
    expect(new Set(retained.map(({ dataRow }) => dataRow.meta)).size).toBe(ROWS_COUNT);

    expect(retained[0].dataRow).toEqual(jasmine.objectContaining({ row: 0, value: 'A1' }));
    expect(Object.keys(retained[0].dataRow)).toEqual(['row', 'meta', 'value']);

    // Read at call time, every row described itself.
    expect(retained[0].valueAtCallTime).toBe('A1');
    expect(retained[299].valueAtCallTime).toBe('A300');
    expect(retained[300].classNameAtCallTime).toBe('marked-300');
    expect(retained[301].classNameAtCallTime).toBe('marked-301');
    expect(retained[302].classNameAtCallTime).toBeUndefined();

    // Read AFTER the scan finished, every retained object still describes its own row. This is the
    // part a reused cursor breaks: all 500 references would report row 499.
    expect(retained[0].dataRow.value).toBe('A1');
    expect(retained[0].dataRow.row).toBe(0);
    expect(retained[299].dataRow.value).toBe('A300');
    expect(retained[299].dataRow.row).toBe(299);
    expect(retained[300].dataRow.meta.className).toBe('marked-300');
    expect(retained[301].dataRow.meta.className).toBe('marked-301');
    expect(retained[302].dataRow.meta.className).toBeUndefined();
  });

  it('should not materialize the column read while the scan runs', () => {
    // The columnar read exists so that the scan resolves the value of every row and the cell meta
    // of almost none. `toArray()` resolves one meta per row, so a single call from inside the scan
    // puts back the whole cost the shape removes - and it does so invisibly, because the filter
    // result stays correct either way.
    const filters = buildGrid().getPlugin('filters');

    // Two filtered columns, so the second read also goes through the `physicalRows` subset branch.
    filters.addCondition(0, 'contains', ['A1']);
    filters.addCondition(1, 'contains', ['B15']);

    const toArraySpy = jest.spyOn(ColumnDataMap.prototype, 'toArray');
    let toArrayCalls = -1;

    try {
      filters.filter();
      // Read the count BEFORE restoring - `mockRestore()` clears the call history, which would make
      // an assertion placed after it pass whatever the scan did.
      toArrayCalls = toArraySpy.mock.calls.length;
    } finally {
      toArraySpy.mockRestore();
    }

    expect(toArrayCalls).toBe(0);

    // A zero-call count over a filter that never ran would assert nothing, so pin the result too.
    // `A1` leaves the 111 rows whose number starts with `1`; `B15` narrows those to `15` and
    // `150`-`159`.
    expect(hot.countRows()).toBe(11);
    expect(hot.getDataAtCol(0)[0]).toBe('A15');
    expect(hot.getDataAtCol(0)[10]).toBe('A159');
  });

  it('should keep the conditions working on the rows they were handed', () => {
    // The distinctness above would also hold for a scan that handed out the wrong rows, so pin the
    // filter result too.
    const filters = buildGrid().getPlugin('filters');

    filters.addCondition(0, 'eq', ['A300']);
    filters.filter();

    expect(hot.getDataAtCol(0)).toEqual(['A300']);
  });
});
