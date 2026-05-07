import type { HotInstance } from '../../../common';
import { Positioner } from './positioner';
import { createMenuNavigator } from './navigator';
import { createKeyboardShortcutsCtrl } from './shortcuts';
import { SEPARATOR, NO_ITEMS, predefinedItems } from './../predefinedItems';
import {
  filterSeparators,
  hasSubMenu,
  isItemHidden,
  normalizeSelection,
  isItemSubMenu,
  isItemDisabled,
  isItemSeparator,
} from './utils';
import EventManager from '../../../eventManager';
import { arrayEach, arrayFilter, arrayReduce } from '../../../helpers/array';
import { isWindowsOS, isMobileBrowser, isIpadOS } from '../../../helpers/browser';
import {
  addClass,
  isChildOf,
  getParentWindow,
  hasClass,
  setAttribute,
  outerHeight,
  removeClass,
} from '../../../helpers/dom/element';
import { isRightClick } from '../../../helpers/dom/event';
import { debounce, isFunction } from '../../../helpers/function';
import { isUndefined, isDefined } from '../../../helpers/mixed';
import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { createMenuItemRenderer } from './menuItemRenderer';
import {
  A11Y_EXPANDED,
  A11Y_MENU,
  A11Y_TABINDEX,
} from '../../../helpers/a11y';

const MIN_WIDTH = 215;

/**
 * @typedef MenuOptions
 * @property {Menu} [parent=null] Instance of {@link Menu}.
 * @property {string} [name=null] Name of the menu.
 * @property {string} [className=''] Custom class name.
 * @property {boolean} [keepInViewport=true] Determine if should be kept in viewport.
 * @property {boolean} [standalone] Enabling closing menu when clicked element is not belongs to menu itself.
 * @property {number} [minWidth=MIN_WIDTH] The minimum width.
 * @property {HTMLElement} [container] The container.
 */

/**
 * @private
 * @class Menu
 */
export class Menu {
  /**
   * The Handsontable instance.
   *
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * The Menu options.
   *
   * @type {object}
   */
  declare options: Record<string, unknown>;
  /**
   * @type {EventManager}
   */
  declare eventManager: EventManager;
  /**
   * The Menu container element.
   *
   * @type {HTMLElement}
   */
  declare container: HTMLElement;
  /**
   * @type {Positioner}
   */
  declare positioner: Positioner;
  /**
   * The instance of the Handsontable that is used as a menu.
   *
   * @type {Core}
   */
  hotMenu: HotInstance | null = null;
  /**
   * The collection of the Handsontable instances that are used as sub-menus.
   *
   * @type {object}
   */
  hotSubMenus: Record<string, Menu> = {};
  /**
   * If the menu acts as the sub-menu then this property contains the reference to the parent menu.
   *
   * @type {Menu}
   */
  declare parentMenu: Menu | null;
  /**
   * The menu items entries.
   *
   * @type {object[]}
   */
  menuItems: Record<string, unknown>[] | null = null;
  /**
   * @type {boolean}
   */
  origOutsideClickDeselects: boolean | ((target: HTMLElement) => boolean) | null = null;
  declare addLocalHook: (key: string, callback: Function) => object;
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  declare clearLocalHooks: () => object;
  /**
   * The controller module that allows modifying the menu item selection positions.
   *
   * @type {Paginator}
   */
  #navigator: ReturnType<typeof createMenuNavigator> | null = null;
  /**
   * The controller module that allows extending the keyboard shortcuts for the menu.
   *
   * @type {KeyboardShortcutsMenuController}
   */
  #shortcutsCtrl: ReturnType<typeof createKeyboardShortcutsCtrl> | null = null;
  /**
   * The border width of the table used in the menu.
   *
   * @type {number}
   */
  #tableBorderWidth: number | undefined;

