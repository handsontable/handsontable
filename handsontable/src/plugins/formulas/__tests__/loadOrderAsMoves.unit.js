import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Each row holds an ID and a formula that reads the ID of another row: row 1 reads A3, row 2 reads A4, and
 * so on around. `Expected` is what that formula must show for the row, whatever order the grid shows it in.
 *
 * @returns {Array[]}
 */
function crossRowData() {
  return [1, 2, 3, 4, 5].map((id, index) => {
    const target = ((index + 2) % 5) + 1;

    return [id, `=A${target}+1000`, target + 1000];
  });
}

/**
 * Reads every visual row as `[shown, expected]` pairs.
 *
 * @param {Handsontable} hot The grid.
 * @returns {Array[]}
 */
function shownAndExpected(hot) {
  return hot.getData().map(([, shown, expected]) => [shown, expected]);
}

/**
 * Checks that every row shows what its formula should read.
 *
 * @param {Handsontable} hot The grid.
 */
function expectEveryRowReadsItsRecord(hot) {
  shownAndExpected(hot).forEach(([shown, expected]) => {
    expect(shown).toBe(expected);
  });
}

describe('Formulas: an order reached by moves reaches a (re)loaded engine as moves', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  /**
   * @param {object} settings Extra settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    return new Handsontable(container, {
      data: crossRowData(),
      formulas: { engine: HyperFormula },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });
  }

  it('keeps every reference on its record with a manualRowMove array at init', () => {
    const hot = createGrid({ manualRowMove: [2, 3, 4, 0, 1] });

    expect(hot.getDataAtCol(0)).toEqual([3, 4, 5, 1, 2]);
    expectEveryRowReadsItsRecord(hot);
    hot.destroy();
  });

  it('keeps every reference on its record when updateSettings() follows a drag', () => {
    const hot = createGrid({ manualRowMove: true });

    hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
    hot.render();

    expectEveryRowReadsItsRecord(hot);

    hot.updateSettings({});
    hot.updateSettings({});
    hot.updateSettings({});

    expect(hot.getDataAtCol(0)).toEqual([4, 5, 1, 2, 3]);
    expectEveryRowReadsItsRecord(hot);
    hot.destroy();
  });

  it('keeps every reference on its record with a manualColumnMove array at init', () => {
    const hot = createGrid({
      data: [
        [1, '=A1+10', 100, 1000],
        [2, '=A2+10', 200, 2000],
      ],
      manualColumnMove: [0, 2, 1, 3],
    });

    // `=A1+10` keeps reading the ID column, as it does after a `loadData()` with the same array.
    expect(hot.getData()).toEqual([
      [1, 100, 11, 1000],
      [2, 200, 12, 2000],
    ]);
    hot.destroy();
  });

  it('shows the same values at init as after a loadData() with the same move array', () => {
    const atInit = createGrid({ manualRowMove: [2, 0, 1, 4, 3] });
    const initValues = atInit.getData();

    atInit.loadData(crossRowData());

    expect(atInit.getData()).toEqual(initValues);
    atInit.destroy();
  });

  it('sends the order as moves, not as one engine order, at init', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const setRowOrder = jest.spyOn(engine, 'setRowOrder');
    const moveRows = jest.spyOn(engine, 'moveRows');
    const hot = createGrid({ manualRowMove: [2, 3, 4, 0, 1], formulas: { engine } });

    expect(setRowOrder).not.toHaveBeenCalled();
    // `[2, 3, 4]` is one block: one move takes it to the top.
    expect(moveRows).toHaveBeenCalledTimes(1);
    expectEveryRowReadsItsRecord(hot);
    hot.destroy();
  });

  it('keeps the sort order as an engine order after updateSettings() (DEV-917 known limitation)', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const hot = createGrid({ columnSorting: true, formulas: { engine } });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

    const sorted = hot.getData();
    const setRowOrder = jest.spyOn(engine, 'setRowOrder');
    const moveRows = jest.spyOn(engine, 'moveRows');

    hot.updateSettings({});

    // The reload reproduces what the sort showed: the same values, through the same kind of engine call.
    expect(hot.getData()).toEqual(sorted);
    expect(setRowOrder).toHaveBeenCalledTimes(1);
    expect(moveRows).not.toHaveBeenCalled();
    hot.destroy();
  });

  it('keeps every reference on its record on the column axis when updateSettings() follows a drag', () => {
    const hot = createGrid({
      data: [
        [1, '=A1+10', 100, 1000],
        [2, '=A2+10', 200, 2000],
      ],
      manualColumnMove: true,
    });

    hot.getPlugin('manualColumnMove').moveColumns([2], 0);
    hot.render();

    const afterDrag = hot.getData();

    hot.updateSettings({});
    hot.updateSettings({});

    expect(afterDrag).toEqual([
      [100, 1, 11, 1000],
      [200, 2, 12, 2000],
    ]);
    expect(hot.getData()).toEqual(afterDrag);
    hot.destroy();
  });
});
