import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable/base';
import { Formulas, MoveCells, registerPlugin, UndoRedo } from 'handsontable/plugins';

registerPlugin(Formulas);
registerPlugin(UndoRedo);

/**
 * How the engine follows the grid when an action is undone. The legacy browser specs for the same
 * topic are `plugins/undoRedo.spec.js`.
 */
describe('Formulas – undo', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  // DEV-688: after the undo the formula column showed the formula text instead of the results.
  it('should show the calculated values again after undoing a paste that added columns', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[1, 2, '=A1*B1'], [3, 4, '=A2*B2'], [5, 6, '=A3*B3']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      undo: true,
    });

    const before = hot.getData();

    expect(before).toEqual([[1, 2, 2], [3, 4, 12], [5, 6, 30]]);

    hot.populateFromArray(0, 1, [['x', 'y', 'z'], ['x', 'y', 'z']], undefined, undefined, 'CopyPaste.paste');

    expect(hot.countCols()).toBe(4);

    hot.getPlugin('undoRedo').undo();

    expect(hot.countCols()).toBe(3);
    expect(hot.getData()).toEqual(before);
  });

  // An undo writes the stored value back, which for a `{ key, value }` option is an object. The
  // engine gets it the way an edit gives it: through the column's `valueGetter`.
  it('should send an object value to the engine through the column `valueGetter` on undo', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[{ key: 1, value: 'X' }, '=A1']],
      columns: [{ valueGetter: value => (value && typeof value === 'object' ? value.value : value) }, {}],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      undo: true,
    });

    hot.setDataAtCell(0, 0, { key: 2, value: 'Y' });

    expect(hot.getDataAtCell(0, 1)).toBe('Y');

    hot.getPlugin('undoRedo').undo();

    expect(hot.getDataAtCell(0, 1)).toBe('X');

    hot.getPlugin('undoRedo').redo();

    expect(hot.getDataAtCell(0, 1)).toBe('Y');
  });

  // Grid A's row and column changes make the engine rewrite the references other sheets and named
  // expressions hold into A's sheet. Reloading A's own sheet on undo never adjusts them, so the step
  // records them and writes them back – `#REF!` included.
  describe('two grids on one engine', () => {
    let engine;
    let otherContainer;
    let otherHot;

    afterEach(() => {
      otherHot?.destroy();
      otherHot = null;
      otherContainer?.remove();
    });

    /**
     * Builds grid A (sheet `S1`) and then grid B (sheet `S2`) on one engine, or B first when `bFirst`.
     *
     * @param {Array[]} dataA A's data.
     * @param {Array[]} dataB B's data (kept by reference, so a test can read B's source).
     * @param {object} [options] `bFirst`, and extra settings for A.
     * @param options.bFirst
     * @param options.settingsA
     * @returns {object[]} Grids A and B.
     */
    function buildPair(dataA, dataB, { bFirst = false, settingsA = {} } = {}) {
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      otherContainer = document.createElement('div');
      document.body.appendChild(otherContainer);

      const buildA = () => new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: dataA,
        formulas: { engine, sheetName: 'S1' },
        undo: true,
        ...settingsA,
      });
      const buildB = () => new Handsontable(otherContainer, {
        licenseKey: 'non-commercial-and-evaluation',
        data: dataB,
        formulas: { engine, sheetName: 'S2' },
        undo: true,
      });

      if (bFirst) {
        otherHot = buildB();
        hot = buildA();
      } else {
        hot = buildA();
        otherHot = buildB();
      }

      return [hot, otherHot];
    }

    const formulaInB = (row, col) => engine.getCellFormula({ sheet: engine.getSheetId('S2'), row, col });

    it('should put back a reference another sheet holds when a row removal is undone and redone', () => {
      const dataB = [['=S1!A5']];
      const [hotA, hotB] = buildPair([[10], [20], [30], [40], [50]], dataB);
      const undoRedo = hotA.getPlugin('undoRedo');

      hotA.alter('remove_row', 1);

      expect(formulaInB(0, 0)).toBe('=S1!A4');
      expect(dataB[0][0]).toBe('=S1!A4');
      expect(hotB.getPlugin('undoRedo').isUndoAvailable()).toBe(false);

      undoRedo.undo();

      expect(hotA.getDataAtCol(0)).toEqual([10, 20, 30, 40, 50]);
      expect(formulaInB(0, 0)).toBe('=S1!A5');
      expect(hotB.getDataAtCell(0, 0)).toBe(50);
      expect(dataB[0][0]).toBe('=S1!A5');

      undoRedo.redo();

      expect(formulaInB(0, 0)).toBe('=S1!A4');
      expect(hotB.getDataAtCell(0, 0)).toBe(50);
    });

    it('should put back a reference another sheet holds when a row insertion is undone', () => {
      const [hotA, hotB] = buildPair([[10], [20], [30], [40], [50]], [['=S1!A5']]);
      const undoRedo = hotA.getPlugin('undoRedo');

      hotA.alter('insert_row_above', 1);

      expect(formulaInB(0, 0)).toBe('=S1!A6');

      undoRedo.undo();

      expect(formulaInB(0, 0)).toBe('=S1!A5');
      expect(hotB.getDataAtCell(0, 0)).toBe(50);

      undoRedo.redo();

      expect(formulaInB(0, 0)).toBe('=S1!A6');
    });

    it('should turn a `#REF!` a row removal left in another sheet back into its reference on undo', () => {
      const [hotA, hotB] = buildPair([[10], [20], [30], [40], [50]], [['=S1!A5']]);
      const undoRedo = hotA.getPlugin('undoRedo');

      hotA.alter('remove_row', 4);

      expect(formulaInB(0, 0)).toBe('=#REF!');

      undoRedo.undo();

      expect(formulaInB(0, 0)).toBe('=S1!A5');
      expect(hotB.getDataAtCell(0, 0)).toBe(50);

      undoRedo.redo();

      expect(formulaInB(0, 0)).toBe('=#REF!');
    });

    it('should put back a reference another sheet holds when a column removal is undone', () => {
      const [hotA, hotB] = buildPair([[1, 2, 3]], [['=S1!C1']]);
      const undoRedo = hotA.getPlugin('undoRedo');

      hotA.alter('remove_col', 0);

      expect(formulaInB(0, 0)).toBe('=S1!B1');

      undoRedo.undo();

      expect(formulaInB(0, 0)).toBe('=S1!C1');
      expect(hotB.getDataAtCell(0, 0)).toBe(3);

      hotA.alter('remove_col', 2);

      expect(formulaInB(0, 0)).toBe('=#REF!');

      undoRedo.undo();

      expect(formulaInB(0, 0)).toBe('=S1!C1');

      undoRedo.redo();

      expect(formulaInB(0, 0)).toBe('=#REF!');
    });

    it('should put back a named expression a row removal rewrote', () => {
      const [hotA] = buildPair([[10], [20], [30], [40], [50]], [[null]]);
      const undoRedo = hotA.getPlugin('undoRedo');

      engine.addNamedExpression('Fifth', '=S1!$A$5');
      hotA.alter('remove_row', 1);

      expect(engine.getNamedExpressionFormula('Fifth')).toBe('=S1!$A$4');

      undoRedo.undo();

      expect(engine.getNamedExpressionFormula('Fifth')).toBe('=S1!$A$5');

      undoRedo.redo();

      expect(engine.getNamedExpressionFormula('Fifth')).toBe('=S1!$A$4');
    });

    it('should put back a reference another sheet holds when a cell move is undone', () => {
      registerPlugin(MoveCells);

      const [hotA, hotB] = buildPair([[7, null]], [['=S1!A1']], { settingsA: { moveCells: true } });
      const undoRedo = hotA.getPlugin('undoRedo');
      const topLeft = hotA._createCellCoords(0, 0);

      hotA.getPlugin('moveCells').moveCellRange(hotA._createCellRange(topLeft, topLeft, topLeft),
        hotA._createCellCoords(0, 1));

      expect(formulaInB(0, 0)).toBe('=S1!B1');

      undoRedo.undo();

      expect(formulaInB(0, 0)).toBe('=S1!A1');
      expect(hotB.getDataAtCell(0, 0)).toBe(7);

      undoRedo.redo();

      expect(formulaInB(0, 0)).toBe('=S1!B1');
    });

    // B's removal rewrites A's reference in the engine and in A's source data, so A's own undo – which
    // reloads A's sheet from A's source – keeps it.
    it('should keep a reference another grid\'s removal rewrote through this grid\'s own undo', () => {
      const dataA = [['=S2!A5'], [null]];
      const [hotA, hotB] = buildPair(dataA, [[1], [2], [3], [4], [5]], { bFirst: true });

      hotA.alter('insert_row_below', 1);
      hotB.alter('remove_row', 1);

      expect(dataA[0][0]).toBe('=S2!A4');

      hotA.getPlugin('undoRedo').undo();

      expect(engine.getCellFormula({ sheet: engine.getSheetId('S1'), row: 0, col: 0 })).toBe('=S2!A4');
      expect(hotA.getDataAtCell(0, 0)).toBe(5);
    });

    it('should leave a formula edited after the step as it is, with a warning', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const [hotA, hotB] = buildPair([[10], [20], [30], [40], [50]], [['=S1!A5']]);

      hotA.alter('remove_row', 1);
      hotB.setDataAtCell(0, 0, '=S1!A4*2');
      hotA.getPlugin('undoRedo').undo();

      expect(formulaInB(0, 0)).toBe('=S1!A4*2');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('edited after the step'));

      warnSpy.mockRestore();
    });

    it('should not read another sheet when the engine holds this grid\'s sheet alone', () => {
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [[1, '=A1*2'], [2, '=A2*2']],
        formulas: { engine, sheetName: 'S1' },
        undo: true,
      });

      const getSheetFormulas = jest.spyOn(engine, 'getSheetFormulas');
      const getCellFormula = jest.spyOn(engine, 'getCellFormula');
      const ownSheet = engine.getSheetId('S1');

      hot.alter('insert_row_above', 0);

      expect(getSheetFormulas.mock.calls.every(([sheet]) => sheet === ownSheet)).toBe(true);
      expect(getCellFormula).not.toHaveBeenCalled();
    });
  });
});
