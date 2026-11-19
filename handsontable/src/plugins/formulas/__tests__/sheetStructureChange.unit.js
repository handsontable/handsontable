import { HyperFormula } from 'hyperformula';
import plPL from 'hyperformula/commonjs/i18n/languages/plPL';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { recalculatesSheetReferences } from '../engine/sheetStructureChange';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * An engine class that reports a HyperFormula version which leaves references to a sheet added
 * later stale.
 */
class OldHyperFormula extends HyperFormula {
  static version = '3.1.0';
}

/**
 * @returns {HTMLElement} A container attached to the document.
 */
function createContainer() {
  const container = document.createElement('div');

  document.body.appendChild(container);

  return container;
}

describe('recalculatesSheetReferences', () => {
  it('answers true from HyperFormula 3.1.1 on', () => {
    expect(recalculatesSheetReferences('3.1.1')).toBe(true);
    expect(recalculatesSheetReferences('3.2.0')).toBe(true);
    expect(recalculatesSheetReferences('3.10.0')).toBe(true);
    expect(recalculatesSheetReferences('4.0.0')).toBe(true);
    expect(recalculatesSheetReferences('3.2.0-rc.1')).toBe(true);
  });

  it('answers false below 3.1.1 and for a version it cannot read', () => {
    expect(recalculatesSheetReferences('3.1.0')).toBe(false);
    expect(recalculatesSheetReferences('3.0.0')).toBe(false);
    expect(recalculatesSheetReferences('2.7.1')).toBe(false);
    expect(recalculatesSheetReferences(undefined)).toBe(false);
    expect(recalculatesSheetReferences('next')).toBe(false);
    expect(recalculatesSheetReferences('3.1.1-rc.1')).toBe(false);
  });
});

