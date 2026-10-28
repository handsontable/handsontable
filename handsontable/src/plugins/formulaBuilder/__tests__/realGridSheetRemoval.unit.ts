import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { FormulaBuilder } from '../formulaBuilder';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * An application on a shared engine can remove the sheet a grid is bound to. The Formulas plugin keeps
 * the old sheet id, so every read the plugin makes through it must stop instead of throwing
 * `NoSheetWithIdError`.
 */
describe('FormulaBuilder after the engine removes the grid sheet', () => {
  let containers: HTMLDivElement[];

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
  });

  beforeEach(() => {
    containers = [];
  });

  afterEach(() => {
    containers.forEach(container => container.remove());
  });

  /**
   * Builds a grid bound to one sheet of the shared engine.
   *
   * @param {HyperFormula} engine The shared engine.
   * @param {string} sheetName The sheet name.
   * @returns {Handsontable}
   */
  function createGrid(engine: HyperFormula, sheetName: string): Handsontable {
    const container = document.createElement('div');

    document.body.appendChild(container);
    containers.push(container);

    return new Handsontable(container, {
      data: [['=1/0', 2], [3, '=A2+1']],
      editor: 'formula',
      formulas: { engine, sheetName },
      formulaBuilder: { builder: core, showFormulaBar: true },
      licenseKey: 'non-commercial-and-evaluation',
    });
  }

  it('reads no cell of the removed sheet', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
    const first = createGrid(engine, 'First');
    const second = createGrid(engine, 'Second');

    engine.removeSheet(second.getPlugin('formulas').sheetId as number);

    expect(() => second.render()).not.toThrow();
    expect(() => second.selectCell(1, 1)).not.toThrow();
    expect(second.getPlugin('formulaBuilder').getRawCellText(1, 1)).toBe('');
    // The other grid on the engine is untouched.
    expect(first.getPlugin('formulaBuilder').getRawCellText(1, 1)).toBe('=A2+1');

    second.destroy();
    first.destroy();
    engine.destroy();
  });
});
