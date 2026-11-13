import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * A change that waits for its validator is written to the COLUMN it was made on, whatever happens to the
 * columns before the validator answers: a move, an insert, or a removal.
 */
describe('Core validation of a change while its column moves', () => {
  let container;
  let hot;
  let pending;
  let applied;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
    pending = [];
    applied = [];
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Holds every answer until the test releases it.
   *
   * @param {*} value The validated value.
   * @param {Function} callback The validator callback.
   */
  function heldValidator(value, callback) {
    pending.push({ value, answer: callback });
  }

  /**
   * A validator that holds its answer and then corrects `zzz` to `ZZZ` through its own `this.visualRow` and
   * `this.visualCol`, the way a validator written against the cell meta does.
   *
   * @param {*} value The validated value.
   * @param {Function} callback The validator callback.
   */
  function correctingValidator(value, callback) {
    pending.push({
      value,
      answer: (result) => {
        if (value === 'zzz') {
          this.instance.setDataAtCell(this.visualRow, this.visualCol, 'ZZZ', 'upperValidator');
        }

        callback(result);
      },
    });
  }

  /**
   * Creates a grid of three rows and three columns, `r<row>c<column>`, whose column 1 is validated.
   *
   * @param {object} settings Extra grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (__, col) => `r${row}c${col}`)),
      cells: (row, col) => (col === 1 ? { validator: heldValidator } : {}),
      manualColumnMove: true,
      afterChange: (changes, source) => {
        if (source !== 'loadData' && changes) {
          applied.push(changes.map(change => [...change]));
        }
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
   * Answers every held validator, in the order they were asked.
   *
   * @param {boolean} [result=true] The validation result.
   */
  async function answerAll(result = true) {
    await settle();
    pending.splice(0).forEach(({ answer }) => answer(result));
    await settle();
  }

  /**
   * Reads the source data of one record.
   *
   * @param {number} physicalRow The physical row.
   * @returns {Array}
   */
  function sourceRow(physicalRow) {
    return hot.getSourceDataAtRow(physicalRow);
  }

  describe('a move of the visual columns', () => {
    it('should write the value to the edited column when the column is moved before the validator answers', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.getPlugin('manualColumnMove').moveColumn(1, 0);
      hot.render();
      await answerAll();

      expect(sourceRow(1)).toEqual(['r1c0', 'edit', 'r1c2']);
    });

    it('should write the correction made through this.visualCol to the edited column after a column move', async() => {
      createGrid({
        cells: (row, col) => (col === 1 ? { validator: correctingValidator } : {}),
      });

      hot.setDataAtCell(1, 1, 'zzz');
      hot.getPlugin('manualColumnMove').moveColumn(1, 0);
      await answerAll();
      await answerAll();

      expect(sourceRow(1)).toEqual(['r1c0', 'ZZZ', 'r1c2']);
    });

    it('should report in afterChange the property of the edited column, which names its visual column now', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.getPlugin('manualColumnMove').moveColumn(1, 0);
      await answerAll();

      const change = applied[applied.length - 1][0];

      expect(change.slice(2)).toEqual(['r1c1', 'edit']);
      expect(hot.propToCol(change[1])).toBe(0);
    });
  });

  describe('an insert or a removal of columns', () => {
    it('should write the value to the edited column when a column is inserted before it', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.alter('insert_col_start', 0);
      await answerAll();

      expect(sourceRow(1)).toEqual([null, 'r1c0', 'edit', 'r1c2']);
    });

    it('should write the value to the edited column when a column is inserted after it', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.alter('insert_col_start', 2);
      await answerAll();

      expect(sourceRow(1)).toEqual(['r1c0', 'edit', null, 'r1c2']);
    });

    it('should write the value to the edited column when a column before it is removed', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.alter('remove_col', 0);
      await answerAll();

      expect(sourceRow(1)).toEqual(['edit', 'r1c2']);
    });

    it('should write the value to the edited column when a column after it is removed', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.alter('remove_col', 2);
      await answerAll();

      expect(sourceRow(1)).toEqual(['r1c0', 'edit']);
    });

    it('should drop the change when the edited column is removed', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'edit');
      hot.alter('remove_col', 1);
      await answerAll();

      expect(sourceRow(1)).toEqual(['r1c0', 'r1c2']);
      expect(applied).toEqual([]);
    });

    it('should apply the changes of the columns that are left when one column of a set is removed', async() => {
      createGrid({ cells: () => ({ validator: heldValidator }) });

      hot.populateFromArray(0, 0, [['a', 'b', 'c']]);
      hot.alter('remove_col', 1);
      await answerAll();

      expect(sourceRow(0)).toEqual(['a', 'c']);
    });

    it('should write the correction made through this.visualCol to the edited column after a column is inserted before it', async() => {
      createGrid({
        cells: (row, col) => (col === 1 ? { validator: correctingValidator } : {}),
      });

      hot.setDataAtCell(1, 1, 'zzz');
      hot.alter('insert_col_start', 0);
      await answerAll();
      await answerAll();

      expect(sourceRow(1)).toEqual([null, 'r1c0', 'ZZZ', 'r1c2']);
    });
  });

  describe('a hidden column', () => {
    it('should write the value to the edited column when it is hidden before the validator answers', async() => {
      createGrid({ hiddenColumns: true });

      hot.setDataAtCell(1, 1, 'edit');
      hot.getPlugin('hiddenColumns').hideColumn(1);
      await answerAll();

      expect(sourceRow(1)).toEqual(['r1c0', 'edit', 'r1c2']);
    });
  });

  describe('two writes to one cell', () => {
    it('should let the newer write win when a column is inserted between them and the answers come reversed', async() => {
      createGrid();

      hot.setDataAtCell(1, 1, 'first');
      hot.alter('insert_col_start', 0);
      hot.setDataAtCell(1, 2, 'second');
      await settle();

      const answers = pending.splice(0);

      answers.reverse().forEach(({ answer }) => answer(true));
      await settle();

      expect(sourceRow(1)).toEqual([null, 'r1c0', 'second', 'r1c2']);
    });
  });

  describe('object data', () => {
    it('should keep writing to the property when the columns are moved', async() => {
      createGrid({
        data: [{ a: 'a0', b: 'b0' }],
        columns: [{ data: 'a' }, { data: 'b', validator: heldValidator }],
        cells: undefined,
      });

      hot.setDataAtRowProp(0, 'b', 'edit');
      hot.getPlugin('manualColumnMove').moveColumn(1, 0);
      await answerAll();

      expect(hot.getSourceDataAtRow(0)).toEqual({ a: 'a0', b: 'edit' });
    });
  });
});
