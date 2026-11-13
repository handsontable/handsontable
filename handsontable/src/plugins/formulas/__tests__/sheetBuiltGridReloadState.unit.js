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

  /**
   * Tells whether any cell carries the `marked` class name.
   *
   * @returns {boolean}
   */
  function isAnyCellMarked() {
    return hot.getData().some((row, visualRow) => row.some((_, visualColumn) => {
      const className = hot.getCellMeta(visualRow, visualColumn).className;

      return typeof className === 'string' && className.includes('marked');
    }));
  }

  // A host that removes or inserts lines through the engine API shifts the records under the grid's physical
  // indexes. `updateData()` keeps every piece of state keyed by a physical index, so it would land on another
  // record; the reload takes the `loadData()` path there instead, and the state is dropped, as before.
  describe.each([
    ['removes rows', 'row', 0, (engine, sheet) => engine.removeRows(sheet, [0, 1])],
    ['inserts a row', 'row', 2, (engine, sheet) => engine.addRows(sheet, [1, 1])],
  ])('a host that %s through the engine API, on a grid without a move', (_, __, target, change) => {
    it('drops the cell meta, the hidden row, the filter and the waiting edit instead of moving them', async() => {
      const engine = buildEngine();
      const sheet = engine.getSheetId('S1');

      buildGrid(engine, { hiddenRows: true, filters: true });

      hot.setCellMeta(target, 0, 'className', 'marked');
      hot.getPlugin('hiddenRows').hideRow(target);
      hot.getPlugin('filters').addCondition(0, 'by_value', [['b', 'c']]);
      hot.getPlugin('filters').filter();
      hot.setDataAtCell(hot.toVisualRow(target), 1, 50);
      await flush();

      expect(held.length).toBe(1);

      change(engine, sheet);
      hot.updateSettings({});
      await answerAll(true);

      // Every record the engine holds is shown, in the engine's order (an inserted row is blank).
      expect(hot.getData()).toEqual(engine.getSheetValues(sheet).map(row => (row.length ? row : [null, null, null])));
      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(hot.getData().flat()).not.toContain(50);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
      expect(isAnyCellMarked()).toBe(false);
    });
  });

  describe.each([
    ['removes a column', (engine, sheet) => engine.removeColumns(sheet, [0, 1])],
    ['inserts a column', (engine, sheet) => engine.addColumns(sheet, [1, 1])],
  ])('a host that %s through the engine API, on a grid without a move', (_, change) => {
    it('drops the cell meta, the hidden column and the waiting edit instead of moving them', async() => {
      const engine = buildEngine();
      const sheet = engine.getSheetId('S1');

      buildGrid(engine, { hiddenColumns: true });

      hot.setCellMeta(0, 1, 'className', 'marked');
      hot.getPlugin('hiddenColumns').hideColumn(1);
      hot.setDataAtCell(0, 1, 50);
      await flush();

      expect(held.length).toBe(1);

      change(engine, sheet);
      hot.updateSettings({});
      await answerAll(true);

      const values = engine.getSheetValues(sheet)
        .map(row => row.map(value => (value !== null && typeof value === 'object' ? value.value : value)));

      expect(hot.getData().map(row => row.slice(0, values[0].length))).toEqual(values);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(hot.getData().flat()).not.toContain(50);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
      expect(isAnyCellMarked()).toBe(false);
    });
  });

  it('keeps the state of a grid with blank spare rows past the sheet, reading no row', () => {
    buildGrid(buildEngine(), { minSpareRows: 2, columnSorting: true });

    expect(hot.countRows()).toBe(5);

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    const getSourceDataAtRow = jest.spyOn(hot, 'getSourceDataAtRow');

    hot.updateSettings({});

    // The engine sheet holds what the grid left in it, so no row is read.
    expect(getSourceDataAtRow).not.toHaveBeenCalled();
    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
    expect(hot.countRows()).toBe(5);
    expect(hot.getDataAtCol(0).slice(0, 3)).toEqual(['c', 'b', 'a']);
  });

  // A host change through the engine API that keeps the line count (a removal and an insert, a rewritten cell, a
  // moved row) can shift or replace the records under the grid's physical indexes too. Only a sheet nothing but
  // this grid changed since it loaded it is reloaded in place; any other change takes `loadData()`, which drops
  // the state keyed by physical indexes, as before.
  describe.each([
    ['removes a row and inserts another', (engine, sheet) => {
      engine.removeRows(sheet, [0, 1]);
      engine.addRows(sheet, [1, 1]);
    }],
    ['rewrites a cell', (engine, sheet) => engine.setCellContents({ sheet, row: 0, col: 0 }, [['z']])],
    ['moves a row', (engine, sheet) => engine.moveRows(sheet, 0, 1, 3)],
  ])('a host that %s through the engine API', (_, change) => {
    it.each([
      ['without a move', {}],
      ['with a manualRowMove', { manualRowMove: [2, 0, 1] }],
    ])('drops the cell meta, the hidden row, the filter and the waiting edit, %s', async(__, settings) => {
      const engine = buildEngine();
      const sheet = engine.getSheetId('S1');

      buildGrid(engine, { hiddenRows: true, filters: true, ...settings });

      const target = hot.toVisualRow(0);

      hot.setCellMeta(target, 0, 'className', 'marked');
      hot.getPlugin('hiddenRows').hideRow(target);
      hot.getPlugin('filters').addCondition(0, 'by_value', [['b', 'c']]);
      hot.getPlugin('filters').filter();
      hot.setDataAtCell(hot.toVisualRow(0), 1, 50);
      await flush();

      expect(held.length).toBe(1);

      change(engine, sheet);
      hot.updateSettings({});
      await answerAll(true);

      expect(hot.countRows()).toBe(3);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(hot.getData().flat()).not.toContain(50);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
      expect(isAnyCellMarked()).toBe(false);
    });
  });

  it.each([
    ['without a move', {}],
    ['with a manualRowMove', { manualRowMove: [2, 0, 1] }],
  ])('keeps the state across a re-render after the grid\'s own edits, %s', (_, settings) => {
    buildGrid(buildEngine(), { hiddenRows: true, columnSorting: true, ...settings });

    hot.setCellMeta(0, 0, 'className', 'marked');
    hot.getPlugin('hiddenRows').hideRow(2);
    // The engine reads the text `7` as the number 7, and keeps a formula in its own text.
    hot.setDataAtCell(0, 0, '7');
    hot.setDataAtCell(1, 2, '=B1+1');
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

    const sorted = hot.getData();
    const hidden = hot.getPlugin('hiddenRows').getHiddenRows();

    expect(hidden.length).toBe(1);

    hot.updateSettings({});

    // The engine holds the text `7` as the number 7.
    const asText = rows => rows.map(row => row.map(String));

    expect(hot.getData()).toEqual(sorted);
    expect(asText(readEngineThroughGrid())).toEqual(asText(hot.getData()));
    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
    expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual(hidden);
    expect(isAnyCellMarked()).toBe(true);
  });

  /**
   * Builds an engine whose `S1` sheet holds only formulas that read the `Data` sheet, so its rows differ only in
   * their formulas.
   *
   * @returns {HyperFormula}
   */
  function buildFormulaOnlyEngine() {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('Data');
    engine.setSheetContent(engine.getSheetId('Data'), [['x'], ['y'], ['z']]);
    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), [['=Data!A1'], ['=Data!A2'], ['=Data!A3']]);

    return engine;
  }

  describe.each([
    ['moves a row', (engine, sheet) => engine.moveRows(sheet, 0, 1, 3)],
    ['removes a row and inserts another', (engine, sheet) => {
      engine.removeRows(sheet, [0, 1]);
      engine.addRows(sheet, [2, 1]);
      engine.setCellContents({ sheet, row: 2, col: 0 }, [['=Data!A1']]);
    }],
  ])('a host that %s of a sheet whose rows differ only in formulas', (_, change) => {
    it.each([
      ['without a move', {}],
      ['with a manualRowMove', { manualRowMove: [2, 0, 1] }],
    ])('drops the cell meta and the hidden row, %s', (__, settings) => {
      const engine = buildFormulaOnlyEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        hiddenRows: true,
        licenseKey: LICENSE_KEY,
        ...settings,
      });

      const target = hot.toVisualRow(0);

      hot.setCellMeta(target, 0, 'className', 'marked');
      hot.getPlugin('hiddenRows').hideRow(target);

      change(engine, engine.getSheetId('S1'));
      hot.updateSettings({});

      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
      expect(isAnyCellMarked()).toBe(false);
    });
  });

  it('leaves the grid and the engine agreeing when the host writes a cell a waiting change wrote early', async() => {
    const engine = buildEngine();
    const sheet = engine.getSheetId('S1');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      // The default `allowInvalid: true`: the change is written into the engine at once.
      cells: (row, col) => (col === 1 ? {
        validator(value, callback) {
          held.push({ value, callback });
        },
      } : {}),
      licenseKey: LICENSE_KEY,
    });

    hot.setDataAtCell(0, 1, 50);
    await flush();
    engine.setCellContents({ sheet, row: 0, col: 1 }, [[99]]);
    hot.updateSettings({});
    await answerAll(true);

    expect(readEngineThroughGrid()).toEqual(hot.getData());
    expect(hot.getDataAtCell(0, 1)).toBe(99);
  });

  it('takes a host swap of rows that differ only by a number against the same text as a change', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), [['a', 7], ['a', '7']]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      licenseKey: LICENSE_KEY,
    });

    hot.setCellMeta(0, 0, 'className', 'marked');
    engine.moveRows(engine.getSheetId('S1'), 0, 1, 2);
    hot.updateSettings({});

    expect(isAnyCellMarked()).toBe(false);
  });

  it('reloads a moved and sorted grid with cross-row formulas in place on a re-render', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), [
      ['b', 2, '=B2*10'], ['a', 1, '=B3*10'], ['d', 4, '=B4*10'], ['c', 3, '=B1*10'],
    ]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [3, 1, 0, 2],
      columnSorting: true,
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('manualRowMove').dragRows([3], 0);
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    hot.setCellMeta(0, 0, 'className', 'marked');

    const loadData = jest.spyOn(hot, 'loadData');
    const before = hot.getData();

    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.getData()).toEqual(before);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }

    expect(loadData).not.toHaveBeenCalled();
    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
    expect(isAnyCellMarked()).toBe(true);
  });

  it('takes a host change made before the grid\'s own edit as a change, though the edit read the sheet after it', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      hiddenRows: true,
      licenseKey: LICENSE_KEY,
    });

    hot.setCellMeta(0, 0, 'className', 'marked');
    hot.getPlugin('hiddenRows').hideRow(0);
    engine.moveRows(engine.getSheetId('S1'), 0, 1, 3);
    // The grid's own write after the host's: the snapshot it leaves must not take the host's move in.
    hot.setDataAtCell(2, 0, 'q');
    hot.updateSettings({});

    expect(readEngineThroughGrid()).toEqual(hot.getData());
    expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
    expect(isAnyCellMarked()).toBe(false);
  });

  it('takes a host change made before the grid\'s own row insert as a change', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      hiddenRows: true,
      licenseKey: LICENSE_KEY,
    });

    hot.setCellMeta(0, 0, 'className', 'marked');
    hot.getPlugin('hiddenRows').hideRow(0);
    engine.moveRows(engine.getSheetId('S1'), 0, 1, 3);
    // A structural write of the grid's own reads the whole sheet again when it ends; it must not take the host's
    // move in.
    hot.alter('insert_row_below', 2);
    hot.updateSettings({});

    expect(readEngineThroughGrid()).toEqual(hot.getData());
    expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([]);
    expect(isAnyCellMarked()).toBe(false);
  });

  it('reloads in place after the grid\'s own writes that spill, change a spill, or clear one', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), [[1, 2], [3, 4], ['=ARRAYFORMULA(TRANSPOSE(A1:B2))']]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      licenseKey: LICENSE_KEY,
    });

    hot.setCellMeta(0, 0, 'className', 'marked');

    const loadData = jest.spyOn(hot, 'loadData');
    const writes = [
      // A precedent of the array: every value it spills changes.
      () => hot.setDataAtCell(0, 0, 10),
      // A formula that spills into three cells of its own.
      () => hot.setDataAtCell(0, 3, '=SEQUENCE(3)'),
      // A value written into a spilled cell: the array cannot spill any more.
      () => hot.setDataAtCell(1, 3, 'x'),
      () => hot.setDataAtCell(1, 3, null),
      // The anchor cleared: its spilled values go.
      () => hot.setDataAtCell(2, 0, null),
    ];

    writes.forEach((write) => {
      write();
      hot.updateSettings({});

      expect(readEngineThroughGrid()).toEqual(hot.getData());
    });

    expect(loadData).not.toHaveBeenCalled();
    expect(isAnyCellMarked()).toBe(true);
  });

  describe('with batchEvaluation, after writes made inside batch()', () => {
    it('keeps the sort config and the cell meta, and loads no data', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1', batchEvaluation: true },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      hot.setCellMeta(0, 1, 'className', 'marked');

      const afterLoadData = jest.fn();
      let suspendedInBatch;

      hot.addHook('afterLoadData', afterLoadData);
      hot.batch(() => {
        hot.setDataAtCell(0, 1, 10);
        suspendedInBatch = engine.isEvaluationSuspended();
      });
      hot.updateSettings({});

      expect(suspendedInBatch).toBe(true);
      expect(hot.getData()).toEqual([['a', 10, 20], ['b', 2, 4], ['c', 3, 6]]);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(afterLoadData).not.toHaveBeenCalled();
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
      expect(hot.getCellMeta(0, 1).className).toBe('marked');
    });

    it('reloads in place after several batches, each with several writes and a read in between', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1', batchEvaluation: true },
        licenseKey: LICENSE_KEY,
      });
      hot.setCellMeta(0, 0, 'className', 'marked');

      const loadData = jest.spyOn(hot, 'loadData');

      hot.batch(() => {
        hot.setDataAtCell(0, 1, 10);
        hot.setDataAtCell(1, 1, 20);
        // The read recalculates the writes held so far; the ones after it are held again.
        hot.getDataAtCell(0, 2);
        hot.setDataAtCell(2, 1, 30);
        hot.setDataAtCell(0, 2, '=B1*3');
        hot.setDataAtCell(0, 1, 11);
      });
      hot.updateSettings({});
      hot.batch(() => {
        hot.setDataAtCell(1, 0, null);
      });
      hot.updateSettings({});

      expect(hot.getData()).toEqual([['b', 11, 33], [null, 20, 40], ['c', 30, 60]]);
      expect(hot.getSourceDataAtCell(0, 2)).toBe('=B1*3');
      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(loadData).not.toHaveBeenCalled();
      expect(isAnyCellMarked()).toBe(true);
    });

    it('reloads in place after writes that spill, change a spill, or clear one', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      engine.addSheet('S1');
      engine.setSheetContent(engine.getSheetId('S1'), [[1, 2], [3, 4], ['=ARRAYFORMULA(TRANSPOSE(A1:B2))']]);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1', batchEvaluation: true },
        licenseKey: LICENSE_KEY,
      });
      hot.setCellMeta(0, 0, 'className', 'marked');

      const loadData = jest.spyOn(hot, 'loadData');
      const writes = [
        () => hot.setDataAtCell(0, 0, 10),
        () => hot.setDataAtCell(0, 3, '=SEQUENCE(3)'),
        () => hot.setDataAtCell(1, 3, 'x'),
        () => hot.setDataAtCell(1, 3, null),
        () => hot.setDataAtCell(2, 0, null),
      ];

      writes.forEach((write) => {
        hot.batch(write);
        hot.updateSettings({});

        expect(readEngineThroughGrid()).toEqual(hot.getData());
      });

      expect(loadData).not.toHaveBeenCalled();
      expect(isAnyCellMarked()).toBe(true);
    });

    it('still takes a host move of rows made inside the batch as a change', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      engine.addSheet('S1');
      engine.setSheetContent(engine.getSheetId('S1'), [[10], ['=$A$1*2', '=$A$1+2'], ['=$A$1*3', '=$A$1+3']]);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1', batchEvaluation: true },
        licenseKey: LICENSE_KEY,
      });
      hot.setCellMeta(1, 0, 'className', 'marked');

      hot.batch(() => {
        hot.setDataAtCell(0, 0, 20);
        engine.moveRows(engine.getSheetId('S1'), 1, 1, 3);
      });
      hot.updateSettings({});

      expect(readEngineThroughGrid()).toEqual(hot.getData());
      expect(isAnyCellMarked()).toBe(false);
    });

    it('still drops the snapshot for a row insert made inside the batch, and reloads in place after the ' +
      'next load', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1', batchEvaluation: true },
        licenseKey: LICENSE_KEY,
      });

      const loadData = jest.spyOn(hot, 'loadData');

      hot.batch(() => {
        hot.setDataAtCell(0, 1, 10);
        hot.alter('insert_row_above', 1);
        hot.setDataAtCell(2, 1, 20);
      });
      hot.updateSettings({});

      expect(loadData).toHaveBeenCalledTimes(1);
      expect(hot.getData()).toEqual([['b', 10, 20], [null, null, null], ['a', 20, 40], ['c', 3, 6]]);

      hot.batch(() => {
        hot.setDataAtCell(0, 1, 11);
      });
      hot.updateSettings({});

      expect(loadData).toHaveBeenCalledTimes(1);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    });
  });

  it.each([
    ['without a move', {}],
    ['with a manualRowMove', { manualRowMove: [0, 2, 1] }],
  ])('takes a host move of rows that only recalculate from the grid\'s own edit as a change, %s', (_, settings) => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), [[10], ['=$A$1*2', '=$A$1+2'], ['=$A$1*3', '=$A$1+3']]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    const target = hot.toVisualRow(1);

    hot.setCellMeta(target, 0, 'className', 'marked');
    engine.moveRows(engine.getSheetId('S1'), 1, 1, 3);
    // The edit recalculates every formula the host moved: the refresh after it must not take the moved formula
    // text in.
    hot.setDataAtCell(hot.toVisualRow(0), 0, 20);
    hot.updateSettings({});

    expect(readEngineThroughGrid()).toEqual(hot.getData());
    expect(isAnyCellMarked()).toBe(false);
  });

  it.each([
    ['inserts a row', () => hot.alter('insert_row_above', 1)],
    ['removes a row', () => hot.alter('remove_row', 1)],
    ['inserts a column', () => hot.alter('insert_col_start', 1)],
    ['removes a column', () => hot.alter('remove_col', 1)],
  ])('reads no sheet when the grid %s, and reloads in place again after the next load', (_, alter) => {
    const engine = buildEngine();

    buildGrid(engine);

    const getSheetSerialized = jest.spyOn(engine, 'getSheetSerialized');

    alter();

    expect(getSheetSerialized).not.toHaveBeenCalled();

    hot.updateSettings({});

    const loadData = jest.spyOn(hot, 'loadData');

    hot.updateSettings({});

    expect(loadData).not.toHaveBeenCalled();
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  describe('the hooks a reload through updateSettings() fires', () => {
    /**
     * Builds a sheet-built grid, edits a cell, runs `beforeReload`, and records the load,
     * update and change hooks of an `updateSettings({})` call.
     *
     * @param {Function} beforeReload Runs between the edit and the reload.
     * @returns {{ loads: Array, updates: Array, changeSources: Array }}
     */
    async function reloadAfterEdit(beforeReload) {
      const engine = buildEngine();
      const loads = [];
      const updates = [];
      const changeSources = [];

      buildGrid(engine);
      hot.setDataAtCell(0, 0, 'z');
      await flush();
      beforeReload(engine);

      hot.addHook('afterLoadData', (data, initialLoad, source) => loads.push(source));
      hot.addHook('afterUpdateData', (data, initialLoad, source) => updates.push(source));
      hot.addHook('afterChange', (changes, source) => changeSources.push(source));

      hot.updateSettings({});
      await flush();

      return { loads, updates, changeSources };
    }

    it('fires afterUpdateData and afterChange with the updateData source when only the grid changed the sheet', async() => {
      const { loads, updates, changeSources } = await reloadAfterEdit(() => {});

      expect(updates).toEqual(['Formulas.switchSheet']);
      expect(loads).toEqual([]);
      expect(changeSources).toEqual(['updateData']);
      expect(hot.getDataAtCell(0, 0)).toBe('z');
    });

    it('fires afterLoadData and afterChange with the loadData source when the host changed the sheet', async() => {
      const { loads, updates, changeSources } = await reloadAfterEdit((engine) => {
        engine.setCellContents({ sheet: engine.getSheetId('S1'), row: 2, col: 0 }, 'host');
      });

      expect(loads).toEqual(['Formulas.switchSheet']);
      expect(updates).toEqual([]);
      expect(changeSources).toEqual(['loadData']);
      expect(hot.getDataAtCell(2, 0)).toBe('host');
    });
  });
});
