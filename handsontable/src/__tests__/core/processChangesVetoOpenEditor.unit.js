import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/**
 * Builds a grid with an editor open on cell (0, 1) holding typed text, and a `beforeChange` listener that
 * vetoes every change of the `'background'` source.
 *
 * @returns {Handsontable} The instance.
 */
function buildGrid() {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
    licenseKey: 'non-commercial-and-evaluation',
    beforeChange(changes, source) {
      return source === 'background' ? false : undefined;
    },
  });

  hot.selectCell(0, 1);
  hot.getActiveEditor().beginEditing();
  hot.getActiveEditor().setValue('typed');

  return hot;
}

describe('a `beforeChange` veto and an open editor', () => {
  it('should keep the typed text when the vetoed call writes another cell', () => {
    const hot = buildGrid();

    hot.setDataAtCell(2, 1, 'x', 'background');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toBe('typed');

    hot.destroy();
  });

  it('should cancel the editor when the vetoed call writes the edited cell', () => {
    const hot = buildGrid();

    hot.setDataAtCell(0, 1, 'x', 'background');

    expect(hot.getActiveEditor().isOpened()).toBe(false);
    expect(hot.getDataAtCell(0, 1)).toBe('B1');

    hot.destroy();
  });
});
