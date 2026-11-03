import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MergeCells } from '../mergeCells';

describe('MergeCells destroyed ahead of the grid', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(MergeCells);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (__, col) => `${row}-${col}`)),
      mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }], // B2:C3
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should take its merges out of selection, so a later selection neither throws nor grows', () => {
    hot.selectCell(1, 0, 1, 1); // A2:B2 grows over B2:C3 while the plugin runs

    expect(hot.getSelectedLast()).toEqual([1, 0, 2, 2]);

    hot.getPlugin('mergeCells').destroy();

    expect(() => hot.selectCell(1, 0, 1, 1)).not.toThrow();
    expect(hot.getSelectedLast()).toEqual([1, 0, 1, 1]);
    expect(() => hot.selection.isMultiple()).not.toThrow();
  });
});
