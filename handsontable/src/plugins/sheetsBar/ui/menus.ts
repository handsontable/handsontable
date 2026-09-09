import { Menu } from '../../contextMenu/menu';
import { SEPARATOR } from '../../contextMenu/predefinedItems';
import { getDocumentOffsetByElement } from '../../contextMenu/utils';
import { setAttribute, getDeepActiveElement } from '../../../helpers/dom/element';
import { A11Y_LABEL } from '../../../helpers/a11y';
import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';
import type { SheetDescriptor } from '../sheetModel';

/**
 * Callbacks the per-tab menu drives on the plugin.
 */
export interface TabMenuActions {
  remove: (id: number) => void;
  duplicate: (id: number) => void;
  rename: (id: number) => void;
  moveRight: (id: number) => void;
  moveLeft: (id: number) => void;
}

/**
 * Everything the per-tab menu needs to know about the tab it was opened from.
 */
export interface TabMenuOptions {
  sheetId: number;
  sheetName: string;
  selectFirstItem: boolean;
  /**
   * The element the menu hangs from, when that is not the control it was opened from. A sheet
   * tab is the control — it takes the focus and carries the popup semantics — while the menu
   * itself lines up under the trigger glyph inside it.
   */
  positionTarget?: HTMLElement;
  /**
   * Looks the focus target up again when the menu closes. A command can rebuild the tab the menu
   * was opened from — moving a sheet repaints the strip — and a detached node cannot take focus.
   */
  resolveFocusTarget?: () => HTMLElement | null;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canRemove: boolean;
  actions: TabMenuActions;
}

/**
 * A menu item definition, as the shared `Menu` takes it, plus the callback run on selection.
 */
type MenuItem = Record<string, unknown> & { key?: string; callback?: () => void };

/**
 * What one opening of a menu needs to remember until it closes.
 */
interface OpenMenuState {
  anchor: HTMLElement;
  items: MenuItem[];
  resolveFocusTarget?: () => HTMLElement | null;
}

/**
 * Owns the per-tab dropdown and the all-sheets menu, both built on the shared `Menu`
 * component (auto keyboard navigation, viewport-aware positioning).
 *
 * Each menu is one `Menu` instance for the life of the plugin, refilled on every opening. The
 * shared component registers a host hook when it is built and does not remove it when it is
 * destroyed, so building a fresh instance per opening would leave one dead menu behind per
 * click.
 */
export class SheetsBarMenus {
  /**
   * The host Handsontable instance (`Menu` needs it for theming and portals).
   */
  readonly #hot: HotInstance;
  /**
   * The per-tab actions menu, built on first use.
   */
  #tabMenu: Menu | null = null;
  /**
   * The all-sheets menu, built on first use.
   */
  #allSheetsMenu: Menu | null = null;
  /**
   * The menu currently open, with what it was opened from, or `null`.
   */
  #open: { menu: Menu, state: OpenMenuState } | null = null;

