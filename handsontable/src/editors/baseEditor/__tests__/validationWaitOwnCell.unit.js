import Core from 'handsontable/core';
import { registerCellType } from 'handsontable/cellTypes/registry';
import { NumericCellType } from 'handsontable/cellTypes/numericType';
import { TextCellType } from 'handsontable/cellTypes/textType';
import { registerRenderer, baseRenderer, textRenderer, numericRenderer } from 'handsontable/renderers';
import { registerPlugin } from 'handsontable/plugins/registry';
import { ManualColumnMove } from 'handsontable/plugins/manualColumnMove';
import { ManualRowMove } from 'handsontable/plugins/manualRowMove';
import { TextEditor } from 'handsontable/editors/textEditor';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerCellType(NumericCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);
registerRenderer(numericRenderer);
registerPlugin(ManualColumnMove);
registerPlugin(ManualRowMove);

/**
 * @param {HTMLElement} container Host element.
 * @param {object} settings Handsontable settings.
 * @returns {Core} An initialized Core instance.
 */
function createHot(container, settings) {
  const core = new Core(container, {
    theme: 'ht-theme-main',
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });

  core.init();

  return core;
}

/**
 * Lets the validator microtasks, and what their answers queue, run.
 */
async function flush() {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

/**
 * A validator that answers after 600 ms and rejects negative numbers.
 *
 * @param {*} value The validated value.
 * @param {Function} callback The validator callback.
 */
function asyncNonNegative(value, callback) {
  // eslint-disable-next-line handsontable/no-fixed-sleep-in-spec -- an async validator, driven by fake timers
  setTimeout(() => callback(Number(value) >= 0), 600);
}

/**
 * A validator that answers at once (in the validation microtask) and accepts everything.
 *
 * @param {*} value The validated value.
 * @param {Function} callback The validator callback.
 */
function syncAccept(value, callback) {
  callback(true);
}

/**
 * @param {number} rows The row count.
 * @returns {Array[]} One numeric column, `18` in every row.
 */
function createData(rows) {
  return Array.from({ length: rows }, () => [18]);
}

describe('BaseEditor validation wait', () => {
  let container;
  let core;

  beforeEach(() => {
    jest.useFakeTimers('legacy');
    container = document.createElement('div');
    document.body.appendChild(container);
    core = null;
  });

  afterEach(() => {
    if (core && !core.isDestroyed) {
      core.destroy();
    }

    container.remove();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('ignores another cell\'s answer and closes on its own', async() => {
    const data = createData(12);
    const answers = [];

    data[11][0] = -5;

    core = createHot(container, {
      data,
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
    });
    core.addHook('postAfterValidate', (valid, value, row, col, source) => {
      answers.push([row, source]); // returns nothing, so the hook keeps `valid`
    });

    core.validateCells(); // the batch is in flight, its first answer (row 11) will be `false`
    await flush();
    jest.advanceTimersByTime(300);
    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing();
    await flush();
    jest.advanceTimersByTime(300); // the whole batch answers, (1, 0) included; the editor's validator still runs
    await flush();

    expect(answers).toHaveLength(12);
    expect(answers[0]).toEqual([11, 'validateCells']);
    expect(answers).toContainEqual([1, 'validateCells']);
    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(300); // the edited cell's own answer
    await flush();

    expect(answers[12]).toEqual([1, 'edit']);

    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCell(1, 0)).toBe(7);
    expect(core.getSelectedLast()).toEqual([1, 0, 1, 0]); // closed, not reopened by the batch's `false`
  });

  it('keeps waiting while a foreign validation answers first', async() => {
    core = createHot(container, {
      data: createData(5),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
      cell: [{ row: 3, col: 0, validator: syncAccept }],
    });

    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing();

    core.validateCell(1, core.getCellMeta(3, 0), () => {}, 'edit');
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(false);
  });

  it('reopens on its own rejection, not on a foreign acceptance', async() => {
    core = createHot(container, {
      data: createData(5),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
      cell: [{ row: 3, col: 0, validator: syncAccept }],
    });

    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('-5');
    core.getActiveEditor().finishEditing();

    core.validateCell(1, core.getCellMeta(3, 0), () => {}, 'edit'); // the foreign `true`, answering first
    await flush();
    jest.advanceTimersByTime(600); // the own `false`
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCell(1, 0)).toBe(18);
  });

  it('closes on the edited cell\'s answer during a Ctrl+Enter fill', async() => {
    const sources = [];

    core = createHot(container, {
      data: createData(5),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
    });
    core.addHook('postAfterValidate', (valid, value, row, col, source) => {
      sources.push(source); // returns nothing, so the hook keeps `valid`
    });

    core.selectCells([[1, 0, 3, 0]]);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing(false, true); // three answers, the own one is (1, 0)
    await flush();
    jest.advanceTimersByTime(600);
    await flush();

    expect(sources).toEqual(['edit', 'edit', 'edit']); // a fill validates with the editor's source
    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCol(0).slice(1, 4)).toEqual([7, 7, 7]);
  });

  it('closes when a beforeChange listener drops the edited cell from a Ctrl+Enter fill', async() => {
    core = createHot(container, {
      data: createData(5),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
      beforeChange(changes) {
        changes.forEach((change, index) => {
          if (change && change[0] === 1 && change[1] === 0) {
            changes[index] = null;
          }
        });
      },
    });

    core.selectCells([[1, 0, 3, 0]]);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing(false, true);
    await flush();
    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().state).not.toBe('STATE_WAITING');
    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCol(0).slice(1, 4)).toEqual([18, 7, 7]);
  });

  it('closes at once, not reopened by another cell\'s rejection, when a beforeChange listener drops the edited cell from a fill', async() => {
    core = createHot(container, {
      data: createData(5),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
      beforeChange(changes) {
        changes.forEach((change, index) => {
          if (change && change[0] === 1 && change[1] === 0) {
            changes[index] = null;
          }
        });
      },
      cell: [{
        row: 2,
        col: 0,
        // eslint-disable-next-line handsontable/no-fixed-sleep-in-spec -- an async validator, driven by fake timers
        validator: (value, callback) => setTimeout(() => callback(false), 600),
      }],
    });

    core.selectCells([[1, 0, 3, 0]]);

    const editor = core.getActiveEditor();

    editor.beginEditing();
    editor.setValue('7');
    editor.finishEditing(false, true);
    await flush();

    // The listener refuses to write the edited cell, so no answer can be the editor's own.
    expect(editor.state).toBe('STATE_VIRGIN');
    expect(editor.isOpened()).toBe(false);

    jest.advanceTimersByTime(600); // (2, 0) is rejected, (3, 0) accepted
    await flush();

    expect(editor.state).toBe('STATE_VIRGIN');
    expect(editor.isOpened()).toBe(false);
    expect(core.getDataAtCol(0)).toEqual([18, 18, 18, 7, 18]);
  });

  it('closes at once when a beforeChange listener drops the edited cell from a fill whose other cells have no validator', async() => {
    core = createHot(container, {
      data: createData(5),
      // A plain column: the `numeric` type would bring a validator to every other cell of the fill.
      cell: [{ row: 1, col: 0, validator: asyncNonNegative, allowInvalid: false }],
      beforeChange(changes) {
        changes.forEach((change, index) => {
          if (change && change[0] === 1 && change[1] === 0) {
            changes[index] = null;
          }
        });
      },
    });

    core.selectCells([[1, 0, 3, 0]]);

    const editor = core.getActiveEditor();

    editor.beginEditing();
    editor.setValue('7');
    editor.finishEditing(false, true);
    await flush();

    // Nothing the save wrote has a validator, so no answer can end the wait.
    expect(editor.state).toBe('STATE_VIRGIN');
    expect(editor.isOpened()).toBe(false);
    expect(core.getDataAtCol(0)).toEqual([18, 18, '7', '7', 18]);
  });

  /**
   * Starts a `validateCells()` batch, then confirms an edit of (1, 0) 300 ms into it, so the batch's answer
   * for the edited cell (its old value) arrives before the editor's own.
   *
   * @param {number} oldValue The value (1, 0) holds, which the batch validates.
   * @param {string} newValue The value the editor confirms.
   */
  async function editDuringBatch(oldValue, newValue) {
    const data = createData(5);

    data[1][0] = oldValue;

    core = createHot(container, {
      data,
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
    });

    core.validateCells();
    await flush();
    jest.advanceTimersByTime(300);
    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue(newValue);
    core.getActiveEditor().finishEditing();
    await flush();
    jest.advanceTimersByTime(300); // the batch answers for (1, 0) with the old value
    await flush();
  }

  it('closes on its own acceptance, not reopened by the batch\'s rejection of the old value', async() => {
    await editDuringBatch(-5, '7');

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(300);
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCell(1, 0)).toBe(7);
  });

  it('reopens on its own rejection, not closed by the batch\'s acceptance of the old value', async() => {
    await editDuringBatch(18, '-5');

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(300);
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCell(1, 0)).toBe(18);
  });

  it('matches the answer by prop when columns are moved', async() => {
    const postAfterValidate = jest.fn();

    core = createHot(container, {
      data: [{ a: 1, b: 2 }, { a: 3, b: 4 }],
      columns: [
        { data: 'a' },
        { data: 'b', type: 'numeric', validator: asyncNonNegative, allowInvalid: false },
      ],
      manualColumnMove: [1, 0],
    });
    core.addHook('postAfterValidate', postAfterValidate);

    core.selectCell(0, 0); // visual column 0 is prop 'b'
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('9');
    core.getActiveEditor().finishEditing();
    await flush();
    jest.advanceTimersByTime(600);
    await flush();

    expect(postAfterValidate).toHaveBeenCalledTimes(1);
    expect(postAfterValidate.mock.calls[0][3]).toBe('b'); // the answer carries colArg === 'b'
    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtRowProp(0, 'b')).toBe(9);
  });

  /**
   * Confirms `newValue` in an editor on (1, 0), then runs `alterDuringWait` while the editor waits for its
   * 600 ms validator, and lets the validator answer.
   *
   * @param {string} newValue The value the editor confirms.
   * @param {Function} alterDuringWait Changes the rows while the editor waits.
   */
  async function editAndAlterDuringWait(newValue, alterDuringWait) {
    core = createHot(container, {
      data: [[10], [11], [12], [13], [14]],
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
    });

    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue(newValue);
    core.getActiveEditor().finishEditing();
    await flush();
    alterDuringWait();
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();
  }

  it('closes on its own acceptance when a row is inserted above during the wait', async() => {
    await editAndAlterDuringWait('7', () => core.alter('insert_row_above', 0));

    expect(core.getActiveEditor().state).not.toBe('STATE_WAITING');
    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCol(0)).toContain(7);
    // Where the value lands is core's write path, not the wait: the change keeps the visual row it was
    // made with, so it lands on the record that now sits there (a known limit, not pinned here).
  });

  it('reopens on its own rejection when a row is inserted above during the wait', async() => {
    await editAndAlterDuringWait('-5', () => core.alter('insert_row_above', 0));

    expect(core.getActiveEditor().state).toBe('STATE_EDITING'); // reopened, not left waiting
    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCol(0)).toEqual([null, 10, 11, 12, 13, 14]);
  });

  it('closes on its own acceptance when a row above is removed during the wait', async() => {
    await editAndAlterDuringWait('7', () => core.alter('remove_row', 0));

    expect(core.getActiveEditor().state).not.toBe('STATE_WAITING');
    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCol(0)).toContain(7);
    // Where the value lands is core's write path, not the wait: the change keeps the visual row it was
    // made with, so it lands on the record that now sits there (a known limit, not pinned here).
  });

  it('reopens on its own rejection when a row above is removed during the wait', async() => {
    await editAndAlterDuringWait('-5', () => core.alter('remove_row', 0));

    expect(core.getActiveEditor().state).toBe('STATE_EDITING'); // reopened, not left waiting
    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCol(0)).toEqual([11, 12, 13, 14]);
  });

  it('takes the answer of an editor whose saveValue() writes without a source as its own', async() => {
    class SourcelessEditor extends TextEditor {
      saveValue(value) {
        this.hot.setDataAtCell(this.row, this.col, value[0][0]);
      }
    }
    const sources = [];

    core = createHot(container, {
      data: createData(3),
      columns: [{ editor: SourcelessEditor, validator: asyncNonNegative, allowInvalid: false }],
    });
    core.addHook('postAfterValidate', (valid, value, row, col, source) => {
      sources.push(source); // returns nothing, so the hook keeps `valid`
    });

    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('-5');
    core.getActiveEditor().finishEditing();
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();

    expect(sources).toEqual([undefined]);
    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCell(1, 0)).toBe(18);
  });

  it('waits for the first answer, as before, when an editor\'s saveValue() writes asynchronously', async() => {
    class DeferredSaveEditor extends TextEditor {
      saveValue(value) {
        const { row, col } = this;

        // eslint-disable-next-line handsontable/no-fixed-sleep-in-spec -- an async save, driven by fake timers
        setTimeout(() => this.hot.setDataAtCell(row, col, value[0][0]), 50);
      }
    }

    core = createHot(container, {
      data: createData(3),
      columns: [{ editor: DeferredSaveEditor, validator: asyncNonNegative, allowInvalid: false }],
    });

    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('-5');
    core.getActiveEditor().finishEditing();
    await flush();

    // Nothing was validated during the save, so the editor keeps waiting instead of closing with `true`.
    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(50); // the save writes
    await flush();
    jest.advanceTimersByTime(600); // its rejection
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCell(1, 0)).toBe(18);
  });

  /**
   * Builds a grid whose column validator answers after 600 ms and rejects negative numbers, confirms
   * `newValue` in an editor on (1, 0), and lets the save run.
   *
   * @param {string} newValue The value the editor confirms.
   * @param {object} [settings] Settings merged over the defaults.
   */
  async function confirmEdit(newValue, settings = {}) {
    core = createHot(container, {
      data: createData(4),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
      ...settings,
    });

    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue(newValue);
    core.getActiveEditor().finishEditing();
    await flush();
  }

  /**
   * A `saveValue()` override that writes the value into the row below the edited cell.
   */
  class WriteBelowEditor extends TextEditor {
    saveValue(value) {
      this.hot.setDataAtCell(this.row + 1, this.col, value[0][0], 'edit');
    }
  }

  const writeBelowColumn = {
    type: 'numeric', editor: WriteBelowEditor, validator: asyncNonNegative, allowInvalid: false,
  };

  /**
   * A `beforeChange` listener that moves an edit of (1, 0) to the row below.
   *
   * @param {Array} changes The changes.
   * @param {string} source The change source.
   */
  function moveEditBelow(changes, source) {
    if (source === 'edit') {
      changes.forEach((change) => {
        if (change && change[0] === 1 && change[1] === 0) {
          change[0] = 2;
        }
      });
    }
  }

  /**
   * A `beforeChange` listener that moves an edit of visual row 1 to visual row 2, in whatever column.
   *
   * @param {Array} changes The changes.
   * @param {string} source The change source.
   */
  function moveRowOneBelow(changes, source) {
    if (source === 'edit') {
      changes.forEach((change) => {
        if (change && change[0] === 1) {
          change[0] = 2;
        }
      });
    }
  }

  const validatedColumn = { type: 'numeric', validator: asyncNonNegative, allowInvalid: false };
  // Three columns of array data in the order [2, 0, 1]: the `prop` that `beforeValidate` names is the physical
  // column, not the visual one.
  const movedColumns = {
    data: Array.from({ length: 4 }, () => [18, 18, 18]),
    manualColumnMove: [2, 0, 1],
  };
  const movedRows = { manualRowMove: [3, 2, 1, 0] };

  it.each([
    ['a saveValue() override', { columns: [writeBelowColumn] }],
    ['a beforeChange listener', { beforeChange: moveEditBelow }],
    ['a saveValue() override over moved columns', {
      ...movedColumns, columns: [writeBelowColumn, writeBelowColumn, writeBelowColumn],
    }],
    ['a beforeChange listener over moved columns', {
      ...movedColumns, columns: [validatedColumn, validatedColumn, validatedColumn], beforeChange: moveRowOneBelow,
    }],
    ['a saveValue() override over moved rows', { ...movedRows, columns: [writeBelowColumn] }],
    ['a beforeChange listener over moved rows', { ...movedRows, beforeChange: moveRowOneBelow }],
  ])('waits for the moved write and reopens on its rejection when %s writes to another cell', async(_, settings) => {
    await confirmEdit('-5', settings);

    // The save validated (2, 0), not the edited cell, so no answer of the edited cell will come.
    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_EDITING');
    expect(core.getActiveEditor().isOpened()).toBe(true);
    expect(core.getActiveEditor().getValue()).toBe('-5');
    expect(core.getDataAtCol(0)).toEqual([18, 18, 18, 18]);
  });

  it.each([
    ['a saveValue() override', { columns: [writeBelowColumn] }],
    ['a beforeChange listener', { beforeChange: moveEditBelow }],
    ['a saveValue() override over moved columns', {
      ...movedColumns, columns: [writeBelowColumn, writeBelowColumn, writeBelowColumn],
    }],
    ['a beforeChange listener over moved columns', {
      ...movedColumns, columns: [validatedColumn, validatedColumn, validatedColumn], beforeChange: moveRowOneBelow,
    }],
    ['a saveValue() override over moved rows', { ...movedRows, columns: [writeBelowColumn] }],
    ['a beforeChange listener over moved rows', { ...movedRows, beforeChange: moveRowOneBelow }],
  ])('closes on the moved write\'s acceptance when %s writes to another cell', async(_, settings) => {
    await confirmEdit('7', settings);

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCol(0)).toEqual([18, 18, 7, 18]);
  });

  it('keeps waiting on a foreign answer when the save moved its write to another cell', async() => {
    await confirmEdit('-5', {
      beforeChange: moveEditBelow,
      cell: [{ row: 0, col: 0, validator: syncAccept }],
    });

    core.validateCell(1, core.getCellMeta(0, 0), () => {}, 'edit'); // a foreign `true`, answering first
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_EDITING');
    expect(core.getActiveEditor().getValue()).toBe('-5');
  });

  it('stays waiting during a Ctrl+Enter fill whose validator never answers the edited cell', async() => {
    // Known limit, pinned: the set is applied only once every cell of it answered, so with the edited cell
    // unanswered nothing is ever written, and no answer can end the editor's wait without losing its own
    // rejection under `allowInvalid: false`.
    core = createHot(container, {
      data: createData(5),
      columns: [{
        type: 'numeric',
        allowInvalid: false,
        validator(value, callback) {
          if (this.visualRow !== 1) {
            asyncNonNegative(value, callback);
          }
        },
      }],
    });

    core.selectCells([[1, 0, 3, 0]]);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing(false, true);
    await flush();
    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().state).toBe('STATE_WAITING');
    expect(core.getDataAtCol(0)).toEqual([18, 18, 18, 18, 18]);
  });

  it('ignores a later validation of the cell once the wait was canceled', async() => {
    let vetoes = 1;

    core = createHot(container, {
      data: createData(3),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
      beforeChange() {
        if (vetoes > 0) {
          vetoes -= 1;

          return false;
        }
      },
    });

    core.selectCell(1, 0);

    const editor = core.getActiveEditor();

    editor.beginEditing();
    editor.setValue('7');
    editor.finishEditing(); // the veto cancels the editor and its wait

    expect(editor.isOpened()).toBe(false);

    const discardEditor = jest.spyOn(editor, 'discardEditor');

    core.validateCell(-5, core.getCellMeta(1, 0), () => {}, 'edit');
    await flush();
    jest.advanceTimersByTime(600);
    await flush();

    expect(discardEditor).not.toHaveBeenCalled();
    expect(editor.isOpened()).toBe(false);
    expect(editor.state).toBe('STATE_VIRGIN');
  });
});
