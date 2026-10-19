import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  ColumnSummary,
  Formulas,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);
registerPlugin(Formulas);

/**
 * A settings update that turns ColumnSummary on next to Formulas leaves a Formulas resync pending, and
 * ColumnSummary computes its endpoints before Formulas has run it. The first cell read runs the resync, the
 * engine reports its values, and ColumnSummary refreshes an endpoint from inside the calculation it is still
 * running. That nested refresh used to clear the endpoint the outer calculation was reading, which threw
 * `Cannot read properties of null (reading 'forceNumeric')`.
 */
describe('ColumnSummary turned on next to Formulas', () => {
  let container;
  let hot;
  let originalScrollIntoView;
  let originalScrollTo;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    originalScrollTo = window.scrollTo;
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.scrollTo = () => {};
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.scrollTo = originalScrollTo;
  });

  /**
   * Returns rows of numbers where each cell holds `row * 10 + column`.
   *
   * @param {number} rows The row count.
   * @param {number} columns The column count.
   * @returns {number[][]}
   */
  function numbers(rows, columns) {
    return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (__, col) => (row * 10) + col));
  }

  it('computes the summary through updateSettings() without throwing', () => {
    hot = new Handsontable(container, {
      data: numbers(20, 6),
      formulas: { engine: HyperFormula },
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(() => hot.updateSettings({
      columnSummary: [{ sourceColumn: 2, destinationRow: 19, destinationColumn: 4, type: 'sum', ranges: [[0, 8]] }],
    })).not.toThrow();

    expect(hot.getDataAtCell(19, 4)).toBe(378);
  });

  it('keeps every endpoint computed when several are turned on at once', () => {
    hot = new Handsontable(container, {
      data: numbers(20, 6),
      formulas: { engine: HyperFormula },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({
      columnSummary: [
        { sourceColumn: 2, destinationRow: 19, destinationColumn: 4, type: 'sum', ranges: [[0, 8]] },
        { sourceColumn: 1, destinationRow: 19, destinationColumn: 5, type: 'max', ranges: [[0, 8]] },
      ],
    });

    expect(hot.getDataAtCell(19, 4)).toBe(378);
    expect(hot.getDataAtCell(19, 5)).toBe(81);
  });
});
