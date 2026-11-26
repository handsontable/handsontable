import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';
import { instanceToTableElement } from '../../../utils/parseTable';

registerAllModules();

/**
 * Builds a 3x4 grid with the plugin on for both header axes.
 */
function createGrid(settings: Record<string, unknown> = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: [['a', 'b', 'c', 'd'], ['e', 'f', 'g', 'h'], ['i', 'j', 'k', 'l']],
    colHeaders: ['A1', 'B1', 'C1', 'D1'],
    rowHeaders: true,
    editableHeaders: { columnHeaders: true, rowHeaders: true },
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });

  return {
    hot,
    plugin: hot.getPlugin('editableHeaders'),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('EditableHeaders', () => {
  it('should be off by default', () => {
    const { plugin, destroy } = createGrid({ editableHeaders: undefined });

    expect(plugin.enabled).toBe(false);
    destroy();
  });

  it('should return the renamed column header from getColHeader() without changing colHeaders', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 1, 'Price');

    expect(hot.getColHeader(1)).toBe('Price');
    expect(hot.getColHeader()).toEqual(['A1', 'Price', 'C1', 'D1']);
    expect(hot.getSettings().colHeaders).toEqual(['A1', 'B1', 'C1', 'D1']);
    expect(plugin.getHeader('column', 1)).toBe('Price');
    expect(plugin.getHeader('column', 0)).toBeUndefined();
    destroy();
  });

  it('should return the renamed row header from getRowHeader()', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('row', 2, 'Total');

    expect(hot.getRowHeader(2)).toBe('Total');
    expect(hot.getRowHeader(1)).toBe(2);
    destroy();
  });

  it('should keep a renamed column header on its column after a column move and an insert', () => {
    const { hot, plugin, destroy } = createGrid({ manualColumnMove: true, colHeaders: true });

    plugin.setHeader('column', 0, 'First');
    hot.getPlugin('manualColumnMove').moveColumn(0, 2);
    hot.render();

    expect(hot.getColHeader(2)).toBe('First');

    hot.alter('insert_col_start', 0, 1);

    expect(hot.getColHeader(3)).toBe('First');
    expect(hot.getColHeader(0)).toBe('A');
    destroy();
  });

  it('should drop a renamed header with its removed column', () => {
    const { hot, plugin, destroy } = createGrid({ colHeaders: true });

    plugin.setHeader('column', 1, 'Gone');
    hot.alter('remove_col', 1, 1);

    expect(hot.getColHeader()).not.toContain('Gone');
    destroy();
  });

  it('should leave a column with `editableHeaders: false` in its column settings unchanged', () => {
    const { hot, plugin, destroy } = createGrid({
      editableHeaders: true,
      columns: [{}, { editableHeaders: false }, {}, {}],
    });

    expect(plugin.isEditable('column', 0)).toBe(true);
    expect(plugin.isEditable('column', 1)).toBe(false);
    expect(plugin.setHeader('column', 1, 'Nope')).toBe(false);
    expect(hot.getColHeader(1)).toBe('B1');
    destroy();
  });

  it('should edit only column headers for `editableHeaders: true`', () => {
    const { plugin, destroy } = createGrid({ editableHeaders: true });

    expect(plugin.isEditable('column', 0)).toBe(true);
    expect(plugin.isEditable('row', 0)).toBe(false);
    destroy();
  });

  it('should fire beforeHeaderChange and afterHeaderChange, and let the first veto the change', () => {
    const before = jest.fn();
    const after = jest.fn();
    const { hot, plugin, destroy } = createGrid({
      beforeHeaderChange: before,
      afterHeaderChange: after,
    });

    plugin.setHeader('column', 0, 'Name');

    expect(before).toHaveBeenCalledWith('column', 0, 'Name', 'A1');
    expect(after).toHaveBeenCalledWith('column', 0, 'Name', 'A1');

    before.mockReturnValue(false);
    after.mockClear();

    expect(plugin.setHeader('column', 0, 'Vetoed')).toBe(false);
    expect(hot.getColHeader(0)).toBe('Name');
    expect(after).not.toHaveBeenCalled();
    destroy();
  });

  it('should fire afterHeaderChange for every header an undo, a redo or clearHeaders() changes', () => {
    const afterHeaderChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ undo: true, afterHeaderChange });
    const undoRedo = hot.getPlugin('undoRedo');

    plugin.setHeader('column', 1, 'Price');
    afterHeaderChange.mockClear();

    undoRedo.undo();

    expect(afterHeaderChange.mock.calls).toEqual([['column', 1, 'B1', 'Price']]);

    afterHeaderChange.mockClear();
    undoRedo.redo();

    expect(afterHeaderChange.mock.calls).toEqual([['column', 1, 'Price', 'B1']]);

    plugin.setHeader('row', 2, 'Total');
    afterHeaderChange.mockClear();
    plugin.clearHeaders();

    expect(afterHeaderChange.mock.calls).toEqual([
      ['column', 1, 'B1', 'Price'],
      ['row', 2, '3', 'Total'],
    ]);
    destroy();
  });

  it('should undo and redo a rename as one step', () => {
    const { hot, plugin, destroy } = createGrid({ undo: true });

    plugin.setHeader('column', 0, 'Name');
    plugin.setHeader('column', 0, 'Item');
    hot.getPlugin('undoRedo').undo();

    expect(hot.getColHeader(0)).toBe('Name');

    hot.getPlugin('undoRedo').undo();

    expect(hot.getColHeader(0)).toBe('A1');

    hot.getPlugin('undoRedo').redo();

    expect(hot.getColHeader(0)).toBe('Name');
    destroy();
  });

  it('should undo clearHeaders() as one step', () => {
    const { hot, plugin, destroy } = createGrid({ undo: true });

    plugin.setHeader('column', 0, 'Name');
    plugin.setHeader('row', 1, 'Middle');
    plugin.clearHeaders();
    hot.getPlugin('undoRedo').undo();

    expect(hot.getColHeader(0)).toBe('Name');
    expect(hot.getRowHeader(1)).toBe('Middle');
    destroy();
  });

  it('should not run beforeHeaderChange for an undo, a redo or clearHeaders()', () => {
    const beforeHeaderChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ undo: true, beforeHeaderChange });

    plugin.setHeader('column', 0, 'Name');
    beforeHeaderChange.mockClear();
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();
    plugin.clearHeaders();

    expect(beforeHeaderChange).not.toHaveBeenCalled();
    destroy();
  });

  it('should report no rename from another record for an undo that brings a removed row back', () => {
    const afterHeaderChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({
      undo: true,
      afterHeaderChange,
      data: [['a'], ['b'], ['c'], ['d']],
      colHeaders: true,
    });

    plugin.setHeader('row', 1, 'N1');
    plugin.setHeader('row', 3, 'N3');
    hot.alter('remove_row', 1, 1);
    afterHeaderChange.mockClear();
    hot.getPlugin('undoRedo').undo();

    expect(hot.getRowHeader()).toEqual([1, 'N1', 3, 'N3']);
    // The rows were renumbered: comparing the renames by physical index would pair one record's name with another's.
    expect(afterHeaderChange).not.toHaveBeenCalled();
    destroy();
  });

  it('should keep a rename on its physical row through updateData() and drop it on loadData()', () => {
    const { hot, plugin, destroy } = createGrid({ data: [['a'], ['b'], ['c']], colHeaders: true });

    plugin.setHeader('row', 1, 'N1');
    hot.updateData([['w'], ['x'], ['y'], ['z']]);

    expect(hot.getRowHeader()).toEqual([1, 'N1', 3, 4]);

    hot.loadData([['w'], ['x'], ['y'], ['z']]);

    expect(hot.getRowHeader()).toEqual([1, 2, 3, 4]);
    destroy();
  });

  it('should keep a half-typed name in the input when the window loses the focus', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.openEditor('column', 1);

    const input = hot.rootElement.querySelector('.htEditableHeaderInput') as HTMLInputElement;

    input.value = 'Pri';
    // Switching to another window fires `blur` on the input, which stays the document's active element.
    input.dispatchEvent(new FocusEvent('blur'));

    expect(document.activeElement).toBe(input);
    expect(plugin.isEditorOpened()).toBe(true);
    expect(hot.getColHeader(1)).toBe('B1');
    destroy();
  });

  it('should copy renamed column and row headers as text in the HTML table', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 1, '<b>Cost</b>');
    plugin.setHeader('row', 0, 'a & b');

    const table = instanceToTableElement(hot, document);
    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent);

    expect(table.querySelector('b')).toBeNull();
    expect(headers).toContain('<b>Cost</b>');
    expect(headers).toContain('a & b');
    destroy();
  });

  it('should export and copy a renamed header as typed with `textExtractor: true`', () => {
    const { hot, plugin, destroy } = createGrid({
      textExtractor: true,
      colHeaders: ['<b>Name</b>', 'B1', 'C1', 'D1'],
      rowHeaders: ['<i>One</i>', 'Two', 'Three'],
    });

    plugin.setHeader('column', 1, 'a<b>c');
    plugin.setHeader('row', 1, 'R&amp;D');

    const csv = hot.getPlugin('exportFile').exportAsString('csv', { colHeaders: true, rowHeaders: true });
    const [headerLine, , secondLine] = csv.split('\r\n');

    // A configured header is still projected into text; a rename is the text the user typed.
    expect(headerLine).toContain('"Name","a<b>c"');
    expect(secondLine).toBe('R&amp;D,e,f,g,h');

    const copyPaste = hot.getPlugin('copyPaste');
    const clipboard: Record<string, string> = {};

    hot.selectCell(0, 0, 0, 1);
    // jsdom has no `execCommand`: `copy()` only sets the mode here, and the event is dispatched by hand below.
    (document as unknown as { execCommand: () => boolean }).execCommand = () => true;
    copyPaste.copy('with-column-headers');
    delete (document as unknown as { execCommand?: unknown }).execCommand;
    copyPaste.onCopy({
      clipboardData: {
        types: [],
        getData: () => '',
        setData: (type: string, value: string) => {
          clipboard[type] = value;
        },
      },
      target: hot.rootElement,
      preventDefault() {},
      composedPath: () => [],
    } as unknown as ClipboardEvent);

    expect(clipboard['text/plain'].split('\n')[0]).toBe('Name\ta<b>c');
    destroy();
  });

  it('should change nothing for a setHeader() with the name the header already shows', () => {
    const beforeHeaderChange = jest.fn();
    const afterHeaderChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ undo: true, beforeHeaderChange, afterHeaderChange });

    expect(plugin.setHeader('column', 1, 'B1')).toBe(true);
    expect(beforeHeaderChange).not.toHaveBeenCalled();
    expect(afterHeaderChange).not.toHaveBeenCalled();
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    destroy();
  });

  it('should store a typed name equal to a configured HTML label as text', () => {
    const { hot, plugin, destroy } = createGrid({ colHeaders: ['<b>Name</b>', 'B1', 'C1', 'D1'] });

    expect(plugin.setHeader('column', 0, '<b>Name</b>')).toBe(true);
    expect(plugin.getHeader('column', 0)).toBe('<b>Name</b>');
    expect(hot.getCell(-1, 0)?.querySelector('b')).toBeNull();
    expect(hot.getCell(-1, 0)?.querySelector('.colHeader')?.textContent).toBe('<b>Name</b>');
    destroy();
  });

  it('should keep the HTML of an extra header row a plugin draws with its own label for a renamed column', () => {
    const { hot, plugin, destroy } = createGrid({
      afterGetColumnHeaderRenderers(this: Handsontable, renderers: Array<(column: number, TH: HTMLElement) => void>) {
        renderers.unshift((column, TH) => {
          this.view.appendColHeader(column, TH, () => '<b class="own-level">Group</b>', 0);
        });
      },
    });

    plugin.setHeader('column', 1, 'Price');

    const headers = Array.from(hot.rootElement.querySelectorAll('.ht_master thead tr')).map(tr => tr.children[2]);

    expect(headers[0]?.querySelector('b.own-level')).not.toBeNull();
    expect(headers[1]?.textContent).toBe('Price');
    destroy();
  });

  it('should export a renamed row header', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('row', 1, 'Middle');

    const csv = hot.getPlugin('exportFile').exportAsString('csv', { rowHeaders: true });

    expect(csv).toContain('Middle');
    destroy();
  });

  it('should drop every rename with clearHeaders() and keep them on an unrelated updateSettings()', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 0, 'Name');
    plugin.setHeader('row', 0, 'Top');
    hot.updateSettings({ colHeaders: ['X', 'Y', 'Z', 'W'] });

    expect(hot.getColHeader(0)).toBe('Name');
    expect(hot.getColHeader(1)).toBe('Y');

    plugin.clearHeaders('column');

    expect(hot.getColHeader(0)).toBe('X');
    expect(hot.getRowHeader(0)).toBe('Top');

    plugin.clearHeaders();

    expect(hot.getRowHeader(0)).toBe(1);
    destroy();
  });

  it('should show the configured headers again once the plugin is turned off', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 0, 'Name');
    hot.updateSettings({ editableHeaders: false });

    expect(hot.getColHeader(0)).toBe('A1');
    destroy();
  });

  it('should skip column headers while NestedHeaders is on, and say so once', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { hot, plugin, destroy } = createGrid({
      editableHeaders: true,
      nestedHeaders: [['A', 'B', 'C', 'D']],
    });

    hot.updateSettings({ editableHeaders: true });

    expect(plugin.isEditable('column', 0)).toBe(false);
    expect(warnSpy.mock.calls.filter(([message]) => String(message).includes('EditableHeaders'))).toHaveLength(1);
    warnSpy.mockRestore();
    destroy();
  });

  it('should keep the renames when the option is sent again (a wrapper re-render)', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 0, 'Name');
    hot.updateSettings({ editableHeaders: { columnHeaders: true, rowHeaders: true } });

    expect(hot.getColHeader(0)).toBe('Name');
    destroy();
  });

  it('should rename a header that comes from `columns[].title`', () => {
    const { hot, plugin, destroy } = createGrid({
      editableHeaders: true,
      colHeaders: true,
      columns: [{ title: 'Title' }, {}, {}, {}],
    });

    plugin.setHeader('column', 0, 'Renamed');

    expect(hot.getColHeader(0)).toBe('Renamed');
    expect(hot.getSettings().columns[0].title).toBe('Title');
    destroy();
  });

  it('should draw a renamed header as text, never as HTML, also when measuring it', () => {
    let measuredHeaders = 0;
    let markupSeen = false;
    const { hot, plugin, destroy } = createGrid({
      autoColumnSize: true,
      // Runs for the grid's headers and for the ones the GhostTable builds to measure, which it removes again before
      // the call returns: the check has to happen while the header exists.
      afterGetColHeader(this: Handsontable, column: number, TH: HTMLTableCellElement) {
        if (!this.rootElement.contains(TH)) {
          measuredHeaders += 1;
        }

        markupSeen ||= TH.querySelector('.pwn') !== null;
      },
    });

    plugin.setHeader('column', 0, '<img src="x" class="pwn">');
    plugin.setHeader('row', 0, '<b class="pwn">Top</b>');
    hot.getPlugin('autoColumnSize').calculateAllColumnsWidth();

    expect(measuredHeaders).toBeGreaterThan(0);
    expect(markupSeen).toBe(false);
    expect(document.querySelector('.pwn')).toBeNull();
    expect(hot.getCell(-1, 0)?.querySelector('.colHeader')?.textContent).toBe('<img src="x" class="pwn">');
    expect(hot.getCell(0, -1)?.querySelector('.rowHeader')?.textContent).toBe('<b class="pwn">Top</b>');
    destroy();
  });

  it('should keep the configured HTML of a header that was not renamed', () => {
    const { hot, destroy } = createGrid({ colHeaders: ['<b class="own">Name</b>', 'B1', 'C1', 'D1'] });

    expect(hot.getCell(-1, 0)?.querySelector('b.own')).not.toBeNull();
    destroy();
  });

  it('should not show a rename while the grid has no headers on that axis', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 0, 'Name');
    plugin.setHeader('row', 0, 'Top');
    hot.updateSettings({ colHeaders: false, rowHeaders: false });

    expect(hot.getColHeader(0)).toBeNull();
    expect(hot.getRowHeader(0)).toBe(false);

    hot.updateSettings({ colHeaders: true, rowHeaders: true });

    expect(hot.getColHeader(0)).toBe('Name');
    expect(hot.getRowHeader(0)).toBe('Top');
    destroy();
  });

  it('should return the renames from getRowHeader() and getColHeader() called with no argument', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('row', 1, 'Middle');

    expect(hot.getRowHeader()).toEqual([1, 'Middle', 3]);
    destroy();
  });

  it('should keep a renamed row header on its row after a sort', () => {
    const { hot, plugin, destroy } = createGrid({
      data: [['c'], ['a'], ['b']],
      colHeaders: true,
      columnSorting: true,
    });

    plugin.setHeader('row', 0, 'Charlie');
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    // Default row headers count positions; the renamed one stays with the row it named.
    expect(hot.getRowHeader()).toEqual([1, 2, 'Charlie']);
    destroy();
  });

  it('should export the renamed headers', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 1, 'Price');

    const csv = hot.getPlugin('exportFile').exportAsString('csv', { colHeaders: true });

    expect(csv.split('\r\n')[0]).toBe('\uFEFF"A1","Price","C1","D1"');
    destroy();
  });

  it('should copy the renamed headers with the column headers', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 1, 'Price');

    const copied = hot.getPlugin('copyPaste').getRangedData([{ startRow: -1, startCol: 0, endRow: 0, endCol: 1 }]);

    expect(copied).toEqual([['A1', 'Price'], ['a', 'b']]);
    destroy();
  });

  it('should keep the input open, with what the user typed, when the option is sent again', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.openEditor('column', 1);
    (hot.rootElement.querySelector('.htEditableHeaderInput') as HTMLInputElement).value = 'Typed';
    hot.updateSettings({ editableHeaders: { columnHeaders: true, rowHeaders: true } });

    expect(plugin.isEditorOpened()).toBe(true);

    plugin.closeEditor();

    expect(hot.getColHeader(1)).toBe('Typed');
    destroy();
  });

  it('should close the input without saving when an update makes its header not renamable', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.openEditor('row', 1);
    (hot.rootElement.querySelector('.htEditableHeaderInput') as HTMLInputElement).value = 'Typed';
    hot.updateSettings({ editableHeaders: true });

    expect(plugin.isEditorOpened()).toBe(false);
    expect(hot.getRowHeader(1)).toBe(2);
    destroy();
  });

  it('should treat an emptied input as a cancel', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.openEditor('column', 1);
    (hot.rootElement.querySelector('.htEditableHeaderInput') as HTMLInputElement).value = '   ';
    plugin.closeEditor();

    expect(hot.getColHeader(1)).toBe('B1');
    destroy();
  });

  it('should rename only rows with `{ columnHeaders: false, rowHeaders: true }`', () => {
    const { plugin, destroy } = createGrid({ editableHeaders: { columnHeaders: false, rowHeaders: true } });

    expect(plugin.isEditable('column', 0)).toBe(false);
    expect(plugin.isEditable('row', 0)).toBe(true);
    destroy();
  });

  it('should store the value as a string, verbatim', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setHeader('column', 0, '  spaced  ');

    expect(hot.getColHeader(0)).toBe('  spaced  ');

    plugin.setHeader('column', 0, '');

    expect(hot.getColHeader(0)).toBe('');
    destroy();
  });
});
