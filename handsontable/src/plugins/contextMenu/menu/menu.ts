import type { HotInstance } from '../../../core/types';
import type { GridSettings } from '../../../core/settings';
import type { MenuItemConfig } from '../contextMenu';
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
import { isWindowsOS, isMobileOrIpadOS } from '../../../helpers/browser';
import {
  addClass,
  empty,
  eventTargetEl,
  isChildOf,
  isHTMLElement,
  getParentWindow,
  hasClass,
  setAttribute,
  outerHeight,
  removeClass,
} from '../../../helpers/dom/element';
import { isRightClick } from '../../../helpers/dom/event';
import { debounce } from '../../../helpers/function';
import { isDefined } from '../../../helpers/mixed';
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
 * How long a hover has to rest on a menu row before a sub-menu opens, switches or closes.
 * Opening and closing use the same delay on purpose: the sub-menu is drawn beside the
 * parent, so reaching it means crossing the rows below the anchor, and an instant close
 * would kill the sub-menu mid-move (DEV-66).
 */
const SUB_MENU_HOVER_DELAY = 300;

/**
 * Type guard that checks whether the provided value has a readable `name` property.
 *
 * @param {unknown} value Value to inspect.
 * @returns {boolean} `true` when the value is an object with a `name` property.
 */
function hasName(value: unknown): value is { name: unknown } {
  return typeof value === 'object' && value !== null && 'name' in value;
}

/**
 * Returns the current bounding rectangle of the element the menu is anchored to,
 * or `null` when the anchor is not rendered anymore (scrolled out of the viewport).
 */
export type MenuAnchorRectProvider = () => DOMRect | null;

interface MenuOptions {
  // eslint-disable-next-line no-use-before-define
  parent: Menu | null;
  name: string | null;
  className: string;
  keepInViewport: boolean;
  standalone: boolean;
  minWidth: number;
  container: HTMLElement;
}

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
 * Where a menu is in its open/close cycle: `closed` -> `opening` -> `opened` -> `closing` -> `closed`.
 */
