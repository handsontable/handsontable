import {
  AutoColumnSize, DropdownMenu, Filters, HiddenRows, ManualColumnFreeze, registerPlugin, UndoRedo,
} from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { setUpUndoGrid, spreadsheet } from './helpers/grid';

registerPlugin(UndoRedo);
registerPlugin(ManualColumnFreeze);
// Filters requires these.
registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

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
});