  /**
   * Binds the menus to the host instance.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;
  }

  /**
   * Opens the per-tab actions menu below the tab it belongs to.
   *
   * @param {HTMLElement} anchor The control the menu was opened from — the tab, which takes the
   *   focus back when the menu closes.
   * @param {object} options The tab's identity, its move affordances, and the action callbacks.
   */
  openTabMenu(anchor: HTMLElement, options: TabMenuOptions): void {
    const {
      sheetId, sheetName, selectFirstItem, canMoveLeft, canMoveRight, canRemove, actions, positionTarget,
      resolveFocusTarget,
    } = options;
    const t = (key: string) => this.#hot.getTranslatedPhrase(key) as string;
    const menu = this.#tabMenu ?? this.#createMenu();

    this.#tabMenu = menu;

    if (this.#hot.getSettings().ariaTags) {
      setAttribute(menu.container, [
        A11Y_LABEL(this.#hot.getTranslatedPhrase(C.SHEETS_BAR_SHEET_MENU, { name: sheetName }) as string),
      ]);
    }

    this.#openMenu(menu, {
      anchor,
      resolveFocusTarget,
      items: [
        { key: 'sheet_rename', name: () => t(C.SHEETS_BAR_ITEMS_RENAME), callback: () => actions.rename(sheetId) },
        {
          key: 'sheet_duplicate',
          name: () => t(C.SHEETS_BAR_ITEMS_DUPLICATE),
          callback: () => actions.duplicate(sheetId),
        },
        {
          key: 'sheet_delete',
          name: () => t(C.SHEETS_BAR_ITEMS_DELETE),
          disabled: !canRemove,
          callback: () => actions.remove(sheetId),
        },
        { name: SEPARATOR },
        {
          key: 'sheet_move_left',
          name: () => t(C.SHEETS_BAR_ITEMS_MOVE_LEFT),
          disabled: !canMoveLeft,
          callback: () => actions.moveLeft(sheetId),
        },
        {
          key: 'sheet_move_right',
          name: () => t(C.SHEETS_BAR_ITEMS_MOVE_RIGHT),
          disabled: !canMoveRight,
          callback: () => actions.moveRight(sheetId),
        },
      ],
    }, selectFirstItem, positionTarget);
  }

  /**
   * Opens the all-sheets list anchored below the `≡` control.
   */
  openAllSheetsMenu(
    anchor: HTMLElement,
    sheets: SheetDescriptor[],
    onSelect: (id: number) => void,
    selectFirstItem: boolean,
  ): void {
    const menu = this.#allSheetsMenu ?? this.#createMenu();

    this.#allSheetsMenu = menu;

    // A checkable item is what tells a screen reader which sheet is the one in front of the
    // user: the row is a `menuitemcheckbox` named by the sheet and checked for the active one.
    this.#openMenu(menu, {
      anchor,
      items: sheets.map(sheet => ({
        key: `sheet_${sheet.id}`,
        name: () => sheet.name,
        checkable: true,
        ariaLabel: sheet.name,
        ariaChecked: sheet.isActive,
        renderer: (_menuHot: unknown, wrapper: HTMLElement) =>
          this.#renderSheetName(wrapper, sheet.name, sheet.isActive),
        callback: () => onSelect(sheet.id),
      })),
    }, selectFirstItem);

    this.#revealActiveRow(sheets.findIndex(sheet => sheet.isActive));
  }

  /**
   * Scrolls the open all-sheets menu to the row of the sheet you are on.
   *
   * The list holds the whole workbook and scrolls past eight sheets, so on a large one the
   * marked row can open out of sight — which is the row a reader opens the list to find.
   *
   * @param {number} index The active sheet's row in the menu.
   */
  #revealActiveRow(index: number): void {
    const menuHot = this.#allSheetsMenu?.hotMenu;

    if (index === -1 || !menuHot) {
      return;
    }

    menuHot.scrollViewportTo({ row: index, verticalSnap: 'top' });
  }

  /**
   * Closes the open menu, if any, and destroys both menus.
   */
  destroy(): void {
    this.close();
    this.#tabMenu?.destroy();
    this.#allSheetsMenu?.destroy();
    this.#tabMenu = null;
    this.#allSheetsMenu = null;
  }

  /**
   * Whether one of the menus is open.
   *
   * @returns {boolean} `true` while a menu is open.
   */
  isOpened(): boolean {
    return this.#open !== null;
  }

  /**
   * Closes the menu that is open, if any.
   */
  close(): void {
    this.#open?.menu.close();
  }

  /**
   * Builds one of the two menus and wires its two hooks once: selecting an item runs the
   * callback of whichever items the menu holds at the time, and closing hands the focus back to
   * whatever the menu was last opened from.
   *
   * @returns {Menu} The menu, closed and empty.
   */
  #createMenu(): Menu {
    const menu = new Menu(this.#hot, {
      className: 'htSheetsBarMenu',
      keepInViewport: true,
      standalone: true,
      container: this.#hot.rootPortalElement,
    });

    menu.addLocalHook('executeCommand', (key: string) => {
      this.#open?.state.items.find(item => item.key === key)?.callback?.();
    });
    menu.addLocalHook('afterClose', () => {
      const open = this.#open;

      if (!open || open.menu !== menu) {
        return;
      }

      this.#open = null;

      if (open.state.anchor.isConnected && this.#hot.getSettings().ariaTags) {
        open.state.anchor.setAttribute('aria-expanded', 'false');
      }

      this.#hot.listen();
      this.#restoreFocus(open.state.resolveFocusTarget?.() ?? open.state.anchor, menu);
    });

    return menu;
  }

  /**
   * Fills a menu with items and opens it below the anchor element, closing whichever menu was
   * open first.
   *
   * @param {Menu} menu The menu to open.
   * @param {object} state What the menu was opened from and with.
   * @param {boolean} selectFirstItem Whether to move the menu navigator onto the first item.
   * @param {HTMLElement} [positionTarget] The element the menu lines up under, when that is not
   *   the control it was opened from.
   */
  #openMenu(
    menu: Menu,
    state: OpenMenuState,
    selectFirstItem: boolean,
    positionTarget: HTMLElement = state.anchor,
  ): void {
    this.close();

    this.#open = { menu, state };
    menu.setMenuItems(state.items);

    if (this.#hot.getSettings().ariaTags) {
      state.anchor.setAttribute('aria-expanded', 'true');
    }

    const offset = getDocumentOffsetByElement(menu.container, this.#hot.rootDocument);
    const rect = positionTarget.getBoundingClientRect();

    menu.open();
    // A 4px gap on both sides of the anchor. Below, the positioner adds one pixel of its own.
    // Above, it aligns the menu's bottom to the cursor point — the anchor's bottom edge — so
    // without the anchor-height correction a menu flipping upward covered its own trigger
    // (UX review). The correction is clamped to what the viewport has: the positioner accepts
    // a flip whenever the menu alone fits above the anchor's bottom edge, so an uncapped lift
    // of anchor-height-plus-gap could push the first items off-screen. In that squeeze the
    // menu pins to the viewport top instead — measured after `open()`, which is what renders
    // the menu at its real height.
    menu.setOffset('below', 3);
    menu.setOffset('above', Math.max(-(rect.height + 4), (menu.container?.offsetHeight ?? 0) - rect.bottom));
    menu.setPosition(
      { left: rect.left + offset.left, top: rect.bottom + offset.top },
      () => (positionTarget.isConnected ? positionTarget.getBoundingClientRect() : null),
    );

    // Only a keyboard opening preselects an item, which is what the header's menu button does
    // too. The selection is what a screen reader announces and what keeps Escape working, so a
    // keyboard user needs it — while for a pointer user it just leaves a row looking pressed
    // that they never asked for.
    if (selectFirstItem) {
      menu.getNavigator()?.toFirstItem();
    }
  }

  /**
   * Hands focus back to the button the menu was opened from, which is what a menu button owes
   * a keyboard user: dismissing with Escape must not drop them onto the document body with no
   * way back into the bar.
   *
   * It only claims focus that nothing else wanted. A menu command can move focus deliberately —
   * choosing "Rename" opens the inline input and focuses it — and that must win over the
   * restore regardless of which of the two runs first.
   *
   * @param {HTMLElement} anchor The button the menu was opened from.
   * @param {Menu} menu The menu being closed.
   */
  #restoreFocus(anchor: HTMLElement | null, menu: Menu): void {
    if (anchor === null) {
      return;
    }

    // The deep lookup matters in a shadow root, where the raw `activeElement` collapses to the
    // outermost host — which reads as "claimed elsewhere" and would skip every restore there.
    const activeElement = getDeepActiveElement(this.#hot.rootDocument);
    const claimedElsewhere = activeElement !== null
      && activeElement !== this.#hot.rootDocument.body
      && !menu.container?.contains(activeElement);

    if (anchor.isConnected && !claimedElsewhere) {
      anchor.focus({ preventScroll: true });
    }
  }

  /**
   * Writes a sheet's name into the row's item wrapper. Sheet names are user-supplied and can
   * arrive from a persisted or server-supplied workbook, so they go in through `textContent`;
   * the shared `Menu` falls back to `innerHTML` for plain string items whenever the grid has
   * no `sanitizer` configured, which is the default.
   *
   * The name lands inside the wrapper the menu already created rather than in an element of
   * its own beside it, so the row carries the same structure as a plain string item.
   *
   * @param {HTMLElement} wrapper The row's `.htItemWrapper`, supplied by the menu renderer.
   * @param {string} name The sheet name to display.
   * @param {boolean} isActive Whether this row is the sheet currently in front of the user.
   * @returns {HTMLElement} The wrapper, which the menu re-appends to the row.
   */
  #renderSheetName(wrapper: HTMLElement, name: string, isActive: boolean): HTMLElement {
    wrapper.textContent = name;
    wrapper.dir = 'auto';

    if (!isActive) {
      return wrapper;
    }

    // The same mark the context menu puts against a chosen option, and the shared menu styles
    // already draw it for this menu's class — a list of sheets is worth nothing if it does not
    // say which one you are on. The glyph is decoration: the row itself is a checked
    // `menuitemcheckbox`, which is what carries "this is the one" to a screen reader.
    const mark = wrapper.ownerDocument.createElement('span');

    mark.className = 'selected';
    mark.textContent = String.fromCharCode(10003);
    setAttribute(mark, [['aria-hidden', 'true']]);
    wrapper.insertBefore(mark, wrapper.firstChild);

    return wrapper;
  }
}
