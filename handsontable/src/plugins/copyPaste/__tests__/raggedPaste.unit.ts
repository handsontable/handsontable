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

  it('should write every column of a ragged clipboard whose first row is the narrowest', () => {
    const hot = pasteInto([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']], 'x\ny\tz\tw');

    expect(hot.getDataAtCell(1, 1)).toBe('z');
    expect(hot.getDataAtCell(1, 2)).toBe('w');

    hot.destroy();
  });

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
});
