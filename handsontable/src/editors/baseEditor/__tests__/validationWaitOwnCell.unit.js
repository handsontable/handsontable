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

    data[11][0] = -5;

    core = createHot(container, {
      data,
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
    });

    core.validateCells(); // the batch is in flight, its first answer (row 11) will be `false`
    await flush();
    jest.advanceTimersByTime(300);
    core.selectCell(1, 0);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing();
    await flush();
    jest.advanceTimersByTime(300); // the batch answers, the edited cell's validator still runs
    await flush();

    // The batch's `false` for row 11 arrives first and must not reopen the editor.
    expect(core.getActiveEditor().isOpened()).toBe(false);

    jest.advanceTimersByTime(300); // the edited cell's own answer
    await flush();

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
    core = createHot(container, {
      data: createData(5),
      columns: [{ type: 'numeric', validator: asyncNonNegative, allowInvalid: false }],
    });

    core.selectCells([[1, 0, 3, 0]]);
    core.getActiveEditor().beginEditing();
    core.getActiveEditor().setValue('7');
    core.getActiveEditor().finishEditing(false, true); // three answers, the own one is (1, 0)
    await flush();
    jest.advanceTimersByTime(600);
    await flush();

    expect(core.getActiveEditor().isOpened()).toBe(false);
    expect(core.getDataAtCol(0).slice(1, 4)).toEqual([7, 7, 7]);
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
