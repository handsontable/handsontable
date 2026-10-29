import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import deDE from '../../../i18n/languages/de-DE';
import { registerLanguageDictionary } from '../../../i18n/registry';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { UndoRedo } from '../../undoRedo';
import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * Waits one task: the validators answer in a microtask, and a deferred rebuild runs a task later.
 *
 * @returns {Promise<void>}
 */
function settle(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * State the plugin keeps between hooks, on a real grid: the formula bar's view of the selected
 * cell, the error marks on recycled cell elements, the deferred rebuild flag, and the inputs a
 * rebuild reads again.
 */
describe('FormulaBuilder state that has to follow the grid', () => {
  let container: HTMLDivElement;
  let hot: Handsontable | undefined;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
    registerPlugin(UndoRedo);
    registerLanguageDictionary(deDE);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = undefined;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * Builds a grid with the formula bar on.
   *
   * @param {object} [settings] Extra settings.
   * @returns {Handsontable}
   */
  function createGrid(settings: Record<string, unknown> = {}): Handsontable {
    hot = new Handsontable(container, {
      data: [['=SUM(B1:B3)', 1], ['=A1*2', 2], [3, 3]],
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core, showFormulaBar: true },
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    } as Handsontable.GridSettings);

    return hot;
  }

  /**
   * Returns the text the formula bar shows while it is not edited, without the zero-width space the
   * package ends its overlay with.
   *
   * @returns {string}
   */
  function barText(): string {
    return (container.querySelector('.hfe-formula-bar__idle')?.textContent ?? '').replace(/\u200B/g, '');
  }

  /**
   * Opens the grid's editor on the selected cell.
   *
   * @param {Handsontable} grid The grid.
   */
  function openEditor(grid: Handsontable): void {
    grid._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
  }

  describe('the formula bar', () => {
    it('shows the new content of the selected cell after a write that does not move the selection', () => {
      const grid = createGrid();

      grid.selectCell(0, 0);

      expect(barText()).toBe('=SUM(B1:B3)');

      grid.setDataAtCell(0, 0, '=1');

      expect(barText()).toBe('=1');

      grid.setDataAtCell(0, 0, '');

      expect(barText()).toBe('');
    });

    it('shows the restored content after an undo', () => {
      const grid = createGrid({ undo: true });

      grid.selectCell(1, 0);
      grid.setDataAtCell(1, 0, '=A1*3');
      grid.getPlugin('undoRedo').undo();

      expect(barText()).toBe('=A1*2');
    });

    it('is not told again for a write to another cell', () => {
      const grid = createGrid();
      const plugin = grid.getPlugin('formulaBuilder');

      grid.selectCell(0, 0);

      const emitted = jest.fn();

      plugin.onFormulaCellSelection(emitted);
      grid.setDataAtCell(2, 1, 9);

      expect(emitted).not.toHaveBeenCalled();
    });

    it('is told about the selected cell when the plugin is turned back on after an edit made while it was off', async() => {
      const grid = createGrid();

      grid.updateSettings({ formulaBuilder: false } as Handsontable.GridSettings);
      grid.selectCell(1, 0);
      // The plain textarea edits the cell while the plugin is off; its close still reaches the plugin.
      openEditor(grid);
      grid.getActiveEditor()?.finishEditing();
      await settle();

      // The editor's close wrote the dedupe key while the plugin was off; a matching key skipped the
      // enable-time emit, so nothing subscribed to the bar selection heard about the selected cell.
      const emitted = jest.fn();

      grid.getPlugin('formulaBuilder').onFormulaCellSelection(emitted);
      grid.updateSettings({ formulaBuilder: { builder: core, showFormulaBar: true } } as Handsontable.GridSettings);

      expect(emitted).toHaveBeenCalledWith(expect.objectContaining({ active: { row: 1, col: 0 } }));
      expect(barText()).toBe('=A1*2');
    });
  });

  describe('error marks with no builder', () => {
    it('takes the marks off when the Formulas engine detaches', () => {
      const grid = createGrid({ data: [['=1/0', 2]] });

      expect(grid.getCell(0, 0)?.getAttribute('data-hfe-error')).toBe('#DIV/0!');

      grid.getPlugin('formulas').disablePlugin();

      expect(grid.getPlugin('formulaBuilder').enabled).toBe(true);
      expect(grid.rootElement.querySelectorAll('[data-hfe-error]')).toHaveLength(0);
      expect(grid.getCell(0, 0)?.hasAttribute('aria-description')).toBe(false);
    });

    it('clears a mark a recycled cell element carries, and describes nothing', () => {
      const grid = createGrid({ data: [['=1/0', 2]] });

      grid.getPlugin('formulas').disablePlugin();

      // An element that showed an error for another cell before it was reused.
      grid.getCell(0, 1)?.setAttribute('data-hfe-error', '#DIV/0!');
      grid.render();

      expect(grid.getCell(0, 1)?.hasAttribute('data-hfe-error')).toBe(false);
      expect(grid.getCell(0, 1)?.hasAttribute('aria-description')).toBe(false);
    });
  });

  describe('the deferred rebuild', () => {
    it('builds once for a settings update made after an empty-sheet switch during an edit', async() => {
      const engine = HyperFormula.buildFromSheets({ Main: [[1, 2]], Empty: [] }, { licenseKey: 'gpl-v3' });
      const builtFor: number[] = [];

      class RecordingFormulaBuilder extends core.FormulaBuilder {
        constructor(options: ConstructorParameters<typeof core.FormulaBuilder>[0]) {
          super(options);
          builtFor.push(options.sheetId as number);
        }
      }
      const builder = { ...core, FormulaBuilder: RecordingFormulaBuilder };
      const grid = createGrid({
        data: [[1, 2]],
        formulas: { engine, sheetName: 'Main' },
        formulaBuilder: { builder },
      });

      grid.selectCell(0, 0);
      openEditor(grid);
      grid.getPlugin('formulas').switchSheet('Empty');

      const buildsBefore = builtFor.length;

      // A changed setting rebuilds the whole plugin: the teardown cancels the edit, whose close asks
      // for a deferred rebuild of the builder it is about to replace.
      grid.updateSettings({ formulaBuilder: { builder, showFormulaBar: true } } as Handsontable.GridSettings);
      await settle();
      await settle();

      expect(builtFor.slice(buildsBefore)).toEqual([engine.getSheetId('Empty')]);

      grid.destroy();
      hot = undefined;
      engine.destroy();
    });
  });

  describe('popup containers', () => {
    it('drops an element container that is not in a document, with a warning', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const detached = document.createElement('div');

      createGrid({
        formulaBuilder: { builder: core, popups: { suggestions: { container: detached } } },
      });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('popups.suggestions.container'));
    });

    it('drops a `null` container (a framework ref before mount) with a warning, and builds', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const grid = createGrid({
        formulaBuilder: { builder: core, showFormulaBar: true, popups: { suggestions: { container: null } } },
      });

      expect(grid.getPlugin('formulaBuilder').enabled).toBe(true);
      expect(container.querySelector('.hfe-formula-bar')).not.toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('popups.suggestions.container'));
    });

    it('keeps an element container that is in the document', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const host = document.createElement('div');

      document.body.append(host);
      createGrid({
        formulaBuilder: { builder: core, popups: { suggestions: { container: host } } },
      });

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('popups.suggestions.container'));
      host.remove();
    });
  });

  describe('the language', () => {
    /**
     * Builds a grid whose builder constructions are counted.
     *
     * @returns {object} The grid and the construction counter.
     */
    function createCountingGrid() {
      const counter = { builds: 0 };

      class CountingFormulaBuilder extends core.FormulaBuilder {
        constructor(options: ConstructorParameters<typeof core.FormulaBuilder>[0]) {
          super(options);
          counter.builds += 1;
        }
      }

      const grid = createGrid({ formulaBuilder: { builder: { ...core, FormulaBuilder: CountingFormulaBuilder } } });

      return { grid, counter };
    }

    it('does not rebuild the builder when `updateSettings` re-sends the language in use', () => {
      const { grid, counter } = createCountingGrid();

      grid.updateSettings({ language: 'en-US' });
      grid.updateSettings({ language: 'en-US' });

      expect(counter.builds).toBe(1);
    });

    it('rebuilds the builder once when the language changes', () => {
      const { grid, counter } = createCountingGrid();

      grid.updateSettings({ language: 'de-DE' });
      grid.updateSettings({ language: 'de-DE' });

      expect(counter.builds).toBe(2);
    });

    it('keeps the builder, and does not throw, for a language code that is not registered', () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { grid, counter } = createCountingGrid();

      expect(() => grid.updateSettings({ language: 'xx-XX' })).not.toThrow();
      expect(error).toHaveBeenCalled();
      expect(counter.builds).toBe(1);
      expect(grid.getPlugin('formulaBuilder').enabled).toBe(true);
    });
  });

  describe('the reference border width', () => {
    it('is read again after a theme change', () => {
      const grid = createGrid({ theme: 'ht-theme-main' });
      const adapter = getFormulaBuilderAdapter(grid.getPlugin('formulaBuilder'));
      const reset = jest.spyOn(adapter!, 'resetBorderWidth');

      grid.useTheme('ht-theme-horizon');

      expect(reset).toHaveBeenCalled();
    });
  });
});
