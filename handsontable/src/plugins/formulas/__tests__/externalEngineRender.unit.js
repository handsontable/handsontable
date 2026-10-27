import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Builds a grid bound to an existing engine and counts `afterRender` after init.
 *
 * @param {HTMLElement} container The grid container.
 * @param {Array[]} data The grid data.
 * @param {object} engine The shared HyperFormula instance.
 * @param {string} sheetName The sheet this grid owns.
 * @param {Function} onRender Called from `afterRender`.
 * @returns {Handsontable} The grid.
 */
function mountGrid(container, data, engine, sheetName, onRender) {
  const hot = new Handsontable(container, {
    data,
    formulas: { engine, sheetName },
    licenseKey: LICENSE_KEY,
    renderAllRows: true,
    renderAllColumns: true,
    afterRender: onRender,
  });

  return hot;
}

describe('external engine changes repaint formula cells', () => {
  beforeAll(() => {
    registerPlugin(Formulas);
  });

  describe('one grid', () => {
    let container;
    let hot;
    let engine;
    let renders;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      renders = 0;
      hot = mountGrid(container, [[1, '=A1*2']], engine, 'Sheet1', () => {
        renders += 1;
      });
      renders = 0;
    });

    afterEach(() => {
      hot?.destroy();
      container.remove();
    });

    it('paints the formula cell after engine.setCellContents without a manual render', () => {
      const sheetId = engine.getSheetId('Sheet1');

      engine.setCellContents({ sheet: sheetId, row: 0, col: 0 }, 10);

      expect(renders).toBe(1);
      expect(hot.getCell(0, 1).textContent).toBe('20');
      // The plain cell stays on the source value. The engine write is not copied back.
      expect(hot.getCell(0, 0).textContent).toBe('1');
      expect(hot.getSourceDataAtCell(0, 0)).toBe(1);
      expect(hot.getDataAtCell(0, 0)).toBe(1);
    });

    it('does not validate when the engine is written from outside', async() => {
      const validations = [];

      hot.addHook('beforeValidate', (value) => {
        validations.push(value);
      });
      hot.updateSettings({ type: 'numeric' });
      renders = 0;
      validations.length = 0;

      engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 }, 10);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(validations).toEqual([]);
      expect(hot.getCell(0, 1).textContent).toBe('20');
    });

    it('paints a setDataAtCell edit the same number of times as before this change', () => {
      hot.setDataAtCell(0, 0, 10);

      expect(hot.getCell(0, 1).textContent).toBe('20');
      expect(renders).toBe(1);
    });
  });

  describe('two grids on one engine', () => {
    let containers;
    let hot1;
    let hot2;
    let engine;
    let renders1;
    let renders2;

    beforeEach(() => {
      containers = [document.createElement('div'), document.createElement('div')];
      containers.forEach(container => document.body.appendChild(container));
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      renders1 = 0;
      renders2 = 0;
      hot1 = mountGrid(containers[0], [[1, 2]], engine, 'Sheet1', () => {
        renders1 += 1;
      });
      hot2 = mountGrid(containers[1], [['=Sheet1!A1*10', '=Sheet1!B1+1']], engine, 'Sheet2', () => {
        renders2 += 1;
      });
      renders1 = 0;
      renders2 = 0;
    });

    afterEach(() => {
      hot1?.destroy();
      hot2?.destroy();
      containers.forEach(container => container.remove());
    });

    it('paints the other grid after a direct engine write on the first sheet', () => {
      engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 }, 5);

      expect(renders1).toBe(1);
      expect(renders2).toBe(1);
      expect(hot2.getCell(0, 0).textContent).toBe('50');
      expect(hot1.getCell(0, 0).textContent).toBe('1');
      expect(hot1.getSourceDataAtCell(0, 0)).toBe(1);
      expect(hot2.getDataAtCell(0, 0)).toBe(50);
    });

    it('does not paint the other grid an extra time when this grid edits a cell', () => {
      hot1.setDataAtCell(0, 0, 5);

      expect(hot2.getCell(0, 0).textContent).toBe('50');
      expect(hot1.getCell(0, 0).textContent).toBe('5');
      expect(renders1).toBe(1);
      expect(renders2).toBe(1);
    });
  });
});
