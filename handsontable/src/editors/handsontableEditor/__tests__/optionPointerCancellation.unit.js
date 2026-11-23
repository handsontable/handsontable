import { HandsontableEditor } from '../handsontableEditor';
import { TextEditor } from '../../textEditor';

/**
 * A press on a list option commits on the release of the same option, and a release anywhere else
 * cancels it. The editor wires this through the hooks of the nested grid, so the test drives those
 * hooks the way Walkontable would, against a stand-in for the nested grid.
 */
describe('HandsontableEditor list option press', () => {
  let editor;
  let nested;
  let options;
  let optionCells;
  let outside;

  /**
   * Builds a stand-in for the nested grid that keeps one selection and resolves cells by data attributes.
   */
  function createNested() {
    const grid = {
      isDestroyed: false,
      rootElement: document.createElement('div'),
      selection: null,
      getDataAtCell: (row, col) => ['Alpha', 'Beta', 'Gamma'][row + col],
      getSelectedLast: () => (grid.selection ? [...grid.selection, ...grid.selection] : undefined),
      getSelectedActive: () => grid.selection !== null,
      getValue: () => grid.getDataAtCell(...grid.selection),
      selectCell: jest.fn((row, col) => {
        grid.selection = [row, col];
      }),
      deselectCell: jest.fn(() => {
        grid.selection = null;
      }),
      isListening: () => true,
      getCoords: td => (td ? { row: Number(td.dataset.row), col: Number(td.dataset.col) } : null),
    };

    return grid;
  }

  /**
   * Creates a `td` the nested grid would render for one option.
   *
   * @param {number} row The visual row.
   * @returns {HTMLTableCellElement}
   */
  function createOptionCell(row) {
    const td = document.createElement('td');

    td.dataset.row = String(row);
    td.dataset.col = '0';
    nested.rootElement.appendChild(td);

    return td;
  }

  /**
   * Plays the press the way Walkontable does: the `before` hook, the selection of the cell, the `after` hook.
   *
   * @param {number} row The pressed option.
   * @param {string} [type] The event type that started the press.
   */
  function press(row, type = 'mousedown') {
    const event = type === 'mousedown' ? new MouseEvent('mousedown', { button: 0 }) : new Event(type);
    const coords = { row, col: 0 };

    options.beforeOnCellMouseDown.call(nested, event, coords);
    nested.selectCell(row, 0);
    options.afterOnCellMouseDown.call(nested, event, coords);
  }

  /**
   * Plays a release: the capture listener on the document runs first, then the nested grid's own hook,
   * as it does in the browser when the release is on one of its cells.
   *
   * @param {HTMLElement} target Where the pointer is released.
   */
  function release(target) {
    const event = new MouseEvent('mouseup', { bubbles: true, button: 0 });

    // Walkontable calls the hook from its own listener, which runs after the document capture phase.
    target.addEventListener('mouseup', () => {
      const coords = nested.getCoords(target.closest('td'));

      if (coords) {
        options.afterOnCellMouseUp.call(nested, event, coords);
      }
    }, { once: true });
    target.dispatchEvent(event);
  }

  beforeEach(() => {
    jest.spyOn(TextEditor.prototype, 'prepare').mockImplementation(() => {});

    editor = new HandsontableEditor({
      rootDocument: document,
      rootWindow: window,
      rootElement: document.createElement('div'),
      addHook: jest.fn(),
      addHookOnce: jest.fn(),
      getCurrentThemeName: () => 'main',
      isRtl: () => false,
      listen: jest.fn(),
      destroyEditor: jest.fn(),
      _registerTimeout: jest.fn(),
    });
    editor.setValue = jest.fn();
    editor.cellProperties = {};
    nested = createNested();
    document.body.appendChild(nested.rootElement);
    editor.htEditor = nested;
    editor.prepare(0, 0, 0, document.createElement('td'), '', editor.cellProperties);
    options = editor.htOptions;

    optionCells = [createOptionCell(0), createOptionCell(1), createOptionCell(2)];
    outside = document.body.appendChild(document.createElement('div'));
  });

  afterEach(() => {
    TextEditor.prototype.prepare.mockRestore();
    optionCells.forEach(td => td.remove());
    outside.remove();
    nested.rootElement.remove();
    editor.eventManager.destroy();
  });

  it('leaves the value and the editor alone on the press', () => {
    press(1);

    expect(editor.setValue).not.toHaveBeenCalled();
    expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    expect(nested.selection).toEqual([1, 0]);
  });

  it('commits the option and closes the editor when the pointer is released on the same option', () => {
    press(1);
    release(optionCells[1]);

    expect(editor.setValue).toHaveBeenCalledWith('Beta');
    expect(editor.hot.destroyEditor).toHaveBeenCalledTimes(1);
    expect(editor.innerSelectionOrigin).toBe('user');
  });

  it('cancels when the pointer is released on another option', () => {
    press(1);
    release(optionCells[2]);

    expect(editor.setValue).not.toHaveBeenCalled();
    expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    expect(nested.selection).toBeNull();
  });

  it('cancels when the pointer is released outside the list, with no cell hook involved', () => {
    press(1);
    release(outside);

    expect(editor.setValue).not.toHaveBeenCalled();
    expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    expect(nested.selection).toBeNull();
  });

  it('restores the selection that was there before the press', () => {
    nested.selection = [2, 0];
    editor.innerSelectionOrigin = 'user';

    press(0);
    release(outside);

    expect(nested.selection).toEqual([2, 0]);
    expect(editor.innerSelectionOrigin).toBe('user');
  });

  it('gives the keys back to the editor after the click that follows a release outside the grid', () => {
    editor._opened = true;
    editor.TEXTAREA.focus = jest.fn();

    press(1);
    release(outside);

    // The click on the page that ends the gesture makes the focus scopes stop the grid listening, so
    // the keys come back from a deferred callback.
    expect(editor.hot.listen).not.toHaveBeenCalled();

    editor.hot._registerTimeout.mock.calls[0][0]();

    expect(editor.hot.listen).toHaveBeenCalled();
    expect(editor.TEXTAREA.focus).toHaveBeenCalled();
  });

  it('does not let a later Enter commit the option of a cancelled press', () => {
    press(1);
    release(outside);

    expect(editor.resolveInnerSelectionValue()).toBeUndefined();
  });

  it('cancels on Escape, and the release that follows on the same option commits nothing', () => {
    press(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    release(optionCells[1]);

    expect(editor.setValue).not.toHaveBeenCalled();
    expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    expect(nested.selection).toBeNull();
  });

  it('commits a touch tap, which has no document release to wait for', () => {
    const event = new MouseEvent('mouseup', { button: 0 });

    press(1, 'touchstart');
    options.afterOnCellMouseUp.call(nested, event, { row: 1, col: 0 });

    expect(editor.setValue).toHaveBeenCalledWith('Beta');
    expect(editor.hot.destroyEditor).toHaveBeenCalledTimes(1);
  });

  it('drops a pending press when the editor closes', () => {
    jest.spyOn(TextEditor.prototype, 'close').mockImplementation(() => {});
    editor.removeHooksByKey = jest.fn();

    press(1);
    editor.close();
    release(optionCells[1]);

    TextEditor.prototype.close.mockRestore();

    expect(editor.setValue).not.toHaveBeenCalled();
  });

  it('keeps calling an afterOnCellMouseUp the user passes through the handsontable option', () => {
    const userHook = jest.fn();

    editor.cellProperties = { handsontable: { afterOnCellMouseUp: userHook } };
    editor.prepare(0, 0, 0, document.createElement('td'), '', editor.cellProperties);
    options = editor.htOptions;

    press(1);
    release(optionCells[1]);

    expect(userHook).toHaveBeenCalledTimes(1);
    expect(editor.setValue).toHaveBeenCalledWith('Beta');
  });

  it('hands the user hooks every argument the hook system passes, the cell element included', () => {
    const beforeHook = jest.fn();
    const afterHook = jest.fn();
    const event = new MouseEvent('mouseup');
    const coords = { row: 1, col: 0 };

    editor.cellProperties = { handsontable: { beforeOnCellMouseDown: beforeHook, afterOnCellMouseUp: afterHook } };
    editor.prepare(0, 0, 0, document.createElement('td'), '', editor.cellProperties);
    options = editor.htOptions;

    options.beforeOnCellMouseDown.call(nested, event, coords, optionCells[1]);
    options.afterOnCellMouseUp.call(nested, event, coords, optionCells[1]);

    expect(beforeHook).toHaveBeenCalledWith(event, coords, optionCells[1]);
    expect(afterHook).toHaveBeenCalledWith(event, coords, optionCells[1]);
  });
});
