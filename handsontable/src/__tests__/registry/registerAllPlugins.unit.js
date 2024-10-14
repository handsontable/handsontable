// eslint-disable-next-line no-unused-vars
import Handsontable from 'handsontable/base';
import { getRegisteredCellTypeNames } from '../../cellTypes/registry';
import { getRegisteredEditorNames } from '../../editors/registry';
import { getPluginsNames } from '../../plugins/registry';
import { getRegisteredRendererNames } from '../../renderers/registry';
import { getRegisteredValidatorNames } from '../../validators/registry';
import { registerAllPlugins } from '../../registry';

describe('`registerAllPlugins`', () => {
  it('should register all built-in plugins', () => {
    registerAllPlugins();

    expect(getRegisteredCellTypeNames()).toEqual([
      'text',
    ]);
    expect(getRegisteredEditorNames()).toEqual([
      'text',
    ]);
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
      'StretchColumns',
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
    expect(getRegisteredRendererNames()).toEqual([
      'text',
    ]);
    expect(getRegisteredValidatorNames()).toEqual([]);
  });
});
