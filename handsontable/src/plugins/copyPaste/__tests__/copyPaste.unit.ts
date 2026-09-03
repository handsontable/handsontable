import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { CopyPaste } from '../copyPaste';

registerCellType(TextCellType);
registerPlugin(CopyPaste);

/**
 * Builds a grid, selects a cell, and pastes `text` as the plain-text flavor.
 *
 * @param {Array} data The initial data source.
 * @param {string} text The clipboard text to paste.
 * @param {object} [settings] Extra grid settings, plus `at` to choose the cell to paste into.
 * @returns {object} The Handsontable instance, already pasted into.
 */
function pasteInto(
  data: unknown[][] | object[],
  text: string,
  { at = [0, 0], ...settings }: Record<string, unknown> & { at?: number[] } = {}
) {
  const hot = new Handsontable(document.createElement('div'), {
    data,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  hot.selectCell(at[0], at[1]);
  hot.getPlugin('copyPaste').paste(text);

  return hot;
}

describe('CopyPaste ragged clipboard', () => {
  it('should pad a short row with the empty-cell value rather than undefined', () => {
    const hot = pasteInto([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']], 'x\ny\tz\tw');

    // `undefined` here would delete the property outright in an object data source.
    expect(hot.getDataAtCell(0, 1)).toBeNull();
    expect(hot.getDataAtCell(0, 2)).toBeNull();

    hot.destroy();
  });

  it('should keep every field of an object data source serializable when it pads a short row', () => {
    const hot = pasteInto(
      [{ a: 'A1', b: 'B1', c: 'C1' }, { a: 'A2', b: 'B2', c: 'C2' }],
      'x\ny\tz\tw'
    );

    // `Object.keys` still lists a key whose value is `undefined` - only serializing drops it,
    // which is how the padded fields would silently vanish from a saved data source.
    expect(JSON.stringify(hot.getSourceData()[0])).toBe('{"a":"x","b":null,"c":null}');

    hot.destroy();
  });

  it('should pad a short row that is not the first one', () => {
    const hot = pasteInto(
      [{ a: 'A1', b: 'B1', c: 'C1' }, { a: 'A2', b: 'B2', c: 'C2' }],
      'x\ty\tz\nw'
    );

    // A trailing short row covers those cells too, so its fields must survive serializing.
    expect(JSON.stringify(hot.getSourceData()[1])).toBe('{"a":"w","b":null,"c":null}');

    hot.destroy();
  });

  it('should hand the beforePaste hook the same shape the grid is given', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
      licenseKey: 'non-commercial-and-evaluation',
    });
    let seen: unknown[][] = [];

    hot.addHook('beforePaste', (data: unknown[][]) => {
      seen = JSON.parse(JSON.stringify(data));
    });

    hot.selectCell(0, 0);
    hot.getPlugin('copyPaste').paste('x\ny\tz\tw');

    // A ragged array here would describe a different paste than the one the grid performed.
    expect(seen).toEqual([['x', null, null], ['y', 'z', 'w']]);

    hot.destroy();
  });

  it('should hand the hook the same width the grid writes when a cell spans past the table', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H']],
      licenseKey: 'non-commercial-and-evaluation',
    });
    let seen: number[] = [];

    hot.addHook('beforePaste', (data: unknown[][]) => {
      seen = data.map((row: unknown[]) => row.length);
    });

    hot.selectCell(0, 0);
    hot.getPlugin('copyPaste').paste('', '<table><tbody><tr><td>A1</td><td>B1</td><td>C1</td></tr>' +
      '<tr><td colspan="20">footer</td></tr></tbody></table>');

    // The footer spans far past the table. Reporting 20 columns while writing 3 would send an
    // integrator syncing from the hook seventeen columns the grid never touched.
    expect(seen).toEqual([3, 3]);
    expect(hot.getDataAtRow(1)).toEqual(['footer', null, null, 'H']);

    hot.destroy();
  });

  it('should repeat a ragged clipboard across a wider selection on the widest row', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1', 'C1', 'D1', 'E1', 'F1'], ['A2', 'B2', 'C2', 'D2', 'E2', 'F2']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(0, 0, 1, 5);
    hot.getPlugin('copyPaste').paste('x\ny\tz\tw');

    // The clipboard is three wide, so it tiles every three columns - not once per column.
    expect(hot.getDataAtRow(0)).toEqual(['x', null, null, 'x', null, null]);
    expect(hot.getDataAtRow(1)).toEqual(['y', 'z', 'w', 'y', 'z', 'w']);

    hot.destroy();
  });
});

