import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(ColumnSummary);

/**
 * A `columns`, `cells` or `cell` payload, and a grid-level `type` change, reset the cell meta cache, which drops
 * the meta the plugin declares on its summary cells. The plugin writes it again after each of them.
 */
describe('ColumnSummary after the cell meta cache was reset', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a numeric grid with a read-only summary in (2, 0).
   *
   * @returns {Handsontable} The created instance.
   */
  function buildGrid() {
    return new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [[10, 'a'], [20, 'b'], [null, 'c']],
      type: 'numeric',
      columnSummary: [
        { destinationColumn: 0, destinationRow: 2, ranges: [[0, 1]], type: 'sum' },
      ],
    });
  }

  it('should keep the summary cell read-only and styled after a grid-level type change', () => {
    hot = buildGrid();

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(2, 0).className).toContain('columnSummaryResult');

    hot.updateSettings({ type: 'text' });

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(2, 0).className).toContain('columnSummaryResult');
  });

  it.each([
    ['cells', { cells: () => ({}) }],
    ['cell', { cell: [{ row: 0, col: 1, comment: { value: 'note' } }] }],
    ['columns', { columns: [{}, {}] }],
  ])('should keep the summary cell read-only and styled after a `%s` payload', (name, payload) => {
    hot = buildGrid();

    hot.updateSettings(payload);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(2, 0).className).toContain('columnSummaryResult');
  });
});
