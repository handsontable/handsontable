import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../index';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * FormulaBuilder in a SheetsBar workbook whose sheets declare `formulas` per sheet while the grid
 * declares `formulaBuilder`. The Formulas plugin is enabled from the sheet settings later in the
 * init than the FormulaBuilder plugin first tries to enable.
 */
describe('FormulaBuilder in a SheetsBar workbook with per-sheet formulas', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
    warnSpy.mockRestore();
  });

  /**
   * Builds a two-sheet workbook bound to one engine, with a module whose `FormulaBuilder` records
   * the engine sheet id each builder is built for.
   *
   * @param {number[]} builtSheetIds Receives the sheet id of every builder built.
   * @returns {Handsontable}
   */
  function createWorkbook(builtSheetIds: number[]): Handsontable {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    class RecordingFormulaBuilder extends core.FormulaBuilder {
      constructor(options: ConstructorParameters<typeof core.FormulaBuilder>[0]) {
        super(options);
        builtSheetIds.push(options.sheetId as number);
      }
    }

    hot = new Handsontable(container, {
      editor: 'formula',
      formulaBuilder: { builder: { ...core, FormulaBuilder: RecordingFormulaBuilder } },
      sheetsBar: {
        sheets: [
          { name: 'Revenue', data: [[1250, '=A1*2']], settings: { formulas: { engine, sheetName: 'Revenue' } } },
          { name: 'Costs', data: [[890, '=A1*3']], settings: { formulas: { engine, sheetName: 'Costs' } } },
        ],
      },
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);

    return hot;
  }

  /**
   * The warnings that say the Formulas plugin is missing.
   *
   * @returns {unknown[][]}
   */
  function formulasWarnings(): unknown[][] {
    return warnSpy.mock.calls.filter(([message]) => String(message).includes('requires the Formulas'));
  }

  it('does not warn that the Formulas plugin is missing once the init enabled it', () => {
    createWorkbook([]);

    expect(hot.getPlugin('formulaBuilder').enabled).toBe(true);
    expect(formulasWarnings()).toEqual([]);
  });

  it('rebuilds the builder for the engine sheet of each sheet the bar switches to', () => {
    const builtSheetIds: number[] = [];

    createWorkbook(builtSheetIds);

    const bar = hot.getPlugin('sheetsBar');
    const revenueId = builtSheetIds.at(-1);

    bar.setActiveSheet('Costs');

    const costsId = builtSheetIds.at(-1);

    bar.setActiveSheet('Revenue');

    expect(costsId).not.toBe(revenueId);
    expect(builtSheetIds.at(-1)).toBe(revenueId);
    expect(hot.getDataAtCell(0, 1)).toBe(2500);
  });

  it('still warns when no sheet enables the Formulas plugin', () => {
    hot = new Handsontable(container, {
      editor: 'formula',
      formulaBuilder: { builder: core },
      sheetsBar: { sheets: [{ name: 'Revenue', data: [[1250]] }] },
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);

    expect(hot.getPlugin('formulaBuilder').enabled).toBe(false);
    expect(formulasWarnings()).toHaveLength(1);
  });
});
