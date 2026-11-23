import { HandsontableEditor } from '../handsontableEditor';
import { TextEditor } from '../../textEditor';
import { markLongPressReplay } from '../../../helpers/dom/longPress';

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
  let timeouts;

  /**
   * Builds a stand-in for the nested grid that keeps one selection and resolves cells by data attributes.
   */
  function createNested() {
    const grid = {
      data: ['Alpha', 'Beta', 'Gamma'],
      isDestroyed: false,
      rootElement: document.createElement('div'),
      selection: null,
      getDataAtCell: (row, col) => grid.data[row + col],
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
   * @param {object} [init] What kind of press.
   * @param {boolean} [init.touch] A touch tap, replayed at `touchend`.
   * @param {boolean} [init.longPress] A touch replayed while the finger is still down.
   * @param {number} [init.button] The mouse button.
   */
  function press(row, { touch = false, longPress = false, button = 0 } = {}) {
    const event = touch || longPress ?
      Object.assign(new Event('touchstart'), { touches: [], changedTouches: [] }) :
      new MouseEvent('mousedown', { button });
    const coords = { row, col: 0 };

    if (longPress) {
      markLongPressReplay(event);
    }

    options.beforeOnCellMouseDown.call(nested, event, coords);
    nested.selectCell(row, 0);
    options.afterOnCellMouseDown.call(nested, event, coords);
  }

  /**
   * Runs the callbacks the editor handed to its `_registerTimeout()`, as the elapsed timers would.
   */
  function flushTimeouts() {
    timeouts.splice(0).forEach(callback => callback());
  }

  /**
   * Plays a release: the capture listener on the document runs first, then the nested grid's own hook,
   * as it does in the browser when the release is on one of its cells.
   *
   * @param {HTMLElement} target Where the pointer is released.
   * @param {boolean} [reachesCellHook] Whether the nested grid's own hook gets the release. A listener that
   * stops the event keeps it from there.
   */
  function release(target, reachesCellHook = true) {
    const event = new MouseEvent('mouseup', { bubbles: true, button: 0 });

    // Walkontable calls the hook from its own listener, which runs after the document capture phase.
    target.addEventListener('mouseup', () => {
      const coords = nested.getCoords(target.closest('td'));

      if (coords && reachesCellHook) {
        options.afterOnCellMouseUp.call(nested, event, coords);
      }
    }, { once: true });
    target.dispatchEvent(event);
  }

  beforeEach(() => {
    jest.spyOn(TextEditor.prototype, 'prepare').mockImplementation(() => {});

    timeouts = [];
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
      _registerTimeout: jest.fn((callback) => {
        timeouts.push(callback);
      }),
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

  it('gives the keys back at once, and again after the click that follows a release outside the grid', () => {
    editor._opened = true;
    editor.TEXTAREA.focus = jest.fn();

    press(1);
    release(outside);

    expect(editor.hot.listen).toHaveBeenCalledTimes(1);
    expect(editor.TEXTAREA.focus).toHaveBeenCalledTimes(1);

    // The click on the page that ends the gesture makes the focus scopes stop the grid listening. The
    // editor takes the keys back from the click itself, not from a later timer.
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(editor.hot.listen).toHaveBeenCalledTimes(2);

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(editor.hot.listen).toHaveBeenCalledTimes(2);
  });

  it('removes the click listener once the timer has run, so a later click takes nothing', () => {
    editor._opened = true;
    editor.TEXTAREA.focus = jest.fn();

    press(1);
    release(outside);
    flushTimeouts();
    editor.hot.listen.mockClear();
    editor.TEXTAREA.focus.mockClear();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(editor.hot.listen).not.toHaveBeenCalled();
    expect(editor.TEXTAREA.focus).not.toHaveBeenCalled();
  });

  it('gives the keys back from a timer when the gesture ends with no click', () => {
    editor._opened = true;
    editor.TEXTAREA.focus = jest.fn();

    press(1);
    release(outside);
    editor.hot.listen.mockClear();
    flushTimeouts();

    expect(editor.hot.listen).toHaveBeenCalledTimes(1);
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

    press(1, { touch: true });
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

  describe('a press that must not pick', () => {
    it('gives the highlight back at once for a press by a button other than the primary one', () => {
      nested.selection = [2, 0];

      press(1, { button: 2 });

      expect(nested.selection).toEqual([2, 0]);

      release(optionCells[1]);

      expect(editor.setValue).not.toHaveBeenCalled();
      expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    });

    it('gives the keys back to the editor after a press by another button', () => {
      editor._opened = true;
      editor.TEXTAREA.focus = jest.fn();

      press(1, { button: 2 });
      flushTimeouts();

      expect(editor.hot.listen).toHaveBeenCalled();
      expect(editor.TEXTAREA.focus).toHaveBeenCalled();
    });

    it.each([
      ['a press by another button', { button: 2 }],
      ['a replayed long press', { longPress: true }],
    ])('leaves nothing armed for a later click after %s', (_, init) => {
      editor._opened = true;
      editor.TEXTAREA.focus = jest.fn();

      press(1, init);
      flushTimeouts();
      editor.hot.listen.mockClear();
      editor.TEXTAREA.focus.mockClear();

      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(editor.hot.listen).not.toHaveBeenCalled();
      expect(editor.TEXTAREA.focus).not.toHaveBeenCalled();
    });

    it('picks nothing at the lift of a finger that long-pressed the option', () => {
      nested.selection = [2, 0];

      press(1, { longPress: true });

      expect(nested.selection).toEqual([2, 0]);

      options.afterOnCellMouseUp.call(nested, new MouseEvent('mouseup'), { row: 1, col: 0 });

      expect(editor.setValue).not.toHaveBeenCalled();
      expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    });

    it('cancels when the list changed under the pointer between the press and the release', () => {
      press(1);
      nested.data[1] = 'Delta';
      release(optionCells[1]);

      expect(editor.setValue).not.toHaveBeenCalled();
      expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
      expect(nested.selection).toBeNull();
    });

    it('drops a press the nested grid never answered, so a later gesture on the same option picks nothing', () => {
      press(1);
      // The release lands on the option, but a listener stops it before the nested grid's hook.
      release(optionCells[1], false);
      flushTimeouts();

      options.afterOnCellMouseUp.call(nested, new MouseEvent('mouseup'), { row: 1, col: 0 });

      expect(editor.setValue).not.toHaveBeenCalled();
      expect(editor.hot.destroyEditor).not.toHaveBeenCalled();
    });
  });
});
