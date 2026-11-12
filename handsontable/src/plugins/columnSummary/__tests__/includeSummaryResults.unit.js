import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(ColumnSummary);

// Physical rows: 0 total | 1, 2 leaves | 3 subtotal | 4, 5, 6 leaves. Column 1 holds the values.
const createData = () => [
  ['Line 1', null], ['Line 2', 5], ['Line 3', 6], ['Line 4', null],
  ['Line 5', 7], ['Line 6', 8], ['Line 7', 9],
];
const endpoint = (destinationRow, ranges, extra = {}) => ({
  destinationRow, destinationColumn: 1, sourceColumn: 1, type: 'sum', ranges, ...extra,
});

describe('ColumnSummary `includeSummaryResults` option', () => {
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

  function buildGrid(columnSummary, settings = {}) {
    return new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY, data: createData(), columnSummary, ...settings,
    });
  }

  it('parses `includeSummaryResults` as `false` by default and keeps a declared `true`', () => {
    hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 3]], { includeSummaryResults: true })]);
    const endpoints = hot.getPlugin('columnSummary').endpoints.getAllEndpoints();

    expect(endpoints[0].includeSummaryResults).toBe(false);
    expect(endpoints[1].includeSummaryResults).toBe(true);
  });

  it('exports the option with the endpoint settings', () => {
    hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 3]], { includeSummaryResults: true })]);

    expect(hot.getPlugin('columnSummary').exportEndpointSettings()[1].includeSummaryResults).toBe(true);
  });

  it('keeps skipping a summary result when the option is off (control)', () => {
    hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 3]])]);

    expect(hot.getDataAtCell(3, 1)).toBe(24);
    expect(hot.getDataAtCell(0, 1)).toBe(11);
  });
});
