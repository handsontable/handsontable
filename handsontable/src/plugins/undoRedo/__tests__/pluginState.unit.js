import {
  CollapsibleColumns, Comments, CustomBorders, HiddenColumns, ManualColumnMove, NestedHeaders,
  registerPlugin, UndoRedo,
} from 'handsontable/plugins';
import { setUpUndoGrid, spreadsheet } from './helpers/grid';

registerPlugin(UndoRedo);
registerPlugin(Comments);
registerPlugin(CustomBorders);
registerPlugin(HiddenColumns);
registerPlugin(ManualColumnMove);
registerPlugin(NestedHeaders);
registerPlugin(CollapsibleColumns);

/**
 * Undo of state that is neither cell values nor rows and columns: comments, cell meta, hidden
 * columns. The browser half of this topic is `tests/e2e/undo-plugin-state.spec.ts`.
 */
describe('UndoRedo – plugin state and cell meta', () => {
  const grid = setUpUndoGrid();

  // DEV-515
  it('should undo and redo adding, editing, locking and removing a comment', () => {
    const hot = grid.create({ data: spreadsheet(3, 3), comments: true });
    const comments = hot.getPlugin('comments');
    const undoRedo = hot.getPlugin('undoRedo');
    const comment = () => hot.getCellMeta(0, 0).comment ?? null;

    comments.setCommentAtCell(0, 0, 'First');
    comments.setCommentAtCell(0, 0, 'Second');
    comments.updateCommentMeta(0, 0, { readOnly: true });
    comments.removeCommentAtCell(0, 0);

    expect(comment()).toBeNull();

    undoRedo.undo();

    expect(comment()).toEqual({ value: 'Second', readOnly: true });

    undoRedo.undo();

    expect(comment()).toEqual({ value: 'Second' });

    undoRedo.undo();

    expect(comment()).toEqual({ value: 'First' });

    undoRedo.undo();

    expect(comment()).toBeNull();

    undoRedo.redo();
    undoRedo.redo();
    undoRedo.redo();

    expect(comment()).toEqual({ value: 'Second', readOnly: true });
  });

  // DEV-137
  it('should undo and redo a `className` and a `readOnly` set with `setCellMeta()`', () => {
    const hot = grid.create({ data: spreadsheet(3, 3) });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setCellMeta(1, 1, 'className', 'blue');
    hot.setCellMeta(2, 2, 'readOnly', true);

    undoRedo.undo();

    expect(hot.getCellMeta(2, 2).readOnly).toBe(false);
    expect(hot.getCellMeta(1, 1).className).toBe('blue');

    undoRedo.undo();

    expect(hot.getCellMeta(1, 1).className).toBeUndefined();

    undoRedo.redo();
    undoRedo.redo();

    expect(hot.getCellMeta(1, 1).className).toBe('blue');
    expect(hot.getCellMeta(2, 2).readOnly).toBe(true);
  });

  // DEV-2806
  it('should undo hiding columns', () => {
    const hot = grid.create({ data: spreadsheet(3, 5), hiddenColumns: true });
    const hiddenColumns = hot.getPlugin('hiddenColumns');

    hiddenColumns.hideColumns([1, 3]);

    expect(hiddenColumns.getHiddenColumns()).toEqual([1, 3]);

    hot.getPlugin('undoRedo').undo();

    expect(hiddenColumns.getHiddenColumns()).toEqual([]);
  });

  describe('a progressive border load', () => {
    const border = { width: 1, color: 'red' };
    const bordersConfig = () => Array.from({ length: 40 }, (_, index) => ({
      row: Math.floor(index / 4),
      col: index % 4,
      top: border,
      bottom: border,
      start: border,
      end: border,
    }));
    const countBorderedCells = (hot) => {
      let count = 0;

      for (let row = 0; row < hot.countRows(); row++) {
        for (let column = 0; column < hot.countCols(); column++) {
          if (hot.getCellMeta(row, column).borders) {
            count += 1;
          }
        }
      }

      return count;
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not record its batches as undo steps', () => {
      const hot = grid.create({
        data: spreadsheet(10, 4),
        customBorders: bordersConfig(),
        customBordersProgressive: { chunkSize: 5 },
      });

      jest.runAllTimers();

      expect(countBorderedCells(hot)).toBe(40);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('should keep every border when a row insert that finished the load is undone', () => {
      const hot = grid.create({
        data: spreadsheet(10, 4),
        customBorders: bordersConfig(),
        customBordersProgressive: { chunkSize: 5 },
      });

      jest.advanceTimersByTime(0);
      hot.alter('insert_row_above', 0);

      expect(countBorderedCells(hot)).toBe(40);

      hot.getPlugin('undoRedo').undo();

      expect(hot.countRows()).toBe(10);
      expect(countBorderedCells(hot)).toBe(40);
      expect(hot.getCellMeta(9, 3).borders).toBeDefined();
      expect(hot.getPlugin('customBorders').getBorders()).toHaveLength(40);
    });
  });

  describe('collapsed header groups', () => {
    const nestedHeaders = [
      ['A', { label: 'B', colspan: 3 }],
      ['a', 'b', 'c', 'd'],
    ];

    it('should not walk the header tree for a step that changes no header group', () => {
      const hot = grid.create({
        data: spreadsheet(3, 4), colHeaders: true, nestedHeaders, collapsibleColumns: true,
      });
      const stateManager = hot.getPlugin('nestedHeaders').getStateManager();

      // The first step has no earlier state to compare with, so it reads the groups once.
      hot.setDataAtCell(2, 2, 'edited');

      const exportCollapsedGroups = jest.spyOn(stateManager, 'exportCollapsedGroups');

      hot.setDataAtCell(0, 0, 'edited');
      hot.setDataAtCell(1, 1, 'edited');

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
      expect(exportCollapsedGroups).not.toHaveBeenCalled();
    });

    it('should still record and undo a collapse', () => {
      const hot = grid.create({
        data: spreadsheet(3, 4), colHeaders: true, nestedHeaders, collapsibleColumns: true,
      });
      const collapsibleColumns = hot.getPlugin('collapsibleColumns');
      const stateManager = hot.getPlugin('nestedHeaders').getStateManager();

      hot.setDataAtCell(0, 0, 'edited');
      collapsibleColumns.collapseSection({ row: -2, col: 1 });

      expect(stateManager.exportCollapsedGroups()).toEqual([{ headerLevel: 0, authoredColumnIndex: 1 }]);

      hot.getPlugin('undoRedo').undo();

      expect(stateManager.exportCollapsedGroups()).toEqual([]);
      expect(hot.getDataAtCell(0, 0)).toBe('edited');

      hot.getPlugin('undoRedo').redo();

      expect(stateManager.exportCollapsedGroups()).toEqual([{ headerLevel: 0, authoredColumnIndex: 1 }]);
    });

    it('should not put back groups recorded under another `nestedHeaders` configuration', () => {
      const hot = grid.create({
        data: spreadsheet(3, 4), colHeaders: true, nestedHeaders, collapsibleColumns: true,
      });
      const collapsibleColumns = hot.getPlugin('collapsibleColumns');
      const stateManager = hot.getPlugin('nestedHeaders').getStateManager();
      const undoRedo = hot.getPlugin('undoRedo');

      collapsibleColumns.collapseSection({ row: -2, col: 1 });
      // A new configuration whose group `C` sits where `B` did (header level 0, column 1).
      hot.updateSettings({ nestedHeaders: [['A', { label: 'C', colspan: 2 }, 'D'], ['a', 'b', 'c', 'd']] });

      const hiddenBeforeUndo = collapsibleColumns.getCollapsedColumns();

      undoRedo.undo();
      undoRedo.redo();

      // `C` was never collapsed. The redo leaves the grid as the new configuration left it.
      expect(stateManager.exportCollapsedGroups()).toEqual([]);
      expect(collapsibleColumns.getCollapsedColumns()).toEqual(hiddenBeforeUndo);
    });

    it('should record a collapse made after a new configuration expanded every group', () => {
      const hot = grid.create({
        data: spreadsheet(3, 4), colHeaders: true, nestedHeaders, collapsibleColumns: true,
      });
      const collapsibleColumns = hot.getPlugin('collapsibleColumns');
      const stateManager = hot.getPlugin('nestedHeaders').getStateManager();

      collapsibleColumns.collapseSection({ row: -2, col: 1 });
      // A new configuration derives the tree again, with every group expanded.
      hot.updateSettings({ nestedHeaders });

      expect(stateManager.exportCollapsedGroups()).toEqual([]);

      hot.setDataAtCell(0, 0, 'edited');
      collapsibleColumns.collapseSection({ row: -2, col: 1 });
      hot.getPlugin('undoRedo').undo();

      expect(stateManager.exportCollapsedGroups()).toEqual([]);
      expect(hot.getDataAtCell(0, 0)).toBe('edited');
    });
  });

  describe('header group membership after a new `nestedHeaders` configuration', () => {
    it('should not put back the membership a column move recorded under the previous configuration', () => {
      const hot = grid.create({
        data: spreadsheet(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });
      const nestedHeadersPlugin = hot.getPlugin('nestedHeaders');
      const stateManager = nestedHeadersPlugin.getStateManager();
      const moves = hot.getPlugin('manualColumnMove');

      // Both moves drop a Finance column inside Address, which adopts it.
      moves.moveColumn(2, 1);
      moves.moveColumn(3, 2);

      expect(stateManager.exportMembershipOverrides().length).toBeGreaterThan(0);

      hot.updateSettings({
        nestedHeaders: [
          [{ label: 'A', colspan: 2 }, { label: 'B', colspan: 2 }],
          ['a', 'b', 'c', 'd'],
        ],
      });

      expect(stateManager.exportMembershipOverrides()).toEqual([]);
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

      // Undoes the second move. The state before it holds the first move's membership, recorded
      // under the previous configuration.
      hot.getPlugin('undoRedo').undo();

      const topHeaders = () => [0, 1, 2, 3].map((column) => {
        const { label, colspan } = nestedHeadersPlugin.getHeaderSettings(0, column);

        return [label, colspan];
      });

      expect([0, 1, 2, 3].map(column => hot.toPhysicalColumn(column))).toEqual([0, 2, 1, 3]);
      expect(stateManager.exportMembershipOverrides()).toEqual([]);
      // The new configuration, derived for the restored column order.
      expect(topHeaders()).toEqual([['A', 1], ['B', 1], ['A', 1], ['B', 1]]);
    });
  });

  describe('a `columns` settings update', () => {
    // The border model's state names no column (`getStateColumns()` answers `[]`): the borders live in
    // cell meta, which the step's journal addresses by column.
    it('should keep a border step on a column that still shows its field', () => {
      const hot = grid.create({
        data: spreadsheet(2, 3),
        columns: [{ data: 0 }, { data: 1 }, { data: 2 }],
        customBorders: true,
      });
      const customBorders = hot.getPlugin('customBorders');
      const undoRedo = hot.getPlugin('undoRedo');

      customBorders.setBorders([[0, 0, 0, 0]], { top: { width: 2, color: 'red' } });
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }] });

      expect(undoRedo.isUndoAvailable()).toBe(true);

      undoRedo.undo();

      expect(customBorders.getBorders()).toEqual([]);
      expect(hot.getCellMeta(0, 0).borders).toBeUndefined();
    });
  });
});
