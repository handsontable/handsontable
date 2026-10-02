import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { CopyPaste } from '../copyPaste';
import type { PasteClipboardData } from '../../../core/settings';

registerCellType(TextCellType);
registerPlugin(CopyPaste);

const PRIVATE_FLAVOR = 'application/ht-source-data-json-html';
const table = (...rows: string[][]) => {
  const body = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');

  return `<table><tbody>${body}</tbody></table>`;
};

/**
 * Dispatches a native-shaped paste event into the plugin, the way the document listener would.
 *
 * @param {object} hot The Handsontable instance.
 * @param {object} flavors The flavors the clipboard carries.
 * @param {string[]} [types] What `clipboardData.types` reports. Defaults to the keys of `flavors`.
 * @returns {object} The event the plugin received.
 */
function nativePaste(hot: Handsontable, flavors: Record<string, string>, types = Object.keys(flavors)) {
  const event = {
    clipboardData: { types, getData: (type: string) => flavors[type] ?? '', setData() {} },
    target: document.body,
    defaultPrevented: false,
    preventDefault() {},
    composedPath: () => [],
  };

  (hot.getPlugin('copyPaste') as unknown as { onPaste(e: unknown): void }).onPaste(event);

  return event;
}

/**
 * Builds a listening grid with a selection.
 *
 * @param {object} [settings] Extra grid settings.
 * @returns {object} The Handsontable instance.
 */
