import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable/base';
import { Formulas, ManualColumnFreeze, registerPlugin } from 'handsontable/plugins';

registerPlugin(Formulas);
registerPlugin(ManualColumnFreeze);

/**
 * The engine has to follow an unfrozen column wherever ManualColumnFreeze puts it. With
 * `restoreColumnPosition` that is not the freeze line, so the target comes from the unfreeze hooks.
 */
describe('Formulas – ManualColumnFreeze unfreeze', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Creates a grid whose last column multiplies the first one, so a write to the first column shows whether
   * the engine still reads the column the grid shows.
   *
   * @param {boolean|object} manualColumnFreeze The `manualColumnFreeze` option.
   */
  function createGrid(manualColumnFreeze) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[1, 2, 3, 4, 5, 6, '=A1*100']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      manualColumnFreeze,
    });
  }

  /**
   * Writes a value to the column whose physical index is 0, wherever it is shown.
   *
   * @param {number} value The value to write.
   */
  function writeToPhysicalA(value) {
    hot.setDataAtCell(0, hot.toVisualColumn(0), value);
  }

  /**
   * Reads the formula column, wherever it is shown.
   *
   * @returns {*}
   */
  function formulaValue() {
    return hot.getDataAtCell(0, hot.toVisualColumn(6));
  }

  it('should keep the engine in sync after unfreezing to the freeze line', () => {
    createGrid(true);

    hot.getPlugin('manualColumnFreeze').freezeColumn(5);
    hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
    writeToPhysicalA(7);

    expect(formulaValue()).toBe(700);
  });

  it('should keep the engine in sync after unfreezing with `restoreColumnPosition`', () => {
    createGrid({ restoreColumnPosition: true });

    hot.getPlugin('manualColumnFreeze').freezeColumn(5);
    hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);

    expect(hot.getDataAtRow(0)).toEqual([1, 2, 3, 4, 5, 6, 100]);

    writeToPhysicalA(7);

    expect(formulaValue()).toBe(700);
  });
});
