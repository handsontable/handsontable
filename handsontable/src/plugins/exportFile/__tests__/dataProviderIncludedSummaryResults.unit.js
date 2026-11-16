import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';
import ExportDataProvider from '../dataProvider';
import { buildSummaryFormula } from '../types/xlsx/formula-utils';

registerAllCellTypes();
registerPlugin(ColumnSummary);

describe('ExportDataProvider#getColumnSummaries with `includeSummaryResults`', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  // Physical rows: 0 total | 1, 2 leaves | 3 subtotal | 4, 5, 6 leaves.
  const getSummaries = (includeSummaryResults) => {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [[null], [5], [6], [null], [7], [8], [9]],
      columnSummary: [
        { destinationRow: 3, destinationColumn: 0, type: 'sum', ranges: [[4, 6]] },
        { destinationRow: 0, destinationColumn: 0, type: 'sum', ranges: [[1, 3]], includeSummaryResults },
      ],
    });

    const provider = new ExportDataProvider(hot);

    provider.setOptions({ range: [] });

    return provider.getColumnSummaries();
  };

  it('should mark the summary that includes other results, so it is written as its value', () => {
    const [subtotal, total] = getSummaries(true);

    expect(hot.getDataAtCell(0, 0)).toBe(35);
    expect(subtotal.includesSummaryResults).toBe(false);
    expect(total.includesSummaryResults).toBe(true);
    // The subtotal row stays out of the total's source ranges, so a formula would give 11.
    expect(total.sourceRanges).toEqual([[1, 2]]);
    expect(buildSummaryFormula(subtotal, 1, 1)).toEqual({ formula: 'SUM(A5:A7)' });
    expect(buildSummaryFormula(total, 1, 1)).toBe(null);
  });

  it('should keep the formula of both summaries without the option (control)', () => {
    const [subtotal, total] = getSummaries(false);

    expect(hot.getDataAtCell(0, 0)).toBe(11);
    expect(total.includesSummaryResults).toBe(false);
    expect(buildSummaryFormula(subtotal, 1, 1)).toEqual({ formula: 'SUM(A5:A7)' });
    expect(buildSummaryFormula(total, 1, 1)).toEqual({ formula: 'SUM(A2:A3)' });
  });
});
