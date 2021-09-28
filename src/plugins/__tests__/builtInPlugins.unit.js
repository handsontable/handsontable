import '../../';
import { getPluginsNames } from '../';

describe('built-in plugins', () => {
  it('should auto-register build-in plugins in the proper order in full build', () => {
    expect(getPluginsNames()).toEqual([
      'PersistentState',
      'AutoColumnSize',
      'Autofill',
      'ManualRowResize',
      'AutoRowSize',
      'ColumnSorting',
      'Comments',
      'ContextMenu',
      'CopyPaste',
      'CustomBorders',
      'DragToScroll',
      'ManualColumnFreeze',
      'ManualColumnMove',
      'ManualColumnResize',
      'ManualRowMove',
      'MergeCells',
      'MultipleSelectionHandles',
      'MultiColumnSorting',
      'Search',
      'TouchScroll',
      'BindRowsWithHeaders',
      'ColumnSummary',
      'DropdownMenu',
      'ExportFile',
      'Filters',
      'Formulas',
      'NestedHeaders',
      'CollapsibleColumns',
      'NestedRows',
      'HiddenColumns',
      'HiddenRows',
      'TrimRows',
      'UndoRedo',
    ]);
  });
});
