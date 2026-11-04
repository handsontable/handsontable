import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * `validateCells()`, `validateRows()` and `validateColumns()` validate a choice cell on the value it
 * STORES, the form an edit validates. A choice type's own `valueGetter` turns that value into the text
 * the cell shows - a key/value entry into its label, a multiselect array into a joined string - and the
 * validators of those types check the stored form, so validating the getter's output marked every such
 * cell invalid, while an edit of the same cell left it valid. A `valueGetter` a column configures itself
 * keeps its output validated, as before.
 */
describe('Core bulk validation of the stored value', () => {
  const KEY_VALUE_SOURCE = [{ key: 'a', value: 'Alpha' }, { key: 'b', value: 'Beta' }];
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
    }

    container.remove();
  });

  /**
   * Builds a one-cell grid.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, { licenseKey: TEST_LICENSE_KEY, ...settings });

    return hot;
  }

  /**
   * Runs one of the bulk validation methods and resolves with the result it reports, and the `valid`
   * flag the cell meta of cell (0, 0) carries afterwards.
   *
   * @param {string} method `validateCells`, `validateRows` or `validateColumns`.
   * @returns {Promise<{ valid: boolean, cellValid: boolean | undefined }>}
   */
  function validate(method) {
    return new Promise((resolve) => {
      const done = (valid) => {
        resolve({ valid, cellValid: hot.getCellMeta(0, 0).valid });
      };

      if (method === 'validateCells') {
        hot.validateCells(done);
      } else {
        hot[method]([0], done);
      }
    });
  }

  const VALID_CELLS = [
    {
      name: 'a key/value entry in a column whose type is the autocomplete cell type object',
      settings: {
        data: [[{ key: 'a', value: 'Alpha' }]],
        columns: [{ type: Handsontable.cellTypes.getCellType('autocomplete'), source: KEY_VALUE_SOURCE, strict: true }],
      },
    },
    {
      name: 'a key/value entry in a strict autocomplete column',
      settings: {
        data: [[{ key: 'a', value: 'Alpha' }]],
        columns: [{ type: 'autocomplete', source: KEY_VALUE_SOURCE, strict: true }],
      },
    },
    {
      name: 'a key/value entry in a dropdown column',
      settings: {
        data: [[{ key: 'a', value: 'Alpha' }]],
        columns: [{ type: 'dropdown', source: KEY_VALUE_SOURCE }],
      },
    },
    {
      name: 'a multiselect value with a string source',
      settings: {
        data: [[['Alpha', 'Beta']]],
        columns: [{ type: 'multiselect', source: ['Alpha', 'Beta'] }],
      },
    },
    {
      name: 'a multiselect value with a key/value source',
      settings: {
        data: [[[{ key: 'a', value: 'Alpha' }]]],
        columns: [{ type: 'multiselect', source: KEY_VALUE_SOURCE }],
      },
    },
  ];

  ['validateCells', 'validateRows', 'validateColumns'].forEach((method) => {
    describe(method, () => {
      VALID_CELLS.forEach(({ name, settings }) => {
        it(`keeps ${name} valid`, async() => {
          createGrid(settings);

          await expect(validate(method)).resolves.toEqual({ valid: true, cellValid: true });
        });
      });

      it('still marks a value the strict source does not hold as invalid', async() => {
        createGrid({
          data: [[{ key: 'z', value: 'Zeta' }]],
          columns: [{ type: 'autocomplete', source: KEY_VALUE_SOURCE, strict: true }],
        });

        await expect(validate(method)).resolves.toEqual({ valid: false, cellValid: false });
      });
    });
  });

  it('agrees with the validation of an edit of the same cell', async() => {
    createGrid({
      data: [[null]],
      columns: [{ type: 'autocomplete', source: KEY_VALUE_SOURCE, strict: true }],
    });

    await new Promise((resolve) => {
      hot.addHookOnce('afterChange', resolve);
      hot.setDataAtCell(0, 0, { key: 'b', value: 'Beta' });
    });

    expect(hot.getCellMeta(0, 0).valid).toBe(true);
    await expect(validate('validateCells')).resolves.toEqual({ valid: true, cellValid: true });
  });

  it('hands a validator the output of a valueGetter the column configures itself', async() => {
    const received = [];

    createGrid({
      data: [[{ amount: 5 }]],
      columns: [{
        valueGetter: value => `${value.amount} pcs`,
        valueSetter: value => ({ amount: parseInt(value, 10) }),
        validator(value, callback) {
          received.push(value);
          callback(true);
        },
      }],
    });

    await validate('validateCells');

    expect(received).toEqual(['5 pcs']);
  });

  it('keeps a numeric cell valid when its own valueGetter shows a number the cell stores in an object', async() => {
    // The validator was written against what the getter shows: an edit of the cell validates the
    // number the user typed, not the object the cell stores. The numeric type brings a `valueSetter`
    // of its own, so the presence of a setter cannot decide this.
    createGrid({
      data: [[{ amount: 5 }]],
      columns: [{
        type: 'numeric',
        valueGetter: value => value.amount,
      }],
    });

    await expect(validate('validateCells')).resolves.toEqual({ valid: true, cellValid: true });
  });

  it('still validates the value a modifyData listener reads', async() => {
    const received = [];

    createGrid({
      data: [['stored']],
      columns: [{
        validator(value, callback) {
          received.push(value);
          callback(true);
        },
      }],
      modifyData(row, column, valueHolder, ioMode) {
        if (ioMode === 'get') {
          valueHolder.value = 'modified';
        }
      },
    });

    await validate('validateCells');

    expect(received).toEqual(['modified']);
  });
});
