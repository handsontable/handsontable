import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { ColumnSorting } from '../../columnSorting';
import { AutoLink } from '../../autoLink';
import { registerCellType, NumericCellType } from '../../../cellTypes';

/**
 * DEV-207: `showFormulas()`/`hideFormulas()`/`isShowingFormulas()`. Display-only, matching
 * Excel/Sheets - these are the data-layer assertions (`getDataAtCell()`, sorting, the shortcut
 * registration, the copy/cut hooks). The DOM-repaint, real-keypress, and AutoLink-interaction
 * checks that need a real browser live in `tests/e2e/formulas-show-formulas.spec.ts`.
 */
describe('Formulas showFormulas() / hideFormulas() / isShowingFormulas()', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(ColumnSorting);
    registerPlugin(AutoLink);
    registerCellType(NumericCellType);
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
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @returns {Handsontable} The built instance.
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [['1', '2', '=A1+B1']],
      formulas: { engine: HyperFormula },
      licenseKey: 'non-commercial-and-evaluation',
      // jsdom has no real layout, so Walkontable's viewport-based column/row virtualization
      // computes against a 0 client size and renders only a couple of columns regardless of an
      // explicit `width` - rendering everything sidesteps that measurement entirely.
      renderAllColumns: true,
      renderAllRows: true,
      ...settings,
    });

    // jsdom reports every element as invisible, so a grid built here takes Core's hidden-init
    // branch and defers its first real draw - forcing one is what makes `getCell()` return a
    // populated TD instead of `null`.
    hot.render();

    return hot;
  }

  it('should report calculated values by default, and display them', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');

    expect(formulas.isShowingFormulas()).toBe(false);
    expect(hot.getDataAtCell(0, 2)).toBe(3);
    expect(hot.getCell(0, 2).textContent).toBe('3');
  });

  it('should display the formula text without changing getDataAtCell()', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');

    formulas.showFormulas();

    expect(formulas.isShowingFormulas()).toBe(true);
    expect(hot.getCell(0, 2).textContent).toBe('=A1+B1');
    expect(hot.getDataAtCell(0, 2)).toBe(3);
    // A non-formula cell is unaffected.
    expect(hot.getCell(0, 0).textContent).toBe('1');
  });

  it('should revert the rendered cell to the calculated value after hideFormulas()', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');

    formulas.showFormulas();
    formulas.hideFormulas();

    expect(formulas.isShowingFormulas()).toBe(false);
    expect(hot.getCell(0, 2).textContent).toBe('3');
  });

  it('should reset to hidden on a disable/re-enable cycle, and reject calls while disabled', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');

    formulas.showFormulas();
    expect(formulas.isShowingFormulas()).toBe(true);

    hot.updateSettings({ formulas: false });

    // Calling the API while the plugin is disabled must not silently set the flag: there is no
    // `afterRenderer` hook registered to act on it, so it would misreport a mode that shows nothing.
    formulas.showFormulas();
    expect(formulas.isShowingFormulas()).toBe(false);

    hot.updateSettings({ formulas: { engine: HyperFormula } });

    expect(formulas.isShowingFormulas()).toBe(false);
    expect(hot.getDataAtCell(0, 2)).toBe(3);
  });

  it('should show the formula text only on an array formula\'s origin cell, leaving its spill' +
    ' cells at their calculated values', () => {
    buildGrid({
      data: [
        ['1', '2'],
        ['3', '4'],
        [null, null],
        [null, null],
      ],
    });
    hot.setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

    const formulas = hot.getPlugin('formulas');

    expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
    expect(formulas.getCellType(3, 1)).toBe('ARRAY');

    formulas.showFormulas();

    // Only the origin cell has its own formula text to show; a spill cell has none of its own,
    // so it keeps displaying the value HyperFormula computed for it.
    expect(hot.getCell(2, 0).textContent).toBe('=TRANSPOSE(A1:B2)');
    expect(hot.getCell(2, 1).textContent).toBe('3');
    expect(hot.getCell(3, 0).textContent).toBe('2');
    expect(hot.getCell(3, 1).textContent).toBe('4');
  });

  it('should rewrite a formula cell\'s copied/cut value to its formula text while shown, leaving' +
    ' getDataAtCell() untouched', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');
    const coords = [{ startRow: 0, startCol: 0, endRow: 0, endCol: 2 }];

    formulas.showFormulas();

    const copyData = [['1', '2', 3]];

    hot.runHooks('beforeCopy', copyData, coords, { columnHeadersCount: 0 });
    expect(copyData).toEqual([['1', '2', '=A1+B1']]);

    const cutData = [['1', '2', 3]];

    hot.runHooks('beforeCut', cutData, coords);
    expect(cutData).toEqual([['1', '2', '=A1+B1']]);

    expect(hot.getDataAtCell(0, 2)).toBe(3);
  });

  it('should not rewrite a copied column header (a negative-indexed row)', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');
    const coords = [{ startRow: -1, startCol: 2, endRow: 0, endCol: 2 }];

    formulas.showFormulas();

    const copyData = [['C'], [3]];

    hot.runHooks('beforeCopy', copyData, coords, { columnHeadersCount: 1 });

    expect(copyData).toEqual([['C'], ['=A1+B1']]);
  });

  it('should sort a formula column by its calculated value, not its formula text', () => {
    // The formula text in column 1, read row by row, is already ascending ('=A1' < '=A2' <
    // '=A3'): a leak that sorted by formula text would leave the rows in this original order.
    // Sorting by the calculated value (3, 1, 2) reorders them.
    buildGrid({
      data: [
        ['3', '=A1'],
        ['1', '=A2'],
        ['2', '=A3'],
      ],
      columnSorting: true,
    });

    hot.getPlugin('formulas').showFormulas();
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['1', '2', '3']);
  });

  it('should keep reporting the calculated value from getDataAtCol(), which Filters\' value-list' +
    ' dropdown reads for a column with no condition of its own', () => {
    buildGrid();

    hot.getPlugin('formulas').showFormulas();

    expect(hot.getDataAtCol(2)).toEqual([3]);
  });

  it('should validate a numeric formula column against its calculated value, not its formula text', (done) => {
    buildGrid({
      columns: [{}, {}, { type: 'numeric' }],
    });

    hot.getPlugin('formulas').showFormulas();

    hot.validateCells(() => {
      expect(hot.getCellMeta(0, 2).valid).toBe(true);
      done();
    });
  });

  it('should register exactly one grid shortcut for control+backquote that toggles the mode', () => {
    buildGrid();

    const formulas = hot.getPlugin('formulas');
    const gridContext = hot.getShortcutManager().getContext('grid');
    const shortcuts = gridContext.getShortcuts(['control', 'backquote']);

    expect(shortcuts.length).toBe(1);

    shortcuts[0].callback();
    expect(formulas.isShowingFormulas()).toBe(true);

    shortcuts[0].callback();
    expect(formulas.isShowingFormulas()).toBe(false);
  });

  it('should not register the shortcut twice after a disable/re-enable cycle', () => {
    buildGrid();

    hot.updateSettings({ formulas: false });
    hot.updateSettings({ formulas: { engine: HyperFormula } });

    const gridContext = hot.getShortcutManager().getContext('grid');
    const shortcuts = gridContext.getShortcuts(['control', 'backquote']);

    // A shortcut left registered from the disabled instance would leave two callbacks in the
    // group, which would toggle the flag back off in the same keypress instead of leaving it on.
    expect(shortcuts.length).toBe(1);
  });
});
