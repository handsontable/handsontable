import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Lets the validator microtasks, and what their answers queue, run.
 */
async function flush() {
  for (let i = 0; i < 30; i++) {
    await Promise.resolve();
  }
}

/**
 * A validator that answers after 600 ms and rejects negative numbers.
 *
 * @param {*} value The validated value.
 * @param {Function} callback The validator callback.
 */
function async600(value, callback) {
  // eslint-disable-next-line handsontable/no-fixed-sleep-in-spec -- an async validator, driven by fake timers
  setTimeout(() => callback(Number(value) >= 0), 600);
}

/**
 * A validator that answers at once and rejects values above 100.
 *
 * @param {*} value The validated value.
 * @param {Function} callback The validator callback.
 */
function atMost100(value, callback) {
  callback(Number(value) <= 100);
}

/**
 * The edited column rejects under `allowInvalid: false`, so the Formulas plugin writes its value into the
 * engine only when the validator accepts it, and the dependent C2 is neither recalculated nor validated
 * while the editor waits. It used to be (its answer came first and the editor took it as its own); that
 * core-side guard is pinned without Formulas by `src/editors/baseEditor/__tests__/validationWaitOwnCell.unit.js`.
 */
describe('Formulas dependent validation and the editor wait', () => {
  let container;
  let hot;

  beforeEach(() => {
    jest.useFakeTimers('legacy');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  /**
   * @param {Function} column2Validator The validator of the dependent column.
   * @param {string} newValue The value confirmed in (1, 1).
   */
  async function editB2(column2Validator, newValue) {
    hot = new Handsontable(container, {
      data: [0, 1, 2, 3].map(i => [i, 18, `=B${i + 1}*2`]),
      columns: [{}, { type: 'numeric', validator: async600, allowInvalid: false },
        { type: 'numeric', validator: column2Validator }],
      formulas: { engine: HyperFormula },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.selectCell(1, 1);
    hot.getActiveEditor().beginEditing();
    hot.getActiveEditor().setValue(newValue);
    hot.getActiveEditor().finishEditing();
    await flush();
  }

  it('lets the edited cell\'s async rejection reopen the editor, with no dependent validated during the wait', async() => {
    const dependentValidator = jest.fn(atMost100);

    await editB2(dependentValidator, '-5');

    expect(hot.getActiveEditor().state).toBe('STATE_WAITING');
    expect(dependentValidator).not.toHaveBeenCalled();

    jest.advanceTimersByTime(600);
    await flush();

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getDataAtCell(1, 1)).toBe(18);
    expect(dependentValidator).not.toHaveBeenCalled();
  });

  it('does not reopen the editor when only the dependent is invalid', async() => {
    await editB2(atMost100, '60');
    jest.advanceTimersByTime(600);
    await flush();

    expect(hot.getActiveEditor().isOpened()).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(60);
    expect(hot.getCellMeta(1, 2).valid).toBe(false);
  });

  it('does not reopen on a dependent\'s rejection when the save moved its write to a cell that cannot reject', async() => {
    // A2 rejects under `allowInvalid: false`. The `beforeChange` listener moves its write to B2, whose validator
    // cannot reject (`allowInvalid: true`), so Formulas writes B2 at once and validates its dependent C2 during
    // the save. C2's answer comes first and is `false`, but C2 is not a cell the save wrote.
    hot = new Handsontable(container, {
      data: [0, 1, 2, 3].map(i => [i, 18, `=B${i + 1}*2`]),
      columns: [
        { type: 'numeric', validator: async600, allowInvalid: false },
        { type: 'numeric', validator: async600 },
        { type: 'numeric', validator: atMost100 },
      ],
      formulas: { engine: HyperFormula },
      beforeChange(changes, source) {
        if (source === 'edit') {
          changes.forEach((change) => {
            if (change && change[1] === 0) {
              change[1] = 1;
            }
          });
        }
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.selectCell(1, 0);
    hot.getActiveEditor().beginEditing();
    hot.getActiveEditor().setValue('60');
    hot.getActiveEditor().finishEditing();
    await flush();

    expect(hot.getCellMeta(1, 2).valid).toBe(false); // the dependent answered first, with a rejection
    expect(hot.getActiveEditor().state).toBe('STATE_WAITING');

    jest.advanceTimersByTime(600);
    await flush();

    expect(hot.getActiveEditor().isOpened()).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(60);
  });

  it('closes at once when the save moved its write to a cell without a validator, whatever its dependent answers', async() => {
    hot = new Handsontable(container, {
      data: [0, 1, 2, 3].map(i => [i, 18, `=B${i + 1}*2`]),
      columns: [
        { type: 'numeric', validator: async600, allowInvalid: false },
        { type: 'numeric' },
        { type: 'numeric', validator: atMost100 },
      ],
      formulas: { engine: HyperFormula },
      beforeChange(changes, source) {
        if (source === 'edit') {
          changes.forEach((change) => {
            if (change && change[1] === 0) {
              change[1] = 1;
            }
          });
        }
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.selectCell(1, 0);
    hot.getActiveEditor().beginEditing();
    hot.getActiveEditor().setValue('60');
    hot.getActiveEditor().finishEditing();
    await flush();

    expect(hot.getActiveEditor().state).not.toBe('STATE_WAITING');
    expect(hot.getActiveEditor().isOpened()).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(60);
    expect(hot.getCellMeta(1, 2).valid).toBe(false);
  });
});