describe('CopyPaste past the last column', () => {
  /**
   * Two rows whose object shape declares `id` and `name` while carrying a third, undeclared
   * property.
   *
   * @returns {Array} A fresh data source.
   */
  const schemaBoundRows = () => [
    { id: 1, name: 'Ted Right', address: '' },
    { id: 2, name: 'Frank Honest', address: '' },
  ];

  it('should not mint a property the data schema never declared', () => {
    const data = schemaBoundRows();
    const hot = pasteInto(data, '2\tFrank Honest', {
      dataSchema: { id: null, name: null },
      at: [0, 1],
    });

    // The paste starts on the last column, so its second value has nowhere to land. Writing it
    // put `"Frank Honest"` on a literal `2` key beside the declared ones, which is how a paste
    // used to break the schema it was given (#5409).
    expect(Object.keys(data[0])).toEqual(['id', 'name', 'address']);
    expect(hot.getDataAtRow(0)).toEqual([1, '2']);

    hot.destroy();
  });

  it('should not mint a property when `dataSchema` is a function', () => {
    const data = schemaBoundRows();
    const hot = pasteInto(data, '2\tFrank Honest', {
      dataSchema: () => ({ id: null, name: null }),
      at: [0, 1],
    });

    // A function `dataSchema` sets `dataType` to 'function', not 'object'. It is just as unable to
    // gain a column, so a predicate naming only 'object' would leave this case writing the key.
    expect(hot.dataType).toBe('function');
    expect(Object.keys(data[0])).toEqual(['id', 'name', 'address']);

    hot.destroy();
  });

  it('should report the dropped value to neither beforeChange nor afterChange', () => {
    const data = schemaBoundRows();
    const hot = new Handsontable(document.createElement('div'), {
      data,
      dataSchema: { id: null, name: null },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const seen: Record<string, unknown[][]> = { before: [], after: [] };

    hot.addHook('beforeChange', (cellChanges: unknown[][] | null) => {
      if (cellChanges) {
        seen.before.push(...JSON.parse(JSON.stringify(cellChanges)));
      }
    });
    hot.addHook('afterChange', (cellChanges: unknown[][] | null) => {
      if (cellChanges) {
        seen.after.push(...JSON.parse(JSON.stringify(cellChanges)));
      }
    });

    hot.selectCell(0, 1);
    hot.getPlugin('copyPaste').paste('2\tFrank Honest');

    // A change entry for a value the grid did not write would send an integrator syncing from
    // either hook a property its own schema does not have - and it carried the column index as
    // the property name, which is what the issue's `beforeChange` workaround had to filter out.
    expect(seen.before).toEqual([[0, 'name', 'Ted Right', '2']]);
    expect(seen.after).toEqual([[0, 'name', 'Ted Right', '2']]);
    expect(data[0].name).toBe('2');

    hot.destroy();
  });

  it('should still grow an array data source that has room to gain a column', () => {
    const hot = pasteInto([['A1', 'B1'], ['A2', 'B2']], '2\tFrank Honest', { at: [0, 1] });

    // An array data source with no `columns` setting is the one case where the missing column can
    // be created, so the overflow value must keep landing there.
    expect(hot.countCols()).toBe(3);
    expect(hot.getDataAtRow(0)).toEqual(['A1', '2', 'Frank Honest']);

    hot.destroy();
  });

  it('should keep writing into an array data source that `columns` has narrowed', () => {
    const data: unknown[][] = [['A1', 'B1'], ['A2', 'B2']];
    const hot = pasteInto(data, 'x\ty', { columns: [{}], at: [0, 0] });

    // Only object-rowed data is capped. Here the index names a real array slot rather than a
    // positional key on a named record, `colToProp()` hands it back unchanged by design (#5945),
    // and the value reads back - so widening this to `isColumnModificationAllowed()` would break
    // array grids, and does break `formulas.spec.js`'s renamed-sheet spec.
    expect(hot.countCols()).toBe(1);
    expect(data[0][1]).toBe('y');
    expect(hot.getDataAtCell(0, 1)).toBe('y');

    hot.destroy();
  });

  it('should keep writing into a grid that declares no columns at all', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [],
      licenseKey: 'non-commercial-and-evaluation',
    });

    // An empty `data: []` is duck-typed to 'object' because there is no `data[0]` to inspect, and
    // `countCols()` is 0 - so every index is "past the last column". Writing to such a grid is how
    // an empty dataset gets bootstrapped, and it is deliberately left alone.
    hot.setDataAtCell(0, 0, 'WRITE');

    expect(hot.dataType).toBe('object');
    expect(hot.getDataAtCell(0, 0)).toBe('WRITE');

    hot.destroy();
  });
});
