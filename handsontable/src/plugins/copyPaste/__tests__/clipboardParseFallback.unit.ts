import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { CopyPaste } from '../copyPaste';
import PasteEvent from '../pasteEvent';

registerCellType(TextCellType);
registerPlugin(CopyPaste);

describe('CopyPaste clipboard parse fallback', () => {
  let warnSpy: jest.SpyInstance;
  let parseFromString: typeof DOMParser.prototype.parseFromString;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    parseFromString = DOMParser.prototype.parseFromString;
  });

  afterEach(() => {
    DOMParser.prototype.parseFromString = parseFromString;
    warnSpy.mockRestore();
  });

  /**
   * Makes every HTML parse throw, the way a Trusted Types sink rejects a plain string under
   * `require-trusted-types-for 'script'` when the value came from no policy.
   */
  function refuseEveryParse() {
    DOMParser.prototype.parseFromString = () => {
      throw new TypeError(
        'Failed to execute \'parseFromString\' on \'DOMParser\': ' +
        'This document requires \'TrustedHTML\' assignment.'
      );
    };
  }

  /**
   * Builds a grid and pastes both clipboard flavours into the top-left cell.
   *
   * @param {string} textPlain The `text/plain` payload.
   * @param {string} textHTML The `text/html` payload.
   * @returns {object} The Handsontable instance, already pasted into.
   */
  function pasteInto(textPlain: string, textHTML: string) {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(0, 0);
    refuseEveryParse();
    hot.getPlugin('copyPaste').paste(textPlain, textHTML);

    return hot;
  }

  it('should paste the plain-text flavour when the HTML parse is refused', () => {
    const hot = pasteInto('x\ty', '<table><tbody><tr><td>x</td><td>y</td></tr></tbody></table>');

    // Before the fallback the throw escaped `onPaste`, so nothing landed at all - which is the
    // failure mode a page enforcing Trusted Types with no policy of its own hits on every paste.
    expect(hot.getDataAtRow(0)).toEqual(['x', 'y']);

    hot.destroy();
  });

  /**
   * Counts the warnings that named Trusted Types.
   *
   * Filtered rather than counted outright, because the missing-sanitizer warning fires on the same
   * paste and is keyed separately on purpose - the case that needs this message most is a sanitizer
   * that is configured and returns a plain string, where the other warning does not fire at all.
   *
   * @returns {number} How many of the warnings were this one.
   */
  function countParseWarnings() {
    return warnSpy.mock.calls
      .filter(call => String(call[0]).includes('require-trusted-types-for'))
      .length;
  }

  it('should leave the target cell alone when there is no plain-text flavour to fall back to', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: 'non-commercial-and-evaluation',
    });
    const event = new PasteEvent();

    event.clipboardData.setData('text/html', '<table><tbody><tr><td>x</td></tr></tbody></table>');

    hot.selectCell(0, 0);
    refuseEveryParse();
    hot.getPlugin('copyPaste').onPaste(event);

    // `SheetClip.parse('')` is `[['']]`, whose length is 1, so the guard in `onPaste` would let it
    // through and clear the cell. Doing nothing is the better outcome for a payload that was valid
    // markup the parser refused.
    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1']);

    hot.destroy();
  });

  it('should still sanitize a table-less payload, and still fall back to plain text', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: 'non-commercial-and-evaluation',
      sanitizer: jest.fn(content => content) as never,
    });
    const sanitizer = hot.getSettings().sanitizer as unknown as jest.Mock;

    hot.selectCell(0, 0);
    hot.getPlugin('copyPaste').paste('x\ty', '<div><td>orphan</td></div>');

    // Skipping the normalize for a table-less payload must not skip the sanitizer with it: an
    // auditing or length-capping sanitizer has always seen every clipboard payload, markup or not.
    expect(sanitizer).toHaveBeenCalledWith('<div><td>orphan</td></div>', 'CopyPaste.paste');
    expect(hot.getDataAtRow(0)).toEqual(['x', 'y']);

    hot.destroy();
  });

  it('should let a sanitizer that strips the table fall back to plain text', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: 'non-commercial-and-evaluation',
      sanitizer: (content: string) => content.replace(/<\/?table[^>]*>/gi, ''),
    });

    hot.selectCell(0, 0);
    hot.getPlugin('copyPaste').paste(
      'x\ty', '<table><tbody><tr><td>P1</td><td>P2</td></tr></tbody></table>'
    );

    // The branch reads the SANITIZED value, so the table is gone by the time it is tested. Moving
    // the test above the sanitize pair would send this payload to the parser, find no table, and
    // paste nothing at all.
    expect(hot.getDataAtRow(0)).toEqual(['x', 'y']);

    hot.destroy();
  });

  it('should warn once, naming Trusted Types as the reason', () => {
    const hot = pasteInto('x\ty', '<table><tbody><tr><td>x</td><td>y</td></tr></tbody></table>');

    expect(countParseWarnings()).toBe(1);

    hot.selectCell(1, 0);
    hot.getPlugin('copyPaste').paste('z\tw', '<table><tbody><tr><td>z</td></tr></tbody></table>');

    // keyed per instance, so a page that pastes repeatedly gets one message, not one per paste
    expect(countParseWarnings()).toBe(1);
    expect(hot.getDataAtRow(1)).toEqual(['z', 'w']);

    hot.destroy();
  });

  it('should still paste when only the source-data flavour is refused', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: 'non-commercial-and-evaluation',
    });
    const event = new PasteEvent();
    let calls = 0;

    // `paste()` sets no source-data flavour, so the event is built by hand to reach that branch.
    event.clipboardData.setData(
      'application/ht-source-data-json-html',
      '<table><tbody><tr><td>x</td><td>y</td></tr></tbody></table>'
    );
    event.clipboardData.setData('text/plain', 'ignored\tvalues');
    event.clipboardData.setData('text/html', '<table><tbody><tr><td>x</td><td>y</td></tr></tbody></table>');

    hot.selectCell(0, 0);

    // the source-data parse runs first; only it throws, so the `text/html` parse must still run,
    // which is why each parse gets its own `try` rather than one wrapping both
    DOMParser.prototype.parseFromString = function refuseFirst(this: DOMParser, ...args) {
      calls += 1;

      if (calls === 1) {
        throw new TypeError('This document requires \'TrustedHTML\' assignment.');
      }

      return parseFromString.apply(this, args);
    } as typeof DOMParser.prototype.parseFromString;

    hot.getPlugin('copyPaste').onPaste(event);

    expect(calls).toBe(2);
    // from the HTML flavour, not from the plain-text fallback, whose values differ on purpose
    expect(hot.getDataAtRow(0)).toEqual(['x', 'y']);

    hot.destroy();
  });
});
