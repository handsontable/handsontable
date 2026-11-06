import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { ColumnSorting } from '../../columnSorting';
import { HiddenRows } from '../../hiddenRows';
import { ManualRowMove } from '../../manualRowMove';
import { UndoRedo } from '../../undoRedo';
import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';
import type { HandsontableAdapter } from '../handsontableAdapter';
import { injectRealCoreStyles, removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * Waits for the validators, which always answer in a microtask, and the editor close after them.
 *
 * @returns {Promise<void>}
 */
function settle(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * The editing paths the formula editor shares with the grid's own editors, on a real grid: opening
 * from the formula bar goes through the editor manager, and a commit or a cancel moves (or keeps)
 * the selection the way the grid's keys do.
 */
describe('FormulaBuilder editing on a real grid', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
    registerPlugin(HiddenRows);
    registerPlugin(ColumnSorting);
    registerPlugin(ManualRowMove);
    registerPlugin(UndoRedo);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    container.remove();
    removeRealCoreStyles();
  });

  /**
   * Builds a 5x5 grid with the formula editor on every cell.
   *
   * @param {object} [settings] Extra settings.
   * @returns {Handsontable}
   */
  function createGrid(settings: Record<string, unknown> = {}): Handsontable {
    hot = new Handsontable(container, {
      data: [
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ],
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    } as Handsontable.GridSettings);

    return hot;
  }

  /**
   * Returns the adapter of the grid's enabled plugin.
   *
   * @returns {HandsontableAdapter}
   */
  function adapter(): HandsontableAdapter {
    const found = getFormulaBuilderAdapter(hot.getPlugin('formulaBuilder'));

    if (!found) {
      throw new Error('the plugin has no adapter');
    }

    return found;
  }

  /**
   * Returns whether the grid's active editor is open.
   *
   * @returns {boolean}
   */
  function isEditorOpened(): boolean {
    return (hot.getActiveEditor() as { isOpened?(): boolean } | undefined)?.isOpened?.() === true;
  }

  describe('opening from the formula bar', () => {
    it('opens the editor through the editor manager and reports it', () => {
      createGrid();
      hot.selectCell(1, 1);

      expect(adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1+1')).toBe(true);
      expect(isEditorOpened()).toBe(true);
    });

    it('reads the value without closing its parens, and closes them on a native commit', async() => {
      createGrid();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);

      const formulaEditor = hot.getPlugin('formulaBuilder').getActiveEditor();

      formulaEditor?.setValue('=SUM(A1');

      // `getValue()` is public through `getActiveEditor()`: a plain read must not change the buffer.
      expect(hot.getActiveEditor()?.getValue()).toBe('=SUM(A1');
      expect(formulaEditor?.getValue()).toBe('=SUM(A1');

      // A commit that does not go through the formula editor's keys (an outside click) still saves a
      // balanced formula.
      hot.getActiveEditor()?.finishEditing();
      await settle();

      expect(hot.getSourceDataAtCell(1, 1)).toBe('=SUM(A1)');
    });

    it('follows the edited cell when the application inserts or removes rows and columns during the edit', () => {
      // The stub stylesheet renders two rows only; the edited cell has to stay rendered.
      injectRealCoreStyles();
      createGrid();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);

      const plugin = hot.getPlugin('formulaBuilder');

      expect(isEditorOpened()).toBe(true);
      expect(plugin.getActiveFormulaCell()).toEqual({ row: 1, col: 1 });

      hot.alter('insert_row_above', 0);

      // The edited cell is B3 now; a pick on the cell now at B2 must not read as a press on it.
      expect(isEditorOpened()).toBe(true);
      expect(plugin.getActiveFormulaCell()).toEqual({ row: 2, col: 1 });

      hot.alter('insert_col_start', 0);

      expect(plugin.getActiveFormulaCell()).toEqual({ row: 2, col: 2 });

      hot.alter('remove_row', 0);

      expect(isEditorOpened()).toBe(true);
      expect(plugin.getActiveFormulaCell()).toEqual({ row: 1, col: 2 });
    });

    it('reports the range the grid holds after a shift under a column selection', async() => {
      injectRealCoreStyles();
      createGrid({ data: [['=1', 'B1'], ['A2', 'B2'], ['A3', 'B3']], colHeaders: true });

      const plugin = hot.getPlugin('formulaBuilder');
      const reported: unknown[] = [];

      plugin.onFormulaCellSelection(selection => reported.push(selection));
      hot.selectColumns(0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);

      expect(isEditorOpened()).toBe(true);

      // The grid keeps the range's `from` on the header and moves only `to`.
      hot.alter('insert_row_above', 0);
      hot.alter('remove_row', 2);
      hot.getActiveEditor()?.finishEditing(true);
      await settle();

      const { from, to } = hot.getSelectedRangeActive()!;

      expect(reported.at(-1)).toEqual({
        active: plugin.getActiveFormulaCell(),
        range: { startRow: 0, startCol: 0, endRow: to.row, endCol: Math.max(from.col, to.col) },
      });
    });

    it('shows the selected formula cell in a bar turned on by a settings update', () => {
      createGrid({
        data: [['1', '2', '=A1+B1']],
        formulaBuilder: { builder: core, showFormulaBar: false },
      });
      hot.selectCell(0, 2);
      hot.updateSettings({ formulaBuilder: { builder: core, showFormulaBar: true } });

      const bar = hot.rootElement.parentElement?.querySelector('.ht-formula-builder__formula-bar') ??
        document.querySelector('.ht-formula-builder__formula-bar');

      expect(hot.getPlugin('formulaBuilder').getActiveFormulaCell()).toEqual({ row: 0, col: 2 });
      expect(bar?.textContent).toContain('=A1+B1');
    });

    it('honors a `beforeBeginEditing` veto', () => {
      createGrid({ beforeBeginEditing: () => false });
      hot.selectCell(1, 1);

      expect(adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1+1')).toBe(false);
      expect(isEditorOpened()).toBe(false);
    });

    it('does not open on a read-only cell', () => {
      createGrid({ cell: [{ row: 1, col: 1, readOnly: true }] });
      hot.selectCell(1, 1);

      expect(adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1+1')).toBe(false);
      expect(isEditorOpened()).toBe(false);
    });

    it('judges the active layer, not the last one', () => {
      createGrid({ cell: [{ row: 0, col: 0, readOnly: true }] });
      hot.selectCells([[0, 0], [3, 3]]);
      // Move the focus back onto the first layer, the way Tab wraps it with `autoWrapRow`.
      hot.selection.setRangeFocus(hot._createCellCoords(0, 0), 0);

      expect(hot.getSelectedRangeActive()?.highlight.row).toBe(0);
      expect(adapter().beginEdit({ sheet: '', row: 0, col: 0 }, '=1')).toBe(false);
    });
  });

  describe('committing an unchanged bar edit', () => {
    it('leaves the cell and its type alone', async() => {
      createGrid({ data: [[5, true], [null, 2]], undo: true });
      const afterChange = jest.fn();
      const plugin = hot.getPlugin('formulaBuilder') as unknown as FormulaBuilder;

      hot.addHook('afterChange', afterChange);

      // Only the first rows and columns are rendered under jsdom, and an unrendered cell gets no editor.
      for (const [row, col] of [[0, 0], [0, 1], [1, 0]]) {
        const text = plugin.getRawCellText(row, col);

        hot.selectCell(row, col);
        adapter().beginEdit({ sheet: '', row, col }, text);
        adapter().commit(text, 'down');
        await settle();
      }

      expect(hot.getSourceData()).toEqual([[5, true], [null, 2]]);
      expect(afterChange).not.toHaveBeenCalled();
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('leaves a formula cell alone', async() => {
      createGrid({ data: [[1, 2, '=A1+B1']] });
      const afterChange = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.selectCell(0, 2);
      adapter().beginEdit({ sheet: '', row: 0, col: 2 }, '=A1+B1');
      adapter().commit('=A1+B1', 'down');
      await settle();

      expect(hot.getSourceData()[0]).toEqual([1, 2, '=A1+B1']);
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('clears the cell when a fast edit empties the text it typed', async() => {
      createGrid({ data: [[5, 1]], undo: true });
      hot.selectCell(0, 0);
      // Typing a character opens the editor in fast-edit mode, which starts empty.
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'x' }), false);
      hot.getPlugin('formulaBuilder').getActiveEditor()?.setValue('x');
      hot.getPlugin('formulaBuilder').getActiveEditor()?.setValue('');
      hot.getActiveEditor()?.finishEditing();
      await settle();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('');
    });

    it('still writes when the text changed', async() => {
      createGrid();
      hot.selectCell(0, 0);
      adapter().beginEdit({ sheet: '', row: 0, col: 0 }, 'A1');
      adapter().commit('changed', 'down');
      await settle();

      expect(hot.getDataAtCell(0, 0)).toBe('changed');
    });
  });

  describe('committing with a direction', () => {
    it.each([
      ['down', [2, 1]],
      ['up', [0, 1]],
      ['right', [1, 2]],
      ['left', [1, 0]],
    ] as const)('moves %s one cell by default', async(direction, [row, col]) => {
      createGrid();
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commit('7', direction);
      await settle();

      expect(hot.getDataAtCell(1, 1)).toBe('7');
      expect(hot.getSelectedLast()).toEqual([row, col, row, col]);
    });

    it('follows `enterMoves` for Enter and `tabMoves` for Tab', async() => {
      createGrid({ enterMoves: { row: 0, col: 1 }, tabMoves: { row: 1, col: 0 } });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commit('7', 'down');
      await settle();

      expect(hot.getSelectedLast()).toEqual([1, 2, 1, 2]);

      adapter().beginEdit({ sheet: '', row: 1, col: 2 });
      adapter().commit('8', 'right');
      await settle();

      expect(hot.getSelectedLast()).toEqual([2, 2, 2, 2]);
    });

    // A 2x2 grid, so every cell is rendered in jsdom (which draws only the first rows and columns).
    const SMALL_DATA = [['Q1', 'Q2'], ['Q3', 'Q4']];

    it.each([
      ['right', [1, 1]],
      ['left', [0, 0]],
    ] as const)('lets a %s commit at the end of the grid leave it, like Tab in the text editor', async(
      direction, [row, col],
    ) => {
      // The grid's Tab pair (`GRID_TAB_NAVIGATION_GROUP`) drops the selection when Tab has nowhere to
      // move it, so the next Tab leaves the grid; the move command alone kept the selection.
      createGrid({ data: SMALL_DATA });
      hot.selectCell(row, col);
      adapter().beginEdit({ sheet: '', row, col });
      adapter().commit('9', direction);
      await settle();

      expect(hot.getDataAtCell(row, col)).toBe('9');
      expect(hot.getSelected()).toBeUndefined();
    });

    it('keeps the selection on a Tab commit that has a cell to move to', async() => {
      createGrid({ data: SMALL_DATA });
      hot.selectCell(1, 0);
      adapter().beginEdit({ sheet: '', row: 1, col: 0 });
      adapter().commit('9', 'right');
      await settle();

      expect(hot.getDataAtCell(1, 0)).toBe('9');
      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    });

    it('stays on the last row when Enter has nowhere to go', async() => {
      createGrid();
      hot.selectCell(4, 1);
      adapter().beginEdit({ sheet: '', row: 4, col: 1 });
      adapter().commit('7', 'down');
      await settle();

      expect(hot.getSelectedLast()).toEqual([4, 1, 4, 1]);
    });

    it('skips a hidden row on Enter', async() => {
      createGrid({ hiddenRows: { rows: [2] } });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commit('7', 'down');
      await settle();

      expect(hot.getSelectedLast()).toEqual([3, 1, 3, 1]);
    });

    it('moves within a selected range and keeps it', async() => {
      createGrid();
      hot.selectCell(1, 1, 2, 2);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commit('7', 'down');
      await settle();

      expect(hot.getSelectedLast()).toEqual([1, 1, 2, 2]);
      expect(hot.getSelectedRangeActive()?.highlight.row).toBe(2);
      expect(hot.getSelectedRangeActive()?.highlight.col).toBe(1);
    });

    it('does not move when the validator rejected the value', async() => {
      createGrid({
        cell: [{
          row: 1,
          col: 1,
          validator: (value: unknown, callback: (valid: boolean) => void) => callback(value !== 'bad'),
          allowInvalid: false,
        }],
      });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commit('bad', 'down');
      await settle();

      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
      expect(isEditorOpened()).toBe(true);
    });

    it('keeps the grid unlistened when the validator rejected the value and the editor stays open', async() => {
      createGrid({
        formulaBuilder: { builder: core, showFormulaBar: true },
        cell: [{
          row: 1,
          col: 1,
          validator: (value: unknown, callback: (valid: boolean) => void) => callback(value !== 'bad'),
          allowInvalid: false,
        }],
      });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      // Focusing the bar hides the in-cell editor and unlistens the grid.
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      hot.unlisten();
      adapter().commit('bad', 'down');
      await settle();

      expect(isEditorOpened()).toBe(true);
      expect(hot.isListening()).toBe(false);
      expect((hot.getActiveEditor() as unknown as { _hiddenByFormulaBar: boolean })._hiddenByFormulaBar).toBe(true);
    });

    it('leaves the keyboard with another grid the focus moved to while an async validator ran', async() => {
      let answer: ((valid: boolean) => void) | undefined;

      createGrid({
        formulaBuilder: { builder: core, showFormulaBar: true },
        cell: [{
          row: 1,
          col: 1,
          validator: (value: unknown, callback: (valid: boolean) => void) => {
            answer = callback;
          },
        }],
      });

      const otherContainer = document.createElement('div');

      document.body.appendChild(otherContainer);

      const other = new Handsontable(otherContainer, {
        data: [['x']],
        licenseKey: TEST_LICENSE_KEY,
      });

      try {
        hot.selectCell(1, 1);
        adapter().beginEdit({ sheet: '', row: 1, col: 1 });
        hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
        hot.unlisten();
        adapter().commit('7', 'down');
        await settle();

        // The user clicks into the other grid before the validator answers.
        other.selectCell(0, 0);
        other.listen();
        other.getCell(0, 0)?.setAttribute('tabindex', '-1');
        other.getCell(0, 0)?.focus();
        answer?.(true);
        await settle();

        expect(hot.getDataAtCell(1, 1)).toBe('7');
        expect(other.isListening()).toBe(true);
        expect(hot.isListening()).toBe(false);
      } finally {
        other.destroy();
        otherContainer.remove();
      }
    });

    it('listens again after a bar commit in a grid inside a shadow root', async() => {
      const shadowHost = document.createElement('div');

      document.body.appendChild(shadowHost);

      const shadowContainer = document.createElement('div');

      shadowHost.attachShadow({ mode: 'open' }).appendChild(shadowContainer);

      const shadowHot = new Handsontable(shadowContainer, {
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
        editor: 'formula',
        formulas: { engine: HyperFormula },
        formulaBuilder: { builder: core, showFormulaBar: true },
        licenseKey: TEST_LICENSE_KEY,
      } as Handsontable.GridSettings);

      try {
        const shadowAdapter = getFormulaBuilderAdapter(shadowHot.getPlugin('formulaBuilder'));

        shadowHot.selectCell(1, 1);
        shadowAdapter?.beginEdit({ sheet: '', row: 1, col: 1 });
        shadowHot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
        // The bar holds the focus, which `document.activeElement` reports as the shadow host.
        shadowHost.shadowRoot?.querySelector<HTMLElement>('.hfe-formula-bar .hfe-editor__input')?.focus();
        shadowHot.unlisten();
        shadowAdapter?.commit('7', 'down');
        await settle();

        expect(shadowHot.getDataAtCell(1, 1)).toBe('7');
        expect(shadowHot.isListening()).toBe(true);
      } finally {
        shadowHot.destroy();
        shadowHost.remove();
      }
    });

    it('listens again when the presses during an async validator stayed in the grid', async() => {
      let answer: ((valid: boolean) => void) | undefined;

      createGrid({
        formulaBuilder: { builder: core, showFormulaBar: true },
        cell: [{
          row: 1,
          col: 1,
          validator: (value: unknown, callback: (valid: boolean) => void) => {
            answer = callback;
          },
        }],
      });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      hot.unlisten();
      adapter().commit('7', 'down');
      await settle();

      container.querySelector('.ht-formula-builder__formula-bar')
        ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      hot.rootElement.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      answer?.(true);
      await settle();

      expect(hot.getDataAtCell(1, 1)).toBe('7');
      expect(hot.isListening()).toBe(true);
    });

    it('leaves the keyboard alone after a commit of an in-cell edit', async() => {
      createGrid();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      hot.unlisten();
      adapter().commit('7', 'down');
      await settle();

      expect(hot.getDataAtCell(1, 1)).toBe('7');
      expect(hot.isListening()).toBe(false);
    });

    it('listens again after a commit with a direction', async() => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      hot.unlisten();
      adapter().commit('7', 'down');
      await settle();

      expect(hot.isListening()).toBe(true);
    });

    it('listens again after a commit without a direction', async() => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      hot.unlisten();
      adapter().commit('7');
      await settle();

      expect(hot.getDataAtCell(1, 1)).toBe('7');
      expect(hot.isListening()).toBe(true);
    });

    it('listens again after a commit to the whole selection', async() => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(1, 1, 2, 2);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      hot.unlisten();
      adapter().commitFill('7');
      await settle();

      expect(hot.getDataAtCell(2, 2)).toBe('7');
      expect(hot.isListening()).toBe(true);
    });
  });

  describe('committing to the whole selection', () => {
    it('writes the value into every selected cell and keeps the selection', async() => {
      createGrid();
      hot.selectCell(1, 1, 2, 2);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commitFill('7');
      await settle();

      expect(hot.getData(1, 1, 2, 2)).toEqual([['7', '7'], ['7', '7']]);
      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(hot.getSelectedLast()).toEqual([1, 1, 2, 2]);
      // The focus moves within the range by `enterMoves`, as after Ctrl/Cmd+Enter in the text editor.
      expect(hot.getSelectedRangeActive()?.highlight.toObject()).toEqual({ row: 2, col: 1 });
      expect(isEditorOpened()).toBe(false);
    });

    it('moves the focus within the range by a custom enterMoves', async() => {
      createGrid({ enterMoves: { row: 0, col: 1 } });
      hot.selectCell(1, 1, 2, 2);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });
      adapter().commitFill('7');
      await settle();

      expect(hot.getSelectedLast()).toEqual([1, 1, 2, 2]);
      expect(hot.getSelectedRangeActive()?.highlight.toObject()).toEqual({ row: 1, col: 2 });
    });

    it('writes into the edited cell only when a single cell is selected', async() => {
      createGrid();
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 });

      expect(isEditorOpened()).toBe(true);

      adapter().commitFill('9');
      await settle();

      expect(hot.getDataAtCell(1, 1)).toBe('9');
      expect(hot.getData(0, 0, 2, 2).flat().filter(value => value === '9')).toHaveLength(1);
    });

    it('Ctrl/Cmd+Enter on one selected cell moves the selection without adding a layer', async() => {
      createGrid();
      hot.selectCell(0, 0);
      adapter().beginEdit({ sheet: '', row: 0, col: 0 });
      // Simulate the chord being held while the package commits.
      hot.rootDocument.documentElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true })
      );

      expect(hot.getShortcutManager().isCtrlPressed()).toBe(true);

      adapter().commitFill('10');
      await settle();

      expect(hot.getSelected()).toEqual([[1, 0, 1, 0]]);

      adapter().beginEdit({ sheet: '', row: 1, col: 0 });
      hot.rootDocument.documentElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true })
      );
      adapter().commitFill('20');
      await settle();

      expect(hot.getDataAtCell(0, 0)).toBe('10');
      expect(hot.getDataAtCell(1, 0)).toBe('20');
    });

    it('Ctrl/Cmd+Enter with a single-cell active layer among others keeps every layer', async() => {
      createGrid();
      hot.selectCells([[0, 0, 1, 0], [3, 0, 3, 0]]);
      adapter().beginEdit({ sheet: '', row: 3, col: 0 });
      adapter().commitFill('5');
      await settle();

      expect(hot.getSelectedRange()?.length).toBe(2);
      expect(hot.getDataAtCell(0, 0)).toBe('5');
      expect(hot.getDataAtCell(3, 0)).toBe('5');
    });
  });

  describe('cancelling', () => {
    it('restores the value and keeps a selected range', () => {
      createGrid();
      hot.selectCell(1, 1, 2, 2);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=99');
      adapter().cancel();

      expect(isEditorOpened()).toBe(false);
      expect(hot.getDataAtCell(1, 1)).toBe('B2');
      expect(hot.getSelectedLast()).toEqual([1, 1, 2, 2]);
      expect(hot.isListening()).toBe(true);
      expect(document.activeElement).toBe(hot.getCell(1, 1));
    });
  });

  describe('the cell the formula bar shows', () => {
    it('is the highlighted cell of the active layer, decided by that cell', () => {
      createGrid({ columns: [{ editor: 'text' }, { editor: 'formula' }, {}, {}, {}] });

      const seen: Array<{ row: number; col: number } | null> = [];
      const plugin = hot.getPlugin('formulaBuilder');

      plugin.onFormulaCellSelection(selection => seen.push(selection ? selection.active : null));
      // The range starts on a text-editor cell and the highlight lands on a formula cell.
      hot.selectCell(0, 0, 0, 1);
      hot.selection.setRangeFocus(hot._createCellCoords(0, 1));

      expect(plugin.getActiveFormulaCell()).toEqual({ row: 0, col: 1 });

      hot.selection.setRangeFocus(hot._createCellCoords(0, 0));

      expect(plugin.getActiveFormulaCell()).toBeNull();
      expect(seen[seen.length - 1]).toBeNull();
    });

    it('is reported once per distinct selection while a range is dragged', () => {
      createGrid();

      const plugin = hot.getPlugin('formulaBuilder');
      const received: unknown[] = [];

      plugin.onFormulaCellSelection(selection => received.push(selection));
      hot.selectCell(1, 1, 2, 1);
      hot.selectCell(1, 1, 3, 1);
      hot.selectCell(1, 1, 3, 1);

      expect(received).toEqual([
        { active: { row: 1, col: 1 }, range: { startRow: 1, startCol: 1, endRow: 2, endCol: 1 } },
        { active: { row: 1, col: 1 }, range: { startRow: 1, startCol: 1, endRow: 3, endCol: 1 } },
      ]);
    });

    it('follows the highlight when only it moves within the range', () => {
      createGrid();

      const plugin = hot.getPlugin('formulaBuilder');
      const received: unknown[] = [];

      hot.selectCell(1, 1, 2, 2);
      plugin.onFormulaCellSelection(selection => received.push(selection));
      hot.selection.setRangeFocus(hot._createCellCoords(2, 2));

      expect(received).toEqual([
        { active: { row: 2, col: 2 }, range: { startRow: 1, startCol: 1, endRow: 2, endCol: 2 } },
      ]);
      expect(hot.getSelectedLast()).toEqual([1, 1, 2, 2]);
    });

    it('is cleared when the grid deselects while a validated edit is still closing', async() => {
      createGrid({
        cell: [{ row: 1, col: 1, validator: (value: unknown, callback: (valid: boolean) => void) => callback(true) }],
      });

      const plugin = hot.getPlugin('formulaBuilder');

      hot.selectCell(1, 1);

      expect(plugin.getActiveFormulaCell()).toEqual({ row: 1, col: 1 });

      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1');
      hot.deselectCell();
      await settle();

      expect(plugin.getActiveFormulaCell()).toBeNull();
    });
  });

  describe('the plain textarea of a `formula` cell while the plugin is off', () => {
    /**
     * Builds a grid whose FormulaBuilder plugin stays disabled (no `builder` module).
     *
     * @returns {Handsontable}
     */
    function createDisabledGrid(): Handsontable {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createGrid({ formulaBuilder: {} });
      warn.mockRestore();

      expect(hot.getPlugin('formulaBuilder').enabled).toBe(false);

      return hot;
    }

    /**
     * Returns the fallback textarea of the open editor.
     *
     * @returns {HTMLTextAreaElement}
     */
    function fallbackTextarea(): HTMLTextAreaElement {
      const textarea = container.querySelector<HTMLTextAreaElement>('.ht-formula-builder__inline-editor > textarea');

      if (!textarea) {
        throw new Error('no fallback textarea');
      }

      return textarea;
    }

    it('starts empty when typing opened it, so the typed character replaces the value', () => {
      createDisabledGrid();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor('', new KeyboardEvent('keydown', { key: 'x' }));

      expect(fallbackTextarea().value).toBe('');
    });

    it('starts with the cell value when Enter opened it', () => {
      createDisabledGrid();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);

      expect(fallbackTextarea().value).toBe('B2');
    });

    it('is styled as the grid\'s text editor, and only while it is mounted', () => {
      createDisabledGrid();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);

      const holder = fallbackTextarea().closest('.handsontableInputHolder');

      expect(holder).not.toBeNull();

      hot._getEditorManager().closeEditor(true);

      expect(holder?.classList.contains('handsontableInputHolder')).toBe(false);
    });
  });

  describe('the editor field is a grid input', () => {
    it('marks the formula editor field with data-hot-input, so a selection change keeps the focus in it', () => {
      createGrid();
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=A1');

      const input = container.querySelector('.ht-formula-builder__inline-editor .hfe-editor__input');

      expect(input?.hasAttribute('data-hot-input')).toBe(true);
    });

    it('marks the plain textarea too while the plugin is off', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createGrid({ formulaBuilder: {} });
      warn.mockRestore();
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);

      const textarea = container.querySelector('.ht-formula-builder__inline-editor > textarea');

      expect(textarea?.hasAttribute('data-hot-input')).toBe(true);
    });
  });

  describe('a cell a validator rejected', () => {
    it('keeps aria-invalid next to htInvalid', () => {
      createGrid();
      hot.setCellMeta(0, 0, 'valid', false);
      hot.render();

      const cell = hot.getCell(0, 0) as HTMLTableCellElement;

      expect(cell.classList.contains('htInvalid')).toBe(true);
      expect(cell.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('keys the formula editor does not handle', () => {
    /**
     * Returns the formula editor's text input.
     *
     * @returns {HTMLTextAreaElement}
     */
    function formulaInput(): HTMLTextAreaElement {
      const input = container.querySelector<HTMLTextAreaElement>('.ht-formula-builder__inline-editor textarea');

      if (!input) {
        throw new Error('no formula editor input');
      }

      return input;
    }

    it('reach the grid, so `beforeKeyDown` fires', () => {
      const beforeKeyDown = jest.fn();

      createGrid({ beforeKeyDown });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, 'abc');
      beforeKeyDown.mockClear();
      formulaInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));

      expect(beforeKeyDown).toHaveBeenCalledTimes(1);
    });

    it('stop at the editor when the formula editor handled them', () => {
      const beforeKeyDown = jest.fn();

      createGrid({ beforeKeyDown });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, 'abc');
      beforeKeyDown.mockClear();

      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

      formulaInput().dispatchEvent(enter);

      expect(enter.defaultPrevented).toBe(true);
      expect(beforeKeyDown).not.toHaveBeenCalled();
    });
  });

  describe('an address the grid does not show or cannot select', () => {
    it('is refused when its row is hidden, and the selection stays', () => {
      createGrid({ hiddenRows: { rows: [2] } });
      hot.selectCell(0, 0);

      expect(adapter().setActiveCell({ sheet: '', row: 2, col: 0 })).toBe(false);
      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it('is refused when it sits at or past maxRows, and the selection stays', () => {
      createGrid({ maxRows: 3 });
      hot.selectCell(0, 0);

      expect(adapter().setActiveCell({ sheet: '', row: 4, col: 0 })).toBe(false);
      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it('is refused when the grid ends up selecting another cell than the one asked for', () => {
      createGrid();
      // An application listener that redirects a select of B2 to A1: `selectCell()` still reports success.
      hot.addHook('afterSelection', (row: number, col: number) => {
        if (row === 1 && col === 1) {
          hot.selectCell(0, 0);
        }
      });
      hot.selectCell(4, 4);

      expect(adapter().setActiveCell({ sheet: '', row: 1, col: 1 })).toBe(false);
      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it('is refused as a range the grid collapses under selectionMode single', () => {
      createGrid({ selectionMode: 'single' });
      hot.selectCell(4, 4);

      const range = { start: { sheet: '', row: 0, col: 0 }, end: { sheet: '', row: 1, col: 1 } };

      expect(adapter().setSelection(range)).toBe(false);
    });

    it('is selected as a range with a corner on a hidden row, as the grid selects it', () => {
      createGrid({ hiddenRows: { rows: [0] } });
      hot.selectCell(4, 4);

      const range = { start: { sheet: '', row: 0, col: 0 }, end: { sheet: '', row: 2, col: 1 } };

      expect(adapter().setSelection(range)).not.toBe(false);
      expect(hot.getSelectedLast()).toEqual([0, 0, 2, 1]);
    });

    it('is refused as a range whose every row is hidden', () => {
      createGrid({ hiddenRows: { rows: [0, 1] } });
      hot.selectCell(4, 4);

      const range = { start: { sheet: '', row: 0, col: 0 }, end: { sheet: '', row: 1, col: 1 } };

      expect(adapter().setSelection(range)).toBe(false);
      expect(hot.getSelectedLast()).toEqual([4, 4, 4, 4]);
    });

    it('is selected when the grid shows it', () => {
      createGrid({ hiddenRows: { rows: [2] } });
      hot.selectCell(0, 0);

      expect(adapter().setActiveCell({ sheet: '', row: 1, col: 1 })).not.toBe(false);
      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    });
  });

  describe('selectFirstFormulaCell()', () => {
    it('prefers the cell the grid focused last over the first formula cell', () => {
      createGrid();
      hot.selectCell(2, 1);
      hot.deselectCell();

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 1, 2, 1]);
    });

    it('prefers the record it focused last after a row was inserted above it', () => {
      createGrid();
      hot.selectCell(2, 1);
      hot.deselectCell();
      hot.alter('insert_row_above', 0);

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([3, 1, 3, 1]);
      expect(hot.getDataAtCell(3, 1)).toBe('B3');
    });

    it('prefers the record it focused last after a row above it was removed', () => {
      createGrid();
      hot.selectCell(3, 1);
      hot.deselectCell();
      hot.alter('remove_row', 0);

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 1, 2, 1]);
      expect(hot.getDataAtCell(2, 1)).toBe('B4');
    });

    it('scans for the first formula cell after the row it focused last was removed', () => {
      createGrid();
      hot.selectCell(2, 1);
      hot.deselectCell();
      hot.alter('remove_row', 2);

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it('prefers the record it focused last after a column was inserted before it', () => {
      createGrid();
      hot.selectCell(1, 2);
      hot.deselectCell();
      hot.alter('insert_col_start', 0);

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([1, 3, 1, 3]);
      expect(hot.getDataAtCell(1, 3)).toBe('C2');
    });

    it('prefers the record it focused last after a column before it was removed', () => {
      createGrid();
      hot.selectCell(1, 3);
      hot.deselectCell();
      hot.alter('remove_col', 0);

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([1, 2, 1, 2]);
      expect(hot.getDataAtCell(1, 2)).toBe('D2');
    });

    it('follows the selection the grid kept on its visual cell through an API sort', () => {
      createGrid({ data: [[1], [3], [5], [7]], columnSorting: true });
      hot.selectCell(2, 0);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      expect(hot.getDataAtCell(2, 0)).toBe(3);

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 0, 2, 0]);
    });

    it('follows the selection the grid kept on its visual cell through an API row move', () => {
      createGrid({ data: [['A1'], ['A2'], ['A3'], ['A4']], manualRowMove: true });
      hot.selectCell(2, 0);
      hot.getPlugin('manualRowMove').moveRow(0, 3);
      hot.render();

      expect(hot.getDataAtCell(2, 0)).toBe('A4');

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 0, 2, 0]);
    });

    // A listener that draws inside `alter()` runs after the index change but before the selection
    // shift, so the draw sees the selection on the record that moved into its old place.
    it('follows the selection an insert above moved when an afterCreateRow listener writes into the new row', () => {
      createGrid();
      hot.selectCell(2, 1);
      hot.addHook('afterCreateRow', (index: number) => hot.setDataAtCell(index, 0, 'new'));
      hot.alter('insert_row_above', 0);

      expect(hot.getSelectedLast()).toEqual([3, 1, 3, 1]);

      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([3, 1, 3, 1]);
      expect(hot.getDataAtCell(3, 1)).toBe('B3');
    });

    it('follows the selection a removal above moved when an afterRemoveRow listener renders', () => {
      createGrid();
      hot.selectCell(3, 1);
      hot.addHook('afterRemoveRow', () => hot.render());
      hot.alter('remove_row', 0);

      expect(hot.getSelectedLast()).toEqual([2, 1, 2, 1]);

      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 1, 2, 1]);
      expect(hot.getDataAtCell(2, 1)).toBe('B4');
    });

    it('follows the selection a column insert moved when an afterCreateCol listener renders', () => {
      createGrid();
      hot.selectCell(1, 2);
      hot.addHook('afterCreateCol', () => hot.render());
      hot.alter('insert_col_start', 0);

      expect(hot.getSelectedLast()).toEqual([1, 3, 1, 3]);

      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([1, 3, 1, 3]);
      expect(hot.getDataAtCell(1, 3)).toBe('C2');
    });

    // The focus of a range stays on its visual row when the change lands inside the range above it.
    // A draw inside the change (the Formulas plugin draws there when dependent formulas move) records
    // the cell in the new numbering, so the shift must have run before it, not after.
    it('keeps the focused cell of a range an insert inside it did not move, when a draw runs inside the change', () => {
      createGrid();
      hot.selectCell(1, 1, 4, 1);
      hot.selection.setRangeFocus(hot._createCellCoords(3, 1));
      hot.addHook('afterCreateRow', () => hot.render(), -1);
      hot.alter('insert_row_above', 2);

      expect(hot.getSelectedRangeActive()?.highlight.row).toBe(3);
      expect(hot.getDataAtCell(3, 1)).toBe('B3');

      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([3, 1, 3, 1]);
    });

    it('keeps the focused cell of a range a removal inside it did not move, when a draw runs inside the change', () => {
      createGrid();
      hot.selectCell(1, 1, 4, 1);
      hot.selection.setRangeFocus(hot._createCellCoords(3, 1));
      hot.addHook('afterRemoveRow', () => hot.render(), -1);
      hot.alter('remove_row', 2);

      expect(hot.getSelectedRangeActive()?.highlight.row).toBe(3);
      expect(hot.getDataAtCell(3, 1)).toBe('B5');

      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([3, 1, 3, 1]);
    });

    // With a sort, the row inserted under the focused one can take a lower physical index than the
    // focused record. The selection does not move, so only the shift keeps the cell on its record.
    it('keeps the cell on its record when a batched insert under it renumbers it and the selection is dropped', () => {
      createGrid({ data: [['A1', 1], ['A2', 2], ['A3', 3], ['A4', 4], ['A5', 5]], columnSorting: true });
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.selectCell(0, 1);
      hot.batch(() => {
        hot.alter('insert_row_above', 1);
        hot.deselectCell();
      });
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 1, 0, 1]);
      expect(hot.getDataAtCell(0, 1)).toBe(5);
    });

    it('remembers the cell the focus moved to inside a range a data load kept', () => {
      createGrid();
      hot.selectCell(0, 1, 3, 1);
      hot.loadData([['N1', 'N2'], ['N3', 'N4'], ['N5', 'N6'], ['N7', 'N8']]);
      hot.selection.setRangeFocus(hot._createCellCoords(2, 1));
      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 1, 2, 1]);
    });

    it('follows a cell selected after a data load through a sort in the same batch', () => {
      createGrid({ data: [[1], [3], [5], [7]], columnSorting: true });
      hot.batch(() => {
        hot.loadData([[2], [4], [6], [8]]);
        hot.selectCell(2, 0);
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      });

      expect(hot.getDataAtCell(2, 0)).toBe(4);

      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 0, 2, 0]);
    });

    it('does not remember the selection a data load kept when a later sort moves records under it', () => {
      createGrid({ data: [[1], [3], [5], [7]], columnSorting: true });
      hot.selectCell(2, 0);
      hot.loadData([[2], [4], [6], [8]]);

      // Control: the load kept the selection, so only the forgetting can send the bar elsewhere.
      expect(hot.getSelectedLast()).toEqual([2, 0, 2, 0]);

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it.each([
      ['an insert above shifts it', () => hot.alter('insert_row_above', 0)],
      ['the grid lays it again', () => hot.selection.refresh()],
    ])('does not remember the selection a data load kept when %s', (_label, relay) => {
      createGrid();
      hot.selectCell(2, 1);
      hot.loadData([['N1', 'N2'], ['N3', 'N4'], ['N5', 'N6'], ['N7', 'N8']]);
      relay();
      hot.deselectCell();
      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it.each(['loadData', 'updateData'] as const)('does not reopen the old index after %s() replaced the data', (method) => {
      createGrid();
      hot.selectCell(2, 1);
      hot[method]([['N1', 'N2'], ['N3', 'N4'], ['N5', 'N6'], ['N7', 'N8']]);
      hot.deselectCell();

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it('prefers the cell the focus moved to inside a selected range', () => {
      createGrid();
      hot.selectCell(1, 1, 2, 2);
      // Tab and Enter move the focus inside a range without ending a selection gesture.
      hot.selection.setRangeFocus(hot._createCellCoords(2, 2));
      hot.deselectCell();

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([2, 2, 2, 2]);
    });

    it('scans for the first formula cell when the remembered cell no longer uses the formula editor', () => {
      createGrid();
      hot.selectCell(2, 1);
      hot.deselectCell();
      hot.setCellMeta(2, 1, 'editor', 'text');

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });

    it('scans when the remembered cell is out of range after the grid shrank', () => {
      createGrid();
      hot.selectCell(4, 4);
      hot.deselectCell();
      hot.updateSettings({ data: [['A1', 'B1']] });

      hot.getPlugin('formulaBuilder').selectFirstFormulaCell();

      expect(hot.getSelectedLast()).toEqual([0, 0, 0, 0]);
    });
  });

  describe('committing an unchanged formula with unbalanced parentheses', () => {
    /**
     * Returns the formula editor's text input.
     *
     * @returns {HTMLTextAreaElement}
     */
    function formulaInput(): HTMLTextAreaElement {
      const input = container.querySelector<HTMLTextAreaElement>('.ht-formula-builder__inline-editor textarea');

      if (!input) {
        throw new Error('no formula editor input');
      }

      return input;
    }

    it('writes nothing on Enter', async() => {
      createGrid({ data: [['=SUM(B1', 1]] });
      const afterChange = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      formulaInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await settle();

      expect(isEditorOpened()).toBe(false);
      expect(hot.getSourceDataAtCell(0, 0)).toBe('=SUM(B1');
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('writes nothing on Ctrl/Cmd+Enter', async() => {
      createGrid({ data: [['=SUM(B1', 1]] });
      const afterChange = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      formulaInput().dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', ctrlKey: true, metaKey: true, bubbles: true, cancelable: true,
      }));
      await settle();

      expect(isEditorOpened()).toBe(false);
      expect(hot.getSourceDataAtCell(0, 0)).toBe('=SUM(B1');
      expect(afterChange).not.toHaveBeenCalled();
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('writes nothing on Enter when the formula editor rewrites the text it was opened with', async() => {
      // The formula editor reads `=1+N("note")` back as `=1+ N("note")`, so its text never equals the
      // cell's value, even when the user changed nothing.
      createGrid({ data: [['=1+N("note")', 1]] });
      const afterChange = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      formulaInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await settle();

      expect(isEditorOpened()).toBe(false);
      expect(hot.getSourceDataAtCell(0, 0)).toBe('=1+N("note")');
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('writes nothing on a native commit when the formula editor rewrites the text it was opened with', async() => {
      createGrid({ data: [['=1+N("note")', 1]] });
      const afterChange = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      hot.getActiveEditor()?.finishEditing();
      await settle();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=1+N("note")');
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('writes nothing on a native commit (an outside click)', async() => {
      createGrid({ data: [['=SUM(B1', 1]] });
      const afterChange = jest.fn();

      hot.addHook('afterChange', afterChange);
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      hot.getActiveEditor()?.finishEditing();
      await settle();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=SUM(B1');
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('still closes them when the text changed', async() => {
      createGrid({ data: [['=SUM(B1', 1]] });
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      hot.getPlugin('formulaBuilder').getActiveEditor()?.setValue('=SUM(B1,B1');
      formulaInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await settle();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=SUM(B1,B1)');
    });

    it('writes a closing parenthesis the user typed', async() => {
      createGrid({ data: [['=SUM(B1', 1]] });
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      // The same text the commit would produce by closing the parentheses, typed by the user instead.
      hot.getPlugin('formulaBuilder').getActiveEditor()?.setValue('=SUM(B1)');
      formulaInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await settle();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=SUM(B1)');
    });
  });

  describe('the event the formula bar opens the editor with', () => {
    it('is an event a `beforeBeginEditing` listener can read', () => {
      const types: string[] = [];

      createGrid({
        beforeBeginEditing: (row: number, col: number, value: unknown, event: Event) => {
          types.push(event.type);
        },
      });
      hot.selectCell(1, 1);

      expect(adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1+1')).toBe(true);
      expect(isEditorOpened()).toBe(true);
      expect(types).toEqual(['focus']);
    });

    it('is not a mouse event, so a bar edit of a selected range still opens', () => {
      createGrid();
      hot.selectCell(0, 0, 1, 1);

      expect(adapter().beginEdit({ sheet: '', row: 0, col: 0 }, '=1+1')).toBe(true);
      expect(isEditorOpened()).toBe(true);
    });
  });

  describe('the address box after an edit closes on a range', () => {
    /**
     * Returns the formula bar's address input.
     *
     * @returns {HTMLInputElement}
     */
    function addressInput(): HTMLInputElement {
      const input = container.parentElement?.querySelector<HTMLInputElement>('.hfe-formula-bar__address-input');

      if (!input) {
        throw new Error('no address input');
      }

      return input;
    }

    it.each([
      ['committed', false],
      ['cancelled', true],
    ])('keeps showing the selected range when the edit is %s', (_, cancel) => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(0, 0, 1, 1);

      expect(addressInput().value).toBe('A1:B2');

      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(isEditorOpened()).toBe(true);

      hot.getActiveEditor()?.finishEditing(cancel);

      expect(isEditorOpened()).toBe(false);
      expect(hot.getSelectedRangeActive()?.from.row).toBe(0);
      expect(addressInput().value).toBe('A1:B2');
    });
  });

  describe('a long engine error message', () => {
    // HyperFormula's message for `=1+` lists every token it expected, one per line.
    const PARSE_ERROR_FORMULA = '=1+';

    it('describes the cell with the first sentence only, while the popup mark keeps the whole message', () => {
      createGrid({ data: [[PARSE_ERROR_FORMULA, 1]] });

      const cell = hot.getCell(0, 0)!;
      const mark = cell.getAttribute('data-hfe-error') ?? '';
      const description = cell.getAttribute('aria-description') ?? '';

      expect(mark).toContain('NumberLiteral');
      expect(description).toBe('#ERROR! — Parsing error.');
    });

    it('caps a long single-sentence message at a word boundary', () => {
      createGrid({ data: [[`=${'VERYLONGFUNCTIONNAME'.repeat(10)}(1)`, 1]] });

      const description = hot.getCell(0, 0)!.getAttribute('aria-description') ?? '';

      expect(description.length).toBeLessThanOrEqual(121);
      expect(description.startsWith('#NAME? — Function name')).toBe(true);
      expect(description.endsWith('…')).toBe(true);
    });

    it('announces the first sentence only when an edit commits the error', async() => {
      createGrid({ data: [['=1', 1]] });
      hot.selectCell(0, 0);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      hot.getPlugin('formulaBuilder').getActiveEditor()?.setValue(PARSE_ERROR_FORMULA);
      container.querySelector<HTMLTextAreaElement>('.ht-formula-builder__inline-editor textarea')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      const liveRegions = document.querySelectorAll('.hfe-live-region');
      const liveRegion = liveRegions[liveRegions.length - 1];
      const deadline = Date.now() + 2000;

      // The package announces after a short delay of its own.
      while (!liveRegion?.textContent && Date.now() < deadline) {
        // eslint-disable-next-line no-await-in-loop
        await settle();
      }

      const announced = liveRegion?.textContent ?? '';

      expect(announced).toContain('Parsing error.');
      expect(announced).not.toContain('NumberLiteral');
    });
  });

  describe('a teardown while the formula bar holds the edit', () => {
    it.each([
      ['the plugin is turned off', () => hot.updateSettings({ formulaBuilder: false } as Handsontable.GridSettings)],
      ['the plugin is disabled through its API', () => hot.getPlugin('formulaBuilder').disablePlugin()],
      ['the Formulas plugin is turned off', () => hot.updateSettings({ formulas: false } as Handsontable.GridSettings)],
      ['a settings change rebuilds the plugin', () => {
        hot.updateSettings({
          formulaBuilder: { builder: core, showFormulaBar: true, direction: 'rtl' },
        } as Handsontable.GridSettings);
      }],
    ])('listens again when %s', async(_, teardown) => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1+1');
      // The bar hosts the edit: the package hides the in-cell editor, and focusing the bar unlistens
      // the grid.
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      hot.unlisten();
      teardown();
      await settle();

      expect(isEditorOpened()).toBe(false);
      expect(hot.getDataAtCell(1, 1)).toBe('B2');
      expect(hot.isListening()).toBe(true);
    });
  });

  describe('a destroy while an async validator holds the edit', () => {
    it('removes the document keydown listener the edit added', () => {
      const rootDocument = document;
      const added: EventListenerOrEventListenerObject[] = [];
      const removed: EventListenerOrEventListenerObject[] = [];
      const addSpy = jest.spyOn(rootDocument, 'addEventListener');
      const removeSpy = jest.spyOn(rootDocument, 'removeEventListener');

      // A validator that never answers keeps the commit waiting.
      createGrid({ validator: () => {} });
      hot.selectCell(1, 1);
      addSpy.mockClear();
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      addSpy.mock.calls.filter(([type, , capture]) => type === 'keydown' && capture === true)
        .forEach(([, listener]) => added.push(listener));
      // The commit waits for the validator, so `afterClose` has not run when the grid is destroyed.
      hot.getActiveEditor()?.finishEditing();
      hot.destroy();
      removeSpy.mock.calls.filter(([type, , capture]) => type === 'keydown' && capture === true)
        .forEach(([, listener]) => removed.push(listener));

      expect(added.length).toBeGreaterThan(0);
      expect(added.filter(listener => !removed.includes(listener))).toEqual([]);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('a teardown while another grid holds the keyboard', () => {
    let otherContainer: HTMLDivElement;
    let other: Handsontable;

    beforeEach(() => {
      otherContainer = document.createElement('div');
      document.body.appendChild(otherContainer);
      other = new Handsontable(otherContainer, {
        data: [[1, 2], [3, 4]],
        licenseKey: TEST_LICENSE_KEY,
      });
    });

    afterEach(() => {
      other.destroy();
      otherContainer.remove();
    });

    it.each([
      ['a settings change rebuilds the plugin', () => {
        hot.updateSettings({
          formulaBuilder: { builder: core, showFormulaBar: true, direction: 'rtl' },
        } as Handsontable.GridSettings);
      }],
      ['the grid is destroyed', () => hot.destroy()],
    ])('leaves the other grid listening when %s under an in-cell edit', async(_, teardown) => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(1, 1);
      hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
      other.selectCell(0, 0);
      other.listen();
      teardown();
      await settle();

      expect(other.isListening()).toBe(true);
    });

    it('leaves the other grid listening when the grid is destroyed under a bar edit', async() => {
      createGrid({ formulaBuilder: { builder: core, showFormulaBar: true } });
      hot.selectCell(1, 1);
      adapter().beginEdit({ sheet: '', row: 1, col: 1 }, '=1+1');
      hot.getPlugin('formulaBuilder').setInlineEditorVisible(false);
      // Focusing the bar unlistens the grid; the user then moves to the other grid.
      other.selectCell(0, 0);
      other.listen();
      hot.destroy();
      await settle();

      expect(other.isListening()).toBe(true);
    });
  });
});
