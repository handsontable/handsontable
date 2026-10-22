import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { HiddenRows } from '../../hiddenRows';
import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';
import type { HandsontableAdapter } from '../handsontableAdapter';

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
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
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
      licenseKey: 'non-commercial-and-evaluation',
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
});
