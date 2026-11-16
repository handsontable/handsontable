import Handsontable from '../../../base';
import Hooks from '../../../core/hooks';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';
import { TextEditor } from '../../../editors/textEditor';
import { registerCellType } from '../../../cellTypes/registry';
import { NumericCellType } from '../../../cellTypes/numericType';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * A header click made while an editor waits for its cell's async validator queues the sort until the
 * EDITED cell's validation answered, the same answer that ends the editor's own wait. An unrelated
 * validation that answers first (a `validateCells()` batch here) must not sort the rows: the edit is
 * written by visual row, so a sort before it lands writes it onto another record.
 *
 * Column A (labels) has a validator that holds its callback until the test answers it. Column B holds
 * `(row * 5) % 7`, so sorting B ascending orders the records p0, p3, p2, p5, p1, p4.
 */
describe.each([
  ['columnSorting', ColumnSorting],
  ['multiColumnSorting', MultiColumnSorting],
])('%s header sort waiting for the edited cell', (pluginKey, PluginClass) => {
  let container;
  let hot;
  let held;

  beforeAll(() => {
    registerPlugin(PluginClass);
    registerCellType(NumericCellType);
  });

  beforeEach(() => {
    held = [];
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds the grid.
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [`p${row}`, (row * 5) % 7]),
      colHeaders: true,
      [pluginKey]: true,
      cells: (row, col) => (col === 0 ? {
        validator(value, callback) {
          held.push({ row: this.visualRow, value, callback });
        },
      } : {}),
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Waits until every queued microtask and one macrotask have run.
   */
  async function flush() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Answers the held validator call that matches the predicate, and removes it from the list.
   *
   * @param {Function} predicate Picks the call.
   * @param {boolean} [valid] The answer.
   */
  async function answer(predicate, valid = true) {
    const index = held.findIndex(predicate);

    expect(index).toBeGreaterThan(-1);

    const [call] = held.splice(index, 1);

    call.callback(valid);
    await flush();
  }

  /**
   * Opens the editor on a column A cell and types a value into it.
   *
   * @param {number} row The visual row.
   * @param {string} value The typed value.
   */
  function editCell(row, value) {
    hot.selectCell(row, 0);

    const editor = hot.getActiveEditor();

    editor.beginEditing();
    editor.setValue(value);
  }

  /**
   * Presses a column header label the way a mouse does: `beforeOnCellMouseDown`, the column selection
   * (which closes and saves the editor), then `afterOnCellMouseDown`.
   *
   * @param {number} column The visual column.
   * @returns {MouseEvent}
   */
  function pressHeader(column) {
    const label = document.createElement('span');
    const event = new MouseEvent('mousedown', { button: 0 });
    const coords = { row: -1, col: column };

    label.className = 'colHeader';
    label.dispatchEvent(event);

    hot.runHooks('beforeOnCellMouseDown', event, coords, null, { row: false, column: false, cell: false });
    hot.selectColumns(column);
    hot.runHooks('afterOnCellMouseDown', event, coords, null);

    return event;
  }

  /**
   * Releases the mouse over a column header.
   *
   * @param {number} column The visual column.
   */
  function releaseHeader(column) {
    hot.runHooks('afterOnCellMouseUp', new MouseEvent('mouseup'), { row: -1, col: column }, null);
  }

  /**
   * Edits row 1 to `zzz` and clicks the column B header. Resolves once the edit's validator is held.
   */
  async function editThenClickHeader() {
    editCell(1, 'zzz');
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(held.map(call => call.value)).toEqual(['zzz']);
  }

  /**
   * The number of `postAfterValidate` listeners the grid holds.
   *
   * @returns {number}
   */
  function countPostAfterValidateListeners() {
    return Hooks.getSingleton().getBucket(hot).getHooks('postAfterValidate').length;
  }

  it('should not sort on an unrelated validation answered before the edited cell', async() => {
    buildGrid();
    await editThenClickHeader();

    hot.validateCells();
    await flush();

    // Every other cell of column A (and row 1 by the batch, with its old value) answers first.
    while (held.length > 1) {
      // eslint-disable-next-line no-await-in-loop
      await answer(call => call.value !== 'zzz');
    }

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);

    await answer(call => call.value === 'zzz');

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p3', 'p2', 'p5', 'zzz', 'p4']);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
  });

  it('should not throw when an earlier `postAfterValidate` listener destroys the grid in the same run', async() => {
    buildGrid();

    const grid = hot;

    // Default order index, so it runs before the sort's own listener in the same `postAfterValidate` run.
    grid.addHook('postAfterValidate', () => {
      if (!grid.isDestroyed) {
        grid.destroy();
      }
    });
    await editThenClickHeader();

    // The sort waits through a listener of its own, after the destroying one.
    expect(countPostAfterValidateListeners()).toBeGreaterThan(1);

    const [call] = held.splice(0, 1);
    const errors = [];
    const onError = (event) => {
      errors.push(event.error);
      event.preventDefault();
    };

    window.addEventListener('error', onError);

    try {
      expect(() => call.callback(true)).not.toThrow();
      await flush();
    } finally {
      window.removeEventListener('error', onError);
    }

    expect(errors).toEqual([]);
    expect(grid.isDestroyed).toBe(true);
    hot = null;
  });

  it('should sort once the edited cell answers when nothing else validates', async() => {
    buildGrid();
    await editThenClickHeader();

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p3', 'p2', 'p5', 'zzz', 'p4']);
  });

  /**
   * Fills rows 1-3 of column A with `zzz` through Ctrl+Enter, the edited cell being (1, 0). Resolves once the
   * three validator calls are held.
   */
  async function fillColumnA() {
    hot.selectCells([[1, 0, 3, 0]]);

    const editor = hot.getActiveEditor();

    editor.beginEditing();
    editor.setValue('zzz');
    editor.finishEditing(false, true);
    await flush();

    expect(held.map(call => [call.row, call.value])).toEqual([[3, 'zzz'], [2, 'zzz'], [1, 'zzz']]);
  }

  it('should wait for the whole Ctrl+Enter fill, not only the edited cell\'s answer', async() => {
    buildGrid();
    await fillColumnA();
    pressHeader(1);
    releaseHeader(1);
    await flush();

    await answer(call => call.row === 1); // the edited cell answers first and ends the editor's wait

    expect(hot.getActiveEditor().isWaiting()).toBe(false);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.row === 2);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.row === 3);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'zzz', 'zzz', 'p4', 'p5']);
  });

  it('should keep every later header sort queued while a closed editor\'s fill waits for one cell (known limit)', async() => {
    buildGrid();

    const applyHeaderClickSort = jest.spyOn(hot.getPlugin(pluginKey), 'applyHeaderClickSort');

    await fillColumnA();
    await answer(call => call.row === 1); // the edited cell: the editor closes
    await answer(call => call.row === 2); // row 3 stays unanswered, so the fill is not written

    expect(hot.getActiveEditor().isOpened()).toBe(false);
    expect(hot.getActiveEditor().isWaiting()).toBe(false);

    pressHeader(1);
    releaseHeader(1);
    pressHeader(1);
    releaseHeader(1);
    pressHeader(0);
    releaseHeader(0);
    await flush();

    // Accepted limit: a sort now would move the rows before core writes the fill by visual row.
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);
    expect(applyHeaderClickSort).not.toHaveBeenCalled();
    expect(hot._getWaitingChangeSets()).toHaveLength(1);

    await answer(call => call.row === 3);

    expect(applyHeaderClickSort.mock.calls.map(([press]) => press.column)).toEqual([1, 1, 0]);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'zzz', 'zzz', 'p4', 'p5']);
  });

  it('should wait for a Ctrl+Enter fill whose edited cell answered before the press', async() => {
    buildGrid();
    await fillColumnA();
    await answer(call => call.row === 1);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.row === 2);
    await answer(call => call.row === 3);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'zzz', 'zzz', 'p4', 'p5']);
  });

  it('should wait for a fill that answered its edited cell when the clicked column has another editor', async() => {
    // Column B is numeric, so the header press prepares the NumericEditor, not the TextEditor that saved.
    buildGrid({ columns: [{}, { type: 'numeric' }] });
    await fillColumnA();
    await answer(call => call.row === 1);
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.row === 2);
    await answer(call => call.row === 3);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'zzz', 'zzz', 'p4', 'p5']);
  });

  it('should keep waiting for a fill when another save runs while the fill waits', async() => {
    buildGrid();
    await fillColumnA();
    pressHeader(1);
    releaseHeader(1);
    await flush();
    await answer(call => call.row === 1);

    // A later save of a column B cell (no validator) through the same TextEditor.
    hot.selectCell(5, 1);

    const editor = hot.getActiveEditor();

    editor.beginEditing();
    editor.setValue('9');
    editor.finishEditing();
    await flush();
    await answer(call => call.row === 2);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.row === 3);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'zzz', 'zzz', 'p4', 'p5']);
  });

  it('should wait for the rest of a Ctrl+Enter fill when the edited cell is rejected', async() => {
    buildGrid({ allowInvalid: false });
    await fillColumnA();
    pressHeader(1);
    releaseHeader(1);
    await flush();

    await answer(call => call.row === 1, false); // reopens the editor on the rejected value

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.row === 2);
    await answer(call => call.row === 3);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'p1', 'zzz', 'zzz', 'p4', 'p5']);
  });

  it('should wait for an edit a `modifyGetCellCoords` listener redirects onto a validated cell', async() => {
    // Column A has no validator here; the edit of a column A cell is redirected to column C, whose
    // validator holds its answer.
    buildGrid({
      data: Array.from({ length: 6 }, (_, row) => [`p${row}`, (row * 5) % 7, `c${row}`]),
      cells: (row, col) => (col === 2 ? {
        validator(value, callback) {
          held.push({ row: this.visualRow, value, callback });
        },
      } : {}),
      modifyGetCellCoords(row, column, topmost, source) {
        if (source === 'meta' && column === 0 && row >= 0) {
          return [row, 2];
        }
      },
    });
    editCell(1, 'zzz');
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(held.map(call => [call.row, call.value])).toEqual([[1, 'zzz']]);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(2)).toEqual(['c0', 'zzz', 'c2', 'c3', 'c4', 'c5']);
  });

  it('should not wait for an API write whose validator never answers', async() => {
    buildGrid({
      cells: (row, col) => (col === 0 ? { validator() {} } : {}),
    });
    hot.setDataAtCell(0, 0, 'x');
    await flush();
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should not wait for an API write whose async validator is in flight', async() => {
    buildGrid();
    hot.setDataAtCell(1, 0, 'zzz');
    await flush();

    expect(held).toHaveLength(1);

    pressHeader(1);
    releaseHeader(1);
    await flush();

    // Not proof the write lands on its record: an API write that waits is written by visual row after the sort
    // (a known limit). Only an editor save holds the sort.
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should wait for the edited cell on an unchanged edit, which validates the stored value', async() => {
    buildGrid();
    editCell(1, 'p1');
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(held.map(call => call.value)).toEqual(['p1']);

    hot.validateCell('x', hot.getCellMeta(3, 0), () => {}, 'test');
    await flush();
    await answer(call => call.value === 'x');

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(call => call.value === 'p1');

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should sort at once when a `beforeChange` listener drops the edit, which validates no cell', async() => {
    buildGrid({
      beforeChange(changes, source) {
        if (source === 'edit') {
          return false;
        }
      },
    });
    editCell(1, 'zzz');
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(held).toEqual([]);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p3', 'p2', 'p5', 'p1', 'p4']);
  });

  /**
   * Presses a column header label while the editor stays open: the press runs no column selection, so the
   * editor is still `EDITING` when the press reads it and takes the wait.
   *
   * @param {number} column The visual column.
   */
  function pressHeaderKeepingEditor(column) {
    const event = new MouseEvent('mousedown', { button: 0 });
    const label = document.createElement('span');
    const coords = { row: -1, col: column };

    label.className = 'colHeader';
    label.dispatchEvent(event);
    hot.runHooks('beforeOnCellMouseDown', event, coords, null, { row: false, column: false, cell: false });
    hot.runHooks('afterOnCellMouseDown', event, coords, null);
  }

  it('should sort on release when a `beforeChange` veto ended the edit after the press', async() => {
    buildGrid({
      beforeChange(changes, source) {
        if (source === 'edit') {
          return false;
        }
      },
    });
    editCell(1, 'zzz');
    pressHeaderKeepingEditor(1);
    hot.getActiveEditor().finishEditing(); // vetoed: the editor is canceled and nothing is validated
    releaseHeader(1);
    await flush();

    expect(held).toEqual([]);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should not sort on release while the editor the press found is still open', async() => {
    buildGrid();
    editCell(1, 'zzz');
    pressHeaderKeepingEditor(1);
    releaseHeader(1);
    await flush();

    // The press did not close the editor, so its save has not run yet.
    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    hot.getActiveEditor().finishEditing();
    await flush();

    expect(held.map(call => call.value)).toEqual(['zzz']);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
  });

  it('should not sort on an unrelated validation while the editor the press found is still open', async() => {
    buildGrid();
    editCell(1, 'zzz');
    pressHeaderKeepingEditor(1);
    releaseHeader(1);
    await flush();

    // An unrelated validation answers while the editor has not saved yet.
    hot.validateRows([4]);
    await flush();
    await answer(() => true);
    await flush();

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);

    hot.getActiveEditor().finishEditing();
    await flush();
    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getSourceDataAtCol(0)).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
  });

  it('should not sort on an unrelated validation answered before the release while the editor is still open', async() => {
    buildGrid();
    editCell(1, 'zzz');
    pressHeaderKeepingEditor(1);
    hot.validateRows([4]);
    await flush();
    await answer(() => true);
    await flush();
    releaseHeader(1);
    await flush();

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);
  });

  it('should sort on release when Escape ended the edit after the press', async() => {
    buildGrid();
    editCell(1, 'zzz');
    pressHeaderKeepingEditor(1);
    hot.getActiveEditor().finishEditing(true); // Escape
    releaseHeader(1);
    await flush();

    expect(held).toEqual([]);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(hot.getDataAtCol(0)).toEqual(['p0', 'p3', 'p2', 'p5', 'p1', 'p4']);
  });

  it('should sort at once when an editor wait that holds no change set is canceled without an answer', async() => {
    class DeferredWriteEditor extends TextEditor {
      saveValue() {} // writes later, so the save holds no change set and validates nothing yet
    }

    buildGrid({ columns: [{ editor: DeferredWriteEditor }, {}] });
    editCell(1, 'zzz');
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(hot.getActiveEditor().isWaiting()).toBe(true);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    hot.runHooks('beforeDialogShow'); // cancels the waiting editor; no validation will answer
    await flush();

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should keep waiting for the save when the editor\'s wait is canceled without an answer', async() => {
    buildGrid();
    await editThenClickHeader();

    hot.runHooks('beforeDialogShow'); // cancels the waiting editor; its validator still holds the answer
    await flush();

    // The save's change set still waits in core, so the sort waits for it.
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should end the wait on the first answer when the editor\'s save writes later, as the editor does', async() => {
    let deferredWrite = null;

    class DeferredWriteEditor extends TextEditor {
      saveValue(value, ctrlDown) {
        deferredWrite = () => super.saveValue(value, ctrlDown);
      }
    }

    buildGrid({ columns: [{ editor: DeferredWriteEditor }, {}] });
    editCell(1, 'zzz');
    pressHeader(1);
    releaseHeader(1);
    await flush();

    expect(typeof deferredWrite).toBe('function');
    expect(hot.getActiveEditor().isWaiting()).toBe(true);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    hot.validateCell('x', hot.getCellMeta(3, 0), () => {}, 'test');
    await flush();
    await answer(call => call.value === 'x');

    // Accepted limit, not proof the edit lands on its record: the save validated no cell yet, so the editor
    // takes the first answer of any cell as its own, and the sort follows the editor. The rows sort before the
    // deferred write lands, and that write then goes by visual row onto another record.
    expect(hot.getActiveEditor().isWaiting()).toBe(false);
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  it('should apply both presses made during one wait, in press order', async() => {
    buildGrid();
    await editThenClickHeader();

    pressHeader(pluginKey === 'columnSorting' ? 1 : 0);
    releaseHeader(pluginKey === 'columnSorting' ? 1 : 0);
    await flush();

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);

    await answer(() => true);

    // A press without Ctrl replaces the MultiColumnSorting config, so the second press wins there.
    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual(pluginKey === 'columnSorting'
      ? [{ column: 1, sortOrder: 'desc' }]
      : [{ column: 0, sortOrder: 'asc' }]);
  });

  it('should remove its `postAfterValidate` listener once the wait resolves', async() => {
    buildGrid();

    const before = countPostAfterValidateListeners();

    await editThenClickHeader();

    expect(countPostAfterValidateListeners()).toBeGreaterThan(before);

    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(countPostAfterValidateListeners()).toBe(before);
  });

  it.each([
    ['loadData()', () => hot.loadData([['n0', 1], ['n1', 0]])],
    ['disablePlugin()', () => hot.getPlugin(pluginKey).disablePlugin()],
    ['updateSettings({ columns })', () => hot.updateSettings({ columns: [{ data: 1 }, { data: 0 }] })],
  ])('should drop the wait and its listener on %s', async(_, reset) => {
    buildGrid();

    const before = countPostAfterValidateListeners();
    const applyHeaderClickSort = jest.spyOn(hot.getPlugin(pluginKey), 'applyHeaderClickSort');

    await editThenClickHeader();
    reset();

    // `loadData()` ends the editor's own wait too; the other resets leave it registered.
    const editorWaits = hot.getActiveEditor()?.isWaiting() ? 1 : 0;

    expect(countPostAfterValidateListeners()).toBe(before + editorWaits);

    held.splice(0).forEach(call => call.callback(true));
    await flush();

    expect(applyHeaderClickSort).not.toHaveBeenCalled();
    expect(hot.getPlugin(pluginKey).enabled ? hot.getPlugin(pluginKey).getSortConfig() : []).toEqual([]);
  });

  it('should remove the listener of a press that turned into a column drag', async() => {
    buildGrid();

    const before = countPostAfterValidateListeners();

    editCell(1, 'zzz');
    pressHeader(1);
    hot.runHooks('afterColumnMove', [1], 0, null, 0, true);
    releaseHeader(1);
    await flush();

    // The editor's own wait is still registered; only the sort's listener is gone.
    expect(countPostAfterValidateListeners()).toBe(before + 1);

    await answer(() => true);

    expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([]);
    expect(countPostAfterValidateListeners()).toBe(before);
  });
});
