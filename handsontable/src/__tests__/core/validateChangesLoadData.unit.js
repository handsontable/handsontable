import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * A change that waits for an async validator addresses the data the grid held when it was made. A
 * `loadData()` that replaces that data before the validator answers drops the change instead of
 * writing it into the loaded rows.
 */
describe('Core validation of a change when loadData() replaces the data', () => {
  let container;
  let hot;
  let pending;
  let edits;
  let validated;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
    pending = [];
    edits = [];
    validated = [];
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Creates a grid whose `name` validator holds every answer until the test releases it.
   *
   * @param {object} settings Extra grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [{ id: 'A', name: 'alice' }, { id: 'B', name: 'bob' }],
      columns: [
        { data: 'id' },
        {
          data: 'name',
          validator: (value, callback) => {
            pending.push({ value, answer: callback });
          },
        },
      ],
      afterChange: (changes, source) => {
        if (source === 'edit') {
          edits.push(changes);
        }
      },
      afterValidate: (isValid, value) => {
        validated.push([value, isValid]);
      },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Flushes the microtasks that defer the validation.
   */
  async function settle() {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  /**
   * Answers the held validator of the given value.
   *
   * @param {string} value The value the validator was asked about.
   * @param {boolean} [result=true] The validation result.
   */
  function answer(value, result = true) {
    const index = pending.findIndex(item => item.value === value);

    if (index === -1) {
      throw new Error(`No validator is waiting on "${value}"`);
    }

    const [{ answer: callback }] = pending.splice(index, 1);

    callback(result);
  }

  /**
   * Returns fresh rows that hold other records than the initial data.
   *
   * @returns {object[]}
   */
  function otherRecords() {
    return [{ id: 'X', name: 'xavier' }, { id: 'Y', name: 'yolanda' }];
  }

  it('should write the change when no load lands before the validator answers', async() => {
    createGrid();

    hot.setDataAtCell(0, 1, 'typed');
    await settle();
    answer('typed');

    expect(hot.getSourceData()).toEqual([{ id: 'A', name: 'typed' }, { id: 'B', name: 'bob' }]);
    expect(edits).toEqual([[[0, 'name', 'alice', 'typed']]]);
  });

  it('should drop the change when loadData() replaces the data before the validator answers', async() => {
    createGrid();

    const loaded = otherRecords();

    hot.setDataAtCell(0, 1, 'typed');
    await settle();
    hot.loadData(loaded);
    answer('typed');

    expect(loaded).toEqual(otherRecords());
    expect(hot.getDataAtCell(0, 1)).toBe('xavier');
    expect(edits).toEqual([]);
    expect(validated).toEqual([['typed', true]]);
  });

  it('should drop the change when loadData() runs in the same task as the write', async() => {
    createGrid();

    const loaded = otherRecords();

    hot.setDataAtCell(0, 1, 'typed');
    hot.loadData(loaded);
    await settle();
    answer('typed');

    expect(loaded).toEqual(otherRecords());
    expect(edits).toEqual([]);
  });

  it('should drop the change of a synchronous validator when loadData() runs in the same task', async() => {
    createGrid({
      columns: [{ data: 'id' }, { data: 'name', validator: (value, callback) => callback(true) }],
    });

    const loaded = otherRecords();

    hot.setDataAtCell(0, 1, 'typed');
    hot.loadData(loaded);
    await settle();

    expect(loaded).toEqual(otherRecords());
    expect(edits).toEqual([]);
  });

  it('should not mark a loaded record invalid when loadData() runs from beforeValidate', async() => {
    let loaded = null;

    createGrid({
      beforeValidate() {
        if (!loaded) {
          loaded = otherRecords();
          hot.loadData(loaded);
        }
      },
    });

    hot.setDataAtRowProp([[0, 'name', 'bad'], [1, 'name', 'worse']]);
    await settle();
    pending.splice(0).forEach(({ answer: callback }) => callback(false));

    expect(hot.getCellMeta(0, 1).valid).not.toBe(false);
    expect(hot.getCellMeta(1, 1).valid).not.toBe(false);
    expect(loaded).toEqual(otherRecords());
    expect(edits).toEqual([]);
  });

  it.each(['beforeChange', 'afterSetDataAtCell'])(
    'should drop an accepted change when loadData() runs from a %s listener of the change', async(hookName) => {
      let loaded = null;

      createGrid({
        [hookName]() {
          if (!loaded) {
            loaded = otherRecords();
            hot.loadData(loaded);
          }
        },
      });

      hot.setDataAtCell(0, 1, 'typed');
      await settle();

      expect(pending).toEqual([]);
      expect(loaded).toEqual(otherRecords());
      expect(edits).toEqual([]);
      expect(hot._hasPendingValidation()).toBe(false);
    });

  it('should drop the correction a validator writes for a change that loadData() dropped', async() => {
    const corrections = [];

    createGrid({
      columns: [
        { data: 'id' },
        {
          data: 'name',
          validator(value, callback) {
            if (typeof value === 'string' && value !== value.toUpperCase()) {
              this.instance.setDataAtCell(this.visualRow, this.visualCol, value.toUpperCase(), 'upperCaseValidator');
            }

            callback(true);
          },
        },
      ],
      afterChange(changes, source) {
        if (source === 'upperCaseValidator') {
          corrections.push(changes);
        }
      },
    });

    hot.setDataAtCell(0, 1, 'hello');
    hot.loadData(otherRecords());
    await settle();

    expect(hot.getSourceData()).toEqual(otherRecords());
    expect(corrections).toEqual([]);
  });

  it('should not validate the correction of a dropped change against the loaded record', async() => {
    const asked = [];

    createGrid({
      columns: [
        { data: 'id' },
        {
          data: 'name',
          validator(value, callback) {
            asked.push(value);

            if (value === 'hello') {
              this.instance.setDataAtCell(this.visualRow, this.visualCol, 'HELLO', 'upperCaseValidator');
              callback(true);
            } else {
              callback(false);
            }
          },
        },
      ],
    });

    hot.setDataAtCell(0, 1, 'hello');
    hot.loadData(otherRecords());
    await settle();

    expect(asked).toEqual(['hello']);
    expect(hot.getCellMeta(0, 1).valid).not.toBe(false);
    expect(hot._hasPendingValidation()).toBe(false);
  });

  it('should tell the dropped-changes listeners about the dropped set, once each', async() => {
    createGrid();

    const heard = [];
    const removedListener = jest.fn();
    const listener = (changes, source) => heard.push([changes, source]);
    let written = null;

    hot.addHook('afterSetDataAtCell', (changes) => {
      written = changes;
    });
    hot._addDroppedChangesListener(listener);
    hot._addDroppedChangesListener(listener);
    hot._addDroppedChangesListener(removedListener);
    hot._removeDroppedChangesListener(removedListener);

    hot.setDataAtCell(0, 1, 'typed', 'appEdit');
    await settle();
    hot.loadData(otherRecords());
    answer('typed');

    expect(heard).toHaveLength(1);
    expect(heard[0][0]).toBe(written);
    expect(heard[0][1]).toBe('appEdit');
    expect(removedListener).not.toHaveBeenCalled();
  });

  it('should tell the dropped-changes listeners which changes a validator rejected', async() => {
    createGrid({ allowInvalid: false });

    const heard = [];
    let written = null;

    hot.addHook('afterSetDataAtCell', (changes) => {
      written = [...changes];
    });
    hot._addDroppedChangesListener((changes, source, rejectedChanges) => {
      heard.push([[...changes], rejectedChanges]);
    });

    hot.setDataAtCell([[0, 1, 'kept'], [1, 1, 'rejected']], 'edit');
    await settle();
    hot.loadData(otherRecords());
    answer('rejected', false);
    answer('kept');
    await settle();

    expect(heard).toHaveLength(1);
    expect(heard[0][0]).toEqual([written[0]]);
    expect(heard[0][1]).toEqual([written[1]]);
    expect(heard[0][1][0]).toBe(written[1]);
  });

  /**
   * Creates a grid whose `name` validator corrects `typed` to `Typed` later than its own run, the way a
   * validator that asks a server does, and answers once it wrote the correction.
   *
   * @param {string[]} calls Collects the values the validator is called with.
   * @param {object} [settings] Extra grid settings.
   * @returns {Function[]} The held corrections, each writing its correction and then answering.
   */
  function createGridWithLateCorrection(calls, settings = {}) {
    const corrections = [];

    createGrid({
      ...settings,
      columns: [
        { data: 'id' },
        {
          data: 'name',
          validator(value, callback) {
            calls.push(value);

            if (value !== 'typed') {
              callback(true);

              return;
            }

            corrections.push(() => {
              this.instance.setDataAtCell(this.visualRow, this.visualCol, 'Typed', 'nameValidator');
              callback(true);
            });
          },
        },
      ],
    });

    return corrections;
  }

  it('should drop a correction a validator writes later than its run when loadData() dropped the change', async() => {
    const calls = [];
    const corrections = createGridWithLateCorrection(calls);

    hot.setDataAtCell(0, 1, 'typed', 'edit');
    await settle();
    hot.loadData(otherRecords());
    corrections.forEach(correct => correct());
    await settle();

    expect(hot.getDataAtCol(1)).toEqual(['xavier', 'yolanda']);
    expect(calls).toEqual(['typed']);
    expect(edits).toEqual([]);
  });

  it('should drop a late correction of a change that loadData() from beforeValidate dropped', async() => {
    const calls = [];
    let loaded = null;
    const corrections = createGridWithLateCorrection(calls, {
      beforeValidate() {
        if (!loaded) {
          loaded = otherRecords();
          hot.loadData(loaded);
        }
      },
    });

    hot.setDataAtCell(0, 1, 'typed', 'edit');
    await settle();
    corrections.forEach(correct => correct());
    await settle();

    expect(loaded).toEqual(otherRecords());
    expect(calls).toEqual(['typed']);
    expect(edits).toEqual([]);
    expect(hot._hasPendingValidation()).toBe(false);
  });

  it('should write a correction a validator writes later than its run when no load lands', async() => {
    const calls = [];
    const corrections = createGridWithLateCorrection(calls);

    hot.setDataAtCell(0, 1, 'typed', 'edit');
    await settle();
    corrections.forEach(correct => correct());
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('Typed');
    expect(calls).toEqual(['typed', 'Typed']);
    expect(edits).toHaveLength(1);
  });

  it('should write a change made after the load and drop the one made before it', async() => {
    createGrid();

    const loaded = otherRecords();

    hot.setDataAtCell(0, 1, 'stale');
    await settle();
    hot.loadData(loaded);
    hot.setDataAtCell(1, 1, 'fresh');
    await settle();
    answer('fresh');
    answer('stale');

    expect(loaded).toEqual([{ id: 'X', name: 'xavier' }, { id: 'Y', name: 'fresh' }]);
    expect(edits).toEqual([[[1, 'name', 'yolanda', 'fresh']]]);
  });

  it('should drop the change when _applySettingsAndData() loads other data before the validator answers', async() => {
    createGrid();

    const loaded = otherRecords();

    hot.setDataAtCell(0, 1, 'typed');
    await settle();
    hot._applySettingsAndData({}, loaded, 'test');
    answer('typed');

    expect(loaded).toEqual(otherRecords());
    expect(edits).toEqual([]);
  });

  it('should keep writing the change when updateData() replaces the array before the validator answers', async() => {
    createGrid();

    const updated = [{ id: 'A', name: 'alice' }, { id: 'B', name: 'bob' }];

    hot.setDataAtCell(0, 1, 'typed');
    await settle();
    hot.updateData(updated);
    answer('typed');

    expect(updated).toEqual([{ id: 'A', name: 'typed' }, { id: 'B', name: 'bob' }]);
    expect(edits).toEqual([[[0, 'name', 'alice', 'typed']]]);
  });

  describe('an editor waiting for the validator', () => {
    /**
     * Opens the editor on a `name` cell, types a value, and confirms it, so the editor waits for the
     * validator.
     *
     * @param {string} value The typed value.
     * @param {number} [row=0] The visual row.
     */
    async function confirmEdit(value, row = 0) {
      hot.selectCell(row, 1);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().setValue(value);
      hot.getActiveEditor().finishEditing();
      await settle();
    }

    it('should not take the stale answer of a dropped edit as the answer to the next one', async() => {
      createGrid({ allowInvalid: false });
      await confirmEdit('first');
      hot.loadData(otherRecords());
      await confirmEdit('second', 1);

      expect(hot.getActiveEditor().isWaiting()).toBe(true);

      answer('first', true);

      expect(hot.getActiveEditor().isWaiting()).toBe(true);

      answer('second', false);

      expect(hot.getActiveEditor().isOpened()).toBe(true);
      expect(hot.getActiveEditor().getValue()).toBe('second');
    });

    it('should not reopen the next edit on the stale rejection of a dropped one', async() => {
      createGrid({ allowInvalid: false });
      await confirmEdit('first');
      hot.loadData(otherRecords());
      await confirmEdit('second', 1);
      answer('first', false);

      expect(hot.getActiveEditor().isWaiting()).toBe(true);

      answer('second', true);

      expect(hot.getActiveEditor().isOpened()).toBe(false);
      expect(hot.getDataAtCell(1, 1)).toBe('second');
    });

    it('should keep an editor opened on the same cell after the load when the dropped edit is answered', async() => {
      createGrid();
      await confirmEdit('typed');
      hot.loadData(otherRecords());
      hot.selectCell(0, 1);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().setValue('again');
      answer('typed', true);

      expect(hot.getActiveEditor().isOpened()).toBe(true);
      expect(hot.getActiveEditor().getValue()).toBe('again');
      expect(hot.getDataAtCell(0, 1)).toBe('xavier');
    });

    it('should not take an answer of a set dropped from beforeValidate as the next edit\'s answer', async() => {
      let loaded = null;

      createGrid({
        allowInvalid: false,
        beforeValidate() {
          if (!loaded) {
            loaded = otherRecords();
            hot.loadData(loaded);
          }
        },
      });

      hot.setDataAtCell(0, 1, 'dropped');
      await settle();

      expect(hot._hasPendingValidation()).toBe(false);

      await confirmEdit('second', 1);
      answer('dropped', false);

      expect(hot.getActiveEditor().isWaiting()).toBe(true);

      answer('second', true);

      expect(hot.getActiveEditor().isOpened()).toBe(false);
      expect(hot.getDataAtCell(1, 1)).toBe('second');
    });

    it('should remove its validation listener when the load ends the wait', async() => {
      createGrid();
      await confirmEdit('typed');

      expect(hot.hasHook('postAfterValidate')).toBe(true);

      hot.loadData(otherRecords());

      expect(hot.hasHook('postAfterValidate')).toBe(false);
    });

    it('should prepare the editor against the loaded data after the load closed a waiting one', async() => {
      createGrid();
      await confirmEdit('typed');
      hot.selectCell(1, 1);

      const finishCallback = jest.fn();

      hot.getActiveEditor().finishEditing(false, false, finishCallback);
      hot.loadData(otherRecords());

      expect(finishCallback).toHaveBeenCalledWith(false);

      hot._getEditorManager().openEditor(null, null, true);

      expect(hot.getActiveEditor().row).toBe(1);
      expect(hot.getActiveEditor().getValue()).toBe('yolanda');
    });

    it('should stay closed when loadData() runs from a beforeChange listener of its own save', async() => {
      let loaded = null;

      createGrid({
        allowInvalid: false,
        beforeChange() {
          if (!loaded) {
            loaded = otherRecords();
            hot.loadData(loaded);
          }
        },
      });

      await confirmEdit('typed');

      expect(pending).toEqual([]);
      expect(hot.getActiveEditor().state).toBe('STATE_VIRGIN');
      expect(hot.getActiveEditor().isOpened()).toBe(false);
    });

    it('should stay closed when an unchanged confirm is rejected after the load', async() => {
      createGrid({ allowInvalid: false });
      hot.selectCell(0, 1);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().finishEditing();
      await settle();

      expect(hot.getActiveEditor().isWaiting()).toBe(true);

      hot.loadData(otherRecords());

      expect(pending).toHaveLength(1);

      pending.splice(0).forEach(({ answer: callback }) => callback(false));

      expect(hot.getActiveEditor().isOpened()).toBe(false);
      expect(hot.getActiveEditor().state).toBe('STATE_VIRGIN');
    });

    it('should leave an editor that is not waiting alone', () => {
      createGrid();
      hot.selectCell(0, 1);
      hot.getActiveEditor().beginEditing();

      expect(hot.getActiveEditor()._endValidationWait()).toBeNull();
      expect(hot.getActiveEditor().state).toBe('STATE_EDITING');
      expect(hot.getActiveEditor().isOpened()).toBe(true);
    });

    it('should close when loadData() replaces the data', async() => {
      createGrid();
      await confirmEdit('typed');

      expect(hot.getActiveEditor().isWaiting()).toBe(true);

      hot.loadData(otherRecords());

      expect(hot.getActiveEditor().isWaiting()).toBe(false);
      expect(hot.getActiveEditor().isOpened()).toBe(false);
    });

    it('should stay closed when the validator rejects the value after the load', async() => {
      createGrid({ allowInvalid: false });

      const loaded = otherRecords();

      await confirmEdit('typed');
      hot.loadData(loaded);
      answer('typed', false);

      expect(hot.getActiveEditor().isOpened()).toBe(false);
      expect(hot.getActiveEditor().state).toBe('STATE_VIRGIN');
      expect(loaded).toEqual(otherRecords());
    });

    it('should reopen on a rejected value when no load lands before the validator answers', async() => {
      createGrid({ allowInvalid: false });

      await confirmEdit('typed');
      answer('typed', false);

      expect(hot.getActiveEditor().isOpened()).toBe(true);
      expect(hot.getActiveEditor().getValue()).toBe('typed');
      expect(hot.getDataAtCell(0, 1)).toBe('alice');
    });
  });
});
