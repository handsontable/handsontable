import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
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