  /**
   * Getter for the table border width.
   * This getter retrieves the border width of the table used in the menu.
   *
   * @returns {number} The border width of the table in pixels.
   */
  get tableBorderWidth() {
    if (this.#tableBorderWidth === undefined && this.hotMenu) {
      this.#tableBorderWidth = parseInt(this.hotMenu.rootWindow
        .getComputedStyle(this.hotMenu.view._wt.wtTable.TABLE).borderWidth, 10);
    }

    return this.#tableBorderWidth;
  }

  /**
   * @param {Core} hotInstance Handsontable instance.
   * @param {MenuOptions} [options] Menu options.
   */
  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    this.hot = hotInstance;
    this.options = options || {
      parent: null,
      name: null,
      className: '',
      keepInViewport: true,
      standalone: false,
      minWidth: MIN_WIDTH,
      container: this.hot.rootPortalElement,
    };
    this.container = this.createContainer(this.options.name as string | null);
    this.positioner = new Positioner(this.options.keepInViewport as boolean);
    this.parentMenu = (this.options.parent as Menu) || null;

    this.eventManager = new EventManager(this);

    this.registerEvents();

    if (this.isSubMenu()) {
      this.addLocalHook('afterSelectionChange',
        (...args: unknown[]) => this.parentMenu!.runLocalHooks('afterSelectionChange', ...args));
    }

    this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
      if (this.options.container !== this.hot.rootPortalElement) {
        removeClass(this.options.container as HTMLElement, /ht-theme-.*/g);
        addClass(this.options.container as HTMLElement, themeName);
      }

      if (!firstRun) {
        this.close();
      }
    });
  }

  /**
   * Register event listeners.
   *
   * @private
   */
  registerEvents() {
    let frame = this.hot.rootWindow;

    while (frame) {
      this.eventManager.addEventListener(frame.document, 'mousedown', event => this.onDocumentMouseDown(event));
      this.eventManager.addEventListener(frame.document, 'touchstart', event => this.onDocumentMouseDown(event));
      this.eventManager.addEventListener(frame.document, 'contextmenu', event => this.onDocumentContextMenu(event));

      frame = getParentWindow(frame) as Window & typeof globalThis;
    }
  }

  /**
   * Set array of objects which defines menu items.
   *
   * @param {Array} menuItems Menu items to display.
   */
  setMenuItems(menuItems: Record<string, unknown>[]) {
    this.menuItems = menuItems;
  }

  /**
   * Gets the controller object that allows modifying the the menu item selection.
   *
   * @returns {Paginator | undefined}
   */
  getNavigator() {
    return this.#navigator;
  }

  /**
   * Gets the controller object that allows extending the keyboard shortcuts of the menu.
   *
   * @returns {KeyboardShortcutsMenuController | undefined}
   */
  getKeyboardShortcutsCtrl() {
    return this.#shortcutsCtrl;
  }

  /**
   * Returns currently selected menu item. Returns `null` if no item was selected.
   *
   * @returns {object|null}
   */
  getSelectedItem(): Record<string, unknown> | null {
    return this.hasSelectedItem()
      ? this.hotMenu!.getSourceDataAtRow(this.hotMenu!.getSelectedActive()![0]) as Record<string, unknown>
      : null;
  }

  /**
   * Checks if the menu has selected (highlighted) any item from the menu list.
   *
   * @returns {boolean}
   */
  hasSelectedItem() {
    return Array.isArray(this.hotMenu!.getSelectedActive());
  }

  /**
   * Check if menu is using as sub-menu.
   *
   * @returns {boolean}
   */
  isSubMenu() {
    return this.parentMenu !== null;
  }

  /**
   * Open menu.
   *
   * @fires Hooks#beforeContextMenuShow
   * @fires Hooks#afterContextMenuShow
   */
  open() {
    this.runLocalHooks('beforeOpen');

    this.container.removeAttribute('style');
    this.container.style.display = 'block';

    const delayedOpenSubMenu = debounce((row: number) => this.openSubMenu(row), 300);
    const minWidthOfMenu = (this.options.minWidth as number) || MIN_WIDTH;
    let noItemsDefined = false;

    let filteredItems = arrayFilter(this.menuItems!, (item) => {
      if ((item as Record<string, unknown>).key === NO_ITEMS) {
        noItemsDefined = true;
      }

      return isItemHidden(item as Record<string, unknown>, this.hot);
    });

    if (filteredItems.length < 1 && !noItemsDefined) {
      filteredItems.push((predefinedItems() as Record<string, Record<string, unknown>>)[NO_ITEMS]);

    } else if (filteredItems.length === 0) {
      return;
    }

    filteredItems = filterSeparators(filteredItems as Record<string, unknown>[]);

    let shouldAutoCloseMenu = false;

    const settings = {
      data: filteredItems,
      colHeaders: false,
      autoColumnSize: true,
      autoWrapRow: false,
      modifyColWidth(width: number) {
        if (isDefined(width) && width < minWidthOfMenu) {
          return minWidthOfMenu;
        }

        return width;
      },
      autoRowSize: false,
      readOnly: true,
      editor: false,
      copyPaste: false,
      hiddenRows: true,
      maxCols: 1,
      columns: [{
        data: 'name',
        renderer: createMenuItemRenderer(this.hot),
      }],
      renderAllRows: true,
      fragmentSelection: false,
      outsideClickDeselects: false,
      disableVisualSelection: 'area',
      layoutDirection: this.hot.isRtl() ? 'rtl' : 'ltr',
      ariaTags: false,
      themeName: this.hot.getCurrentThemeName(),
      modifyRowHeight: (rowHeight: number, visualRowIndex: number) => {
        const item = this.hotMenu.getSourceDataAtRow(visualRowIndex) as { name?: unknown } | null;

        return item && item.name === SEPARATOR ? 1 : rowHeight;
      },
      beforeRefreshDimensions: () => false,
      beforeOnCellMouseOver: (event: MouseEvent, coords: { row: number; col: number }) => {
        this.#navigator!.setPageCursorAt(coords.row);
      },
      afterOnCellMouseOver: (event: MouseEvent, coords: { row: number; col: number }) => {
        if (this.isAllSubMenusClosed()) {
          delayedOpenSubMenu(coords.row);
        } else {
          this.openSubMenu(coords.row);
        }
      },
      afterOnCellContextMenu: (event: MouseEvent) => {
        event.preventDefault();

        // On the Windows platform, the "contextmenu" is triggered after the "mouseup" so that's
        // why the closing menu is here. (#6507#issuecomment-582392301).
        if (isWindowsOS() && shouldAutoCloseMenu && this.hasSelectedItem()) {
          this.close(true);
        }
      },
      afterSelection: (row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }) => {
        // do not scroll the viewport when mouse clicks on partially visible menu item
        if (this.hotMenu!.view.isMouseDown()) {
          preventScrolling.value = true;
        }

        this.runLocalHooks('afterSelectionChange', this.getSelectedItem());
      },
      beforeOnCellMouseUp: (event: MouseEvent) => {
        if (this.hasSelectedItem()) {
          shouldAutoCloseMenu = !this.isCommandPassive(this.getSelectedItem()!);
          this.executeCommand(event);
        }
      },
      afterOnCellMouseUp: (event: MouseEvent) => {
        // If the code runs on the other platform than Windows, the "mouseup" is triggered
        // after the "contextmenu". So then "mouseup" closes the menu. Otherwise, the closing
        // menu responsibility is forwarded to "afterOnCellContextMenu" callback (#6507#issuecomment-582392301).
        if ((!isWindowsOS() || !isRightClick(event)) && shouldAutoCloseMenu && this.hasSelectedItem()) {
          // The timeout is necessary only for mobile devices. For desktop, the click event that is fired
          // right after the mouseup event gets the event element target the same as the mouseup event.
          // For mobile devices, the click event is triggered with native delay (~300ms), so when the mouseup
          // event hides the tapped element, the click event grabs the element below. As a result, the filter
          // by condition menu is closed and immediately open on tapping the "None" item.
          if (isMobileBrowser() || isIpadOS()) {
            this.hot._registerTimeout(() => this.close(true), 325);
          } else {
            this.close(true);
          }
        }
      },
      afterUnlisten: () => {
        // Restore menu focus, fix for `this.instance.unlisten();` call in the tableView.js@260 file.
        // This prevents losing table responsiveness for keyboard events when filter select menu is closed (#6497).
        if (!this.hasSelectedItem() && this.isOpened()) {
          this.hotMenu!.listen();
        }
      },
    };

    this.origOutsideClickDeselects = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
    this.hotMenu = new (this.hot.constructor as new (element: HTMLElement, settings: object) => HotInstance)(this.container, settings);
    this.hotMenu.addHook('afterInit', () => this.onAfterInit());
    this.hotMenu.init();

    this.#navigator = createMenuNavigator(this.hotMenu as unknown as Record<string, Function>);
    this.#shortcutsCtrl = createKeyboardShortcutsCtrl(this as unknown as Record<string, unknown>);
    this.#shortcutsCtrl.listen();

    this.focus();

    if (this.isSubMenu()) {
      this.addLocalHook('afterOpen', () => this.parentMenu!.runLocalHooks('afterSubmenuOpen', this));
    }

    this.runLocalHooks('afterOpen', this);
  }

  /**
   * Close menu.
   *
   * @param {boolean} [closeParent=false] If `true` try to close parent menu if exists.
   */
  close(closeParent = false) {
    if (!this.isOpened()) {
      return;
    }

    if (closeParent && this.isSubMenu()) {
      this.parentMenu!.close();

    } else {
      this.#navigator!.clear();
      this.closeAllSubMenus();
      this.container.style.display = 'none';
      this.hotMenu!.destroy();
      this.hotMenu = null;
      this.hot.getSettings().outsideClickDeselects = this.origOutsideClickDeselects;
      this.runLocalHooks('afterClose');

      if (this.isSubMenu()) {
        if (this.hot.getSettings().ariaTags) {
          const selection = this.parentMenu!.hotMenu!.getSelectedActive();

          if (selection) {
            const cell = this.parentMenu!.hotMenu!.getCell(selection[0], 0);

            setAttribute(cell, [
              A11Y_EXPANDED(false),
            ]);
          }
        }

        this.parentMenu!.hotMenu!.listen();
      }
    }
  }

  /**
   * Open sub menu at the provided row index.
   *
   * @param {number} row Row index.
   * @returns {Menu|boolean} Returns created menu or `false` if no one menu was created.
   */
  openSubMenu(row: number) {
    if (!this.hotMenu) {
      return false;
    }

    const cell = this.hotMenu.getCell(row, 0);

    this.closeAllSubMenus();

    if (!cell || !hasSubMenu(cell)) {
      return false;
    }

    const dataItem = this.hotMenu!.getSourceDataAtRow(row) as Record<string, unknown>;
    const subMenu = new Menu(this.hot, {
      parent: this,
      name: dataItem.name as string,
      className: this.options.className,
      keepInViewport: true,
      container: this.options.container,
    });

    subMenu.setMenuItems((dataItem.submenu as Record<string, unknown>).items as Record<string, unknown>[]);
    subMenu.open();
    subMenu.setPosition(cell.getBoundingClientRect() as unknown as Record<string, unknown>);
    this.hotSubMenus[dataItem.key as string] = subMenu;

    // Update the accessibility tags on the cell being the base for the submenu.
    if (this.hot.getSettings().ariaTags) {
      setAttribute(cell, [
        A11Y_EXPANDED(true)
      ]);
    }

    return subMenu;
  }

  /**
   * Close sub menu at row index.
   *
   * @param {number} row Row index.
   */
  closeSubMenu(row: number) {
    const dataItem = this.hotMenu!.getSourceDataAtRow(row) as Record<string, unknown>;
    const menus = this.hotSubMenus[dataItem.key as string];

    if (menus) {
      menus.destroy();
      delete this.hotSubMenus[dataItem.key as string];

      const cell = this.hotMenu!.getCell(row, 0);

      // Update the accessibility tags on the cell being the base for the submenu.
      if (this.hot.getSettings().ariaTags) {
        setAttribute(cell, [
          A11Y_EXPANDED(false),
        ]);
      }
    }
  }

  /**
   * Close all opened sub menus.
   */
  closeAllSubMenus() {
    arrayEach(this.hotMenu!.getData(), (value: unknown, row: number) => this.closeSubMenu(row));
  }

  /**
   * Checks if all created and opened sub menus are closed.
   *
   * @returns {boolean}
   */
  isAllSubMenusClosed() {
    return Object.keys(this.hotSubMenus).length === 0;
  }

  /**
   * Focus the menu so all keyboard shortcuts become active.
   */
  focus() {
    if (this.isOpened()) {
      this.hotMenu!.rootElement.focus({
        preventScroll: true,
      });
      this.getKeyboardShortcutsCtrl()!.listen();
      this.hotMenu.listen();
    }
  }

  /**
   * Destroy instance.
   */
  destroy() {
    const menuContainerParentElement = this.container.parentNode;

    this.clearLocalHooks();
    this.close();
    this.parentMenu = null;
    this.eventManager.destroy();

    if (menuContainerParentElement) {
      menuContainerParentElement.removeChild(this.container);
    }
  }

  /**
   * Checks if menu was opened.
   *
   * @returns {boolean} Returns `true` if menu was opened.
   */
  isOpened() {
    return this.hotMenu !== null;
  }

  /**
   * Execute menu command.
   *
   * The `executeCommand()` method works only for selected cells.
   *
   * When no cells are selected, `executeCommand()` doesn't do anything.
   *
   * @param {Event} [event] The mouse event object.
   */
  executeCommand(event?: Event) {
    if (!this.isOpened() || !this.hasSelectedItem()) {
      return;
    }
    const selectedItem = this.getSelectedItem();

    this.runLocalHooks('select', selectedItem, event);

    if (this.isCommandPassive(selectedItem!)) {
      return;
    }

    const selRanges = this.hot.getSelectedRange();
    const normalizedSelection = selRanges ? normalizeSelection(selRanges) : [];

    this.runLocalHooks('executeCommand', selectedItem!.key, normalizedSelection, event);

    if (this.isSubMenu()) {
      this.parentMenu!.runLocalHooks('executeCommand', selectedItem!.key, normalizedSelection, event);
    }
  }

  /**
   * Checks if the passed command is passive or not. The command is passive when it's marked as
   * disabled, the descriptor object contains `isCommand` property set to `false`, command
   * is a separator, or the item is recognized as submenu. For passive items the menu is not
   * closed automatically after the user trigger the command through the UI.
   *
   * @param {object} commandDescriptor Selected menu item from the menu data source.
   * @returns {boolean}
   */
  isCommandPassive(commandDescriptor: Record<string, unknown>) {
    return commandDescriptor.isCommand === false ||
           isItemSeparator(commandDescriptor) ||
           isItemDisabled(commandDescriptor, this.hot) ||
           isItemSubMenu(commandDescriptor);
  }

  /**
   * Set offset menu position for specified area (`above`, `below`, `left` or `right`).
   *
   * @param {string} area Specified area name (`above`, `below`, `left` or `right`).
   * @param {number} offset Offset value.
   */
  setOffset(area: string, offset: number = 0) {
    this.positioner.setOffset(area, offset);
  }

  /**
   * Set menu position based on dom event or based on literal object.
   *
   * @param {Event|object} coords Event or literal Object with coordinates.
   */
  setPosition(coords: Event | Record<string, unknown>) {
    if (this.isSubMenu()) {
      this.positioner.setParentElement(this.parentMenu!.container);
    }

    this.positioner
      .setElement(this.container)
      .updatePosition(coords);
  }

  /**
   * Updates the dimensions of the menu based on its content.
   * This method calculates the real height of the menu by summing up the heights of its items,
   * and adjusts the width and height of the menu's holder and hider elements accordingly.
   */
  updateMenuDimensions() {
    const { wtTable } = this.hotMenu!.view._wt;
    const data = this.hotMenu!.getSettings().data;
    const hiderStyle = wtTable.hider.style;
    const holderStyle = wtTable.holder.style;
    const currentHiderWidth = parseInt(hiderStyle.width, 10);

    const realHeight = arrayReduce(data,
      (accumulator: unknown, value: unknown, index: unknown) => {
        const itemCell = this.hotMenu!.getCell(index as number, 0);
        const currentRowHeight = itemCell ? outerHeight(this.hotMenu!.getCell(index as number, 0)) : 0;

        return (accumulator as number) + ((value as Record<string, unknown>).name === SEPARATOR ? 1 : currentRowHeight);
      }, 0) as number;

    holderStyle.width = `${currentHiderWidth}px`;
    holderStyle.height = `${realHeight}px`;

    hiderStyle.height = holderStyle.height;
  }

  /**
   * Create container/wrapper for handsontable.
   *
   * @private
   * @param {string} [name] Class name.
   * @returns {HTMLElement}
   */
  createContainer(name: string | null = null) {
    const doc = (this.options.container as HTMLElement).ownerDocument;
    let className = name;
    let container;

    if (className) {
      if (isFunction(className)) {
        className = (className as unknown as Function).call(this.hot);

        if (className === null || isUndefined(className)) {
          className = '';

        } else {
          className = className.toString();
        }
      }

      className = className.replace(/[^A-Za-z0-9]/g, '_');
      className = `${this.options.className}Sub_${className}`;

      container = doc.querySelector(`.${this.options.className}.${className}`);
    }

    if (!container) {
      container = doc.createElement('div');

      addClass(container, `htMenu handsontable ${this.options.className}`);

      if (className) {
        addClass(container, className);
      }

      (this.options.container as HTMLElement).appendChild(container);
    }

    return container as HTMLElement;
  }

  /**
   * On after init listener.
   *
   * @private
   */
  onAfterInit() {
    this.updateMenuDimensions();

    // Replace the default accessibility tags with the context menu's
    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.hotMenu!.rootElement, [
        A11Y_MENU(),
        A11Y_TABINDEX(-1),
      ]);
    }
  }

  /**
   * Document mouse down listener.
   *
   * @private
   * @param {Event} event The mouse event object.
   */
  onDocumentMouseDown(event: Event) {
    if (!this.isOpened()) {
      return;
    }

    // Close menu when clicked element is not belongs to menu itself
    if (this.options.standalone && this.hotMenu && !isChildOf(event.target as HTMLElement, this.hotMenu.rootElement)) {
      this.close(true);

      // Automatically close menu when clicked element is not belongs to menu or submenu (not necessarily to itself)
    } else if ((this.isAllSubMenusClosed() || this.isSubMenu()) && !isChildOf(event.target as HTMLElement, '.htMenu')) {
      this.close(true);
    }
  }

  /**
   * Document's contextmenu listener.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onDocumentContextMenu(event: Event) {
    if (!this.isOpened()) {
      return;
    }

    if (hasClass(event.target as HTMLElement, 'htCore') && isChildOf(event.target as HTMLElement, this.hotMenu!.rootElement)) {
      event.preventDefault();
    }
  }
}

mixin(Menu, localHooks);
