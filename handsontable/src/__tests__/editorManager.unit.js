import Handsontable from 'handsontable';
import { command as editorOpenCommand } from '../shortcuts/contexts/commands/editor/open';

describe('EditorManager', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '200px';
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [
        ['a', 'b'],
        ['c', 'd'],
      ],
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Opens the editor the way a cell double-click does.
   *
   * @param {MouseEvent} event Double-click event.
   */
  function openFromDoubleClick(event = new MouseEvent('dblclick')) {
    hot._getEditorManager().openEditor(null, event, true);
  }

  it('should open the editor after a double-click on a selected cell', () => {
    hot.selectCell(0, 0);
    openFromDoubleClick();

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().row).toBe(0);
    expect(hot.getActiveEditor().col).toBe(0);
  });

  it('should not throw when a double-click asks to edit a header selection', () => {
    hot.updateSettings({ navigableHeaders: true });
    hot.selectColumns(0, 0, -1);

    expect(hot.getSelectedRangeActive().highlight.isHeader()).toBe(true);
    expect(() => openFromDoubleClick()).not.toThrow();
    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
  });

  it('should open the editor when a double-click asks to edit a cell selected while data was loading', () => {
    hot.selection.markSource('loadData');
    hot.selectCell(1, 1);
    hot.selection.markEndSource();

    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    expect(() => openFromDoubleClick()).not.toThrow();
    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toBe('d');
  });

  it('should open the editor when Enter asks to edit a cell selected while data was loading', () => {
    hot.selection.markSource('loadData');
    hot.selectCell(1, 1);
    hot.selection.markEndSource();

    expect(() => {
      editorOpenCommand.callback(hot, new KeyboardEvent('keydown', { key: 'Enter' }), ['enter']);
    }).not.toThrow();
    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toBe('d');
  });

  it('should open the editor when Enter is pressed on a selected cell', () => {
    hot.selectCell(0, 0);
    editorOpenCommand.callback(hot, new KeyboardEvent('keydown', { key: 'Enter' }), ['enter']);

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().row).toBe(0);
    expect(hot.getActiveEditor().col).toBe(0);
  });

  it('should not open the editor when Enter follows an updateData that made the selected cell read-only', () => {
    hot.updateSettings({
      cells(row, col) {
        if (row === 0 && col === 1 && this.instance.getDataAtCell(row, col) === 'locked') {
          return { readOnly: true };
        }

        return {};
      },
    });
    hot.selectCell(0, 1);
    hot.updateData([
      ['a', 'locked'],
      ['c', 'd'],
    ]);

    editorOpenCommand.callback(hot, new KeyboardEvent('keydown', { key: 'Enter' }), ['enter']);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
  });

  it('should not open the editor when Enter follows a loadData that made the selected cell read-only', () => {
    hot.updateSettings({
      cells(row, col) {
        if (row === 0 && col === 1 && this.instance.getDataAtCell(row, col) === 'locked') {
          return { readOnly: true };
        }

        return {};
      },
    });
    hot.selectCell(0, 1);
    hot.loadData([
      ['a', 'locked'],
      ['c', 'd'],
    ]);

    editorOpenCommand.callback(hot, new KeyboardEvent('keydown', { key: 'Enter' }), ['enter']);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
  });

  it('should open the editor on the value loadData wrote', () => {
    hot.selectCell(0, 0);
    hot.loadData([
      ['next', 'b'],
      ['c', 'd'],
    ]);

    editorOpenCommand.callback(hot, new KeyboardEvent('keydown', { key: 'Enter' }), ['enter']);

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toBe('next');
  });

  it('should not open the previously selected cell after the highlight moves to a header', () => {
    hot.updateSettings({ navigableHeaders: true });
    hot.selectCell(1, 1);
    hot.selectColumns(0, 0, -1);

    expect(hot.getSelectedRangeActive().highlight.isHeader()).toBe(true);
    expect(() => openFromDoubleClick()).not.toThrow();
    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
  });

  it('should not open the previously selected cell when openEditor is called on a header highlight', () => {
    hot.updateSettings({ navigableHeaders: true });
    hot.selectCell(1, 1);
    hot.selectColumns(0, 0, -1);

    expect(hot.getSelectedRangeActive().highlight.isHeader()).toBe(true);
    expect(() => {
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'F2' }), true);
    }).not.toThrow();
    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
  });

  it('should still open the editor when that cell is double-clicked with the mouse', () => {
    hot.selection.markSource('loadData');
    hot.selectCell(0, 0);
    hot.selection.markEndSource();

    const cell = hot.getCell(0, 0);

    cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, detail: 1 }));
    cell.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, detail: 1 }));
    cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, detail: 2 }));
    cell.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, detail: 2 }));

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().row).toBe(0);
    expect(hot.getActiveEditor().col).toBe(0);
  });
});
