import Handsontable from '../../../base';
import { registerAllCellTypes } from '../../../registry';
import { registerPlugin } from '../../registry';
import { MergeCells } from '../../mergeCells/mergeCells';
import * as consoleHelpers from '../../../helpers/console';
import { applyImportResult } from '../applier';

registerAllCellTypes();
registerPlugin(MergeCells);

/**
 * An import into a grid that already declares typed `columns` used to validate the NEW data against
 * the OLD cell types: `loadData` runs the source-data validators while the previous `columns` still
 * apply, and the result's `columns` only replace them afterwards. A `date` column receiving text
 * logged "Source data warning (3 cells). Invalid value for "date" cell type." on every first import,
 * although the data and the settings ended up right.
 */
describe('applyImportResult into a grid with typed columns', () => {
  let container;
  let hot;
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['a', '2024-01-15'], ['b', '2024-02-20']],
      columns: [{}, { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } }],
      mergeCells: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    warnSpy.mockClear();
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
    warnSpy.mockRestore();
  });

  const sourceDataWarnings = () => warnSpy.mock.calls
    .map(args => String(args[0]))
    .filter(message => message.includes('Source data warning'));

  it('should validate the imported data against the imported column types, not the previous ones', () => {
    applyImportResult(hot, {
      data: [['x', 'plain text'], ['y', 'more text'], ['z', 'still text']],
      columns: [{ type: 'text' }, { type: 'text' }],
      sheetNames: ['Sheet1'],
      dropped: [],
    });

    expect(sourceDataWarnings()).toEqual([]);
    expect(hot.getDataAtCol(1)).toEqual(['plain text', 'more text', 'still text']);
    expect(hot.getCellMeta(0, 1).type).toBe('text');
  });

  it('should still warn when the imported data does not fit the imported column type', () => {
    applyImportResult(hot, {
      data: [['x', 'not a date']],
      columns: [{}, { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } }],
      sheetNames: ['Sheet1'],
      dropped: [],
    });

    expect(sourceDataWarnings()).toHaveLength(1);
  });

  it('should keep the merges the result declares beyond the previous grid size', () => {
    // The reason the layout settings go in after `loadData`: applied to the old two-row table, a
    // merge reaching row 3 was rejected. Only the column types move ahead of the data.
    applyImportResult(hot, {
      data: [['x', 't'], ['y', 't'], ['z', 't'], ['w', 't']],
      columns: [{ type: 'text' }, { type: 'text' }],
      mergeCells: [{ row: 2, col: 0, rowspan: 2, colspan: 1 }],
      sheetNames: ['Sheet1'],
      dropped: [],
    });

    expect(hot.getCellMeta(2, 0).rowspan).toBe(2);
  });
});
