import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';

/**
 * The `modifyData` hook runs once per cell of every bulk read, and it used to ask the engine whether
 * the bound sheet still exists on each of them. The answer is cached now, and every path that can
 * change it has to drop the cache: the engine's sheet events, and the plugin's own engine undo/redo,
 * which add, remove, or rename sheets without emitting those events.
 */
describe('Formulas own-sheet cache', () => {
  let container;
  let hot;
  let engine;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(UndoRedo);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    engine = null;
    container.remove();
  });

  /**
   * Builds a formula grid bound to a named sheet of the shared engine.
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: [
        [1, '=A1+10'],
        [2, '=A2+10'],
        [3, '=A3+10'],
      ],
      formulas: {
        engine,
        sheetName: 'Sheet1',
      },
      undoRedo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  it('asks the engine once for a whole column of reads', () => {
    build();

    const doesSheetExist = jest.spyOn(engine, 'doesSheetExist');

    // The init render already primed the cache; the engine's own event drops it, so the next
    // read has to ask once and the reads after it must not ask again.
    engine.addSheet('Other');
    doesSheetExist.mockClear();

    expect(hot.getDataAtCol(1)).toEqual([11, 12, 13]);
    expect(doesSheetExist).toHaveBeenCalledTimes(1);

    expect(hot.getDataAtCol(1)).toEqual([11, 12, 13]);
    expect(doesSheetExist).toHaveBeenCalledTimes(1);
  });

  it('reports the raw source value once the bound sheet is removed from the engine directly', () => {
    build();

    expect(hot.getDataAtCell(0, 1)).toBe(11);

    engine.removeSheet(engine.getSheetId('Sheet1'));

    expect(() => hot.getDataAtCell(0, 1)).not.toThrow();
    expect(hot.getDataAtCell(0, 1)).toBe('=A1+10');
    expect(hot.getSourceDataAtCell(0, 1)).toBe('=A1+10');
  });

  /**
   * A grid edit gives the grid an undo step, and a sheet removal made on the engine directly lands on
   * the engine's own stack only. The grid's undo never runs `engine.undo()`, so the sheet stays
   * removed whatever the grid undoes.
   */
  function editThenRemoveSheetExternally() {
    hot.setDataAtCell(2, 0, 5);
    engine.removeSheet(engine.getSheetId('Sheet1'));

    expect(hot.getDataAtCell(0, 1)).toBe('=A1+10');
  }

  it('keeps reading the source after a grid undo and redo, which leave the removed sheet removed', () => {
    build();
    editThenRemoveSheetExternally();

    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceDataAtCell(2, 0)).toBe(3);
    expect(engine.doesSheetExist('Sheet1')).toBe(false);
    expect(() => hot.getDataAtCell(0, 1)).not.toThrow();
    expect(hot.getDataAtCell(0, 1)).toBe('=A1+10');

    hot.getPlugin('undoRedo').redo();

    expect(hot.getSourceDataAtCell(2, 0)).toBe(5);
    expect(engine.doesSheetExist('Sheet1')).toBe(false);
    expect(hot.getDataAtCell(0, 1)).toBe('=A1+10');
  });

  it('answers an out-of-bounds read from the source value without asking the engine', () => {
    build();

    const getCellType = jest.spyOn(engine, 'getCellType');
    const getCellValue = jest.spyOn(engine, 'getCellValue');
    const valueHolder = { value: '\'=raw' };

    hot.runHooks('modifyData', hot.countRows(), 1, valueHolder, 'get');

    expect(getCellType).not.toHaveBeenCalled();
    expect(getCellValue).not.toHaveBeenCalled();
    expect(valueHolder.value).toBe('=raw');
  });
});
