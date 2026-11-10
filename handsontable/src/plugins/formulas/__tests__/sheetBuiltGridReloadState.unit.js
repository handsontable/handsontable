import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;
// Column C reads column B of its own row, so a value written into B shows in C once the engine holds it.
const SHEET_CONTENT = [['b', 2, '=B1*2'], ['a', 1, '=B2*2'], ['c', 3, '=B3*2']];

/**
 * A grid built from an engine sheet without `data` reloads that sheet on every `updateSettings()`, which React and
 * Vue call on every re-render. The reload used to go through `loadData()`, which drops every change still waiting
 * for its validator and resets the sort plugins' state, so an edit made right before a re-render never landed,
 * and a sorted grid kept its sorted rows with no sort config, so `clearSort()` could not bring the manual order
 * back. A grid built with `data` keeps both across an update.
 */
describe('Formulas reload of a sheet-built grid keeps the grid\'s state', () => {
  let container;
  let hot;
  let held;

  beforeEach(() => {
    held = [];
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds an engine with the `S1` sheet holding `SHEET_CONTENT`.
   *
   * @returns {HyperFormula}
   */
  function buildEngine() {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), SHEET_CONTENT);

    return engine;
  }

  /**
   * Builds a sheet-built grid whose column B carries a validator that holds its callback until the test answers
   * it, with `allowInvalid: false`, so a change to B waits for the answer before it lands.
   *
   * @param {HyperFormula} engine The engine.
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(engine, settings = {}) {
    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      colHeaders: true,
      cells: (row, col) => (col === 1 ? {
        allowInvalid: false,
        validator(value, callback) {
          held.push({ value, callback });
        },
      } : {}),
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Waits until every queued microtask and one macrotask have run.
   */
  async function flush() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Answers every validator call held so far.
   *
   * @param {boolean} valid The answer.
   */
  async function answerAll(valid) {
    // The Core calls a validator in a microtask.
    await flush();
    held.splice(0).forEach(({ callback }) => callback(valid));
    await flush();
  }

  /**
   * Reads, for each visual cell, the value the engine holds at the cell the grid translates it to.
   *
   * @returns {Array<Array<*>>}
   */
  function readEngineThroughGrid() {
    const formulas = hot.getPlugin('formulas');

    return hot.getData().map((row, visualRow) => row.map((_, visualColumn) => {
      const value = formulas.engine.getCellValue({
        sheet: formulas.sheetId,
        row: formulas.rowAxisSyncer.getHfIndexFromVisualIndex(visualRow),
        col: formulas.columnAxisSyncer.getHfIndexFromVisualIndex(visualColumn),
      });

      return value !== null && typeof value === 'object' ? value.value : value;
    }));
  }

  /**
   * Reads the sort indicator class of a column header.
   *
   * @param {number} column The visual column.
   * @returns {string|null}
   */
  function readIndicator(column) {
    const span = hot.getCell(-1, column)?.querySelector('.columnSorting');

    if (!span) {
      return null;
    }

    if (span.classList.contains('ascending')) {
      return 'ascending';
    }

    return span.classList.contains('descending') ? 'descending' : null;
  }

  const LAYOUTS = [
    ['without a move', {}, () => {}],
    ['with a manualRowMove', { manualRowMove: [2, 0, 1] }, () => {}],
    ['with a sort', { columnSorting: true }, grid => grid.getPlugin('columnSorting')
      .sort({ column: 1, sortOrder: 'desc' })],
  ];

  describe('a change waiting for its validator across updateSettings()', () => {
    it.each(LAYOUTS)('lands when the validator accepts it, %s', async(_, settings, arrange) => {
      buildGrid(buildEngine(), settings);
      arrange(hot);

      const letter = hot.getDataAtCell(0, 0);

      hot.setDataAtCell(0, 1, 5);
      hot.updateSettings({});
      hot.updateSettings({});
      // The Core calls the validator in a microtask; the change waits for its answer from then on.
      await flush();

      expect(held.length).toBe(1);

      await answerAll(true);

      expect(hot.getDataAtCell(0, 0)).toBe(letter);
      expect(hot.getDataAtCell(0, 1)).toBe(5);
      expect(hot.getDataAtCell(0, 2)).toBe(10);
      expect(readEngineThroughGrid()).toEqual(hot.getData());

      // The value stays in after the next re-render too: the engine holds it.
      hot.updateSettings({});

      expect(hot.getDataAtCell(0, 0)).toBe(letter);
      expect(hot.getDataAtCell(0, 1)).toBe(5);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    });

    it.each(LAYOUTS)('keeps the previous value when the validator rejects it, %s', async(_, settings, arrange) => {
      buildGrid(buildEngine(), settings);
      arrange(hot);

      const before = hot.getData();

      hot.setDataAtCell(0, 1, 5);
      hot.updateSettings({});
      await flush();

      expect(held.length).toBe(1);

      await answerAll(false);

      expect(hot.getData()).toEqual(before);
      expect(readEngineThroughGrid()).toEqual(before);
    });
  });

  it('keeps a change written into the engine at once, with an async validator that accepts invalid values, across updateSettings()', async() => {
    hot = new Handsontable(container, {
      formulas: { engine: buildEngine(), sheetName: 'S1' },
      // The default `allowInvalid: true`: the Core cannot reject the change, so Formulas writes it at once.
      cells: (row, col) => (col === 1 ? {
        validator(value, callback) {
          held.push({ value, callback });
        },
      } : {}),
      licenseKey: LICENSE_KEY,
    });

    hot.setDataAtCell(0, 1, 5);
    hot.updateSettings({});
    await answerAll(true);

    expect(hot.getDataAtRow(0)).toEqual(['b', 5, 10]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  describe.each([
    ['columnSorting', 'columnSorting'],
    ['multiColumnSorting', 'multiColumnSorting'],
  ])('the %s state across updateSettings()', (_, pluginKey) => {
    it.each([
      ['without a move', {}, [['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]],
      ['with a manualRowMove', { manualRowMove: [2, 0, 1] }, [['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]],
    ])('keeps the sort config and the indicator, and clears back to the manual order, %s', (__, settings, manual) => {
      buildGrid(buildEngine(), { [pluginKey]: true, ...settings });

      expect(hot.getData()).toEqual(manual);

      hot.getPlugin(pluginKey).sort({ column: 0, sortOrder: 'asc' });

      const sorted = [['a', 1, 2], ['b', 2, 4], ['c', 3, 6]];

      for (let update = 0; update < 3; update += 1) {
        hot.updateSettings({});

        expect(hot.getPlugin(pluginKey).getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
        expect(readIndicator(0)).toBe('ascending');
        expect(hot.getData()).toEqual(sorted);
        expect(readEngineThroughGrid()).toEqual(sorted);
      }

      hot.getPlugin(pluginKey).clearSort();

      expect(hot.getData()).toEqual(manual);
      expect(readIndicator(0)).toBe(null);
      expect(readEngineThroughGrid()).toEqual(manual);

      hot.updateSettings({});

      expect(hot.getData()).toEqual(manual);
      expect(readEngineThroughGrid()).toEqual(manual);
    });
  });

  it('applies a header-click sort that waits for the edited cell\'s validator across updateSettings()', async() => {
    buildGrid(buildEngine(), { columnSorting: true });

    // Opens the editor on B1 and types a value, then presses and releases the column A header the way a mouse
    // does: the column selection closes and saves the editor, and the sort waits for the validator.
    hot.selectCell(0, 1);

    const editor = hot.getActiveEditor();

    editor.beginEditing();
    editor.setValue('7');

    const label = document.createElement('span');
    const event = new MouseEvent('mousedown', { button: 0 });

    label.className = 'colHeader';
    label.dispatchEvent(event);
    hot.runHooks('beforeOnCellMouseDown', event, { row: -1, col: 0 }, null, { row: false, column: false, cell: false });
    hot.selectColumns(0);
    hot.runHooks('afterOnCellMouseDown', event, { row: -1, col: 0 }, null);
    hot.runHooks('afterOnCellMouseUp', new MouseEvent('mouseup'), { row: -1, col: 0 }, null);
    await flush();

    expect(held.length).toBe(1);
    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);

    hot.updateSettings({});

    await answerAll(true);

    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
    // The edit landed on its own record, `b`, before the rows moved. The editor writes text.
    expect(hot.getData()).toEqual([['a', 1, 2], ['b', '7', 14], ['c', 3, 6]]);
    expect(readEngineThroughGrid()).toEqual([['a', 1, 2], ['b', 7, 14], ['c', 3, 6]]);
  });

  it.each([
    ['without a move', {}, 0, [['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]],
    // The first reload of a moved grid loads the engine's formula text, which names the rows in the engine's
    // order, so the rows differ from the ones the history was recorded on and UndoRedo starts over. From then
    // on the reload loads the same rows, and the history stays.
    ['after a first reload of a moved grid', { manualRowMove: [2, 0, 1] }, 1, [['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]],
  ])('undoes an edit made before updateSettings() in the grid and the engine, %s', async(
    _, settings, reloads, initial,
  ) => {
    buildGrid(buildEngine(), { undo: true, ...settings });

    for (let reload = 0; reload < reloads; reload += 1) {
      hot.updateSettings({});
    }

    hot.setDataAtCell(0, 1, 5);
    await answerAll(true);

    expect(hot.getDataAtRow(0)).toEqual([initial[0][0], 5, 10]);

    hot.updateSettings({});
    hot.getPlugin('undoRedo').undo();
    await answerAll(true);

    expect(hot.getData()).toEqual(initial);
    expect(readEngineThroughGrid()).toEqual(initial);

    hot.getPlugin('undoRedo').redo();
    await answerAll(true);

    expect(hot.getDataAtRow(0)).toEqual([initial[0][0], 5, 10]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });
});
