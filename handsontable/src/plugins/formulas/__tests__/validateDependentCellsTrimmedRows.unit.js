import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { TrimRows } from '../../trimRows';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * HyperFormula holds the trimmed rows and columns too, so the engine address of a dependent is its
 * visual address plus the number of trimmed lines before it. The validation of the dependents of a
 * write has to translate that address before it reads the cell, or the validator runs on an unrelated
 * cell, the real dependent gets no `valid` flag, and a dependent past the visible size is skipped.
 */
describe('Formulas validation of the dependents of a write in a trimmed grid', () => {
  const ROWS = 10;
  let containers;
  let grids;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(TrimRows);
  });

  beforeEach(() => {
    containers = [];
    grids = [];
  });

  afterEach(() => {
    grids.forEach(grid => grid.destroy());
    containers.forEach(container => container.remove());
  });

  /**
   * Builds a grid on the engine.
   *
   * @param {object} settings The grid settings.
   * @returns {object} The grid.
   */
  function buildGrid(settings) {
    const container = document.createElement('div');

    document.body.appendChild(container);
    containers.push(container);

    const hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    grids.push(hot);

    return hot;
  }

  /**
   * Waits until the Core and the validators applied the pending work.
   *
   * @returns {Promise<void>}
   */
  function settle() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Builds the rows `[A, B, C]` with `A` = 1..10, `B` = 100 and `C` = `=A+B`, and a sum row after them.
   *
   * @param {number} [leadingColumns] The number of extra leading columns (the trimmed ones).
   * @returns {Array[]}
   */
  function createData(leadingColumns = 0) {
    const leading = new Array(leadingColumns).fill('x');
    const [a, b, c] = ['A', 'B', 'C', 'D', 'E'].slice(leadingColumns);
    const rows = [];

    for (let row = 0; row < ROWS; row++) {
      rows.push([...leading, row + 1, 100, `=${a}${row + 1}+${b}${row + 1}`]);
    }

    rows.push([...leading, null, null, `=SUM(${c}1:${c}${ROWS})`]);

    return rows;
  }

  /**
   * Builds the grid of the ticket: the column `C` rejects every value from 120 up.
   *
   * @param {object} [settings] The extra grid settings.
   * @returns {{ hot: object, validated: Array<number[]> }} The grid and the `[row, column, isValid]` of every validation of `C`.
   */
  function buildValidatedGrid(settings = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const validated = [];
    const hot = buildGrid({
      data: createData(),
      columns: [{}, {}, { validator: (value, callback) => callback(value < 120) }],
      formulas: { engine },
      afterValidate: (isValid, value, row, prop) => {
        if (prop === 2) {
          validated.push([row, prop, isValid]);
        }
      },
      ...settings,
    });

    return { hot, validated };
  }

  /**
   * Reads the `valid` flag of a cell.
   *
   * @param {object} hot The grid.
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {boolean|undefined}
   */
  function validFlag(hot, row, column) {
    return hot.getCellMeta(row, column).valid;
  }

  it('flags the dependents of a write the same way when no row is trimmed', async() => {
    const { hot, validated } = buildValidatedGrid();

    hot.setDataAtCell(5, 0, 50);

    await settle();

    expect(validFlag(hot, 5, 2)).toBe(false);
    expect(validFlag(hot, 10, 2)).toBe(false);
    expect(validated.map(([row]) => row).sort((a, b) => a - b)).toEqual([5, 10]);
  });

  it('validates the dependents, not an unrelated cell, when rows are trimmed', async() => {
    const { hot, validated } = buildValidatedGrid({ trimRows: [0, 1] });

    expect(hot.countRows()).toBe(9);

    // Visual row 3 is the physical row 5, so `C` there is 150 and the sum row is 1099.
    hot.setDataAtCell(3, 0, 50);

    await settle();

    expect(validFlag(hot, 3, 2)).toBe(false);
    expect(validFlag(hot, 8, 2)).toBe(false);
    // The visual row 5 is the physical row 7, which nothing changed.
    expect(validFlag(hot, 5, 2)).toBeUndefined();
    expect(validated.map(([row]) => row).sort((a, b) => a - b)).toEqual([3, 8]);
    expect(validated.every(([, , isValid]) => isValid === false)).toBe(true);
  });

  it('skips a dependent on a trimmed row and still validates the visible one', async() => {
    const { hot, validated } = buildValidatedGrid({ trimRows: [0, 1] });

    // The physical row 0 is trimmed: its `C` and the sum row are the dependents.
    hot.setSourceDataAtCell(0, 0, 50);

    await settle();

    expect(validFlag(hot, 8, 2)).toBe(false);
    expect(validated.map(([row]) => row)).toEqual([8]);
  });

  it('translates the dependents of another sheet through the grid bound to that sheet', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const validated = [];

    buildGrid({
      data: createData(),
      columns: [{}, {}, {}],
      formulas: { engine, sheetName: 'Sheet1' },
    });

    const second = buildGrid({
      data: createData().map((row, index) => [index < ROWS ? `=Sheet1!A${index + 1}+Sheet1!B${index + 1}` : null]),
      columns: [{ validator: (value, callback) => callback(value === null || value < 120) }],
      formulas: { engine, sheetName: 'Sheet2' },
      trimRows: [0, 1],
      afterValidate: (isValid, value, row) => {
        validated.push([row, isValid]);
      },
    });
    const first = grids[0];

    // Writes the engine row 5 of the first sheet, which the second sheet reads at its own engine row 5.
    first.setDataAtCell(5, 0, 50);

    await settle();

    // The engine row 5 of the second sheet is its visual row 3 (two rows are trimmed there).
    expect(validFlag(second, 3, 0)).toBe(false);
    expect(validFlag(second, 5, 0)).toBeUndefined();
    expect(validated).toEqual([[3, false]]);
  });

  it('validates the dependent in the visual column when a column is trimmed', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const validated = [];
    const hot = buildGrid({
      data: createData(1),
      columns: [{}, {}, {}, { validator: (value, callback) => callback(value < 120) }],
      formulas: { engine },
      afterValidate: (isValid, value, row, prop) => {
        if (prop === 3) {
          validated.push([row, prop, isValid]);
        }
      },
    });
    const trimmedColumns = hot.columnIndexMapper.createAndRegisterIndexMap('test.trimmedColumns', 'trimming');

    trimmedColumns.setValueAtIndex(0, true);
    hot.render();

    expect(hot.countCols()).toBe(3);

    hot.setDataAtCell(5, 0, 50);

    await settle();

    // The dependent sits in the engine column 3, which is the visual column 2 once the first one is trimmed.
    expect(validFlag(hot, 5, 2)).toBe(false);
    expect(validFlag(hot, 10, 2)).toBe(false);
    expect(validated.map(([row]) => row).sort((a, b) => a - b)).toEqual([5, 10]);
  });
});
