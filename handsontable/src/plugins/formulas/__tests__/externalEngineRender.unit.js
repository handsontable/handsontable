import { HyperFormula } from 'hyperformula';
import plPL from 'hyperformula/commonjs/i18n/languages/plPL';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../../columnSorting';
import { ManualRowMove } from '../../manualRowMove';
import { NestedRows } from '../../nestedRows';
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
    registerPlugin(NestedRows);
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

    it('paints the formula cell after engine.changeNamedExpression without a manual render', () => {
      engine.addNamedExpression('ADDITIONAL_COST', 5);
      hot.destroy();
      hot = mountGrid(container, [[1, '=A1+ADDITIONAL_COST']], engine, 'Sheet1', () => {
        renders += 1;
      });
      renders = 0;

      expect(hot.getCell(0, 1).textContent).toBe('6');

      engine.changeNamedExpression('ADDITIONAL_COST', 20);

      expect(hot.getCell(0, 1).textContent).toBe('21');
      expect(renders).toBe(1);
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

  describe('several external writes', () => {
    let container;
    let engine;
    let hot;
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
      hot.destroy();
      container.remove();
    });

    it('paints once for each write, and once for the writes inside engine.batch()', () => {
      const address = { sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 };

      engine.setCellContents(address, 2);
      engine.setCellContents(address, 3);

      expect(renders).toBe(2);

      renders = 0;
      engine.batch(() => {
        engine.setCellContents(address, 4);
        engine.setCellContents(address, 5);
      });

      expect(renders).toBe(1);
      expect(hot.getCell(0, 1).textContent).toBe('10');
    });

    it('settles when the host writes the engine from afterRender only while the value differs', () => {
      const address = { sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 };

      hot.addHook('afterRender', () => {
        if (engine.getCellValue(address) !== 9) {
          engine.setCellContents(address, 9);
        }
      });
      engine.setCellContents(address, 3);

      expect(renders).toBe(2);
      expect(hot.getCell(0, 1).textContent).toBe('18');
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
      hot = mountGrid(container, [['a', '=ROW()&A1'], ['b', '=ROW()&A2'], ['c', '=ROW()&A3']], engine, 'Sheet1', () => {
        renders += 1;
      }, { manualRowMove: true });
      renders = 0;

      const shown = () => [0, 1, 2].map(row => hot.getCell(row, 1).textContent);

      expect(shown()).toEqual(['1a', '2b', '3c']);
      expect(hot.getPlugin('manualRowMove').moveRows([0], 2)).toBe(true);

      expect(hot.getDataAtCol(1)).toEqual(['1b', '2c', '3a']);
      expect(shown()).toEqual(['1a', '2b', '3c']);
      expect(renders).toBe(0);

      hot.render();

      expect(shown()).toEqual(['1b', '2c', '3a']);
    });
  });

  describe('a padded sheet, with a second grid that reads it', () => {
    const ROWS = 30;
    const CONTENT_ROWS = 5;
    let containers;
    let grids;
    let engine;
    let renders;

    const lastRowFirst = [ROWS - 1, ...Array.from({ length: ROWS - 1 }, (_, index) => index)];
    const sheetHeight = () => engine.getSheetDimensions(engine.getSheetId('Sheet1')).height;

    beforeEach(() => {
      containers = [createContainer(), createContainer()];
      grids = [];
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      renders = [0, 0];

      const data = Array.from({ length: ROWS }, (_, row) => (
        row < CONTENT_ROWS ? [row + 1, `=A${row + 1}*2`] : [null, null]
      ));

      grids.push(mountGrid(containers[0], data, engine, 'Sheet1', () => {
        renders[0] += 1;
      }, { columnSorting: { sortEmptyCells: true }, manualRowMove: true }));
      grids.push(mountGrid(containers[1], [['=SUM(Sheet1!A1:A3)']], engine, 'Sheet2', () => {
        renders[1] += 1;
      }));
      renders.fill(0);
    });

    afterEach(() => {
      grids.forEach(grid => grid.destroy());
      containers.forEach(container => container.remove());
    });

    it('paints only the dependent grid, once, when a sequence puts a blank row first and the sheet is extended', () => {
      expect(sheetHeight()).toBe(CONTENT_ROWS);
      expect(grids[1].getCell(0, 0).textContent).toBe('6');

      grids[0].rowIndexMapper.setIndexesSequence(lastRowFirst);

      expect(sheetHeight()).toBe(CONTENT_ROWS + 1);
      expect(grids[0].getDataAtCol(0).slice(0, CONTENT_ROWS + 1)).toEqual([null, 1, 2, 3, 4, 5]);
      expect(grids[1].getCell(0, 0).textContent).toBe('3');
      expect(renders).toEqual([0, 1]);
    });

    it('paints each grid once when a sort puts the blank rows first and the sheet is extended', () => {
      grids[0].getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(sheetHeight()).toBe(ROWS);
      expect(grids[0].getDataAtCol(0).slice(-CONTENT_ROWS)).toEqual([1, 2, 3, 4, 5]);
      expect(grids[1].getCell(0, 0).textContent).toBe('0');
      expect(renders).toEqual([1, 1]);
    });

    it('paints the dependent grid once when a row is moved on the padded sheet', () => {
      grids[0].rowIndexMapper.setIndexesSequence(lastRowFirst);
      renders.fill(0);

      expect(grids[0].getPlugin('manualRowMove').moveRows([1], 4)).toBe(true);

      expect(grids[0].getDataAtCol(0).slice(0, CONTENT_ROWS + 1)).toEqual([null, 2, 3, 4, 1, 5]);
      expect(grids[1].getCell(0, 0).textContent).toBe('2');
      expect(renders[1]).toBe(1);
    });
  });

  describe('a second grid that reads a sheet the first grid changes through its own plugins', () => {
    let containers;
    let grids;
    let engine;

    beforeEach(() => {
      containers = [createContainer(), createContainer()];
      grids = [];
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    });

    afterEach(() => {
      grids.forEach(grid => grid.destroy());
      containers.forEach(container => container.remove());
    });

    it('shows the new value in the other grid after a column sort', () => {
      const renders = [0, 0];

      grids.push(mountGrid(containers[0], [[3], [1]], engine, 'Sheet1', () => {
        renders[0] += 1;
      }, { columnSorting: true }));
      grids.push(mountGrid(containers[1], [['=Sheet1!A1*10']], engine, 'Sheet2', () => {
        renders[1] += 1;
      }));
      renders.fill(0);

      grids[0].getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(grids[1].getDataAtCell(0, 0)).toBe(10);
      expect(grids[1].getCell(0, 0).textContent).toBe('10');
      expect(renders).toEqual([1, 1]);
    });

    it('shows the new value in the other grid after a row move', () => {
      grids.push(mountGrid(containers[0], [[3], [1], [5]], engine, 'Sheet1', () => {}, { manualRowMove: true }));
      grids.push(mountGrid(containers[1], [['=SUM(Sheet1!A1:A2)']], engine, 'Sheet2', () => {}));

      expect(grids[1].getCell(0, 0).textContent).toBe('4');
      expect(grids[0].getPlugin('manualRowMove').moveRows([0], 2)).toBe(true);

      expect(grids[1].getDataAtCell(0, 0)).toBe(1);
      expect(grids[1].getCell(0, 0).textContent).toBe('1');
    });

    it('shows the new value in the other grid after a NestedRows detach', () => {
      grids.push(mountGrid(containers[0], [
        { name: 'a', __children: [{ name: 'b' }, { name: 'c' }] }, { name: 'd' }, { name: 'e' }, { name: 'f' },
      ], engine, 'Sheet1', () => {}, { nestedRows: true, columns: [{ data: 'name' }] }));
      grids.push(mountGrid(containers[1], [['=COUNTA(Sheet1!A1:A10)']], engine, 'Sheet2', () => {}));

      expect(grids[1].getCell(0, 0).textContent).toBe('6');

      const nestedRows = grids[0].getPlugin('nestedRows');

      nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(1));

      expect(grids[1].getDataAtCell(0, 0)).toBe(6);
      expect(grids[1].getCell(0, 0).textContent).toBe('6');
    });
  });

  describe('a listener that turns Formulas off while a NestedRows detach is synced', () => {
    let container;
    let hot;

    afterEach(() => {
      hot?.destroy();
      container.remove();
    });

    it('detaches the row without throwing', () => {
      container = createContainer();
      hot = mountGrid(container, [
        { name: 'a', __children: [{ name: 'b' }, { name: 'c' }] }, { name: 'd' },
      ], HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' }), 'Sheet1', () => {}, {
        nestedRows: true,
        columns: [{ data: 'name' }],
      });

      let turnedOff = false;

      hot.addHook('modifySourceData', () => {
        if (!turnedOff && hot.getPlugin('formulas').isEnabled()) {
          turnedOff = true;
          hot.getPlugin('formulas').disablePlugin();
        }
      });

      const nestedRows = hot.getPlugin('nestedRows');

      expect(() => nestedRows.dataManager.detachFromParent(nestedRows.dataManager.getDataObject(1))).not.toThrow();
      expect(turnedOff).toBe(true);
      expect(hot.countRows()).toBe(4);
    });
  });

  describe('a grid whose afterRender throws while other grids repaint', () => {
    let containers;
    let grids;
    let engine;
    let warn;
    let listenerRuns;
    let failNextRender;

    beforeEach(() => {
      containers = [createContainer(), createContainer(), createContainer()];
      grids = [];
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      listenerRuns = 0;
      failNextRender = false;
    });

    afterEach(() => {
      warn.mockRestore();
      grids.forEach(grid => grid.destroy());
      containers.forEach(container => container.remove());
    });

    /**
     * Mounts the grid that owns Sheet1 and two grids that read it. The second one throws from its
     * `afterRender` once `failNextRender` is set.
     *
     * @param {Function} [onSourceRender] Called from `afterRender` of the grid that owns Sheet1.
     */
    function mountReaders(onSourceRender = () => {}) {
      grids.push(mountGrid(containers[0], [[1]], engine, 'Sheet1', onSourceRender));
      grids.push(mountGrid(containers[1], [['=Sheet1!A1*2']], engine, 'Sheet2', () => {
        if (failNextRender) {
          failNextRender = false;
          throw new Error('afterRender failed');
        }
      }));
      grids.push(mountGrid(containers[2], [['=Sheet1!A1*2']], engine, 'Sheet3', () => {}));
      engine.on('valuesUpdated', () => {
        listenerRuns += 1;
      });
    }

    it('returns the engine call, paints the other grids and runs later listeners after an external write', () => {
      mountReaders();
      failNextRender = true;

      let changes;

      expect(() => {
        changes = engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 }, 3);
      }).not.toThrow();

      expect(changes.length).toBeGreaterThan(0);
      expect(grids[2].getCell(0, 0).textContent).toBe('6');
      expect(listenerRuns).toBe(1);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('paints the other grids and runs the listeners before the caller sees the failed paint of a plugin write', () => {
      mountReaders();
      failNextRender = true;

      expect(() => grids[0].setDataAtCell(0, 0, 3)).toThrow('afterRender failed');

      expect(grids[2].getCell(0, 0).textContent).toBe('6');
      expect(listenerRuns).toBe(1);
      expect(warn).not.toHaveBeenCalled();

      grids[0].setDataAtCell(0, 0, 4);

      expect(grids[0].getCell(0, 0).textContent).toBe('4');
      expect(grids[2].getCell(0, 0).textContent).toBe('8');
    });

    it('still throws a failure of the caller\'s own render after a plugin write, as without the plugin', () => {
      let failOwnRender = false;

      mountReaders(() => {
        if (failOwnRender) {
          failOwnRender = false;
          throw new Error('own afterRender failed');
        }
      });
      failOwnRender = true;

      expect(() => grids[0].setDataAtCell(0, 0, 3)).toThrow('own afterRender failed');

      expect(grids[2].getCell(0, 0).textContent).toBe('6');
      expect(listenerRuns).toBe(1);
    });
  });

  describe('a dependent grid whose afterRender throws while this grid registers its sheet', () => {
    let containers;
    let grids;
    let engine;
    let failNextRender;

    beforeEach(() => {
      containers = [createContainer(), createContainer()];
      grids = [];
      engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      failNextRender = false;
      grids.push(mountGrid(containers[0], [['=Sheet2!A1', '=Sheet3!A1']], engine, 'Sheet1', () => {
        if (failNextRender) {
          failNextRender = false;
          throw new Error('afterRender failed');
        }
      }));
      grids.push(mountGrid(containers[1], [['x']], engine, 'Sheet2', () => {}));
    });

    afterEach(() => {
      grids.forEach(grid => grid.destroy());
      containers.forEach(container => container.remove());
    });

    it('binds a grid that turns Formulas on to the sheet it registered, and reports the failed paint after the update', () => {
      containers.push(createContainer());
      grids.push(new Handsontable(containers[2], { data: [['x']], licenseKey: LICENSE_KEY }));
      failNextRender = true;

      let error;

      try {
        grids[2].updateSettings({ formulas: { engine, sheetName: 'Sheet3' } });
      } catch (e) {
        error = e;
      }

      const plugin = grids[2].getPlugin('formulas');

      expect(plugin.sheetName).toBe('Sheet3');
      expect(plugin.sheetId).toBe(engine.getSheetId('Sheet3'));

      grids[2].setDataAtCell(0, 0, '=1+2');

      expect(grids[2].getDataAtCell(0, 0)).toBe(3);
      expect(grids[0].getDataAtCell(0, 1)).toBe(3);
      expect(error?.message).toBe('afterRender failed');
    });

    it('binds a grid that turns Formulas back on to the sheet it registered, and reports the failed paint after the enable', () => {
      containers.push(createContainer());
      grids.push(mountGrid(containers[2], [['x']], engine, 'Sheet3', () => {}));

      const plugin = grids[2].getPlugin('formulas');

      plugin.disablePlugin();
      engine.renameSheet(engine.getSheetId('Sheet3'), 'Renamed');
      engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 1 }, '=Sheet3!A1');
      failNextRender = true;

      let error;

      try {
        plugin.enablePlugin();
      } catch (e) {
        error = e;
      }

      expect(plugin.sheetId).toBe(engine.getSheetId('Sheet3'));

      grids[2].setDataAtCell(0, 0, '=1+2');

      expect(grids[2].getDataAtCell(0, 0)).toBe(3);
      expect(grids[0].getDataAtCell(0, 1)).toBe(3);
      expect(error?.message).toBe('afterRender failed');
    });

    it('returns no name from addSheet for a sheet it did not add, and throws the failed paint for one it did', () => {
      const plugin = grids[1].getPlugin('formulas');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(plugin.addSheet('Sheet1')).toBe(false);
      expect(warn).toHaveBeenCalledWith('Sheet with the provided name already exists.');
      warn.mockRestore();

      failNextRender = true;

      expect(() => plugin.addSheet('Sheet3', [[1]])).toThrow('afterRender failed');
      expect(engine.doesSheetExist('Sheet3')).toBe(true);
    });
  });

  describe('a plugin write that fails midway', () => {
    let containers;
    let grids;

    beforeEach(() => {
      containers = [createContainer(), createContainer()];
      grids = [];
    });

    afterEach(() => {
      grids.forEach(grid => grid.destroy());
      containers.forEach(container => container.remove());
    });

    it('still clears #REF! in the grid that names a sheet whose fill threw', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      let renders = 0;

      grids.push(mountGrid(containers[0], [['a', '=Sheet2!A1']], engine, 'Sheet1', () => {
        renders += 1;
      }));

      expect(grids[0].getCell(0, 1).textContent).toBe('#REF!');
      renders = 0;

      expect(() => mountGrid(containers[1], [['x']], engine, 'Sheet2', () => {}, {
        cells() {
          throw new Error('cells failed');
        },
      })).toThrow('cells failed');

      expect(grids[0].getCell(0, 1).textContent).toBe('');
      expect(renders).toBe(1);

      renders = 0;
      engine.setCellContents({ sheet: engine.getSheetId('Sheet1'), row: 0, col: 0 }, 'b');

      expect(renders).toBe(1);
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
      expect(renders).toBe(1);
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
