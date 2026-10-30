import Handsontable from 'handsontable';

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
      licenseKey: 'non-commercial-and-evaluation',
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

  it('should drop the change after a load even when the validator rejects it', async() => {
    createGrid({ allowInvalid: false });

    const loaded = otherRecords();

    hot.setDataAtCell(0, 1, 'typed');
    await settle();
    hot.loadData(loaded);
    answer('typed', false);

    expect(loaded).toEqual(otherRecords());
    expect(edits).toEqual([]);
    expect(validated).toEqual([['typed', false]]);
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
     * Opens the editor on cell (0, 1), types a value, and confirms it, so the editor waits for the validator.
     *
     * @param {string} value The typed value.
     */
    async function confirmEdit(value) {
      hot.selectCell(0, 1);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().setValue(value);
      hot.getActiveEditor().finishEditing();
      await settle();
    }

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
