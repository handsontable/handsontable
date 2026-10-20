import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/**
 * Builds a grid with an editor open on cell (0, 1) holding typed text.
 *
 * @param {object} [settings] Extra settings.
 * @returns {Handsontable} The instance.
 */
function buildGridWithOpenEditor(settings = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4']],
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  hot.selectCell(0, 1);
  hot.getActiveEditor().beginEditing();
  hot.getActiveEditor().setValue('typed');

  return hot;
}

describe('setSourceDataAtCell() and an open editor', () => {
  it('should keep the typed text when another cell is written', () => {
    const hot = buildGridWithOpenEditor();

    hot.setSourceDataAtCell(2, 1, 'from server');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toBe('typed');
    expect(hot.getSourceDataAtCell(2, 1)).toBe('from server');

    hot.destroy();
  });

  it('should keep the typed text when a filtered-out row is written', () => {
    const hot = buildGridWithOpenEditor({ trimRows: [3] });

    hot.setSourceDataAtCell([[3, 1, 'from server']]);

    expect(hot.getActiveEditor().getValue()).toBe('typed');

    hot.destroy();
  });

  it('should refresh the editor when its own cell is written, by column index or prop', () => {
    const hot = buildGridWithOpenEditor();

    hot.setSourceDataAtCell(0, 1, 'from server');

    expect(hot.getActiveEditor().getValue()).toBe('from server');

    hot.destroy();
  });

  it('should find the edited cell by its physical row when the rows are sorted', () => {
    const hot = buildGridWithOpenEditor({ columnSorting: true });

    hot.getActiveEditor().finishEditing(true);
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    // Visual row 0 is now physical row 3.
    hot.selectCell(0, 1);
    hot.getActiveEditor().beginEditing();
    hot.getActiveEditor().setValue('typed');

    hot.setSourceDataAtCell(0, 1, 'from server');

    expect(hot.getActiveEditor().getValue()).toBe('typed');

    hot.setSourceDataAtCell(3, 1, 'from server');

    expect(hot.getActiveEditor().getValue()).toBe('from server');

    hot.destroy();
  });
});
