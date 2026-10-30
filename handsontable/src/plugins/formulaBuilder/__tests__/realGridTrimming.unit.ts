import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { TrimRows } from '../../trimRows';
import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';
import { removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * The plugin links the grid's visual rows to HyperFormula's rows through the Formulas axis syncers.
 * The two differ only under a trimming map, so a real grid with a trimmed row pins the direction
 * that reads HyperFormula coordinates back onto the screen.
 */
describe('FormulaBuilder on a real grid with a trimmed row', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(TrimRows);
    registerPlugin(FormulaBuilder);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
    removeRealCoreStyles();
  });

  it('draws the highlight of a reference on the visual row of the referenced data', () => {
    hot = new Handsontable(container, {
      data: [[1, 2, ''], [3, 4, ''], [5, 6, ''], ['', '', '']],
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core },
      trimRows: [0],
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);

    // Visual row 0 is physical row 1, which HyperFormula calls row 2 (A2).
    expect(hot.getDataAtCell(0, 0)).toBe(3);

    // The package hands the adapter its references in HyperFormula coordinates: A2:B2 is row 1.
    getFormulaBuilderAdapter(hot.getPlugin('formulaBuilder'))!.setHighlights([{
      range: { start: { sheet: '', row: 1, col: 0 }, end: { sheet: '', row: 1, col: 1 } },
      color: 'red',
    }] as never);
    hot.render();

    const corners = hot.selection.highlight.customSelections
      .filter(selection => !selection.isEmpty())
      .map(selection => selection.getVisualCorners());

    expect(corners).toEqual([[0, 0, 0, 1]]);
  });
});