type MenuLifecycle = 'closed' | 'opening' | 'opened' | 'closing';

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
  declare options: MenuOptions;
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
  origOutsideClickDeselects: GridSettings['outsideClickDeselects'] = undefined;
  /**
   * Registers a local hook listener scoped to this instance. Provided by the `localHooks` mixin.
   */
  declare addLocalHook: (key: string, callback: Function) => object;
  /**
   * Executes all local hook listeners registered under the given name. Provided by the `localHooks` mixin.
   */
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  /**
   * Removes all local hook listeners and returns this instance. Provided by the `localHooks` mixin.
   */
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
   * Where the menu is in its open/close cycle. `isOpened()` and `isClosed()` read this and nothing
   * else - never `hotMenu`, which is assigned partway through opening and cleared partway through
   * closing, so it said "open" about a menu that could not be driven yet (DEV-41).
   *
   * @type {string}
   */
  #lifecycle: MenuLifecycle = 'closed';
  /**
   * Set by `destroy()`. A build already in flight stops instead of finishing into a menu that
   * nothing holds any more.
   */
  #isDestroyed = false;
  /**
   * The host grid's theme hook. Kept so `destroy()` can take it off the grid again - a sub-menu is
   * built and destroyed on every hover, and each one adds its own.
   */
  #onAfterSetTheme: (themeName: string, firstRun: boolean) => void;
  /**
   * The border width of the table used in the menu.
   *
   * @type {number}
   */
  #tableBorderWidth: number | undefined;
  /**
   * Provides the current anchor rectangle for scroll-follow repositioning, or `null`
   * when the anchor is no longer rendered. Set through `setPosition()`.
   *
   * @type {Function|null}
   */
  #anchorRectProvider: MenuAnchorRectProvider | null = null;
  /**
   * Position baseline captured when the menu is positioned: the offset between the
   * menu's document coordinates and its anchor (or the grid root when no anchor
   * provider is available). Used to keep the menu attached while outside elements scroll.
   *
   * @type {object|null}
   */
  #scrollFollowBaseline: { offsetLeft: number; offsetTop: number } | null = null;
  /**
   * When `true`, `afterOnCellMouseOver` ignores the hover instead of opening/closing a
   * sub-menu. Armed for a couple of animation frames right after `#followAnchor` moves
   * the menu: repositioning a menu item out from under a stationary mouse cursor makes
   * the browser recompute `:hover` and fire `mouseout`/`mouseover` on the next frame(s)
   * with NO real pointer movement involved — left unguarded, that spurious hover would
   * toggle sub-menus as if the user had moved the mouse (#12719).
   *
   * @type {boolean}
   */
  #suppressHoverSubMenuToggle = false;
  /**
   * The identifier of the latest pending animation frame request that lifts
   * `#suppressHoverSubMenuToggle`, so a new repositioning can cancel and re-arm the
   * window instead of having it cut short by an earlier one (continuous scrolling
   * repositions the menu on every scroll event).
   *
   * @type {number|null}
   */
  #suppressHoverSubMenuToggleFrameId: number | null = null;
  /**
   * The pending hover-driven sub-menu switch. While a sub-menu is open, hovering another
   * row schedules the switch instead of performing it at once, so the pointer can travel
   * across those rows on its way to the open sub-menu without killing it (DEV-66).
   *
   * @type {number|null}
   */
  #subMenuSwitchTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * The debounced hover-driven sub-menu open, kept as a field so it can be canceled when
   * the pointer leaves the menu. Assigned in `open()`.
   *
   * @type {Function|null}
   */
  #delayedOpenSubMenu: (((...args: unknown[]) => unknown) & { cancel: () => void }) | null = null;
  /**
   * Detach functions for the document `scroll` listeners active while the menu is open.
   * Scroll listeners are registered in `open()` (not in the constructor) so that they
   * fire in menu OPEN order: a menu whose anchor lives inside another menu's container
   * (a sub-menu, or the filters condition select menu inside the dropdown menu) always
   * opens after that menu, so its `#followAnchor` runs after the anchor has been moved.
   * Construction order gives no such guarantee — e.g. `updateSettings` recreates the
   * dropdown menu while the condition select menu is long-lived (#13168).
   *
   * @type {Function[]}
   */
  #detachScrollListeners: Array<() => void> = [];

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
  constructor(hotInstance: HotInstance, options?: Partial<MenuOptions>) {
    this.hot = hotInstance;
    this.options = {
      parent: null,
      name: null,
      className: '',
      keepInViewport: true,
      standalone: false,
      minWidth: MIN_WIDTH,
      container: this.hot.rootPortalElement,
      ...options,
    };
    this.container = this.createContainer(this.options.name);
    this.positioner = new Positioner(this.options.keepInViewport);
    this.parentMenu = this.options.parent || null;

    this.eventManager = new EventManager(this);

    this.registerEvents();

    if (this.isSubMenu()) {
      this.addLocalHook('afterSelectionChange',
        (...args: unknown[]) => this.parentMenu!.runLocalHooks('afterSelectionChange', ...args));
    }

    this.#onAfterSetTheme = (themeName: string, firstRun: boolean) => {
      if (this.options.container !== this.hot.rootPortalElement) {
        const menuContainer = this.options.container;

        removeClass(menuContainer, /ht-theme-.*/g);
        addClass(menuContainer, themeName);
      }

      if (!firstRun) {
        this.close();
      }
    };

    this.hot.addHook('afterSetTheme', this.#onAfterSetTheme);
  }

  /**
   * Register event listeners.
   *
   * @private
   */
  registerEvents() {
    let frame: Window | null = this.hot.rootWindow;

    while (frame) {
      this.eventManager.addEventListener(frame.document, 'mousedown', event => this.onDocumentMouseDown(event));
      this.eventManager.addEventListener(frame.document, 'touchstart', event => this.onDocumentMouseDown(event));
      this.eventManager.addEventListener(frame.document, 'contextmenu', event => this.onDocumentContextMenu(event));

      frame = getParentWindow(frame);
    }

    // Once the pointer is off the menu, no row is being hovered any more, so neither a
    // pending open nor a pending switch reflects what the user is doing. This also covers
    // the sub-menu items that hang BELOW the parent menu: reaching them means leaving the
    // menu and crossing the grid, and without this the switch armed by the last crossed
    // row would still fire and close the sub-menu (DEV-66). A sub-menu container is a
    // SIBLING of this one in the portal, not a descendant, so moving into a sub-menu leaves
    // this container and cancels here too — nothing extra is needed on the sub-menu itself.
    // `mouseleave` (not `mouseout`) on purpose — `mouseout` also fires when moving between
    // rows inside the menu, which is exactly when the timers must survive.
    this.eventManager.addEventListener(this.container, 'mouseleave', () => {
      // Repositioning the menu under a stationary cursor makes the browser recompute `:hover`
      // and dispatch pointer events with no real movement involved (#12719) — the same reason
      // the two hover guards above exist. A scroll that slides the menu out from under the
      // pointer must not cancel a sub-menu the user is still waiting for.
      if (this.#suppressHoverSubMenuToggle) {
        return;
      }

      this.#clearHoverSubMenuTimers();
    });
  }

  /**
   * Registers the document `scroll` listeners (capture phase, all parent frames) that
   * keep the menu attached to its anchor. Called from `open()` — see
   * `#detachScrollListeners` for why the registration is open-scoped.
   */
  #registerScrollListeners() {
    this.#clearScrollListeners();

    let frame: Window | null = this.hot.rootWindow;

    while (frame) {
      this.#detachScrollListeners.push(
        this.eventManager.addEventListener(frame.document, 'scroll',
          event => this.onDocumentScroll(event), { capture: true, passive: true }),
      );

      frame = getParentWindow(frame);
    }
  }

  /**
   * Removes the document `scroll` listeners registered by `#registerScrollListeners()`.
   */
  #clearScrollListeners() {
    this.#detachScrollListeners.forEach(detach => detach());
    this.#detachScrollListeners.length = 0;
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
    if (!this.hasSelectedItem()) {
      return null;
    }

    const rowIndex = this.hotMenu!.getSelectedActive()![0];

    return this.#getSourceDataAtRow<Record<string, unknown>>(rowIndex);
  }

  /**
   * Returns the position (row index) of the menu item identified by the provided `key` within the
   * currently rendered menu. Before rendering, `filterSeparators()` and the hidden-item filter run
   * over `menuItems`, so the rendered list can differ from the raw `menuItems` collection - callers
   * that need an index matching the rendered rows must use this method instead of reading
   * `menuItems` directly. Falls back to `menuItems` when the menu has not been rendered yet.
   *
   * @param {string} key The menu item key to look up.
   * @returns {number} The item row index, or `-1` when the item is not found.
   */
  getItemPositionByKey(key: string): number {
    const items = (this.hotMenu?.getSourceData() ?? this.menuItems ?? []) as unknown as { key?: string }[];

    return items.findIndex(item => item.key === key);
  }

  /**
   * Returns the source data at the provided row index typed as `T`.
   *
   * @param {number} row Row index.
   * @returns {T | null} The source data entry or `null` when the row is not available.
   */
  #getSourceDataAtRow<T extends Record<string, unknown>>(row: number): T | null {
    const data = this.hotMenu?.getSourceDataAtRow(row);

    return data ? data as T : null;
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
   * Does nothing unless the menu is closed. Called while it is open, or re-entered from an item
   * callback while it is opening or from a hook while it is closing, it would build a second menu
   * grid over the first.
   *
   * @fires Hooks#beforeContextMenuShow
   * @fires Hooks#afterContextMenuShow
   */
  open() {
    if (!this.isClosed()) {
      return;
    }

    this.#lifecycle = 'opening';

    try {
      this.#open();
    } finally {
      // `#open()` sets `opened` in one place only, once the menu can be driven. Every other exit -
      // the empty-items return, a throw from an item callback or from the menu grid, or anything
      // added later - arrives here still `opening`, so the menu cannot be left claiming to be open.
      if (this.#lifecycle === 'opening') {
        this.#lifecycle = 'closed';
      }
    }
  }

  /**
   * Builds and shows the menu. Only {@link Menu#open} calls this; it owns the lifecycle around it.
   */
  #open() {
    this.runLocalHooks('beforeOpen');

    this.#delayedOpenSubMenu = debounce(
      (...args: unknown[]) => this.openSubMenu(args[0] as number),
      SUB_MENU_HOVER_DELAY,
    );
    const minWidthOfMenu = (Number(this.options.minWidth) || MIN_WIDTH);
    let noItemsDefined = false;

    let filteredItems = arrayFilter<Record<string, unknown>>(this.menuItems!, (item) => {
      if (item.key === NO_ITEMS) {
        noItemsDefined = true;
      }

      return isItemHidden(item, this.hot);
    });

    if (filteredItems.length < 1 && !noItemsDefined) {
      filteredItems.push(predefinedItems()[NO_ITEMS]);

    } else if (filteredItems.length === 0) {
      return;
    }

    // Filtering the items ran application code too - each item's `hidden()` - and it can destroy this
    // menu, by switching the plugin off, replacing its settings, or destroying the grid. Checked
    // before the settings below are built, because building them reads the host grid, which throws
    // once that grid is gone. Nothing has been acquired yet, so there is nothing to release either.
    if (this.#isDestroyed) {
      return;
    }

    filteredItems = filterSeparators(filteredItems);

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
        const item = this.#getSourceDataAtRow<MenuItemConfig>(visualRowIndex);

        return item && item.name === SEPARATOR ? 1 : rowHeight;
      },
      beforeRefreshDimensions: () => false,
      beforeOnCellMouseOver: (event: MouseEvent, coords: { row: number; col: number }) => {
        // See the matching guard in `afterOnCellMouseOver` below — keeps the keyboard
        // (PageUp/PageDown) page-cursor base row from silently drifting to whatever row
        // the spurious hover lands on.
        if (this.#suppressHoverSubMenuToggle) {
          return;
        }

        this.#navigator!.setPageCursorAt(coords.row);
      },
      afterOnCellMouseOver: (event: MouseEvent, coords: { row: number; col: number }) => {
        // Dropped, not deferred: a genuine hover that lands on a new row while this
        // window is armed gets no submenu toggle at all — the user has to cross another
        // row boundary (a fresh `mouseover`) for the hover to register. Rare in practice
        // (the window is 2 frames) and preferable to replaying a possibly-stale coords.row
        // once the window closes.
        if (this.#suppressHoverSubMenuToggle) {
          return;
        }

        if (this.isAllSubMenusClosed()) {
          // The two timers are alternatives, never both in flight: a switch left armed by an
          // earlier hover would fire after this open and replace the sub-menu the pointer is
          // resting on.
          this.#clearSubMenuSwitchTimer();
          this.#delayedOpenSubMenu!(coords.row);

          return;
        }

        // Back on the row whose sub-menu is open — drop any pending switch. Without this the
        // hover would close and immediately recreate the sub-menu the pointer is already heading
        // for, which reads as a flash.
        // Asked of the sub-menu itself rather than of a remembered row index: `hotSubMenus` keeps
        // its entry after Escape or ArrowLeft (those call `close()` on the sub-menu, not
        // `closeSubMenu()` here), so a remembered index would still name this row and the early
        // return would leave the anchor permanently unresponsive to the mouse. `isOpened()` is
        // false there, so the hover falls through to the switch below, which reopens it.
        if (this.#isSubMenuOpenAtRow(coords.row)) {
          this.#clearSubMenuSwitchTimer();

          return;
        }

        this.#scheduleSubMenuSwitch(coords.row);
      },
      afterOnCellContextMenu: (event: MouseEvent) => {
        event.preventDefault();

        // On the Windows platform, the "contextmenu" is triggered after the "mouseup" so that's
        // why the closing menu is here. (#6507#issuecomment-582392301).
        if (isWindowsOS() && shouldAutoCloseMenu && this.hasSelectedItem()) {
          this.close(true);
        }
      },
      afterSelection: (
        row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }
      ) => {
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
          if (isMobileOrIpadOS()) {
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

    // Everything this menu takes hold of is acquired from here on, and `#rollbackFailedOpen()`
    // releases all of it on a throw: the HOST grid's `outsideClickDeselects`, the visible container,
    // the document scroll listeners and the menu grid. Acquiring anything above this line leaks it
    // instead, because `close()` bails unless the menu is open. Painting the items runs application
    // code again - `name()`, `disabled()`, `checked()` and `ariaLabel()` - and the menu still cannot
    // be stranded "open" (DEV-41): that is set only at the commit point below.
    try {
      this.origOutsideClickDeselects = this.hot.getSettings().outsideClickDeselects;
      this.hot.getSettings().outsideClickDeselects = false;

      // Shown only once the item list is settled. Above this line the menu can still bail - the
      // empty-items return, or a throw from an item's own `hidden()` callback inside the filter -
      // and either used to leave an empty, themed box sitting over the page. It still has to happen
      // before `hotMenu.init()` below, because `updateMenuDimensions()` measures the rendered rows
      // and a `display: none` container measures as zero.
      this.container.removeAttribute('style');
      this.container.style.display = 'block';

      // Registered per-open (and after the empty-items early return, which would leak
      // them) so that scroll listeners fire in menu open order — a menu anchored inside
      // another menu then always repositions AFTER its anchor was moved.
      this.#registerScrollListeners();

      this.hotMenu = new (
        this.hot.constructor as new (element: HTMLElement, settings: object) => HotInstance
      )(this.container, settings);
      this.hotMenu.addHook('afterInit', () => this.onAfterInit());
      this.hotMenu.init();

      this.#navigator = createMenuNavigator(this.hotMenu as unknown as Record<string, Function>);
      this.#shortcutsCtrl = createKeyboardShortcutsCtrl(this);
      this.#shortcutsCtrl.listen();
    } catch (error) {
      this.#rollbackFailedOpen();

      // The menu is consistent again, but the caller's own bug still has to reach them.
      throw error;
    }

    // Painting the grid above ran application code once more, and it can destroy this menu the same
    // way. Committing now would leave a menu that reports itself open, holds the keyboard and keeps
    // the host grid's `outsideClickDeselects` switched off, with nothing left that could close it.
    if (this.#isDestroyed) {
      this.#rollbackFailedOpen();

      return;
    }

    // The commit point. From here the menu grid, the navigator and the keyboard controller all
    // exist - exactly what `isOpened()` promises its callers.
    this.#lifecycle = 'opened';

    this.focus();

    if (this.isSubMenu()) {
      this.addLocalHook('afterOpen', () => this.parentMenu!.runLocalHooks('afterSubmenuOpen', this));
    }

    this.runLocalHooks('afterOpen', this);
  }

  /**
   * Releases what {@link Menu#open} acquired before it failed partway through.
   *
   * This is resource cleanup, not what keeps the menu from being stranded "open" - the lifecycle in
   * `open()` guarantees that on its own - so a release missed here leaks instead of breaking the
   * page. Still mirror every new side effect of `#open()` in it. No sub-menu or hover timer exists
   * yet and `setPosition()` has not run, but the container is visible and the document scroll
   * listeners are registered, and `close()` cannot undo either, because it bails unless the menu
   * is open.
   *
   * `afterClose` IS fired, even though `afterOpen` never was. The callers have already announced
   * the menu: `DropdownMenu#open()` runs `beforeDropdownMenuShow` and `ContextMenu#open()` runs
   * `beforeContextMenuShow` before reaching here, so staying silent would leave an application
   * that tracks the documented before/after pair stuck in the "menu showing" state for good. The
   * three listeners on this hook only restore focus and emit the matching `*Hide` hook, which is
   * exactly what a failed open needs. They find the menu closed, as they do after `close()`.
   */
  #rollbackFailedOpen() {
    const menuGrid = this.hotMenu;

    // First, and it must stay throw-free: the menu is back to `closed` before anything else is
    // tried, and a throw here would skip the release below and escape as the caller's error.
    this.#resetToClosed();

    try {
      menuGrid?.destroy();
      this.runLocalHooks('afterClose');
    } catch {
      // Dropped on purpose. `open()` rethrows the error that started this rollback, and that one is
      // the application's own bug. A second failure here - a grid that cannot tear down after a
      // failed init, or a throwing `after*Hide` listener - would replace it, and the real cause
      // would never reach the caller or Sentry.
    }
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
      // Set before the teardown, which runs sub-menu and grid hooks: a `close()` or `open()`
      // re-entered from one of them finds a menu neither open nor closed, and does nothing.
      this.#lifecycle = 'closing';

      try {
        // Safe because `isOpened()` passed: `opened` is set only after the navigator exists.
        this.#navigator!.clear();
        this.closeAllSubMenus();
        this.hotMenu!.destroy();
      } finally {
        // The menu's own state returns to `closed` whatever happened above, so it can never be
        // stranded mid-transition - that is the DEV-41 fix. Every line in the `try` runs
        // application code (clearing the navigator deselects through the grid's hooks, sub-menu
        // teardown destroys grids), and an error from it propagates, exactly as it does everywhere
        // else in the grid.
        this.#resetToClosed();
      }

      this.runLocalHooks('afterClose');
      this.#returnToParentMenu();
    }
  }

  /**
   * Returns the menu's own state to closed once its grid is gone. Plain resets only, so it runs to
   * the end even when the teardown before it threw.
   */
  #resetToClosed() {
    this.hotMenu = null;
    this.#lifecycle = 'closed';
    this.container.style.display = 'none';
    // Emptied rather than assumed empty. A teardown that threw before `hotMenu.destroy()` leaves
    // the old grid's DOM behind, and the next open would build a second grid on top of it.
    empty(this.container);
    this.#anchorRectProvider = null;
    this.#scrollFollowBaseline = null;
    this.#clearScrollListeners();

    if (this.#suppressHoverSubMenuToggleFrameId !== null) {
      this.hot.rootWindow.cancelAnimationFrame(this.#suppressHoverSubMenuToggleFrameId);
      this.#suppressHoverSubMenuToggleFrameId = null;
    }

    this.#suppressHoverSubMenuToggle = false;
    // A timer that outlives the menu would call `openSubMenu` on a destroyed `hotMenu`.
    this.#clearHoverSubMenuTimers();

    // Skipped once the host is gone: its methods throw by then, and there is no setting left to
    // restore. Without the guard this reset throws on the way out of a failed open, and that error
    // replaces the application's own - the one `open()` exists to rethrow. `destroy()` guards the
    // host the same way.
    if (!this.hot.isDestroyed) {
      this.hot.getSettings().outsideClickDeselects = this.origOutsideClickDeselects;
    }
  }

  /**
   * After a sub-menu closes, marks its anchor row collapsed and hands the keyboard back to the
   * parent menu. Does nothing for a top-level menu.
   */
  #returnToParentMenu() {
    if (!this.isSubMenu()) {
      return;
    }

    if (this.hot.getSettings().ariaTags) {
      const selection = this.parentMenu!.hotMenu!.getSelectedActive();

      if (selection) {
        const cell = this.parentMenu!.hotMenu!.getCell(selection[0], 0);

        if (cell) {
          setAttribute(cell, [
            A11Y_EXPANDED(false),
          ]);
        }
      }
    }

    this.parentMenu!.hotMenu!.listen();
  }

  /**
   * Schedules a hover-driven sub-menu switch for the given row, replacing any pending one.
   * The switch is what closes the currently open sub-menu, so delaying it is what lets the
   * pointer cross the rows between the anchor and the sub-menu (DEV-66).
   *
   * @param {number} row Row index the pointer is hovering.
   */
  #scheduleSubMenuSwitch(row: number) {
    // Both timers, for the same reason the open path clears the switch: they are alternatives.
    this.#clearHoverSubMenuTimers();

    // `_registerTimeout` so the handle is cleared if the grid is destroyed with the menu open.
    // It is the convention here, and the cost is known: `hot.timeouts` only grows, so canceling
    // leaves a dead handle behind and hovering across menu rows adds one each time. They are
    // integers on an array freed with the instance. The alternative — a generation token and a
    // timer that fires and no-ops — trades that for more state and a callback that still runs.
    this.#subMenuSwitchTimer = this.hot._registerTimeout(() => {
      this.#subMenuSwitchTimer = null;
      this.openSubMenu(row);
    }, SUB_MENU_HOVER_DELAY) as ReturnType<typeof setTimeout>;
  }

  /**
   * Whether the row's own sub-menu is currently open on screen.
   *
   * Read from the sub-menu rather than from a remembered row index, because `hotSubMenus` holds
   * an entry until something destroys it and the Escape and ArrowLeft shortcuts close a sub-menu
   * without going through `closeSubMenu()`. A remembered index would go on naming a row whose
   * sub-menu is already gone.
   *
   * @param {number} row Row index to test.
   * @returns {boolean}
   */
  #isSubMenuOpenAtRow(row: number) {
    const key = this.#getSourceDataAtRow<MenuItemConfig>(row)?.key;

    return !!key && !!this.hotSubMenus[key]?.isOpened();
  }

  /**
   * Drops a pending sub-menu switch, leaving the open sub-menu as it is.
   */
  #clearSubMenuSwitchTimer() {
    if (this.#subMenuSwitchTimer !== null) {
      clearTimeout(this.#subMenuSwitchTimer);
      this.#subMenuSwitchTimer = null;
    }
  }

  /**
   * Drops both hover timers. Called when the pointer leaves the menu and when it enters an
   * open sub-menu — in both cases the hover that armed them is no longer what the user is
   * doing, so neither an open nor a switch should still be on its way.
   */
  #clearHoverSubMenuTimers() {
    this.#clearSubMenuSwitchTimer();
    this.#delayedOpenSubMenu?.cancel();
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

    // Opening a sub-menu — from the keyboard, or because a hover timer just fired — settles what
    // the hover timers were still deciding, so neither may outlive it. The keyboard is the case
    // that matters: hovering does not move the menu selection, so the pointer can be resting on
    // another row (with its switch armed) while ArrowRight or Enter opens the selected row's
    // sub-menu. Left armed, that switch fires 300ms later and tears down what the key just opened.
    this.#clearHoverSubMenuTimers();

    const cell = this.hotMenu.getCell(row, 0);

    this.closeAllSubMenus();

    if (!cell || !hasSubMenu(cell)) {
      return false;
    }

    const dataItem = this.#getSourceDataAtRow<MenuItemConfig>(row)!;
    const subMenu = new Menu(this.hot, {
      parent: this,
      name: typeof dataItem.name === 'function' ? dataItem.name.call(this.hot) : dataItem.name,
      className: this.options.className,
      keepInViewport: true,
      container: this.options.container,
    });

    subMenu.setMenuItems(dataItem.submenu!.items);

    try {
      subMenu.open();
      subMenu.setPosition(
        cell.getBoundingClientRect(),
        () => (cell.isConnected ? cell.getBoundingClientRect() : null),
      );
    } catch (error) {
      // `hotSubMenus` is only assigned below, so a sub-menu that throws while opening is
      // unreachable from `closeAllSubMenus()` and from `destroy()` - nothing would ever tear it
      // down, and its `document` listeners and portal container would outlive the grid. Every
      // hover that reaches the row tries again, so each attempt would leak another set.
      try {
        subMenu.destroy();
      } catch {
        // The open error below is the application's own bug; a failed teardown must not replace it.
      }

      throw error;
    }

    this.hotSubMenus[dataItem.key!] = subMenu;

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
    const dataItem = this.#getSourceDataAtRow<MenuItemConfig>(row)!;
    const menus = this.hotSubMenus[dataItem.key!];

    if (menus) {
      // The parent's own bookkeeping comes first: the sub-menu's teardown runs grid hooks and can
      // throw, and it must not leave a destroyed menu registered here.
      delete this.hotSubMenus[dataItem.key!];

      const cell = this.hotMenu!.getCell(row, 0);

      // Update the accessibility tags on the cell being the base for the submenu.
      if (cell && this.hot.getSettings().ariaTags) {
        setAttribute(cell, [
          A11Y_EXPANDED(false),
        ]);
      }

      menus.destroy();
    }
  }

  /**
   * Closes every open sub menu. A throw from one stops the rest and reaches the caller, as every
   * other teardown here does.
   */
  closeAllSubMenus() {
    arrayEach(this.hotMenu!.getData(), (value: unknown, row: number) => {
      this.closeSubMenu(row);
    });
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
      this.hotMenu!.listen();
    }
  }

  /**
   * Destroy instance.
   */
  destroy() {
    const menuContainerParentElement = this.container.parentNode;

    this.#isDestroyed = true;

    try {
      // A menu destroyed mid-build still owes its callers the other half of the pair: they ran
      // `before*Show` before `open()` reached here, and `close()` below is a no-op while the menu is
      // opening, so nothing else fires it. Without this the application stays in its "menu showing"
      // state for good, and never gets the focus back.
      if (this.#lifecycle === 'opening') {
        this.runLocalHooks('afterClose');
      }

      this.clearLocalHooks();
      this.close();
    } finally {
      // Released whatever happened above. These document listeners are what carried the DEV-41
      // crash onto the next page of an SPA, and the theme hook holds this menu on the host grid.
      if (!this.hot.isDestroyed) {
        this.hot.removeHook('afterSetTheme', this.#onAfterSetTheme);
      }

      this.parentMenu = null;
      this.eventManager.destroy();

      if (menuContainerParentElement) {
        menuContainerParentElement.removeChild(this.container);
      }
    }
  }

  /**
   * Checks if the menu is open and can be driven.
   *
   * `true` from the moment `open()` finishes building the menu - its grid, navigator and keyboard
   * controller all exist - until `close()` starts tearing it down. `false` while it is still being
   * built, which is when its items are first painted and their callbacks first run (DEV-41).
   *
   * @returns {boolean} Returns `true` if menu was opened.
   */
  isOpened() {
    return this.#lifecycle === 'opened';
  }

  /**
   * Checks if the menu is closed, with no menu grid in play.
   *
   * Not the opposite of {@link Menu#isOpened}: while the menu is opening or closing, both are
   * `false`. Ask this before starting another `open()`; ask `isOpened()` before driving the menu.
   *
   * @returns {boolean} Returns `true` if the menu is closed.
   */
  isClosed() {
    return this.#lifecycle === 'closed';
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
   * @param {Function} [anchorRectProvider] Returns the current anchor rectangle for
   * scroll-follow repositioning, or `null` when the anchor is no longer rendered.
   */
  setPosition(coords: Event | DOMRect | Record<string, unknown>, anchorRectProvider?: MenuAnchorRectProvider) {
    if (this.isSubMenu()) {
      this.positioner.setParentElement(this.parentMenu!.container);
    }

    this.positioner
      .setElement(this.container)
      .updatePosition(coords);

    this.#anchorRectProvider = anchorRectProvider ?? null;
    this.#captureScrollFollowBaseline();
  }

  /**
   * Captures the offset between the menu's measured document position and its anchor's
   * (or the grid root element's, when no anchor provider is set). Both sides are
   * MEASURED rects — never `style.left/top`, which are not document coordinates when
   * the menu lives in a custom `uiContainer` with its own containing block. The offset
   * stays constant while outside elements scroll; repositioning restores it.
   */
  #captureScrollFollowBaseline() {
    const menuRect = this.container.getBoundingClientRect();
    const anchorRect = this.#anchorRectProvider?.() ?? this.hot.rootElement.getBoundingClientRect();

    this.#scrollFollowBaseline = {
      offsetLeft: menuRect.left - anchorRect.left,
      offsetTop: menuRect.top - anchorRect.top,
    };
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

    const realHeight = arrayReduce<unknown[] | object, number>(data ?? [],
      (accumulator, value, index) => {
        const itemCell = this.hotMenu!.getCell(index, 0);
        const currentRowHeight = itemCell ? outerHeight(itemCell) : 0;
        const isSeparator = hasName(value) && value.name === SEPARATOR;

        return accumulator + (isSeparator ? 1 : currentRowHeight);
      }, 0);

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
  createContainer(name: string | null = null): HTMLElement {
    const menuContainer = this.options.container;
    const doc = menuContainer.ownerDocument;
    let className: string | null = name;
    let container: HTMLElement | null = null;

    if (className) {
      className = className.replace(/[^A-Za-z0-9]/g, '_');
      className = `${this.options.className}Sub_${className}`;

      container = doc.querySelector<HTMLElement>(`.${this.options.className}.${className}`);
    }

    if (!container) {
      container = doc.createElement('div');

      addClass(container, `htMenu handsontable ${this.options.className}`);

      if (className) {
        addClass(container, className);
      }

      menuContainer.appendChild(container);
    }

    return container;
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
    if (this.options.standalone && this.hotMenu && !isChildOf(eventTargetEl(event)!, this.hotMenu.rootElement)) {
      this.close(true);

      // Automatically close menu when clicked element is not belongs to menu or submenu (not necessarily to itself)
    } else if ((this.isAllSubMenusClosed() || this.isSubMenu()) && !isChildOf(eventTargetEl(event)!, '.htMenu')) {
      this.close(true);
    }
  }

  /**
   * Document's scroll listener (capture phase). When an element outside of the menu
   * is scrolled, repositions the menu so it stays visually attached to its anchor
   * (column header, cell, or parent menu item) — the menu is rendered in a portal
   * positioned in document coordinates, so it would otherwise stay stranded (#12719).
   * Closes the menu when the anchor is scrolled out of the rendered viewport.
   * Ignored: page/document scroll (document coordinates already track it), scrolls
   * within the menu, and scrolls of elements that contain the menu (custom
   * `uiContainer` — the menu moves natively with its container).
   *
   * @private
   * @param {Event} event The scroll event object.
   */
  onDocumentScroll(event: Event) {
    if (!this.isOpened() || this.#scrollFollowBaseline === null) {
      return;
    }

    if (!isHTMLElement(event.target) || isChildOf(event.target, '.htMenu')) {
      return;
    }

    this.#followAnchor(event.target);
  }

  /**
   * Repositions the menu to restore its captured offset to the anchor. The correction
   * is computed from MEASURED rects (desired document position minus actual document
   * position) and applied as an increment to the current inline `left`/`top` styles,
   * which keeps the math correct in any containing block (default body portal or a
   * custom `uiContainer`) and makes scrolls the menu already follows natively a no-op.
   * Closes the menu when the anchor provider reports the anchor as no longer rendered,
   * or — when no provider is available — when the scroll happened inside the grid root
   * element (an anchor-less menu cannot track content movement within the grid).
   *
   * @param {HTMLElement} scrolledElement The element whose scroll triggered the update.
   */
  #followAnchor(scrolledElement: HTMLElement) {
    let anchorRect: DOMRect | null;

    if (this.#anchorRectProvider) {
      anchorRect = this.#anchorRectProvider();
    } else if (scrolledElement === this.hot.rootElement || isChildOf(scrolledElement, this.hot.rootElement)) {
      this.close(true);

      return;
    } else {
      anchorRect = this.hot.rootElement.getBoundingClientRect();
    }

    if (anchorRect === null) {
      this.close(true);

      return;
    }

    const { offsetLeft, offsetTop } = this.#scrollFollowBaseline!;
    const menuRect = this.container.getBoundingClientRect();
    const correctionLeft = (anchorRect.left + offsetLeft) - menuRect.left;
    const correctionTop = (anchorRect.top + offsetTop) - menuRect.top;

    if (correctionLeft === 0 && correctionTop === 0) {
      return;
    }

    this.container.style.left = `${(Number.parseFloat(this.container.style.left) || 0) + correctionLeft}px`;
    this.container.style.top = `${(Number.parseFloat(this.container.style.top) || 0) + correctionTop}px`;

    this.#armHoverSuppression();
  }

  /**
   * Arms `#suppressHoverSubMenuToggle` for two animation frames. The browser recomputes
   * `:hover` (and dispatches the resulting `mouseout`/`mouseover`) on a frame AFTER the
   * layout-affecting style change that just moved menu content out from under the
   * pointer, not synchronously with it — one frame is not reliably enough to outlast it.
   * Re-arming cancels a still-pending lift so continuous scrolling keeps the window open.
   */
  #armHoverSuppression() {
    this.#suppressHoverSubMenuToggle = true;

    if (this.#suppressHoverSubMenuToggleFrameId !== null) {
      this.hot.rootWindow.cancelAnimationFrame(this.#suppressHoverSubMenuToggleFrameId);
    }

    this.#suppressHoverSubMenuToggleFrameId = this.hot.rootWindow.requestAnimationFrame(() => {
      this.#suppressHoverSubMenuToggleFrameId = this.hot.rootWindow.requestAnimationFrame(() => {
        this.#suppressHoverSubMenuToggle = false;
        this.#suppressHoverSubMenuToggleFrameId = null;
      });
    });
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

    if (hasClass(eventTargetEl(event)!, 'htCore') && isChildOf(eventTargetEl(event)!, this.hotMenu!.rootElement)) {
      event.preventDefault();
    }
  }
}

mixin(Menu, localHooks);
