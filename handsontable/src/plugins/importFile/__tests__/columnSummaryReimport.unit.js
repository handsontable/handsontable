import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { registerAllCellTypes } from '../../../registry';
import { ColumnSummary } from '../../columnSummary/columnSummary';
import { applyImportResult } from '../applier';

registerAllCellTypes();

/**
 * Pins the limitation and the workaround the import guide states for ColumnSummary. A
 * `reversedRowCoords` endpoint resolves its destination row from the row count when it is
 * configured, and neither an import nor `loadData()` re-derives it. So a summary declared on a
 * 5-row grid keeps writing to row 4 after a 6-row file is imported, over an imported value.
 * Turning `columnSummary` off for the import and back on afterwards re-derives the endpoints
 * against the imported rows.
 */
describe('ImportFile with a reversedRowCoords ColumnSummary', () => {
  let container;
  let hot;
  const endpoints = () => [{
    sourceColumn: 0,
    destinationColumn: 0,
    destinationRow: 0,
    reversedRowCoords: true,
    type: 'sum',
    forceNumeric: true,
  }];
  const sixRows = () => ({ data: [['1'], ['2'], ['3'], ['4'], ['5'], ['6']] });

  beforeAll(() => {
    registerPlugin(ColumnSummary);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['1'], ['2'], ['3'], ['4'], ['5']],
      columnSummary: endpoints(),
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  it('should keep the destination row it derived for the previous data', () => {
    applyImportResult(hot, sixRows());

    // Row 4 held the summary of the 5-row grid; it still does, so the imported `'5'` is gone.
    expect(hot.getDataAtCol(0)).toEqual(['1', '2', '3', '4', 21, '6']);
  });

  it('should re-derive the endpoints when columnSummary is turned off for the import', () => {
    hot.updateSettings({ columnSummary: false });
    applyImportResult(hot, sixRows());
    hot.updateSettings({ columnSummary: endpoints() });

    // Every imported value above the last row survives, and the summary lands on the new last
    // row, as it does on a grid created with these six rows.
    const freshContainer = document.createElement('div');

    document.body.appendChild(freshContainer);

    const fresh = new Handsontable(freshContainer, {
      data: sixRows().data,
      columnSummary: endpoints(),
      licenseKey: 'non-commercial-and-evaluation',
    });
    const expected = fresh.getDataAtCol(0);

    fresh.destroy();
    freshContainer.remove();

    expect(hot.getDataAtCol(0).slice(0, 5)).toEqual(['1', '2', '3', '4', '5']);
    expect(hot.getDataAtCol(0)).toEqual(expected);
  });
});
