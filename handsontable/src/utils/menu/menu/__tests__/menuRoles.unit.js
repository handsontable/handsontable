import Handsontable from 'handsontable/base';
import { AutoColumnSize, ContextMenu, DropdownMenu, Filters, HiddenRows, registerPlugin } from 'handsontable/plugins';
import { CheckboxCellType, registerCellType } from 'handsontable/cellTypes';
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';
import { Menu } from 'handsontable/utils/menu/menu';
import { TEST_LICENSE_KEY } from '../../../../../test/helpers/licenseKey';

registerPlugin(AutoColumnSize);
registerPlugin(ContextMenu);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerPlugin(HiddenRows);
registerCellType(CheckboxCellType);
registerLanguageDictionary(plPL);

describe('Menu: roles and names', () => {
  let container;
  let hot;

  /**
   * Builds a grid with both menus enabled.
   *
   * @param {object} [settings] Extra settings.
   * @returns {object} The Handsontable instance.
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [['A1', 'B1'], ['A2', 'B2']],
      colHeaders: true,
      contextMenu: true,
      dropdownMenu: true,
      ...settings,
    });

    return hot;
  }

  /**
   * Opens the menu of a plugin and returns the menu instance.
   *
   * @param {string} pluginName The plugin name.
   * @returns {Menu} The opened menu.
   */
  function openMenu(pluginName) {
    const plugin = hot.getPlugin(pluginName);

    hot.selectCell(0, 0);
    plugin.open({ top: 0, left: 0 });

    return plugin.menu;
  }

  /**
   * Collects the master table and every overlay clone table of the menu grid.
   *
   * @param {Menu} menu The opened menu.
   * @returns {object[]} The Walkontable tables.
   */
  function getOwnTables(menu) {
    return menu.hotMenu.view._wt.wtOverlays.getOverlays(true)
      .map(overlay => (overlay.name === 'master' ? overlay : overlay.clone?.wtTable))
      .filter(Boolean);
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  it('should name the context menu with its translated phrase', () => {
    createGrid();

    const menu = openMenu('contextMenu');

    expect(menu.hotMenu.rootElement.getAttribute('role')).toBe('menu');
    expect(menu.hotMenu.rootElement.getAttribute('aria-label')).toBe('Context menu');
  });

  it('should name the dropdown menu with its translated phrase', () => {
    createGrid();

    const menu = openMenu('dropdownMenu');

    expect(menu.hotMenu.rootElement.getAttribute('role')).toBe('menu');
    expect(menu.hotMenu.rootElement.getAttribute('aria-label')).toBe('Column menu');
  });

  it('should resolve the name when the menu opens, so it follows a language changed later', () => {
    createGrid();

    const plugin = hot.getPlugin('contextMenu');

    hot.selectCell(0, 0);
    plugin.open({ top: 0, left: 0 });
    plugin.close();

    hot.updateSettings({ language: 'pl-PL' });
    hot.selectCell(0, 0);
    hot.getPlugin('contextMenu').open({ top: 0, left: 0 });

    expect(hot.getPlugin('contextMenu').menu.hotMenu.rootElement.getAttribute('aria-label'))
      .toBe('Menu kontekstowe');
  });

  it('should name a submenu by the item that opens it', () => {
    createGrid();

    const menu = openMenu('contextMenu');
    const alignmentRow = menu.hotMenu.getSourceData().findIndex(item => item.key === 'alignment');
    const subMenu = menu.openSubMenu(alignmentRow);

    expect(subMenu).not.toBe(false);
    expect(subMenu.hotMenu.rootElement.getAttribute('role')).toBe('menu');
    expect(subMenu.hotMenu.rootElement.getAttribute('aria-label')).toBe('Alignment');
  });

  it('should name a submenu by the text of its item when the item name holds markup', () => {
    createGrid({
      contextMenu: {
        items: {
          more: {
            name: '<b>More</b> &amp; less',
            submenu: {
              items: [{ key: 'more:one', name: 'One' }],
            },
          },
        },
      },
    });

    const menu = openMenu('contextMenu');
    const subMenu = menu.openSubMenu(0);

    expect(subMenu).not.toBe(false);
    expect(subMenu.hotMenu.rootElement.getAttribute('aria-label')).toBe('More & less');
  });

  it('should write no name on a menu that was given none, and keep a name its owner wrote', () => {
    createGrid();

    const menu = new Menu(hot, { className: 'htCustomMenu' });

    menu.container.setAttribute('aria-label', 'Named by the owner');
    menu.setMenuItems([{ key: 'one', name: 'One' }]);
    menu.open();

    expect(menu.hotMenu.rootElement).toBe(menu.container);
    expect(menu.container.getAttribute('role')).toBe('menu');
    expect(menu.container.getAttribute('aria-label')).toBe('Named by the owner');

    menu.destroy();

    const unnamedMenu = new Menu(hot, { className: 'htOtherMenu' });

    unnamedMenu.setMenuItems([{ key: 'one', name: 'One' }]);
    unnamedMenu.open();

    expect(unnamedMenu.container.hasAttribute('aria-label')).toBe(false);

    unnamedMenu.destroy();
  });

  it('should take the table markup of the menu grid out of the accessibility tree', () => {
    createGrid();

    const menu = openMenu('contextMenu');
    const tables = getOwnTables(menu);

    // The master table and the eight overlay clones.
    expect(tables.length).toBeGreaterThan(1);

    tables.forEach((wtTable) => {
      expect(wtTable.TABLE.getAttribute('role')).toBe('presentation');
      expect(wtTable.THEAD.getAttribute('role')).toBe('presentation');
      expect(wtTable.TBODY.getAttribute('role')).toBe('presentation');
      expect(wtTable.holder.hasAttribute('tabindex')).toBe(false);
    });

    const rows = Array.from(menu.hotMenu.view._wt.wtTable.TBODY.rows);

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(row => expect(row.getAttribute('role')).toBe('presentation'));
  });

  it('should leave the roles of a grid nested in a menu cell (the Filters value list) untouched', () => {
    createGrid({ filters: true });

    const menu = openMenu('dropdownMenu');
    const valueList = menu.container.querySelector('.htUIMultipleSelectHot');
    const nestedTables = Array.from(valueList.querySelectorAll(':scope > .ht_master table'));
    const nestedRows = Array.from(valueList.querySelectorAll(':scope > .ht_master tbody tr'));

    expect(nestedTables.length).toBeGreaterThan(0);
    expect(nestedRows.length).toBeGreaterThan(0);

    // The value list is built with `ariaTags: false` and writes no role below its tables, so a role on
    // its body, rows or cells could only come from the menu's own pass reaching into it.
    nestedTables.forEach(table => expect(table.tBodies[0].hasAttribute('role')).toBe(false));
    nestedRows.forEach((row) => {
      expect(row.hasAttribute('role')).toBe(false);
      expect(row.cells[0].hasAttribute('role')).toBe(false);
    });
    expect(valueList.querySelector(':scope > .ht_master > .wtHolder').getAttribute('tabindex')).toBe('-1');

    // The menu's own tables are still presentational around it.
    getOwnTables(menu).forEach(wtTable => expect(wtTable.TABLE.getAttribute('role')).toBe('presentation'));
  });

  it('should leave the table markup untouched when the host grid has `ariaTags` off', () => {
    createGrid({ ariaTags: false });

    const menu = openMenu('contextMenu');
    const master = menu.hotMenu.view._wt.wtTable;

    expect(menu.hotMenu.rootElement.hasAttribute('role')).toBe(false);
    expect(menu.hotMenu.rootElement.hasAttribute('aria-label')).toBe(false);
    expect(master.TABLE.hasAttribute('role')).toBe(false);
    expect(master.TBODY.hasAttribute('role')).toBe(false);
    expect(master.holder.getAttribute('tabindex')).toBe('-1');
    expect(master.TBODY.rows[0].hasAttribute('role')).toBe(false);
  });

  it('should not write `aria-selected` on the highlighted item', () => {
    createGrid();

    const menu = openMenu('contextMenu');

    menu.hotMenu.selectCell(0, 0);

    const highlighted = menu.hotMenu.getCell(0, 0);

    expect(highlighted.classList.contains('current')).toBe(true);
    expect(highlighted.getAttribute('role')).toBe('menuitem');
    expect(menu.hotMenu.rootElement.querySelectorAll('[aria-selected]').length).toBe(0);
  });

  it('should not write `aria-selected` on the highlighted item when the host grid has `ariaTags` off', () => {
    createGrid({ ariaTags: false });

    const menu = openMenu('contextMenu');

    menu.hotMenu.selectCell(0, 0);

    expect(menu.hotMenu.getCell(0, 0).classList.contains('current')).toBe(true);
    expect(menu.hotMenu.rootElement.querySelectorAll('[aria-selected]').length).toBe(0);
  });

  it('should keep the table markup presentational after a full draw of the menu grid', () => {
    createGrid();

    const menu = openMenu('contextMenu');

    // Nothing re-applies the roles after `afterInit`: they survive a draw only because the menu grid
    // is built with `ariaTags: false`, so Walkontable writes no `rowgroup` or `row` role over them.
    menu.hotMenu.render();

    getOwnTables(menu).forEach((wtTable) => {
      expect(wtTable.TABLE.getAttribute('role')).toBe('presentation');
      expect(wtTable.THEAD.getAttribute('role')).toBe('presentation');
      expect(wtTable.TBODY.getAttribute('role')).toBe('presentation');
      expect(wtTable.holder.hasAttribute('tabindex')).toBe(false);
    });

    const rows = Array.from(menu.hotMenu.view._wt.wtTable.TBODY.rows);

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(row => expect(row.getAttribute('role')).toBe('presentation'));
  });

  it('should keep `aria-selected` on the selected cell of the host grid while a menu is open and after it closes', () => {
    createGrid();

    const menu = openMenu('contextMenu');

    menu.hotMenu.selectCell(0, 0);

    expect(menu.hotMenu.rootElement.querySelectorAll('[aria-selected]').length).toBe(0);
    expect(hot.getCell(0, 0).getAttribute('aria-selected')).toBe('true');

    hot.render();

    expect(hot.getCell(0, 0).getAttribute('aria-selected')).toBe('true');

    menu.close();
    hot.selectCell(1, 1);

    expect(hot.getCell(1, 1).getAttribute('aria-selected')).toBe('true');
    expect(hot.getCell(0, 0).hasAttribute('aria-selected')).toBe(false);
  });
});
