import Handsontable from 'handsontable';
import exportItem from '../contextMenuItem/exportItem';
import { isItemHidden } from '../../contextMenu/menu/utils';

/**
 * Builds a grid with the given `exportFile` settings and returns the "To Excel" sub-item
 * descriptor together with the instance the context menu evaluates it against.
 *
 * @param {*} exportFileSettings The `exportFile` option value.
 * @returns {{ hot: Handsontable, xlsxItem: object, csvItem: object }}
 */
function setup(exportFileSettings) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: [[1, 2], [3, 4]],
    exportFile: exportFileSettings,
    licenseKey: 'non-commercial-and-evaluation',
  });
  const descriptor = exportItem(hot.getPlugin('exportFile'));
  const [csvItem, xlsxItem] = descriptor.submenu.items;

  return { hot, csvItem, xlsxItem };
}

/**
 * Answers whether the context menu would show the item, through the same predicate `Menu` uses.
 *
 * @param {object} item The menu item descriptor.
 * @param {Handsontable} hot The instance.
 * @returns {boolean}
 */
function isShown(item, hot) {
  return isItemHidden(item, hot);
}

describe('ExportFile context menu "Export" submenu', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  it('should show "To Excel" in the default setup, through the built-in engine', () => {
    const result = setup(true);

    hot = result.hot;

    expect(result.xlsxItem.key).toBe('export_file:xlsx');
    expect(isShown(result.xlsxItem, hot)).toBe(true);
  });

  it('should show "To Excel" when the engines entry is null', () => {
    const result = setup({ engines: { xlsx: null } });

    hot = result.hot;

    expect(isShown(result.xlsxItem, hot)).toBe(true);
  });

  it('should hide "To Excel" when engines.xlsx is not a recognized engine', () => {
    // Every click would fail with "Invalid xlsx engine module." in the console, so the item
    // must not be offered at all.
    const result = setup({ engines: { xlsx: { notAnEngine: true } } });

    hot = result.hot;

    expect(result.xlsxItem.key).toBe('export_file:xlsx');
    expect(isShown(result.xlsxItem, hot)).toBe(false);
  });

  it('should keep "To CSV" visible when engines.xlsx is not a recognized engine', () => {
    const result = setup({ engines: { xlsx: { notAnEngine: true } } });

    hot = result.hot;

    expect(result.csvItem.key).toBe('export_file:csv');
    expect(isShown(result.csvItem, hot)).toBe(true);
  });
});

describe('ExportFile context menu: removing only the "To Excel" sub-item', () => {
  // The recipe the 18.1 to 19.0 migration guide (section 25) gives to keep the default menu and
  // "To CSV" while dropping "To Excel". Keep the two in sync.
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  /**
   * Builds the grid, resolves the context menu items and returns the "Export" item.
   *
   * @param {object} extraSettings Settings merged into the grid configuration.
   * @returns {object} The resolved `export_file` item.
   */
  function resolveExportItem(extraSettings) {
    const container = document.createElement('div');

    document.body.appendChild(container);

    hot = new Handsontable(container, {
      data: [[1, 2], [3, 4]],
      contextMenu: true,
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...extraSettings,
    });

    const contextMenu = hot.getPlugin('contextMenu');

    contextMenu.prepareMenuItems();

    return {
      menuKeys: contextMenu.menu.menuItems.map(item => item.key),
      exportFileItem: contextMenu.menu.menuItems.find(item => item.key === 'export_file'),
    };
  }

  it('should list both sub-items without the override (control)', () => {
    const { exportFileItem } = resolveExportItem({});

    expect(exportFileItem.submenu.items.map(item => item.key)).toEqual(['export_file:csv', 'export_file:xlsx']);
  });

  it('should drop only "To Excel" and keep the rest of the default menu', () => {
    const { menuKeys: defaultKeys } = resolveExportItem({});

    hot.destroy();
    hot = null;

    const { menuKeys, exportFileItem } = resolveExportItem({
      beforeContextMenuSetItems(menuItems) {
        const item = menuItems.find(({ key }) => key === 'export_file');

        if (item) {
          item.submenu.items = item.submenu.items.filter(({ key }) => key !== 'export_file:xlsx');
        }
      },
    });

    expect(menuKeys).toEqual(defaultKeys);
    expect(exportFileItem.submenu.items.map(item => item.key)).toEqual(['export_file:csv']);
  });
});
