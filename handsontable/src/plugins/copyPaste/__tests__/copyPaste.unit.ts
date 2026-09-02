import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { _resetDeprecationWarnings } from '../../../helpers/console';
import { CopyPaste } from '../copyPaste';

registerCellType(TextCellType);
registerPlugin(CopyPaste);

describe('CopyPaste ragged clipboard', () => {
  /**
   * Builds a grid, selects the top-left cell, and pastes `text` as the plain-text flavor.
   *
   * @param {Array} data The initial data source.
   * @param {string} text The clipboard text to paste.
   * @returns {object} The Handsontable instance, already pasted into.
   */
  function pasteInto(data: unknown[][] | object[], text: string) {
    const hot = new Handsontable(document.createElement('div'), {
      data,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(0, 0);
    hot.getPlugin('copyPaste').paste(text);

    return hot;
  }

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

describe('CopyPaste past the last column of an object data source', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    // `deprecatedWarnOnce` records printed warnings module-globally, so without this the
    // assertions below would depend on the order the specs run in.
    _resetDeprecationWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  /**
   * Pastes `text` starting at the last column of a grid whose object data source declares two
   * columns through `dataSchema` while its rows carry a third, undeclared property.
   *
   * @param {string} text The clipboard text to paste.
   * @returns {object} The data source and the Handsontable instance built on it.
   */
  function pastePastLastColumn(text: string) {
    const data = [
      { id: 1, name: 'Ted Right', address: '' },
      { id: 2, name: 'Frank Honest', address: '' },
    ];
    const hot = new Handsontable(document.createElement('div'), {
      data,
      dataSchema: { id: null, name: null },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(0, 1);
    hot.getPlugin('copyPaste').paste(text);

    return { data, hot };
  }

  /**
   * Collects every deprecation warning printed so far that mentions the last-column write.
   *
   * @returns {Array} The matching `console.warn` messages.
   */
  function pastLastColumnWarnings() {
    return warnSpy.mock.calls
      .map(args => String(args[0]))
      .filter(message => message.includes('past the last column of an object data source'));
  }

  it('should warn once that the write is deprecated', () => {
    const { hot } = pastePastLastColumn('2\tFrank Honest');
    const warnings = pastLastColumnWarnings();

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Deprecated:');
    expect(warnings[0]).toContain('19.0.0');
    expect(warnings[0]).toContain('setDataAtRowProp()');

    hot.destroy();
  });

  it('should still perform the write while the behavior is only deprecated', () => {
    const { data, hot } = pastePastLastColumn('2\tFrank Honest');

    // Dropping the value is the 19.0.0 behavior. Until then the write stands, so the deprecation
    // is a warning rather than a silent behavior change.
    expect(data[0]).toEqual({ 2: 'Frank Honest', id: 1, name: '2', address: '' });

    hot.destroy();
  });

  it('should not repeat the warning on a second paste', () => {
    const first = pastePastLastColumn('2\tFrank Honest');

    first.hot.destroy();

    const second = pastePastLastColumn('3\tRoger Moore');

    expect(pastLastColumnWarnings()).toHaveLength(1);

    second.hot.destroy();
  });

  it('should not warn for an array data source, which can grow a column', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(0, 1);
    hot.getPlugin('copyPaste').paste('2\tFrank Honest');

    // The missing column is created here, so nothing is deprecated - the index names a real array
    // slot rather than a property the schema never declared.
    expect(pastLastColumnWarnings()).toHaveLength(0);
    expect(hot.countCols()).toBe(3);

    hot.destroy();
  });
});
