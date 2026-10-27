import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { FormulaBuilder } from '../formulaBuilder';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * `Formulas#switchSheet()` loads nothing into the grid when the target sheet is empty, so no data
 * hook reports the new binding. The builder must still follow it, or references, own-sheet checks
 * and sheet-scoped named expressions resolve against the previous sheet.
 */
describe('FormulaBuilder after a switch to an empty sheet', () => {
  let container: HTMLDivElement;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  /**
   * Returns a builder module that records the sheet id of every builder it creates.
   *
   * @param {number[]} builtFor The list the sheet ids are pushed to.
   * @returns {CoreModule}
   */
  function recordingCore(builtFor: number[]): CoreModule {
    class RecordingFormulaBuilder extends core.FormulaBuilder {
      constructor(options: ConstructorParameters<typeof core.FormulaBuilder>[0]) {
        super(options);
        builtFor.push(options.sheetId as number);
      }
    }

    return { ...core, FormulaBuilder: RecordingFormulaBuilder };
  }

  it('rebuilds the builder for the switched-to sheet', () => {
    const engine = HyperFormula.buildFromSheets({ Main: [[1, 2]], Empty: [] }, { licenseKey: 'gpl-v3' });
    const builtFor: number[] = [];
    const hot = new Handsontable(container, {
      data: [[1, 2]],
      editor: 'formula',
      formulas: { engine, sheetName: 'Main' },
      formulaBuilder: { builder: recordingCore(builtFor) },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const formulas = hot.getPlugin('formulas');

    expect(builtFor.at(-1)).toBe(engine.getSheetId('Main'));

    formulas.switchSheet('Empty');

    // The sheet holds no data, so the switch loads nothing and fires no data hook.
    expect(formulas.sheetId).toBe(engine.getSheetId('Empty'));

    hot.selectCell(0, 0);

    expect(builtFor.at(-1)).toBe(engine.getSheetId('Empty'));

    hot.destroy();
    engine.destroy();
  });

  /**
   * Resolves once the condition holds, checking once per task (the deferred rebuild runs a task later).
   *
   * @param {Function} condition The condition to wait for.
   * @returns {Promise<void>}
   */
  async function waitFor(condition: () => boolean): Promise<void> {
    for (let task = 0; task < 50 && !condition(); task++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve));
    }
  }

  /**
   * Opens the formula editor on a cell.
   *
   * @param {Handsontable} hot The grid.
   */
  function openEditor(hot: Handsontable): void {
    hot.selectCell(0, 0);
    hot._getEditorManager().openEditor(null, new KeyboardEvent('keydown', { key: 'Enter' }), true);
  }

  it('rebuilds once an edit that was open during the switch closes', async() => {
    const engine = HyperFormula.buildFromSheets({ Main: [[1, 2]], Empty: [] }, { licenseKey: 'gpl-v3' });
    const builtFor: number[] = [];
    const hot = new Handsontable(container, {
      data: [[1, 2]],
      editor: 'formula',
      formulas: { engine, sheetName: 'Main' },
      formulaBuilder: { builder: recordingCore(builtFor) },
      licenseKey: 'non-commercial-and-evaluation',
    });

    openEditor(hot);
    hot.getPlugin('formulas').switchSheet('Empty');

    // The edit stays open on the sheet it was started on.
    expect(hot.getActiveEditor()?.isOpened()).toBe(true);
    expect(builtFor.at(-1)).toBe(engine.getSheetId('Main'));

    hot.getActiveEditor()?.finishEditing(true);
    await waitFor(() => builtFor.at(-1) === engine.getSheetId('Empty'));

    expect(builtFor.at(-1)).toBe(engine.getSheetId('Empty'));

    hot.destroy();
    engine.destroy();
  });

  it('rebuilds at once when a switch loads data while an edit is open', () => {
    const engine = HyperFormula.buildFromSheets({ Main: [[1, 2]], Other: [[3, 4]] }, { licenseKey: 'gpl-v3' });
    const builtFor: number[] = [];
    const hot = new Handsontable(container, {
      data: [[1, 2]],
      editor: 'formula',
      formulas: { engine, sheetName: 'Main' },
      formulaBuilder: { builder: recordingCore(builtFor) },
      licenseKey: 'non-commercial-and-evaluation',
    });

    openEditor(hot);
    hot.getPlugin('formulas').switchSheet('Other');

    expect(builtFor.at(-1)).toBe(engine.getSheetId('Other'));
    expect(hot.getPlugin('formulaBuilder').getActiveEditor()).toBeNull();

    hot.destroy();
    engine.destroy();
  });

  it('rebuilds on a settings update that changes nothing else', () => {
    const engine = HyperFormula.buildFromSheets({ Main: [[1, 2]], Empty: [] }, { licenseKey: 'gpl-v3' });
    const builtFor: number[] = [];
    const builder = recordingCore(builtFor);
    const hot = new Handsontable(container, {
      data: [[1, 2]],
      editor: 'formula',
      formulas: { engine, sheetName: 'Main' },
      formulaBuilder: { builder },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('formulas').switchSheet('Empty');
    hot.updateSettings({ formulaBuilder: { builder } });

    expect(builtFor.at(-1)).toBe(engine.getSheetId('Empty'));

    hot.destroy();
    engine.destroy();
  });
});
