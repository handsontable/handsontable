import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { FormulaBuilder } from '../formulaBuilder';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * DEV-202: with `formulas.batchEvaluation: true` the Formulas plugin keeps the HyperFormula engine suspended while
 * the grid's execution is suspended, and the engine refuses value reads ("Computations are suspended") until it
 * recalculates. FormulaBuilder reads the engine for the formula bar and for the cell error marks, so each of its
 * reads has to go through `flushEngineEvaluation()` first, and its bar re-sync must not recalculate once per write.
 */
describe('FormulaBuilder with formulas.batchEvaluation', () => {
  let containers: HTMLDivElement[];
  let grids: Handsontable[];

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
  });

  beforeEach(() => {
    containers = [];
    grids = [];
  });

  afterEach(() => {
    grids.forEach(grid => grid.destroy());
    containers.forEach(element => element.remove());
    jest.restoreAllMocks();
  });

  /**
   * Mounts a grid on `engine`.
   *
   * @param {HyperFormula} engine The engine.
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function mountGrid(engine: HyperFormula, settings: Record<string, unknown>): Handsontable {
    const element = document.createElement('div');

    document.body.appendChild(element);
    containers.push(element);

    const grid = new Handsontable(element, {
      editor: 'formula',
      licenseKey: TEST_LICENSE_KEY,
      renderAllRows: true,
      renderAllColumns: true,
      ...settings,
      formulas: { engine, batchEvaluation: true, ...(settings.formulas as object) },
    } as Handsontable.GridSettings);

    grids.push(grid);

    return grid;
  }

  /**
   * @returns {HyperFormula} A fresh engine.
   */
  function buildEngine(): HyperFormula {
    return HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  }

  /**
   * Returns the text the formula bar shows while it is not edited, without the zero-width space the package ends
   * its overlay with.
   *
   * @param {Handsontable} grid The grid.
   * @returns {string}
   */
  function barText(grid: Handsontable): string {
    const idle = grid.rootWrapperElement.querySelector('.hfe-formula-bar__idle');

    return (idle?.textContent ?? '').split(String.fromCharCode(0x200b)).join('');
  }

  describe('the formula bar read of a plain cell', () => {
    it('reads a plain cell selected while a write holds the engine, without a "Computations are suspended" throw',
      () => {
        const engine = buildEngine();
        const grid = mountGrid(engine, {
          data: [[1, 2], [3, 'plain']],
          formulaBuilder: { builder: core, showFormulaBar: true },
        });
        let suspendedBeforeSelect = false;
        let seen = '';

        expect(() => grid.batch(() => {
          grid.setDataAtCell(0, 0, 10);
          suspendedBeforeSelect = engine.isEvaluationSuspended();
          grid.selectCell(1, 1);
          seen = barText(grid);
        })).not.toThrow();

        expect(suspendedBeforeSelect).toBe(true);
        expect(seen).toBe('plain');
        expect(grid.getPlugin('formulaBuilder').getRawCellText(1, 1)).toBe('plain');
        expect(grid.getDataAtCell(0, 0)).toBe(10);
      });
  });

  describe('the error mark of a plain formula-editor cell drawn by a second grid', () => {
    it('paints a plain cell of a grid on the engine while another grid holds it', () => {
      const engine = buildEngine();
      const holder = mountGrid(engine, { data: [[1, 2], [3, 4]] });
      const painted = mountGrid(engine, {
        data: [['plain', 'cells']],
        formulas: { sheetName: 'Sheet2' },
        formulaBuilder: { builder: core },
      });
      let suspendedBeforeDraw = false;

      expect(() => holder.batch(() => {
        holder.setDataAtCell(0, 0, 10);
        suspendedBeforeDraw = engine.isEvaluationSuspended();
        painted.render();
      })).not.toThrow();

      expect(suspendedBeforeDraw).toBe(true);
      expect(painted.getCell(0, 0)?.textContent).toBe('plain');
      expect(painted.getCell(0, 1)?.textContent).toBe('cells');
      expect(holder.getDataAtCell(0, 0)).toBe(10);
    });
  });

  describe('the bar re-sync of writes made inside one batch()', () => {
    const ROWS = 10;

    /**
     * Writes column A of a 10-row sheet with a formula column next to it, ten `setSourceDataAtCell()` calls in one
     * `batch()`, and counts the engine recalculations.
     *
     * @param {boolean} withBar Whether FormulaBuilder is on.
     * @returns {{ grid: Handsontable, recalculations: number }}
     */
    function runBatch(withBar: boolean): { grid: Handsontable, recalculations: number } {
      const engine = buildEngine();
      const data = Array.from({ length: ROWS }, (_, row) => [row, 1, `=A${row + 1}+B${row + 1}`]);
      const grid = mountGrid(engine, {
        data,
        ...withBar ? { formulaBuilder: { builder: core, showFormulaBar: true } } : {},
      });
      let recalculations = 0;

      engine.on('valuesUpdated', () => {
        recalculations += 1;
      });
      grid.selectCell(0, 0);

      grid.batch(() => {
        for (let row = 0; row < ROWS; row++) {
          grid.setSourceDataAtCell(row, 0, 100 + row);
        }
      });

      return { grid, recalculations };
    }

    it('recalculates once, as a grid without the bar does, and shows the written text of the active cell', () => {
      const withoutBar = runBatch(false);
      const withBar = runBatch(true);

      expect(withoutBar.recalculations).toBe(1);
      expect(withBar.recalculations).toBe(withoutBar.recalculations);
      expect(withBar.grid.getDataAtCell(0, 2)).toBe(101);
      expect(barText(withBar.grid)).toBe('100');
      expect(withBar.grid.getPlugin('formulaBuilder').getRawCellText(0, 0)).toBe('100');
    });

    it('re-reads the active cell into the bar when the execution resumes, without waiting for a draw', () => {
      const engine = buildEngine();
      const grid = mountGrid(engine, {
        data: [[1, 2, '=A1+B1']],
        formulaBuilder: { builder: core, showFormulaBar: true },
      });

      grid.selectCell(0, 0);

      // With the render suspended no draw comes between the writes and the resume.
      grid.suspendRender();
      grid.suspendExecution();
      grid.setSourceDataAtCell(0, 0, 'written');
      grid.setSourceDataAtCell(0, 1, 'other');

      expect(engine.isEvaluationSuspended()).toBe(true);
      expect(barText(grid)).toBe('1');

      grid.resumeExecution();

      expect(barText(grid)).toBe('written');

      grid.resumeRender();
    });
  });
});
