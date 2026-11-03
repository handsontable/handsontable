import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { MergeCells } from '../../mergeCells';
import { TrimRows } from '../../trimRows';
import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';
import type { HandsontableAdapter } from '../handsontableAdapter';
import { removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * Builds a range in HyperFormula coordinates.
 *
 * @param {number} row The first row.
 * @param {number} col The first column.
 * @param {number} row2 The last row.
 * @param {number} col2 The last column.
 * @returns {object}
 */
function range(row: number, col: number, row2: number, col2: number) {
  return { start: { sheet: '', row, col }, end: { sheet: '', row: row2, col: col2 } };
}

/**
 * A picked range grows over the merged cells it touches, the way the grid's selection does, so a
 * reference never cuts a merge.
 */
describe('FormulaBuilder range picks over merged cells on a real grid', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(MergeCells);
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

  /**
   * Builds a 6x4 grid with the given extra settings and returns its adapter.
   *
   * @param {object} settings Extra settings.
   * @returns {HandsontableAdapter}
   */
  function createAdapter(settings: Record<string, unknown>): HandsontableAdapter {
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [row, row, row, row]),
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core },
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    } as Handsontable.GridSettings);

    return getFormulaBuilderAdapter(hot.getPlugin('formulaBuilder'))!;
  }

  it('grows a range that reaches into a merge to cover the whole merge', () => {
    const adapter = createAdapter({ mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }] });

    // A3 dragged up onto the merged A1:B2.
    expect(adapter.expandRangeOverMerges(range(2, 0, 0, 0))).toEqual(range(0, 0, 2, 1));
  });

  it('keeps growing while the grown range reaches another merge', () => {
    const adapter = createAdapter({
      mergeCells: [
        { row: 0, col: 0, rowspan: 2, colspan: 2 },
        { row: 2, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    // A1:A3 grows over A1:B2 to A1:B3, which reaches B3:C4.
    expect(adapter.expandRangeOverMerges(range(0, 0, 2, 0))).toEqual(range(0, 0, 3, 2));
  });

  it('returns a range that touches no merge as it is', () => {
    const adapter = createAdapter({ mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }] });
    const picked = range(3, 2, 5, 3);

    expect(adapter.expandRangeOverMerges(picked)).toBe(picked);
  });

  it('returns the range as it is when MergeCells is off', () => {
    const adapter = createAdapter({});
    const picked = range(2, 0, 0, 0);

    expect(adapter.expandRangeOverMerges(picked)).toBe(picked);
  });

  it('reads the merges in visual rows and answers in HyperFormula rows under a trimmed row', () => {
    // Physical row 0 is trimmed: visual row 0 is HyperFormula row 1.
    const adapter = createAdapter({
      trimRows: [0],
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
    });

    expect(adapter.expandRangeOverMerges(range(3, 0, 1, 0))).toEqual(range(1, 0, 3, 1));
  });
});