function createGrid(settings: Record<string, unknown> = {}) {
  const hot = new Handsontable(document.createElement('div'), {
    data: [['A1', 'B1'], ['A2', 'B2']],
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  hot.selectCell(0, 0);
  hot.listen();

  return hot;
}

describe('CopyPaste beforePasteParse hook', () => {
  let hot: Handsontable;

  afterEach(() => {
    hot?.destroy();
  });

  it('should fire once per native paste with a snapshot and the native event', () => {
    const beforePasteParse = jest.fn();

    hot = createGrid({ beforePasteParse });

    const event = nativePaste(hot, { 'text/plain': 'x', 'text/html': table(['x']) });

    expect(beforePasteParse).toHaveBeenCalledTimes(1);

    const [clipboardData, receivedEvent] = beforePasteParse.mock.calls[0];

    expect(receivedEvent).toBe(event);
    expect(clipboardData.types).toEqual(['text/plain', 'text/html']);
    expect(clipboardData.getData('text/plain')).toBe('x');
  });

  it('should fire from paste() with the event set to null', () => {
    const beforePasteParse = jest.fn();

    hot = createGrid({ beforePasteParse });
    hot.getPlugin('copyPaste').paste('x');

    expect(beforePasteParse).toHaveBeenCalledTimes(1);
    expect(beforePasteParse.mock.calls[0][1]).toBeNull();
    expect(beforePasteParse.mock.calls[0][0].getData('text/plain')).toBe('x');
    expect(hot.getDataAtCell(0, 0)).toBe('x');
  });

  it('should write the edited text/plain once text/html is cleared', () => {
    hot = createGrid({
      beforePasteParse(clipboardData: PasteClipboardData) {
        clipboardData.setData('text/plain', clipboardData.getData('text/plain').replace(',', '.'));
        clipboardData.clearData('text/html');
      },
    });

    nativePaste(hot, { 'text/plain': '1,5', 'text/html': table(['1,5']) });

    expect(hot.getDataAtCell(0, 0)).toBe('1.5');
  });

  it('should ignore an edit of text/plain while the text/html table is left in place', () => {
    hot = createGrid({
      beforePasteParse(clipboardData: PasteClipboardData) {
        clipboardData.setData('text/plain', 'edited');
      },
    });

    nativePaste(hot, { 'text/plain': 'original', 'text/html': table(['original']) });

    expect(hot.getDataAtCell(0, 0)).toBe('original');
  });

  it('should write the edited text/html table', () => {
    hot = createGrid({
      beforePasteParse(clipboardData: PasteClipboardData) {
        clipboardData.setData('text/html', clipboardData.getData('text/html').replace('1,5', '1.5'));
      },
    });

    nativePaste(hot, { 'text/plain': '1,5', 'text/html': table(['1,5', '2']) });

    expect(hot.getDataAtCell(0, 0)).toBe('1.5');
    expect(hot.getDataAtCell(0, 1)).toBe('2');
  });

  it('should cancel the paste when a callback returns false', () => {
    const beforePaste = jest.fn();
    const afterPaste = jest.fn();

    hot = createGrid({ beforePasteParse: () => false, beforePaste, afterPaste });

    nativePaste(hot, { 'text/plain': 'x' });

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
    expect(beforePaste).not.toHaveBeenCalled();
    expect(afterPaste).not.toHaveBeenCalled();
  });

  it('should run the callbacks in order on one shared snapshot', () => {
    const seen: string[] = [];

    hot = createGrid();
    hot.addHook('beforePasteParse', (clipboardData: PasteClipboardData) => {
      clipboardData.setData('text/plain', `${clipboardData.getData('text/plain')}1`);
    });
    hot.addHook('beforePasteParse', (clipboardData: PasteClipboardData) => {
      seen.push(clipboardData.getData('text/plain'));
      clipboardData.setData('text/plain', `${clipboardData.getData('text/plain')}2`);
    });

    nativePaste(hot, { 'text/plain': 'x' });

    expect(seen).toEqual(['x1']);
    expect(hot.getDataAtCell(0, 0)).toBe('x12');
  });

  it('should paste the edited snapshot when the only callback returns a value other than false', () => {
    hot = createGrid({
      beforePasteParse(clipboardData: PasteClipboardData) {
        clipboardData.setData('text/plain', 'edited');

        return 'junk' as unknown as boolean;
      },
    });

    nativePaste(hot, { 'text/plain': 'original' });

    // `Hooks#run` threads the return value into the next callback, but the plugin reads its own
    // snapshot and only compares the result with `false`.
    expect(hot.getDataAtCell(0, 0)).toBe('edited');
  });

  it('should hand a later callback the value an earlier one returned, as Hooks#run does', () => {
    const second = jest.fn();

    hot = createGrid();
    hot.addHook('beforePasteParse', () => true);
    hot.addHook('beforePasteParse', second);

    nativePaste(hot, { 'text/plain': 'x' });

    expect(second.mock.calls[0][0]).toBe(true);
    expect(hot.getDataAtCell(0, 0)).toBe('x');
  });

  it('should cancel the paste and hand the next callback false when the first one cancels', () => {
    const second = jest.fn();
    const beforePaste = jest.fn();

    hot = createGrid({ beforePaste });
    hot.addHook('beforePasteParse', () => false);
    hot.addHook('beforePasteParse', second);

    nativePaste(hot, { 'text/plain': 'x' });

    expect(second.mock.calls[0][0]).toBe(false);
    expect(hot.getDataAtCell(0, 0)).toBe('A1');
    expect(beforePaste).not.toHaveBeenCalled();
  });

  it('should not fire for an event that carries no clipboardData', () => {
    const beforePasteParse = jest.fn();

    hot = createGrid({ beforePasteParse });

    (hot.getPlugin('copyPaste') as unknown as { onPaste(e: unknown): void }).onPaste({
      target: document.body,
      preventDefault() {},
      composedPath: () => [],
    });

    expect(beforePasteParse).not.toHaveBeenCalled();
    expect(hot.getDataAtCell(0, 0)).toBe('A1');
  });

  it('should blank the selection when a callback sets text/plain to an empty string', () => {
    hot = createGrid({
      beforePasteParse(clipboardData: PasteClipboardData) {
        clipboardData.setData('text/plain', '');
      },
    });

    nativePaste(hot, { 'text/plain': 'x' });

    expect(hot.getDataAtCell(0, 0)).toBe('');
  });

  it('should write nothing when a callback clears text/plain', () => {
    hot = createGrid({
      beforePasteParse(clipboardData: PasteClipboardData) {
        clipboardData.clearData('text/plain');
      },
    });

    nativePaste(hot, { 'text/plain': 'x' });

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
  });

  it('should keep the shared snapshot when a callback before returns nothing', () => {
    const second = jest.fn();

    hot = createGrid();
    hot.addHook('beforePasteParse', () => undefined);
    hot.addHook('beforePasteParse', second);

    nativePaste(hot, { 'text/plain': 'x' });

    expect(second.mock.calls[0][0].getData('text/plain')).toBe('x');
  });

  describe('DOM paste event', () => {
    /**
     * Dispatches a paste event on the document body, where the plugin listens for events that
     * target nothing inside the grid.
     */
    function dispatchPaste() {
      const event = new Event('paste', { bubbles: true, cancelable: true });

      Object.defineProperty(event, 'clipboardData', {
        value: { types: ['text/plain'], getData: (type: string) => (type === 'text/plain' ? 'x' : '') },
      });
      document.body.dispatchEvent(event);
    }

    it('should fire once for one event that the document and the grid element both see', () => {
      const beforePasteParse = jest.fn();

      hot = createGrid({ beforePasteParse });
      dispatchPaste();

      expect(beforePasteParse).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCell(0, 0)).toBe('x');
    });

    it('should not fire when the plugin is disabled', () => {
      const beforePasteParse = jest.fn();

      hot = createGrid({ copyPaste: false, beforePasteParse });
      dispatchPaste();

      expect(beforePasteParse).not.toHaveBeenCalled();
      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });
  });

  it('should not fire when the grid is not listening', () => {
    const beforePasteParse = jest.fn();

    hot = createGrid({ beforePasteParse });
    hot.unlisten();

    nativePaste(hot, { 'text/plain': 'x' });

    expect(beforePasteParse).not.toHaveBeenCalled();
    expect(hot.getDataAtCell(0, 0)).toBe('A1');
  });

  it('should not fire when nothing is selected', () => {
    const beforePasteParse = jest.fn();

    hot = createGrid({ beforePasteParse });
    hot.deselectCell();

    nativePaste(hot, { 'text/plain': 'x' });

    expect(beforePasteParse).not.toHaveBeenCalled();
  });

  it('should not fire when the paste targets an element outside the grid', () => {
    const beforePasteParse = jest.fn();
    const outside = document.createElement('input');

    document.body.appendChild(outside);
    hot = createGrid({ beforePasteParse });

    (hot.getPlugin('copyPaste') as unknown as { onPaste(e: unknown): void }).onPaste({
      clipboardData: { types: ['text/plain'], getData: () => 'x' },
      target: outside,
      preventDefault() {},
      composedPath: () => [outside],
    });
    outside.remove();

    expect(beforePasteParse).not.toHaveBeenCalled();
  });

  describe('flavor handling', () => {
    it('should keep the outcome of a real paste with no text: the selection is blanked', () => {
      const beforePasteParse = jest.fn();

      hot = createGrid({ beforePasteParse });
      hot.selectCells([[0, 0, 1, 1]]);

      nativePaste(hot, {}, []);

      // The hook is a way to change a paste, never a change to the paste that has no callback to
      // act on it: a real `DataTransfer` answers `''` for the missing `text/plain`.
      expect(hot.getData()).toEqual([['', ''], ['', '']]);
      expect(beforePasteParse).toHaveBeenCalledTimes(1);
    });

    it('should keep the outcome of paste() with no plain text: nothing is written', () => {
      hot = createGrid();
      hot.selectCells([[0, 0, 1, 1]]);

      hot.getPlugin('copyPaste').paste(undefined, '<p>no table</p>');

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    });

    it('should keep the outcome of a paste with no callbacks: the table wins over the plain text', () => {
      hot = createGrid();

      nativePaste(hot, { 'text/plain': 'plain', 'text/html': table(['from table']) });

      expect(hot.getDataAtCell(0, 0)).toBe('from table');
    });

    it('should make the paste a no-op when a callback clears every flavor', () => {
      hot = createGrid({
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.clearData();
        },
      });
      hot.selectCells([[0, 0, 1, 1]]);

      nativePaste(hot, { 'text/plain': 'x', 'text/html': table(['x']) });

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    });

    it('should let a callback put text into an empty clipboard', () => {
      hot = createGrid({
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.setData('text/plain', 'from files');
        },
      });

      nativePaste(hot, {}, ['Files']);

      expect(hot.getDataAtCell(0, 0)).toBe('from files');
    });

    it('should let a callback put text into an empty paste() clipboard', () => {
      hot = createGrid({
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.setData('text/plain', 'from the hook');
        },
      });

      hot.getPlugin('copyPaste').paste(undefined, '<p>no table</p>');

      expect(hot.getDataAtCell(0, 0)).toBe('from the hook');
    });
  });

  describe('private flavor', () => {
    const source = '<table data-ht><tbody><tr><td>{&quot;id&quot;:7}</td></tr></tbody></table>';

    it('should drop the private flavor when a callback edits text/plain and leaves it untouched', () => {
      hot = createGrid({
        columns: [{ type: 'text', parsePastedValue: true }, {}],
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.setData('text/plain', 'cleaned');
          clipboardData.clearData('text/html');
        },
      });

      nativePaste(hot, {
        'text/plain': 'raw',
        'text/html': table(['raw']),
        [PRIVATE_FLAVOR]: source,
      });

      expect(hot.getDataAtCell(0, 0)).toBe('cleaned');
    });

    it('should drop the private flavor when a callback changes only text/html', () => {
      hot = createGrid({
        columns: [{ type: 'text', parsePastedValue: true }, {}],
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.setData('text/html', table(['cleaned']));
        },
      });

      nativePaste(hot, {
        'text/plain': 'raw',
        'text/html': table(['raw']),
        [PRIVATE_FLAVOR]: source,
      });

      expect(hot.getDataAtCell(0, 0)).toBe('cleaned');
    });

    it('should restore the private flavor when no callback changes anything', () => {
      hot = createGrid({
        columns: [{ type: 'text', parsePastedValue: true }, {}],
        beforePasteParse() {},
      });

      nativePaste(hot, {
        'text/plain': 'raw',
        'text/html': table(['raw']),
        [PRIVATE_FLAVOR]: source,
      });

      expect(hot.getDataAtCell(0, 0)).toEqual({ id: 7 });
    });

    it('should keep the private flavor when a callback edits it', () => {
      hot = createGrid({
        columns: [{ type: 'text', parsePastedValue: true }, {}],
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.setData(PRIVATE_FLAVOR, clipboardData.getData(PRIVATE_FLAVOR).replace('7', '8'));
          clipboardData.setData('text/plain', 'cleaned');
          clipboardData.clearData('text/html');
        },
      });

      nativePaste(hot, {
        'text/plain': 'raw',
        'text/html': table(['raw']),
        [PRIVATE_FLAVOR]: source,
      });

      // The edited private flavor survives and is what the cell takes, the way the unedited one
      // does for an internal copy and paste with `parsePastedValue`.
      expect(hot.getDataAtCell(0, 0)).toEqual({ id: 8 });
    });
  });

  describe('sanitizing', () => {
    it('should run the sanitizer over the text/html that a callback edited', () => {
      const sanitizer = jest.fn((content: string) => (content.includes('dirty') ? table(['sanitized']) : content));

      hot = createGrid({
        sanitizer,
        beforePasteParse(clipboardData: PasteClipboardData) {
          clipboardData.setData('text/html', table(['dirty']));
        },
      });

      nativePaste(hot, { 'text/plain': 'x', 'text/html': table(['x']) });

      expect(sanitizer).toHaveBeenCalledWith(table(['dirty']), 'CopyPaste.paste');
      expect(hot.getDataAtCell(0, 0)).toBe('sanitized');
    });
  });
});