describe('Formulas: adding and removing a sheet on an engine built by the plugin', () => {
  let containers;
  let grids;

  beforeAll(() => {
    registerPlugin(Formulas);
  });

  beforeEach(() => {
    containers = [];
    grids = [];
  });

  afterEach(() => {
    grids.reverse().forEach(hot => hot.destroy());
    containers.forEach(container => container.remove());
  });

  /**
   * @param {Array[]} data The grid data.
   * @param {object} formulas The `formulas` setting.
   * @returns {Handsontable} The grid.
   */
  function grid(data, formulas) {
    const container = createContainer();
    const hot = new Handsontable(container, {
      data,
      formulas,
      licenseKey: TEST_LICENSE_KEY,
    });

    containers.push(container);
    grids.push(hot);

    return hot;
  }

  /**
   * @returns {Handsontable} A grid whose B1 spills `SEQUENCE(3)` into B1:B3.
   */
  function gridWithSpill() {
    return grid(
      [[1, '=SEQUENCE(3)'], [2, null], [3, null], [null, null]],
      { engine: HyperFormula, sheetName: 'S1' },
    );
  }

  it('keeps the spill of the first grid when a second grid binds to its engine', () => {
    const hot1 = gridWithSpill();

    expect(hot1.getDataAtCol(1)).toEqual([1, 2, 3, null]);

    const hot2 = grid([['=SUM(S1!A1:A3)']], { engine: hot1.getPlugin('formulas').engine, sheetName: 'S2' });

    expect(hot1.getDataAtCol(1)).toEqual([1, 2, 3, null]);
    expect(hot2.getDataAtCell(0, 0)).toBe(6);
  });

  it('keeps the spill when a sheet is added to and removed from the engine', () => {
    const hot1 = gridWithSpill();
    const engine = hot1.getPlugin('formulas').engine;

    engine.addSheet('Extra');

    expect(hot1.getDataAtCol(1)).toEqual([1, 2, 3, null]);

    engine.removeSheet(engine.getSheetId('Extra'));

    expect(hot1.getDataAtCol(1)).toEqual([1, 2, 3, null]);
  });

  it('recalculates SHEET and SHEETS when a sheet is added and removed', () => {
    const hot1 = grid([['=SHEETS()', '=SHEET("S3")']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    expect(hot1.getDataAtRow(0)).toEqual([1, '#N/A']);

    const hot2 = grid([['=SHEETS()']], { engine, sheetName: 'S2' });

    expect(hot1.getDataAtRow(0)).toEqual([2, '#N/A']);
    expect(hot2.getDataAtCell(0, 0)).toBe(2);

    engine.addSheet('S3');

    expect(hot1.getDataAtRow(0)).toEqual([3, 3]);
    expect(hot2.getDataAtCell(0, 0)).toBe(3);

    engine.removeSheet(engine.getSheetId('S3'));

    expect(hot1.getDataAtRow(0)).toEqual([2, '#N/A']);
    expect(hot2.getDataAtCell(0, 0)).toBe(2);
  });

  it('numbers the sheets by their engine id after a sheet before them is removed', () => {
    const hot1 = grid([['=SHEET("S3")', '=SHEETS()']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    engine.addSheet('S2');
    engine.addSheet('S3');

    expect(hot1.getDataAtRow(0)).toEqual([3, 3]);

    engine.removeSheet(engine.getSheetId('S2'));

    expect(engine.getSheetId('S3')).toBe(2);
    expect(hot1.getDataAtRow(0)).toEqual([3, 2]);
  });

  it('leaves a formula that reads a removed sheet as `#REF!` and keeps the engine usable', () => {
    const hot1 = grid([['=SHEETS()+Data!A1', '=SHEETS()']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    grid([[7]], { engine, sheetName: 'Data' });

    expect(hot1.getDataAtRow(0)).toEqual([9, 2]);

    expect(() => engine.removeSheet(engine.getSheetId('Data'))).not.toThrow();
    expect(hot1.getDataAtRow(0)).toEqual(['#REF!', 1]);

    const hot3 = grid([['=SHEETS()']], { engine, sheetName: 'S3' });

    expect(hot1.getDataAtRow(0)).toEqual(['#REF!', 2]);
    expect(hot3.getDataAtCell(0, 0)).toBe(2);
    expect(hot1.getSourceDataAtCell(0, 0)).toBe('=SHEETS()+Data!A1');
  });

  it('recalculates SHEETS in a formula that also reads a named expression', () => {
    const hot1 = grid([['=SHEETS()+Rate']], {
      engine: HyperFormula,
      sheetName: 'S1',
      namedExpressions: [{ name: 'Rate', expression: '=10' }],
    });
    const engine = hot1.getPlugin('formulas').engine;

    expect(hot1.getDataAtCell(0, 0)).toBe(11);

    engine.addSheet('S2');

    expect(hot1.getDataAtCell(0, 0)).toBe(12);
  });

  it('recalculates a named expression that calls SHEETS, keeping its options', () => {
    const hot1 = grid([['=Count']], {
      engine: HyperFormula,
      sheetName: 'S1',
      namedExpressions: [{ name: 'Count', expression: '=SHEETS()', options: { comment: 'Sheet count' } }],
    });
    const engine = hot1.getPlugin('formulas').engine;

    expect(hot1.getDataAtCell(0, 0)).toBe(1);

    engine.addSheet('S2');

    expect(hot1.getDataAtCell(0, 0)).toBe(2);
    expect(engine.getNamedExpression('Count').options).toEqual({ comment: 'Sheet count' });
  });

  it('recalculates SHEET when a sheet is renamed', () => {
    const hot1 = grid([['=SHEET("Old")', '=SHEET("New")']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    engine.addSheet('Old');

    expect(hot1.getDataAtRow(0)).toEqual([2, '#N/A']);

    engine.renameSheet(engine.getSheetId('Old'), 'New');

    expect(hot1.getDataAtRow(0)).toEqual(['#N/A', 2]);
  });

  it('leaves no engine undo step for the recalculation', () => {
    const hot1 = grid([['=SHEETS()']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    engine.addSheet('S2');

    expect(hot1.getDataAtCell(0, 0)).toBe(2);
    expect(engine.isThereSomethingToUndo()).toBe(false);
  });

  it('keeps a reference to a sheet whose name the engine reads only in quotes', () => {
    const hot1 = grid([['=SHEETS()+\'2026\'!A1']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    grid([[10]], { engine, sheetName: '2026' });

    expect(hot1.getDataAtCell(0, 0)).toBe(12);

    engine.addSheet('S3');

    expect(hot1.getDataAtCell(0, 0)).toBe(13);
  });

  it('recalculates SHEETS in the engine language', () => {
    try {
      const hot1 = grid([['=ARKUSZE()']], { engine: HyperFormula, sheetName: 'S1', language: plPL });

      grid([[1]], { engine: hot1.getPlugin('formulas').engine, sheetName: 'S2' });

      expect(hot1.getDataAtCell(0, 0)).toBe(2);
    } finally {
      grids.reverse().forEach(hot => hot.destroy());
      grids = [];
      HyperFormula.unregisterLanguage(plPL.langCode);
    }
  });

  it('recalculates SHEETS after a sheet added inside the host engine batch', () => {
    const hot1 = grid([['=SHEETS()', '=SEQUENCE(2)'], [null, null]], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    expect(() => {
      engine.batch(() => {
        engine.addSheet('S2');
        engine.addSheet('S3');
      });
    }).not.toThrow();

    expect(hot1.getDataAtCol(0)).toEqual([3, null]);
    expect(hot1.getDataAtCol(1)).toEqual([1, 2]);
  });

  it('does not rebuild the engine on HyperFormula 3.1.1 or later', () => {
    const hot1 = gridWithSpill();
    const engine = hot1.getPlugin('formulas').engine;
    const rebuild = jest.spyOn(engine, 'rebuildAndRecalculate');

    engine.addSheet('Extra');
    engine.removeSheet(engine.getSheetId('Extra'));

    expect(rebuild).not.toHaveBeenCalled();
  });

  it('rebuilds the engine on a HyperFormula version that leaves sheet references stale', () => {
    const hot1 = grid([[1, '=S2!A1*2']], { engine: OldHyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;
    const rebuild = jest.spyOn(engine, 'rebuildAndRecalculate');

    engine.addSheet('S2');
    engine.removeSheet(engine.getSheetId('S2'));

    expect(rebuild).toHaveBeenCalledTimes(2);
  });

  // HyperFormula 3.1.1 and later resolve this without a rebuild; the bundled version must keep doing so.
  it('resolves a reference to a sheet added and removed later', () => {
    const hot1 = grid([[1, '=S2!A1*2']], { engine: HyperFormula, sheetName: 'S1' });
    const engine = hot1.getPlugin('formulas').engine;

    expect(hot1.getDataAtCell(0, 1)).toBe('#REF!');

    grid([[5]], { engine, sheetName: 'S2' });

    expect(hot1.getDataAtCell(0, 1)).toBe(10);

    engine.removeSheet(engine.getSheetId('S2'));

    expect(hot1.getDataAtCell(0, 1)).toBe('#REF!');
  });
});
