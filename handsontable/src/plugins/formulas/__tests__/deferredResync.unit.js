import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { NestedRows } from '../../nestedRows';

/**
 * DEV-3006: `updateSettings()` used to rebuild the HyperFormula sheet twice when a setting moved
 * the row count - once from `afterCellMetaReset`, mid-update, against a layout the plugins were
 * about to replace, and once from the late `afterUpdateSettings` listener that carries the sheet
 * across the change (DEV-2978). The mid-update pass now records that a resync is owed, and one scan
 * runs per cycle: from the late listener, or earlier, from the first engine read a listener makes.
 */
describe('Formulas deferred resync', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(NestedRows);
  });

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
   * Builds a two-level tree grid with the Formulas plugin bound to an engine instance the test can
   * spy on. The plugin is built with NestedRows OFF, so the sheet holds the two top-level rows.
   *
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @returns {{ engine: object, writes: jest.SpyInstance }} The engine and the `setSheetContent` spy.
   */
  function buildTree(settings = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const writes = jest.spyOn(engine, 'setSheetContent');

    hot = new Handsontable(container, {
      data: [
        {
          name: 'Root A',
          calc: '',
          __children: [
            { name: 'A-1', calc: '=UPPER(A2)' },
            { name: 'A-2', calc: '' },
          ],
        },
        { name: 'Root B', calc: '=UPPER(A1)' },
      ],
      columns: [{ data: 'name' }, { data: 'calc' }],
      nestedRows: false,
      formulas: { engine },
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return { engine, writes };
  }

  /**
   * Builds a flat grid with the Formulas plugin bound to an engine instance the test can spy on.
   *
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @returns {{ engine: object, writes: jest.SpyInstance }} The engine and the `setSheetContent` spy.
   */
  function buildFlat(settings = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const writes = jest.spyOn(engine, 'setSheetContent');

    hot = new Handsontable(container, {
      data: [
        [1, '=A1+10'],
        [2, '=A2+10'],
      ],
      formulas: { engine },
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return { engine, writes };
  }

  /**
   * @param {object} engine The HyperFormula instance.
   * @returns {Array<Array<*>>} What the grid's sheet holds, as formulas.
   */
  function sheetContent(engine) {
    return engine.getSheetSerialized(hot.getPlugin('formulas').sheetId);
  }

  it('fills the sheet at construction', () => {
    const { engine } = buildFlat();

    expect(sheetContent(engine)).toEqual([[1, '=A1+10'], [2, '=A2+10']]);
    expect(hot.getDataAtCell(0, 1)).toBe(11);
  });

  it('rebuilds the sheet once when a settings update changes the row count', () => {
    const { engine, writes } = buildTree();

    writes.mockClear();
    hot.updateSettings({ nestedRows: true });

    expect(writes).toHaveBeenCalledTimes(1);
    expect(hot.countRows()).toBe(4);
    expect(sheetContent(engine)).toEqual([
      ['Root A', ''],
      ['A-1', '=UPPER(A2)'],
      ['A-2', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
    expect(hot.getDataAtCell(1, 1)).toBe('A-1');
    expect(hot.getDataAtCell(3, 1)).toBe('ROOT A');
  });

  it('rebuilds the sheet once when the row count falls back', () => {
    const { engine, writes } = buildTree();

    hot.updateSettings({ nestedRows: true });
    writes.mockClear();
    hot.updateSettings({ nestedRows: false });

    expect(writes).toHaveBeenCalledTimes(1);
    expect(hot.countRows()).toBe(2);
    expect(sheetContent(engine)).toEqual([
      ['Root A', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
  });

  it('rebuilds the sheet once on a settings update that leaves the row count alone', () => {
    const { engine, writes } = buildFlat();

    writes.mockClear();
    hot.updateSettings({ readOnly: true });

    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([[1, '=A1+10'], [2, '=A2+10']]);
  });

  it('feeds new data to the engine once when the update carries it', () => {
    const { engine, writes } = buildFlat();

    writes.mockClear();
    hot.updateSettings({ data: [[5, '=A1*2'], [6, '=A2*2'], [7, '=A3*2']] });

    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([[5, '=A1*2'], [6, '=A2*2'], [7, '=A3*2']]);
    expect(hot.getDataAtCell(2, 1)).toBe(14);
  });

  it('lets a default-order afterUpdateSettings listener read the values the update produced', () => {
    const { writes } = buildFlat();
    const seen = [];

    hot.addHook('afterUpdateSettings', () => {
      seen.push(hot.getDataAtCell(0, 1));
    });

    writes.mockClear();
    hot.updateSettings({ data: [[5, '=A1*2']] });

    expect(seen).toEqual([10]);
    expect(writes).toHaveBeenCalledTimes(1);
  });

  it('serves a default-order listener the layout the plugins produced, at one scan', () => {
    const { engine, writes } = buildTree();
    const seen = [];

    // Every plugin registers its `afterUpdateSettings` listener at construction, so a listener
    // added afterwards runs once the plugins have updated - the tree is already flat when this
    // read drains the owed resync, and the late listener then has nothing left to do.
    hot.addHook('afterUpdateSettings', () => {
      seen.push(hot.getDataAtCell(1, 1));
    });

    writes.mockClear();
    hot.updateSettings({ nestedRows: true });

    expect(seen).toEqual(['A-1']);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([
      ['Root A', ''],
      ['A-1', '=UPPER(A2)'],
      ['A-2', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
  });

  it('syncs the sheet on the next read when a default-order listener throws', () => {
    const { engine, writes } = buildFlat();

    hot.addHook('afterUpdateSettings', () => {
      throw new Error('listener failure');
    });

    writes.mockClear();

    expect(() => hot.updateSettings({ data: [[5, '=A1*2']] })).toThrow('listener failure');
    expect(writes).not.toHaveBeenCalled();

    // The read drains the owed resync against the layout the grid now holds.
    expect(hot.getDataAtCell(0, 1)).toBe(10);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([[5, '=A1*2']]);
  });

  it('does not retry a scan that threw until the next settings update', () => {
    const { engine, writes } = buildFlat();

    writes.mockClear();
    writes.mockImplementationOnce(() => {
      throw new Error('write failed');
    });

    expect(() => hot.updateSettings({ data: [[5, '=A1*2']] })).toThrow('write failed');
    expect(writes).toHaveBeenCalledTimes(1);

    // Reads keep serving the sheet the engine still holds, without another scan: a throw that
    // repeated on every scan would otherwise make every read throw.
    expect(() => hot.getDataAtCell(0, 1)).not.toThrow();
    expect(() => hot.render()).not.toThrow();
    expect(writes).toHaveBeenCalledTimes(1);

    hot.updateSettings({ readOnly: true });

    expect(writes).toHaveBeenCalledTimes(2);
    expect(sheetContent(engine)).toEqual([[5, '=A1*2']]);
    expect(hot.getDataAtCell(0, 1)).toBe(10);
  });

  it('stops scanning after a write that fails on every attempt', () => {
    const { writes } = buildFlat();

    writes.mockClear();
    writes.mockImplementation(() => {
      throw new Error('always fails');
    });

    expect(() => hot.updateSettings({ data: [[5, '=A1*2']] })).toThrow('always fails');

    expect(() => {
      hot.getDataAtCell(0, 1);
      hot.getDataAtCell(0, 1);
      hot.getDataAtCell(0, 1);
      hot.render();
    }).not.toThrow();
    expect(writes).toHaveBeenCalledTimes(1);
  });

  it('empties the sheet instead of throwing when the engine cannot hold the layout', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });
    const writes = jest.spyOn(engine, 'setSheetContent');
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});

    hot = new Handsontable(container, {
      data: [[1, '=A1+10'], [2, '=A2+10']],
      formulas: { engine },
      licenseKey: 'non-commercial-and-evaluation',
    });

    writes.mockClear();

    expect(() => hot.updateSettings({ data: [[1, '=A1+10'], [2, '=A2+10'], [3, '=A3+10']] })).not.toThrow();
    expect(writes).toHaveBeenCalledTimes(1);
    expect(writes).toHaveBeenCalledWith(hot.getPlugin('formulas').sheetId, [[]]);
    expect(warnings).toHaveBeenCalledWith(expect.stringContaining('maxRows'));
    expect(() => hot.getDataAtCell(2, 1)).not.toThrow();
    expect(writes).toHaveBeenCalledTimes(1);

    warnings.mockRestore();
  });

  it('drains the owed resync before every later afterUpdateSettings listener', () => {
    const { writes } = buildFlat();
    const seen = [];

    hot.addHook('afterUpdateSettings', () => {
      seen.push(writes.mock.calls.length);
    }, 2);

    writes.mockClear();
    hot.updateSettings({ readOnly: true });

    // A listener behind the plugin's own `orderIndex: 1` one sees the scan already done, not one
    // left for the render to trigger.
    expect(seen).toEqual([1]);
  });

  it('drains the owed resync before the draw when a plugin renders mid-update', () => {
    const { engine, writes } = buildTree();
    const writesAtRenderStart = [];

    hot.addHook('beforeRender', () => {
      writesAtRenderStart.push(writes.mock.calls.length);
    });

    writes.mockClear();
    hot.updateSettings({ nestedRows: true });

    // NestedRows renders from its own `onUpdateSettings`. The plugin's `beforeRender` listener runs
    // ahead of this one and has scanned already, so no cell paint ever drains it.
    expect(writesAtRenderStart[0]).toBe(1);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([
      ['Root A', ''],
      ['A-1', '=UPPER(A2)'],
      ['A-2', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
  });

  it('rescans when the row count moves after an early drain', () => {
    const { engine, writes } = buildTree();

    // Registered after the plugin's own listener, so it runs right after the flag is set and
    // drains it against the pre-flatten tree.
    hot.addHook('afterCellMetaReset', () => {
      hot.getDataAtCell(0, 1);
    });

    writes.mockClear();
    hot.updateSettings({ nestedRows: true });

    expect(writes).toHaveBeenCalledTimes(2);
    expect(sheetContent(engine)).toEqual([
      ['Root A', ''],
      ['A-1', '=UPPER(A2)'],
      ['A-2', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
    expect(hot.getDataAtCell(3, 1)).toBe('ROOT A');
  });

  it('drains the owed resync on a source data read', () => {
    const { writes } = buildFlat();
    const seen = [];

    hot.addHook('afterUpdateSettings', () => {
      seen.push(hot.getSourceDataAtCell(0, 1), writes.mock.calls.length);
    });

    writes.mockClear();
    hot.updateSettings({ data: [[5, '=A1*2']] });

    expect(seen).toEqual(['=A1*2', 1]);
    expect(writes).toHaveBeenCalledTimes(1);
  });

  it('fills the sheet before the first draw at construction', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const seen = [];

    hot = new Handsontable(container, {
      data: [[1, '=A1+10']],
      formulas: { engine },
      licenseKey: 'non-commercial-and-evaluation',
      beforeViewRender() {
        if (seen.length === 0) {
          seen.push(engine.getSheetSerialized(this.getPlugin('formulas').sheetId));
        }
      },
    });

    // Construction has no late `afterUpdateSettings` pass, so the scan stays eager there.
    expect(seen).toEqual([[[1, '=A1+10']]]);
  });

  it('lets a default-order listener load data without a second scan', () => {
    const { engine, writes } = buildFlat();

    hot.addHook('afterUpdateSettings', () => {
      hot.loadData([[5, '=A1*2'], [6, '=A2*2'], [7, '=A3*2']]);
    });

    writes.mockClear();
    hot.updateSettings({ readOnly: true });

    // `loadData()` wrote the sheet itself and recorded the layout it produced, so neither the owed
    // resync nor the row-count gate has anything left to do.
    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([[5, '=A1*2'], [6, '=A2*2'], [7, '=A3*2']]);
    expect(hot.getDataAtCell(2, 1)).toBe(14);
  });

  it('drops the owed resync when the update turns the plugin off', () => {
    const { writes } = buildFlat();

    writes.mockClear();
    hot.updateSettings({ formulas: false });

    expect(writes).not.toHaveBeenCalled();
    expect(hot.getPlugin('formulas').enabled).toBe(false);
    expect(hot.getDataAtCell(0, 1)).toBe('=A1+10');
    expect(writes).not.toHaveBeenCalled();
  });

  it('keeps serving the engine after a dependent grid throws during a loadData write', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const otherContainer = document.createElement('div');
    const shouldThrow = { current: false };

    document.body.appendChild(otherContainer);

    // A second grid on the same engine, reading this grid's sheet. `renderDependentSheets` redraws
    // it from inside the span `#internalOperationPending` is open across.
    const otherHot = new Handsontable(otherContainer, {
      data: [['=Sheet1!A1']],
      formulas: { engine, sheetName: 'other' },
      licenseKey: 'non-commercial-and-evaluation',
      afterRender() {
        if (shouldThrow.current) {
          throw new Error('dependent grid render failed');
        }
      },
    });

    hot = new Handsontable(container, {
      data: [[1, '=A1+10']],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    shouldThrow.current = true;

    expect(() => hot.loadData([[5, '=A1*2']])).toThrow('dependent grid render failed');

    shouldThrow.current = false;

    // The write landed before the dependent render threw, and the span was released on the way
    // out, so the read hooks keep serving the engine instead of raw formula text.
    expect(hot.getDataAtCell(0, 1)).toBe(10);

    otherHot.destroy();
    otherContainer.remove();
  });

  it('drops the owed resync when a listener disables and re-enables the plugin mid-update', () => {
    const { engine, writes } = buildFlat();
    const plugin = hot.getPlugin('formulas');
    let toggled = false;

    // Pins the documented gap: `disablePlugin()` clears the flag and `enablePlugin()` finds the
    // sheet still in the user-supplied engine, so nothing writes the new data until the next
    // update. Formulas' own `updatePlugin()` does not take this path.
    hot.addHook('afterUpdateSettings', () => {
      if (toggled) {
        return;
      }

      toggled = true;
      plugin.disablePlugin();
      plugin.enablePlugin();
    });

    writes.mockClear();
    hot.updateSettings({ data: [[5, '=A1*2']] });

    expect(writes).not.toHaveBeenCalled();
    expect(sheetContent(engine)).toEqual([[1, '=A1+10'], [2, '=A2+10']]);

    hot.updateSettings({ readOnly: true });

    expect(writes).toHaveBeenCalledTimes(1);
    expect(sheetContent(engine)).toEqual([[5, '=A1*2']]);
  });

  it('does not write the grid into a sheet the update switched to', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('Q1');
    engine.setSheetContent(engine.getSheetId('Q1'), [['q1-a', 'q1-b', 'q1-c'], ['q1-d', 'q1-e', 'q1-f']]);
    engine.addSheet('Q2');
    engine.setSheetContent(engine.getSheetId('Q2'), [
      ['q2-a', 'q2-b', 'q2-c'],
      ['q2-d', 'q2-e', 'q2-f'],
      ['q2-g', 'q2-h', 'q2-i'],
    ]);

    hot = new Handsontable(container, {
      data: [['q1-a', 'q1-b', 'q1-c'], ['q1-d', 'q1-e', 'q1-f']],
      columns: [{ data: 0 }],
      formulas: { engine, sheetName: 'Q1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({ formulas: { engine, sheetName: 'Q2' } });

    expect(hot.countRows()).toBe(3);
    expect(engine.getSheetSerialized(engine.getSheetId('Q2'))).toEqual([
      ['q2-a', 'q2-b', 'q2-c'],
      ['q2-d', 'q2-e', 'q2-f'],
      ['q2-g', 'q2-h', 'q2-i'],
    ]);

    // A later read must not drain a resync the switch made obsolete.
    expect(hot.getDataAtCell(0, 0)).toBe('q2-a');
    expect(engine.getSheetSerialized(engine.getSheetId('Q2'))[0]).toEqual(['q2-a', 'q2-b', 'q2-c']);
  });

  it('pushes exactly one engine undo entry per settings update', () => {
    const { engine } = buildTree();

    /**
     * @returns {number} How many undo entries the engine holds.
     */
    function undoDepth() {
      const state = engine.getAllSheetsSerialized();
      let depth = 0;

      while (engine.isThereSomethingToUndo()) {
        engine.undo();
        depth += 1;
      }

      while (engine.isThereSomethingToRedo()) {
        engine.redo();
      }

      expect(engine.getAllSheetsSerialized()).toEqual(state);

      return depth;
    }

    const depthAfterBuild = undoDepth();

    hot.updateSettings({ nestedRows: true });

    // Every `setSheetContent` pushes one engine undo entry. The grid records no action for a
    // settings update, so each extra scan is an entry the grid can never match.
    expect(undoDepth()).toBe(depthAfterBuild + 1);
  });
});
