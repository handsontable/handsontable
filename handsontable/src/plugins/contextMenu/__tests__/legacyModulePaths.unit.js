import * as legacyCommandExecutor from '../commandExecutor';
import * as currentCommandExecutor from '../../../utils/menu/commandExecutor';
import * as legacyItemsFactory from '../itemsFactory';
import * as currentItemsFactory from '../../../utils/menu/itemsFactory';
import * as legacyMenuCursor from '../menu/cursor';
import * as currentMenuCursor from '../../../utils/menu/menu/cursor';
import * as legacyMenuDefaultShortcutsList from '../menu/defaultShortcutsList';
import * as currentMenuDefaultShortcutsList from '../../../utils/menu/menu/defaultShortcutsList';
import * as legacyMenuIndex from '../menu/index';
import * as currentMenuIndex from '../../../utils/menu/menu/index';
import * as legacyMenuMenu from '../menu/menu';
import * as currentMenuMenu from '../../../utils/menu/menu/menu';
import * as legacyMenuMenuItemRenderer from '../menu/menuItemRenderer';
import * as currentMenuMenuItemRenderer from '../../../utils/menu/menu/menuItemRenderer';
import * as legacyMenuNavigator from '../menu/navigator';
import * as currentMenuNavigator from '../../../utils/menu/menu/navigator';
import * as legacyMenuPositioner from '../menu/positioner';
import * as currentMenuPositioner from '../../../utils/menu/menu/positioner';
import * as legacyMenuShortcuts from '../menu/shortcuts';
import * as currentMenuShortcuts from '../../../utils/menu/menu/shortcuts';
import * as legacyMenuUtils from '../menu/utils';
import * as currentMenuUtils from '../../../utils/menu/menu/utils';
import * as legacyPredefinedItemsAlignment from '../predefinedItems/alignment';
import * as currentPredefinedItemsAlignment from '../../../utils/menu/predefinedItems/alignment';
import * as legacyPredefinedItemsClearColumn from '../predefinedItems/clearColumn';
import * as currentPredefinedItemsClearColumn from '../../../utils/menu/predefinedItems/clearColumn';
import * as legacyPredefinedItemsColumnLeft from '../predefinedItems/columnLeft';
import * as currentPredefinedItemsColumnLeft from '../../../utils/menu/predefinedItems/columnLeft';
import * as legacyPredefinedItemsColumnRight from '../predefinedItems/columnRight';
import * as currentPredefinedItemsColumnRight from '../../../utils/menu/predefinedItems/columnRight';
import * as legacyPredefinedItemsIndex from '../predefinedItems/index';
import * as currentPredefinedItemsIndex from '../../../utils/menu/predefinedItems/index';
import * as legacyPredefinedItemsNoItems from '../predefinedItems/noItems';
import * as currentPredefinedItemsNoItems from '../../../utils/menu/predefinedItems/noItems';
import * as legacyPredefinedItemsReadOnly from '../predefinedItems/readOnly';
import * as currentPredefinedItemsReadOnly from '../../../utils/menu/predefinedItems/readOnly';
import * as legacyPredefinedItemsRedo from '../predefinedItems/redo';
import * as currentPredefinedItemsRedo from '../../../utils/menu/predefinedItems/redo';
import * as legacyPredefinedItemsRemoveColumn from '../predefinedItems/removeColumn';
import * as currentPredefinedItemsRemoveColumn from '../../../utils/menu/predefinedItems/removeColumn';
import * as legacyPredefinedItemsRemoveRow from '../predefinedItems/removeRow';
import * as currentPredefinedItemsRemoveRow from '../../../utils/menu/predefinedItems/removeRow';
import * as legacyPredefinedItemsRowAbove from '../predefinedItems/rowAbove';
import * as currentPredefinedItemsRowAbove from '../../../utils/menu/predefinedItems/rowAbove';
import * as legacyPredefinedItemsRowBelow from '../predefinedItems/rowBelow';
import * as currentPredefinedItemsRowBelow from '../../../utils/menu/predefinedItems/rowBelow';
import * as legacyPredefinedItemsSeparator from '../predefinedItems/separator';
import * as currentPredefinedItemsSeparator from '../../../utils/menu/predefinedItems/separator';
import * as legacyPredefinedItemsUndo from '../predefinedItems/undo';
import * as currentPredefinedItemsUndo from '../../../utils/menu/predefinedItems/undo';
import * as legacyUtils from '../utils';
import * as currentUtils from '../../../utils/menu/utils';

const LEGACY_MODULES = [
  ['commandExecutor', legacyCommandExecutor, currentCommandExecutor],
  ['itemsFactory', legacyItemsFactory, currentItemsFactory],
  ['menu/cursor', legacyMenuCursor, currentMenuCursor],
  ['menu/defaultShortcutsList', legacyMenuDefaultShortcutsList, currentMenuDefaultShortcutsList],
  ['menu/index', legacyMenuIndex, currentMenuIndex],
  ['menu/menu', legacyMenuMenu, currentMenuMenu],
  ['menu/menuItemRenderer', legacyMenuMenuItemRenderer, currentMenuMenuItemRenderer],
  ['menu/navigator', legacyMenuNavigator, currentMenuNavigator],
  ['menu/positioner', legacyMenuPositioner, currentMenuPositioner],
  ['menu/shortcuts', legacyMenuShortcuts, currentMenuShortcuts],
  ['menu/utils', legacyMenuUtils, currentMenuUtils],
  ['predefinedItems/alignment', legacyPredefinedItemsAlignment, currentPredefinedItemsAlignment],
  ['predefinedItems/clearColumn', legacyPredefinedItemsClearColumn, currentPredefinedItemsClearColumn],
  ['predefinedItems/columnLeft', legacyPredefinedItemsColumnLeft, currentPredefinedItemsColumnLeft],
  ['predefinedItems/columnRight', legacyPredefinedItemsColumnRight, currentPredefinedItemsColumnRight],
  ['predefinedItems/index', legacyPredefinedItemsIndex, currentPredefinedItemsIndex],
  ['predefinedItems/noItems', legacyPredefinedItemsNoItems, currentPredefinedItemsNoItems],
  ['predefinedItems/readOnly', legacyPredefinedItemsReadOnly, currentPredefinedItemsReadOnly],
  ['predefinedItems/redo', legacyPredefinedItemsRedo, currentPredefinedItemsRedo],
  ['predefinedItems/removeColumn', legacyPredefinedItemsRemoveColumn, currentPredefinedItemsRemoveColumn],
  ['predefinedItems/removeRow', legacyPredefinedItemsRemoveRow, currentPredefinedItemsRemoveRow],
  ['predefinedItems/rowAbove', legacyPredefinedItemsRowAbove, currentPredefinedItemsRowAbove],
  ['predefinedItems/rowBelow', legacyPredefinedItemsRowBelow, currentPredefinedItemsRowBelow],
  ['predefinedItems/separator', legacyPredefinedItemsSeparator, currentPredefinedItemsSeparator],
  ['predefinedItems/undo', legacyPredefinedItemsUndo, currentPredefinedItemsUndo],
  ['utils', legacyUtils, currentUtils],
];

describe('ContextMenu legacy module paths', () => {
  it.each(LEGACY_MODULES)('`plugins/contextMenu/%s` exposes the same bindings as `utils/menu`', (modulePath, legacy, current) => {
    const names = Object.keys(current);

    expect(names.length).toBeGreaterThan(0);
    expect(Object.keys(legacy).sort()).toEqual([...names].sort());
    names.forEach((name) => {
      expect(legacy[name]).toBe(current[name]);
    });
  });
});
