import Core from 'handsontable/core';
import { registerCellType } from 'handsontable/cellTypes/registry';
import { NumericCellType } from 'handsontable/cellTypes/numericType';
import { TextCellType } from 'handsontable/cellTypes/textType';
import { registerRenderer, baseRenderer, textRenderer, numericRenderer } from 'handsontable/renderers';
import { registerPlugin } from 'handsontable/plugins/registry';
import { ManualColumnMove } from 'handsontable/plugins/manualColumnMove';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerCellType(NumericCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);
registerRenderer(numericRenderer);
registerPlugin(ManualColumnMove);

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
    core.addHook('postAfterValidate', (valid, value, row, col, source) => answers.push([row, source]));

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
    core.addHook('postAfterValidate', (valid, value, row, col, source) => sources.push(source));

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
});
