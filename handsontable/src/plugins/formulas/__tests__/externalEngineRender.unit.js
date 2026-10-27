import { HyperFormula } from 'hyperformula';
import plPL from 'hyperformula/commonjs/i18n/languages/plPL';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../../columnSorting';
import { ManualRowMove } from '../../manualRowMove';
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
 * @param {object} [extraSettings] Extra Handsontable settings.
 * @returns {Handsontable} The grid.
 */
function mountGrid(container, data, engine, sheetName, onRender, extraSettings = {}) {
  const hot = new Handsontable(container, {
    data,
    formulas: { engine, sheetName },
    licenseKey: LICENSE_KEY,
    renderAllRows: true,
    renderAllColumns: true,
    afterRender: onRender,
    ...extraSettings,
  });

  return hot;
}

/**
 * @returns {HTMLElement} A container attached to the document.
 */
function createContainer() {
  const container = document.createElement('div');

  document.body.appendChild(container);

  return container;
}

describe('external engine changes repaint formula cells', () => {
  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(ColumnSorting);
    registerPlugin(ManualRowMove);
  });

  describe('one grid', () => {
    let container;
    let hot;
    let engine;
    let renders;

    beforeEach(() => {
      container = createContainer();
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

    it('paints a setDataAtCell edit once', () => {
      hot.setDataAtCell(0, 0, 10);

      expect(hot.getCell(0, 1).textContent).toBe('20');
      expect(renders).toBe(1);
    });

    it('paints a later external write when a plugin write throws', () => {
      jest.spyOn(engine, 'batch').mockImplementationOnce(() => {
        throw new Error('boom');
      });

      expect(() => hot.setDataAtCell(0, 0, 10)).toThrow('boom');

      engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 }, 10);

      expect(renders).toBe(1);
      expect(hot.getCell(0, 1).textContent).toBe('20');
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
      containers = [createContainer(), createContainer()];
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

    it('does not paint this grid when the change names only the other sheet', () => {
      engine.setCellContents({ sheet: engine.getSheetId('Sheet2'), row: 0, col: 0 }, '=1+1');

      expect(renders1).toBe(0);
      expect(renders2).toBe(1);
      expect(hot2.getCell(0, 0).textContent).toBe('2');
      expect(hot1.getCell(0, 0).textContent).toBe('1');
    });
  });

  describe('a write to another engine during a plugin write', () => {
    let containers;
    let hotA;
    let hotB;
    let engineA;
    let engineB;
    let rendersB;

    beforeEach(() => {
      containers = [createContainer(), createContainer()];
      engineA = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      engineB = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      rendersB = 0;
      hotA = mountGrid(containers[0], [[1, '=A1*2']], engineA, 'Sheet1', () => {});
      hotB = mountGrid(containers[1], [[1, '=A1*2']], engineB, 'Sheet1', () => {
        rendersB += 1;
      });
      rendersB = 0;
    });

    afterEach(() => {
      hotA?.destroy();
      hotB?.destroy();
      containers.forEach(container => container.remove());
    });

    it('paints the other engine when its write happens inside this engine\'s plugin write', () => {
      hotA.addHook('afterFormulasValuesUpdate', () => {
        engineB.setCellContents({ sheet: engineB.getSheetId('Sheet1'), row: 0, col: 0 }, 10);
      });

      hotA.setDataAtCell(0, 0, 4);

      expect(hotB.getCell(0, 1).textContent).toBe('20');
      expect(rendersB).toBe(1);
      expect(hotA.getCell(0, 1).textContent).toBe('8');
    });
  });

  describe('axis order writes', () => {
    let container;
    let hot;
    let engine;
    let renders;

    beforeEach(() => {
      container = createContainer();
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      renders = 0;
    });

    afterEach(() => {
      hot?.destroy();
      container.remove();
    });

    it('paints the editing grid once when a column sort reorders rows', () => {
      hot = mountGrid(container, [[3, '=A1*2'], [1, '=A2*2']], engine, 'Sheet1', () => {
        renders += 1;
      }, { columnSorting: true });
      renders = 0;

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(renders).toBe(1);
      expect(hot.getCell(0, 0).textContent).toBe('1');
      expect(hot.getCell(0, 1).textContent).toBe('2');
    });

    it('does not paint the editing grid when a row is moved', () => {
      hot = mountGrid(container, [['=ROW()'], ['=ROW()'], ['=ROW()']], engine, 'Sheet1', () => {
        renders += 1;
      }, { manualRowMove: true });
      renders = 0;

      expect(hot.getPlugin('manualRowMove').moveRows([0], 2)).toBe(true);

      // `moveRows` does not paint. `=ROW()` changes in the engine, and the DOM stays on the first paint.
      expect(hot.getDataAtCell(0, 0)).toBe(1);
      expect(hot.getCell(0, 0).textContent).toBe('1');
      expect(renders).toBe(0);
    });
  });

  describe('a grid that joins an engine whose formulas already name its sheet', () => {
    let containers;
    let grids;
    let renders1;

    beforeEach(() => {
      containers = [createContainer(), createContainer()];
      grids = [];
      renders1 = 0;
    });

    afterEach(() => {
      grids.forEach(grid => grid.destroy());
      containers.forEach(container => container.remove());
    });

    it('paints the grid that names the sheet once while the other grid registers it', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      grids.push(mountGrid(containers[0], [['Ford', 'Tesla'], ['Opel', '=Sheet2!A2']], engine, 'Sheet1', () => {
        renders1 += 1;
      }));
      renders1 = 0;
      grids.push(mountGrid(containers[1], [['Ford', 'Tesla'], ['Opel', '=Sheet1!B1']], engine, 'Sheet2', () => {}));

      expect(renders1).toBe(1);
      expect(grids[0].getCell(1, 1).textContent).toBe('Opel');
    });

    describe('when the referenced cell has no value in the new sheet', () => {
      let engine;

      beforeEach(() => {
        engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      });

      it('clears #REF! in the grid that names an empty cell of the new sheet, once', () => {
        grids.push(mountGrid(containers[0], [['a', '=Sheet2!A2']], engine, 'Sheet1', () => {
          renders1 += 1;
        }));
        renders1 = 0;
        grids.push(mountGrid(containers[1], [['x', 'y']], engine, 'Sheet2', () => {}));

        expect(grids[0].getCell(0, 1).textContent).toBe('');
        expect(renders1).toBe(1);
      });

      it('clears #REF! in the grid that names a cell outside the new sheet, once', () => {
        grids.push(mountGrid(containers[0], [['a', '=Sheet2!C9']], engine, 'Sheet1', () => {
          renders1 += 1;
        }));
        renders1 = 0;
        grids.push(mountGrid(containers[1], [['x']], engine, 'Sheet2', () => {}));

        expect(grids[0].getCell(0, 1).textContent).toBe('');
        expect(renders1).toBe(1);
      });
    });

    describe('when the grid is renamed to a sheet the other grid names', () => {
      let engine;

      beforeEach(() => {
        engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
        grids.push(mountGrid(containers[0], [['a', '=Sheet3!B2']], engine, 'Sheet1', () => {
          renders1 += 1;
        }));
        grids.push(mountGrid(containers[1], [['x', 'y']], engine, 'Sheet2', () => {}));
        renders1 = 0;
      });

      it('paints the other grid once with the value of the filled cell', () => {
        grids[1].updateSettings({
          data: [['p', 'q'], ['r', 'moved']],
          formulas: { engine, sheetName: 'Sheet3' },
        });

        expect(grids[0].getCell(0, 1).textContent).toBe('moved');
        expect(renders1).toBe(1);
      });

      it('paints the other grid once when the referenced cell is empty', () => {
        grids[1].updateSettings({
          data: [['p', 'q']],
          formulas: { engine, sheetName: 'Sheet3' },
        });

        expect(grids[0].getCell(0, 1).textContent).toBe('');
        expect(renders1).toBe(1);
      });
    });

    describe('after the other grid registered its sheet', () => {
      let engine;

      beforeEach(() => {
        engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
        grids.push(mountGrid(containers[0], [['a', '=Sheet2!A2']], engine, 'Sheet1', () => {
          renders1 += 1;
        }));
        grids.push(mountGrid(containers[1], [['x', 'y'], ['z', 'w']], engine, 'Sheet2', () => {}));
        renders1 = 0;
      });

      it('does not paint the grid that names the sheet when the registering grid edits an unrelated cell', () => {
        grids[1].setDataAtCell(0, 0, 'q');

        expect(grids[0].getCell(0, 1).textContent).toBe('z');
        expect(renders1).toBe(0);
      });

      it('does not paint the grid that names the sheet again when the registering grid writes after an external write', () => {
        engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 }, 'b');

        expect(renders1).toBe(1);

        renders1 = 0;
        grids[1].setDataAtCell(0, 0, 'q');

        expect(grids[0].getCell(0, 1).textContent).toBe('z');
        expect(renders1).toBe(0);
      });
    });

    it('paints the grid that names the sheet once when a grid built without data registers it', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      grids.push(mountGrid(containers[0], [['a', '=Sheet2!A1']], engine, 'Sheet1', () => {
        renders1 += 1;
      }));
      renders1 = 0;
      grids.push(mountGrid(containers[1], undefined, engine, 'Sheet2', () => {}));

      expect(grids[0].getCell(0, 1).textContent).toBe('');
      expect(renders1).toBe(1);
    });
  });

  describe('addSheet and engine settings', () => {
    let container;
    let hot;
    let engine;
    let renders;

    beforeEach(() => {
      container = createContainer();
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      renders = 0;
    });

    afterEach(() => {
      hot?.destroy();
      container.remove();
    });

    it('paints a grid that already reads the sheet addSheet creates', () => {
      hot = mountGrid(container, [['=New!A1']], engine, 'Sheet1', () => {
        renders += 1;
      });
      renders = 0;

      expect(hot.getPlugin('formulas').addSheet('New', [[10]])).toBe('New');
      expect(hot.getCell(0, 0).textContent).toBe('10');
      expect(renders).toBe(2);
    });

    it('paints once when updateSettings changes the engine language', () => {
      hot = mountGrid(container, [[1, '=A1*2']], engine, 'Sheet1', () => {
        renders += 1;
      });
      renders = 0;
      HyperFormula.registerLanguage(plPL.langCode, plPL);

      try {
        hot.updateSettings({
          formulas: {
            engine,
            sheetName: 'Sheet1',
            language: plPL,
          },
        });

        expect(engine.getConfig().language).toBe(plPL.langCode);
        expect(hot.getCell(0, 1).textContent).toBe('2');
        expect(renders).toBe(1);
      } finally {
        HyperFormula.unregisterLanguage(plPL.langCode);
      }
    });
  });
});
