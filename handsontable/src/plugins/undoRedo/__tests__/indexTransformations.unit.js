import {
  AutoColumnSize, DropdownMenu, Filters, HiddenRows, ManualColumnFreeze, ManualColumnMove, registerPlugin, TrimRows,
  UndoRedo,
} from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { setUpUndoGrid, spreadsheet } from './helpers/grid';

registerPlugin(UndoRedo);
registerPlugin(ManualColumnFreeze);
registerPlugin(ManualColumnMove);
// Filters requires these.
registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);
registerPlugin(TrimRows);

/**
 * Undo on a grid whose visual order differs from the physical one - a frozen column moves, a filter
 * trims rows. The browser half of this topic is `tests/e2e/undo-index-transformations.spec.ts`.
 */
describe('UndoRedo – frozen columns and filtered rows', () => {
  const grid = setUpUndoGrid();

  // DEV-3134: the old undo wrote the value back to the visual column the edit was made in.
  it('should put back an edit made before a column was frozen, and change no other cell', () => {
    const hot = grid.create({ data: spreadsheet(6, 8), manualColumnFreeze: true });
    const original = hot.getSourceData();

    hot.setDataAtCell(4, 3, 43000);
    hot.getPlugin('manualColumnFreeze').freezeColumn(4);
    grid.undoAll();

    expect(hot.getSourceData()).toEqual(original);
    expect(hot.toPhysicalColumn(0)).toBe(0);
  });

  describe('a row removed while a filter is on', () => {
    // DEV-767
    it('should bring back the only visible row, still visible', () => {
      const hot = grid.create({ data: spreadsheet(5, 3), filters: true });
      const original = hot.getSourceData();
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'by_value', [['A1']]);
      filters.filter();
      hot.alter('remove_row', 0, 1);

      expect(hot.countRows()).toBe(0);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getData()).toEqual([['A1', 'B1', 'C1']]);
      expect(hot.getSourceData()).toEqual(original);
    });

    // DEV-985
    it('should restore the data exactly after the filter is cleared', () => {
      const hot = grid.create({
        data: [['1', 'et'], ['2', 'dolor'], ['3', 'et'], ['4', 'sit'], ['5', 'amet'], ['6', 'et']],
        filters: true,
      });
      const original = hot.getSourceData();
      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'by_value', [['et']]);
      filters.filter();
      hot.alter('remove_row', 1, 1);
      filters.clearConditions();
      filters.filter();
      grid.undoAll();

      expect(hot.getSourceData()).toEqual(original);
      expect(hot.getData()).toEqual(original);
    });
  });

  // The undo of a row removal leaves the conditions alone, so one added but not applied yet is still
  // there for the `filter()` call that applies it.
  it('should keep a condition added but not applied when a row removal is undone', () => {
    const hot = grid.create({ data: spreadsheet(5, 3), filters: true });
    const filters = hot.getPlugin('filters');

    filters.addCondition(2, 'eq', ['C3']);
    hot.alter('remove_row', 0, 1);
    hot.getPlugin('undoRedo').undo();

    expect(hot.countRows()).toBe(5);

    filters.filter();

    expect(hot.getData()).toEqual([['A3', 'B3', 'C3']]);
  });

  describe('a filter recorded before a column was inserted or removed', () => {
    const data = () => [
      ['A1', 'B1', 'x'],
      ['A2', 'B2', 'y'],
      ['A3', 'B3', 'x'],
      ['A4', 'B4', 'z'],
    ];
    const filteredColumns = hot => hot.getPlugin('filters').exportConditions().map(({ column }) => column);

    it('should put the filter back on its column after a column to its left was removed', () => {
      const hot = grid.create({ data: data(), filters: true });
      const filters = hot.getPlugin('filters');
      const undoRedo = hot.getPlugin('undoRedo');

      filters.addCondition(2, 'eq', ['x']);
      filters.filter();
      hot.alter('remove_col', 0);
      filters.clearConditions();
      filters.filter();

      expect(hot.getData()).toEqual([['B1', 'x'], ['B2', 'y'], ['B3', 'x'], ['B4', 'z']]);

      undoRedo.undo();

      expect(filteredColumns(hot)).toEqual([1]);
      expect(hot.getData()).toEqual([['B1', 'x'], ['B3', 'x']]);

      undoRedo.undo();

      expect(filteredColumns(hot)).toEqual([2]);
      expect(hot.getData()).toEqual([['A1', 'B1', 'x'], ['A3', 'B3', 'x']]);

      undoRedo.redo();

      expect(filteredColumns(hot)).toEqual([1]);
      expect(hot.getData()).toEqual([['B1', 'x'], ['B3', 'x']]);

      undoRedo.redo();

      expect(filteredColumns(hot)).toEqual([]);
      expect(hot.getData()).toEqual([['B1', 'x'], ['B2', 'y'], ['B3', 'x'], ['B4', 'z']]);
    });

    it('should put the filter back on its column after a column to its left was inserted', () => {
      const hot = grid.create({ data: data(), filters: true });
      const filters = hot.getPlugin('filters');
      const undoRedo = hot.getPlugin('undoRedo');

      filters.addCondition(2, 'eq', ['x']);
      filters.filter();
      hot.alter('insert_col_start', 1);
      filters.clearConditions();
      filters.filter();
      undoRedo.undo();

      expect(filteredColumns(hot)).toEqual([3]);
      expect(hot.getData()).toEqual([['A1', null, 'B1', 'x'], ['A3', null, 'B3', 'x']]);
    });

    it('should drop a filter whose column was removed, and not move it to the next column', () => {
      const hot = grid.create({
        data: [['A1', 'x', 'C1', 'D1'], ['A2', 'y', 'C2', 'D2'], ['A3', 'x', 'C3', 'D3']],
        filters: true,
      });
      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'eq', ['x']);
      filters.filter();
      hot.alter('remove_col', 1);
      filters.addCondition(0, 'eq', ['A1']);
      filters.filter();
      hot.getPlugin('undoRedo').undo();

      expect(filteredColumns(hot)).toEqual([]);
      // The rows the removed column's filter hid stay hidden until the next filter pass.
      expect(hot.getData()).toEqual([['A1', 'C1', 'D1'], ['A3', 'C3', 'D3']]);
    });

    // The applied conditions name physical columns. With a moved column, a column to the left on
    // screen can sit after the filtered one in the source, so a shift by visual position lands the
    // filter on another column. `addCondition()` takes a visual column, `exportConditions()` returns
    // physical ones.
    describe('on a moved column order', () => {
      const orderOf = hot => [0, 1, 2, 3].map(column => hot.toPhysicalColumn(column));
      // `A`, `B`, the `x` column and `D`, which `manualColumnMove` shows first: D, A, B, x.
      const createMoved = () => grid.create({
        data: data().map((row, index) => [...row, `D${index + 1}`]),
        manualColumnMove: [3],
        filters: true,
      });

      it('should keep the filter on its column after removing a column shown before it but stored after it', () => {
        const hot = createMoved();
        const filters = hot.getPlugin('filters');
        const undoRedo = hot.getPlugin('undoRedo');

        expect(orderOf(hot)).toEqual([3, 0, 1, 2]);

        filters.addCondition(3, 'eq', ['x']);
        filters.filter();
        hot.alter('remove_col', 0);

        expect(filteredColumns(hot)).toEqual([2]);
        expect(hot.getData()).toEqual([['A1', 'B1', 'x'], ['A3', 'B3', 'x']]);

        undoRedo.undo();

        expect(orderOf(hot)).toEqual([3, 0, 1, 2]);
        expect(filteredColumns(hot)).toEqual([2]);
        expect(filters.getDataMapAtColumn(2).map(({ value }) => value)).toEqual(['x', 'y', 'x', 'z']);
        expect(hot.getData()).toEqual([['D1', 'A1', 'B1', 'x'], ['D3', 'A3', 'B3', 'x']]);

        undoRedo.redo();

        expect(filteredColumns(hot)).toEqual([2]);
        expect(hot.getData()).toEqual([['A1', 'B1', 'x'], ['A3', 'B3', 'x']]);
      });

      it('should move the filter with its column after a column before it in the source was removed', () => {
        const hot = createMoved();
        const filters = hot.getPlugin('filters');
        const undoRedo = hot.getPlugin('undoRedo');

        filters.addCondition(3, 'eq', ['x']);
        filters.filter();
        // `A`, physical 0.
        hot.alter('remove_col', 1);

        expect(filteredColumns(hot)).toEqual([1]);
        expect(hot.getData()).toEqual([['D1', 'B1', 'x'], ['D3', 'B3', 'x']]);

        undoRedo.undo();

        expect(orderOf(hot)).toEqual([3, 0, 1, 2]);
        expect(filteredColumns(hot)).toEqual([2]);
        expect(filters.getDataMapAtColumn(2).map(({ value }) => value)).toEqual(['x', 'y', 'x', 'z']);
        expect(hot.getData()).toEqual([['D1', 'A1', 'B1', 'x'], ['D3', 'A3', 'B3', 'x']]);

        undoRedo.redo();

        expect(filteredColumns(hot)).toEqual([1]);
        expect(hot.getData()).toEqual([['D1', 'B1', 'x'], ['D3', 'B3', 'x']]);
      });

      it('should keep the filter on its column after a column was inserted before a moved column', () => {
        const hot = createMoved();
        const filters = hot.getPlugin('filters');
        const undoRedo = hot.getPlugin('undoRedo');

        // `A`, physical 0, visual 1. An insert at visual 0 lands at physical 3, after it in the source.
        filters.addCondition(1, 'eq', ['A1']);
        filters.filter();
        hot.alter('insert_col_start', 0);

        expect(filteredColumns(hot)).toEqual([0]);
        expect(hot.getData()).toEqual([[null, 'D1', 'A1', 'B1', 'x']]);

        undoRedo.undo();

        expect(orderOf(hot)).toEqual([3, 0, 1, 2]);
        expect(filteredColumns(hot)).toEqual([0]);
        expect(hot.getData()).toEqual([['D1', 'A1', 'B1', 'x']]);

        undoRedo.redo();

        expect(filteredColumns(hot)).toEqual([0]);
        expect(hot.getData()).toEqual([[null, 'D1', 'A1', 'B1', 'x']]);
      });

      it('should move the filter on a moved column after a column was inserted before it', () => {
        const hot = createMoved();
        const filters = hot.getPlugin('filters');
        const undoRedo = hot.getPlugin('undoRedo');

        // `D`, the moved column: physical 3, visual 0.
        filters.addCondition(0, 'eq', ['D2']);
        filters.filter();
        hot.alter('insert_col_start', 0);

        expect(filteredColumns(hot)).toEqual([4]);
        expect(hot.getData()).toEqual([[null, 'D2', 'A2', 'B2', 'y']]);

        undoRedo.undo();

        expect(orderOf(hot)).toEqual([3, 0, 1, 2]);
        expect(filteredColumns(hot)).toEqual([3]);
        expect(filters.getDataMapAtColumn(3).map(({ value }) => value)).toEqual(['D1', 'D2', 'D3', 'D4']);
        expect(hot.getData()).toEqual([['D2', 'A2', 'B2', 'y']]);

        undoRedo.redo();

        expect(filteredColumns(hot)).toEqual([4]);
        expect(hot.getData()).toEqual([[null, 'D2', 'A2', 'B2', 'y']]);
      });
    });
  });

  // Filters answers `getStateColumns()` with the columns whose conditions a step changed.
  describe('a filter recorded before a `columns` settings update', () => {
    const columns = [{ data: 0 }, { data: 1 }, { data: 2 }];

    it('should keep a filter on a column that still shows its field', () => {
      const hot = grid.create({ data: spreadsheet(4, 3), columns, filters: true });
      const filters = hot.getPlugin('filters');
      const undoRedo = hot.getPlugin('undoRedo');

      filters.addCondition(0, 'eq', ['A1']);
      filters.filter();
      hot.updateSettings({ columns: columns.slice(0, 2) });

      expect(undoRedo.isUndoAvailable()).toBe(true);

      undoRedo.undo();

      expect(hot.countRows()).toBe(4);
    });

    it('should drop a filter on a column that is gone', () => {
      const hot = grid.create({ data: spreadsheet(4, 3), columns, filters: true });
      const filters = hot.getPlugin('filters');

      filters.addCondition(2, 'eq', ['C1']);
      filters.filter();
      hot.updateSettings({ columns: columns.slice(0, 2) });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });
  });

  describe('a trim or a hide made outside any step after a row was removed', () => {
    it('should keep the trim on its row through the undo and the redo of the removal', () => {
      const hot = grid.create({ data: spreadsheet(5, 1), trimRows: true });
      const undoRedo = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1);
      // A settings update is not a step, so no undo takes this trim away.
      hot.updateSettings({ trimRows: [2] });

      expect(hot.getData()).toEqual([['A1'], ['A3'], ['A5']]);

      undoRedo.undo();

      expect(hot.getData()).toEqual([['A1'], ['A2'], ['A3'], ['A5']]);
      expect(hot.getPlugin('trimRows').getTrimmedRows()).toEqual([3]);

      undoRedo.redo();

      expect(hot.getData()).toEqual([['A1'], ['A3'], ['A5']]);
      expect(hot.getPlugin('trimRows').getTrimmedRows()).toEqual([2]);
    });

    it('should take back a trim the step made together with the removal', () => {
      const hot = grid.create({ data: spreadsheet(5, 1), trimRows: true });

      hot.batch(() => {
        hot.getPlugin('trimRows').trimRow(0);
        hot.alter('remove_row', 3);
      });
      hot.getPlugin('undoRedo').undo();

      expect(hot.getData()).toEqual([['A1'], ['A2'], ['A3'], ['A4'], ['A5']]);
      expect(hot.getPlugin('trimRows').getTrimmedRows()).toEqual([]);
    });

    it('should keep a hide made the same way on its row', () => {
      const hot = grid.create({ data: spreadsheet(5, 1), hiddenRows: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const hiddenRows = hot.getPlugin('hiddenRows');

      hot.alter('remove_row', 1);
      hot.updateSettings({ hiddenRows: { rows: [2] } });
      undoRedo.undo();

      expect(hiddenRows.getHiddenRows()).toEqual([3]);
      expect(hot.getDataAtCell(3, 0)).toBe('A4');

      undoRedo.redo();

      expect(hiddenRows.getHiddenRows()).toEqual([2]);
      expect(hot.getDataAtCell(2, 0)).toBe('A4');
    });

    // DEV-134: the removed row carried the hide, so the step changed the hiding map.
    it('should hide a hidden row again when an undo brings it back', () => {
      const hot = grid.create({ data: spreadsheet(5, 1), hiddenRows: { rows: [1, 3] } });

      hot.alter('remove_row', 3);
      hot.getPlugin('undoRedo').undo();

      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([1, 3]);
    });

    // The removed row carried the hide, and a settings update hid another row after the step: the undo
    // brings the removed row back hidden, and keeps the later hide on its row.
    it('should keep a hide made after the step when the step removed a hidden row', () => {
      const hot = grid.create({ data: spreadsheet(5, 1), hiddenRows: { rows: [1] } });
      const undoRedo = hot.getPlugin('undoRedo');
      const hiddenRows = hot.getPlugin('hiddenRows');

      hot.alter('remove_row', 1);
      // Row `A5`.
      hot.updateSettings({ hiddenRows: { rows: [3] } });
      undoRedo.undo();

      expect(hiddenRows.getHiddenRows()).toEqual([1, 4]);
      expect(hot.getDataAtCell(4, 0)).toBe('A5');

      undoRedo.redo();

      expect(hiddenRows.getHiddenRows()).toEqual([3]);
      expect(hot.getDataAtCell(3, 0)).toBe('A5');
    });
  });
});
