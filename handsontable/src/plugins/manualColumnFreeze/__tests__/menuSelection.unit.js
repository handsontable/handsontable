import Handsontable from 'handsontable/base';
import { AutoColumnSize, ContextMenu, ManualColumnFreeze, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(AutoColumnSize);
registerPlugin(ContextMenu);
registerPlugin(ManualColumnFreeze);

describe('ManualColumnFreeze – selection after a menu action', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'],
      ],
      contextMenu: true,
      manualColumnFreeze: { restoreColumnPosition: true },
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Runs a menu command the way the menu does: with the selected range as its argument.
   *
   * @param {string} command The command key.
   */
  function runCommand(command) {
    const { from, to } = hot.getSelectedRangeLast();

    hot.getPlugin('contextMenu').executeCommand(command, [{
      start: { row: from.row, col: from.col },
      end: { row: to.row, col: to.col },
    }]);
  }

  it('should keep the selected rows and follow the column to the freeze line', () => {
    hot.selectCells([[1, 4, 2, 4]]);
    runCommand('freeze_column');

    expect(hot.getDataAtRow(0)).toEqual(['E1', 'A1', 'B1', 'C1', 'D1', 'F1']);
    expect(hot.getSelected()).toEqual([[1, 0, 2, 0]]);
  });

  it('should follow the column back to its restored position', () => {
    hot.selectCells([[1, 4, 2, 4]]);
    runCommand('freeze_column');
    hot.selectCells([[1, 0, 2, 0]]);
    runCommand('unfreeze_column');

    expect(hot.getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1']);
    expect(hot.getSelected()).toEqual([[1, 4, 2, 4]]);
  });

  it('should select the whole column when it was selected through its header', () => {
    hot.selectColumns(4);
    runCommand('freeze_column');

    expect(hot.getSelected()).toEqual([[0, 0, 2, 0]]);
    expect(hot.selection.isSelectedByColumnHeader()).toBe(true);
  });

  it('should keep the focus on the row it was on inside a multi-row range', () => {
    hot.selectCells([[0, 4, 2, 4]]);

    const focus = hot.getSelectedRangeLast().highlight.clone();

    focus.row = 2;
    hot.selection.setRangeFocus(focus);

    runCommand('freeze_column');

    expect(hot.getSelected()).toEqual([[0, 0, 2, 0]]);
    expect(hot.getSelectedRangeLast().highlight.row).toBe(2);
    expect(hot.getSelectedRangeLast().highlight.col).toBe(0);
  });

  it('should keep the focus on the column header when the grid navigates headers', () => {
    hot.updateSettings({ colHeaders: true, navigableHeaders: true });
    hot.selectColumns(4, 4, -1);

    expect(hot.getSelectedRangeLast().highlight.row).toBe(-1);

    runCommand('freeze_column');

    expect(hot.getSelectedRangeLast().highlight.row).toBe(-1);
    expect(hot.getSelectedRangeLast().highlight.col).toBe(0);
  });
});
