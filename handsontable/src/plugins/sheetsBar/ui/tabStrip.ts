import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import * as C from '../../../i18n/constants';
import {
  setAttribute,
  removeAttribute,
  isHTMLElement,
  addClass,
  removeClass,
  getDeepActiveElement,
} from '../../../helpers/dom/element';
import { A11Y_LABEL } from '../../../helpers/a11y';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import type EventManager from '../../../eventManager';
import { TabDrag } from './tabDrag';
import { truncateSheetName } from '../sheetModel';
import type { SheetDescriptor } from '../sheetModel';

/**
 * What the strip needs from the plugin to render.
 */
export interface TabStripOptions {
  /**
   * The strip host element (owned by SheetsBarUI).
   */
  host: HTMLElement;
  /**
   * The bar element, which wears the dragging class for the length of a drag.
   */
  dragRoot: HTMLElement;
  /**
   * The plugin's event manager, for the document-level listeners a drag installs.
   */
  eventManager: EventManager;
  /**
   * Phrase translation callback.
   */
  translate: (key: string, args?: unknown) => string;
  /**
   * Whether the grid emits ARIA attributes (`ariaTags` setting).
   */
  ariaTags: boolean;
  /**
   * Whether the grid runs right-to-left, which mirrors the arrow keys.
   */
  isRtl: boolean;
}

/**
 * Where the focus sat inside the strip before a repaint: the sheet, and its tab's position as
 * a fallback for when the sheet is gone.
 */
interface CapturedFocus {
  sheetId: string;
  index: number;
}

/**
 * Renders the sheet tabs and the inline-rename input. Reports interactions through
 * local hooks; holds no sheet state of its own.
 *
 * The keyboard is left to the plugin's shortcut context: this class exposes what a key does
 * ({@link activateFocusedTab}, {@link focusRelativeTab}, {@link abortDrag}) and the plugin
 * binds the keys, the way every other plugin with a focusable UI does.
 */
export class TabStrip {
  /**
   * Registers a callback for a local hook.
   */
  declare addLocalHook: (hookName: string, callback: Function) => TabStrip;
  /**
   * Runs callbacks of a local hook.
   */
  declare runLocalHooks: (...args: unknown[]) => void;
  /**
   * Clears local hooks.
   */
  declare clearLocalHooks: () => void;
  /**
   * The strip host element (owned by SheetsBarUI).
   */
  readonly #host: HTMLElement;
  /**
   * Phrase translation callback.
   */
  readonly #translate: (key: string, args?: unknown) => string;
  /**
   * Whether ARIA attributes are emitted.
   */
  readonly #ariaTags: boolean;
  /**
   * Whether the strip runs right-to-left.
   */
  readonly #isRtl: boolean;
  /**
   * Drags tabs along the strip and reports where they land.
   */
  readonly #drag: TabDrag;
  /**
   * The sheet the strip last scrolled into view. Repaints that leave the active sheet alone —
   * a rename, a paging click, an overflow refresh — must not pull the strip back to it.
   */
  #revealedId = -1;
  /**
   * Ends the rename in progress without committing it, or `null` when none is in progress. A
   * repaint that replaces the tabs would otherwise take the input away silently.
   */
  #cancelRename: (() => void) | null = null;

  /**
   * Binds the strip to its host element.
   */
  constructor(options: TabStripOptions) {
    this.#host = options.host;
    this.#translate = options.translate;
    this.#ariaTags = options.ariaTags;
    this.#isRtl = options.isRtl;
    this.#drag = new TabDrag(
      { host: options.host, dragRoot: options.dragRoot, eventManager: options.eventManager },
      (id, toIndex) => this.runLocalHooks('tabDragCommit', id, toIndex),
    );
  }

  /**
   * Rebuilds all tab elements from the sheet descriptors. Sheet names render via
   * `textContent` only (XSS-safe).
   */
  render(sheets: SheetDescriptor[]): void {
    this.#drag.abort();
    this.#cancelRename?.();

    const focused = this.#capturedFocus();

    this.#host.textContent = '';

    sheets.forEach((sheet) => {
      this.#host.appendChild(this.#buildTab(sheet));
    });

    this.#restoreFocus(focused);
    this.#revealActiveTab(sheets.find(sheet => sheet.isActive)?.id ?? -1);
  }

  /**
   * Builds one tab: the control, its label, and its menu trigger.
   *
   * The tab is one stop in the tab order, and the whole of it is the control: its label and
   * its menu trigger are decoration inside it rather than controls of their own. That is
   * what lets the two activations mean different things, and it keeps a strip of twenty
   * sheets from costing forty stops on the way past.
   *
   * @param {object} sheet The sheet the tab represents.
   * @returns {HTMLElement} The tab element.
   */
  #buildTab(sheet: SheetDescriptor): HTMLElement {
    const tab = this.#host.ownerDocument.createElement('div');
    const label = this.#host.ownerDocument.createElement('span');
    const chevron = this.#host.ownerDocument.createElement('span');

    tab.className = `ht-sheets-bar__tab${sheet.isActive ? ' ht-sheets-bar__tab--active' : ''}`;
    tab.dataset.sheetId = String(sheet.id);
    tab.tabIndex = 0;

    // Only the active tab advertises the popup: on any other tab an activation moves to that
    // sheet, and a "menu button" that navigates instead would promise the wrong thing.
    this.#setAria(tab, [
      ['role', 'button'],
      ...(sheet.isActive ? [['aria-current', 'true'], ['aria-haspopup', 'menu'], ['aria-expanded', 'false']] : []),
    ]);

    label.className = 'ht-sheets-bar__tab-label';
    label.textContent = sheet.name;
    label.dir = 'auto';

    chevron.className = 'ht-sheets-bar__tab-chevron';

    // Pointer-only: the keyboard route to the same menu is the second activation of the tab,
    // so the glyph is decoration to a screen reader rather than a control it should offer.
    // The tab around it is what advertises the popup and takes the focus back.
    this.#setAria(chevron, [['aria-hidden', 'true']]);

    tab.addEventListener('click', (event) => {
      if (this.#isWithinRenameInput(event)) {
        return;
      }

      // The trigger is on every tab, but it only opens a menu for the sheet you are already
      // on. On any other tab the first click means "come here", and the second — now on the
      // active tab — opens the menu. A menu acts on a sheet, so it waits until that sheet is
      // the one in front of you.
      if (sheet.isActive && this.#isWithinChevron(event)) {
        this.#openMenuFor(sheet, false);

        return;
      }

      this.runLocalHooks('tabClick', sheet.id);
    });
    tab.addEventListener('dblclick', (event) => {
      if (!this.#isWithinRenameInput(event)) {
        this.startRename(sheet.id);
      }
    });
    tab.addEventListener('pointerdown', (event) => {
      if (event.button === 0 && !this.#isWithinRenameInput(event)) {
        this.#drag.start(event, tab, sheet.id);
      }
    });

    // Right-clicking a tab opens the same menu, which is what a spreadsheet user expects.
    // On another sheet it moves there first — the menu acts on a sheet, so it has to be the
    // sheet in front of you. The rename input keeps the browser's own menu; that one is for
    // editing text, not for the sheet. The keyboard raises the same event — Shift+F10, the
    // Menu key — with no button pressed, and then the menu has to open with an item selected.
    tab.addEventListener('contextmenu', (event) => {
      if (this.#isWithinRenameInput(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.#openMenuFor(sheet, event.button !== 2);
    });

    tab.appendChild(label);
    tab.appendChild(chevron);

    return tab;
  }

  /**
   * Runs the activation of the tab that holds the focus: on an inactive sheet it moves there,
   * on the active one it opens the sheet's menu. Bound to <kbd>Enter</kbd> and <kbd>Space</kbd>
   * by the plugin, so a tab answers the keys its `button` role promises.
   *
   * @returns {boolean} `true` when a tab held the focus and was activated.
   */
  activateFocusedTab(): boolean {
    const tab = this.getFocusedTab();

    if (!tab) {
      return false;
    }

    const isActive = tab.classList.contains('ht-sheets-bar__tab--active');
    const sheet = { id: Number(tab.dataset.sheetId), name: '', isActive };

    if (isActive) {
      this.#openMenuFor(sheet, true);
    } else {
      this.runLocalHooks('tabClick', sheet.id);
    }

    return true;
  }

  /**
   * Moves the focus along the strip from the tab that holds it. Bound to the arrow, Home and
   * End keys by the plugin. The arrows follow the reading direction: under RTL the next tab is
   * the one to the left.
   *
   * @param {number|'first'|'last'} step `1` or `-1` for the neighbouring tab in reading order,
   *   or an end of the strip.
   * @returns {boolean} `true` when a tab held the focus and the focus moved.
   */
  focusRelativeTab(step: 1 | -1 | 'first' | 'last'): boolean {
    const tabs = this.#tabs();
    const current = this.getFocusedTab();

    if (!current || tabs.length === 0) {
      return false;
    }

    let index = tabs.indexOf(current);

    if (step === 'first') {
      index = 0;
    } else if (step === 'last') {
      index = tabs.length - 1;
    } else {
      index = Math.min(Math.max(index + step, 0), tabs.length - 1);
    }

    tabs[index].focus();

    return true;
  }

  /**
   * Returns the arrow step that reads as "forward" for the given key name, mirroring the
   * horizontal arrows under RTL.
   *
   * @param {string} key The key name, `ArrowLeft` or `ArrowRight`.
   * @returns {1|-1} The step along the strip's DOM order.
   */
  arrowStep(key: 'ArrowLeft' | 'ArrowRight'): 1 | -1 {
    const forward = key === 'ArrowRight';

    return (forward !== this.#isRtl) ? 1 : -1;
  }

  /**
   * Returns the tab that holds the focus, or `null` when the focus is elsewhere or inside the
   * rename input, which owns its own keys.
   *
   * @returns {HTMLElement|null} The focused tab.
   */
  getFocusedTab(): HTMLElement | null {
    const active = getDeepActiveElement(this.#host.ownerDocument);

    if (!isHTMLElement(active) || !active.classList.contains('ht-sheets-bar__tab')) {
      return null;
    }

    return active;
  }

  /**
   * Whether a tab drag is in progress.
   *
   * @returns {boolean} `true` mid-gesture.
   */
  isDragging(): boolean {
    return this.#drag.isDragging();
  }

  /**
   * Puts the strip back the way it was before the drag in progress, if any.
   */
  abortDrag(): void {
    this.#drag.abort();
  }

  /**
   * Opens a sheet's menu, moving to that sheet first when it is not the active one.
   *
   * The anchor is looked up after the move rather than captured before it: activating a sheet
   * repaints the strip, so the element the gesture started on is no longer in the document.
   *
   * @param {object} sheet The sheet whose menu to open.
   * @param {boolean} fromKeyboard Whether the request came from the keyboard, which decides
   *   whether the menu preselects its first item.
   */
  #openMenuFor(sheet: SheetDescriptor, fromKeyboard: boolean): void {
    if (!sheet.isActive) {
      this.runLocalHooks('tabClick', sheet.id);
    }

    const tab = this.getTab(sheet.id);
    const chevron = tab?.querySelector('.ht-sheets-bar__tab-chevron');

    // The tab is the control the menu belongs to — it is what takes the focus back and what
    // carries `aria-expanded` — while the menu lines up under the trigger glyph inside it.
    if (tab && isHTMLElement(chevron)) {
      this.runLocalHooks('tabMenuClick', sheet.id, tab, fromKeyboard, chevron);
    }
  }

  /**
   * Checks whether an event landed on a tab's menu trigger.
   *
   * @param {Event} event The event to test.
   * @returns {boolean} `true` when the trigger owns it.
   */
  #isWithinChevron(event: Event): boolean {
    const target = event.target;

    return isHTMLElement(target) && target.closest('.ht-sheets-bar__tab-chevron') !== null;
  }

  /**
   * Records which tab inside the strip holds the focus, so a repaint can hand it back.
   *
   * A repaint replaces every tab node, which drops the focus to the document body — activating
   * a sheet from the keyboard would otherwise cost the user their place in the tab order.
   * Focus outside the strip is left alone: a repaint must never pull it in.
   *
   * @returns {object|null} The sheet id and the tab's position, or `null`.
   */
  #capturedFocus(): CapturedFocus | null {
    const active = getDeepActiveElement(this.#host.ownerDocument);

    if (!isHTMLElement(active) || !this.#host.contains(active)) {
      return null;
    }

    const tab = active.closest('[data-sheet-id]');

    if (!isHTMLElement(tab) || tab.dataset.sheetId === undefined) {
      return null;
    }

    return { sheetId: tab.dataset.sheetId, index: this.#tabs().indexOf(tab) };
  }

  /**
   * Puts the focus back on the rebuilt tab that held it — or, when that sheet is gone, on the
   * tab that took its place, and on the last tab when it was the last one. The focus must land
   * somewhere in the strip either way; the document body is not a place to leave a user.
   *
   * @param {object|null} focused What `#capturedFocus()` recorded.
   */
  #restoreFocus(focused: CapturedFocus | null): void {
    if (focused === null) {
      return;
    }

    const tabs = this.#tabs();
    const tab = this.#host.querySelector(`[data-sheet-id="${focused.sheetId}"]`);
    const target = isHTMLElement(tab) ? tab : tabs[Math.min(focused.index, tabs.length - 1)];

    target?.focus();
  }

  /**
   * Scrolls the strip just far enough to bring the active tab fully into view.
   *
   * Every route to a new active sheet — the add button, either menu, the API — ends in a
   * repaint, so doing it here covers them all. Only a repaint that changed which sheet is
   * active scrolls, or paging the strip by hand would be undone by the next render. The scroll
   * is applied to the strip itself rather than through `scrollIntoView()`, which would also
   * scroll the page the grid sits on.
   *
   * @param {number} activeId The active sheet's id, or `-1` when there is none.
   */
  #revealActiveTab(activeId: number): void {
    if (activeId === this.#revealedId) {
      return;
    }

    this.#revealedId = activeId;

    const tab = this.#host.querySelector('.ht-sheets-bar__tab--active');

    if (!isHTMLElement(tab)) {
      return;
    }

    const hostRect = this.#host.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    if (tabRect.left < hostRect.left) {
      this.#host.scrollLeft -= hostRect.left - tabRect.left;
    } else if (tabRect.right > hostRect.right) {
      this.#host.scrollLeft += tabRect.right - hostRect.right;
    }
  }

  /**
   * Swaps a tab label for a rename input. Enter/blur commit, Escape cancels; the
   * commit is reported through the `tabRenameCommit` local hook. Keyboard-driven
   * endings (Enter/Escape) request a focus restore on the rebuilt tab label, while a
   * blur-driven commit keeps the focus where the user just moved it.
   */
  startRename(id: number): void {
    const tab = this.getTab(id);
    const label = tab?.querySelector('.ht-sheets-bar__tab-label') as HTMLElement | null;

    if (!tab || !label) {
      return;
    }

    const input = this.#host.ownerDocument.createElement('input');
    const mirror = this.#host.ownerDocument.createElement('span');
    const tabWidthBeforeEdit = tab.getBoundingClientRect().width;
    let finished = false;
    let widthFloor = 0;
    const finish = (commit: boolean, restoreFocus: boolean) => {
      if (finished) {
        return;
      }
      finished = true;
      this.#cancelRename = null;
      mirror.remove();
      removeClass(tab, 'ht-sheets-bar__tab--renaming');

      if (commit) {
        this.runLocalHooks('tabRenameCommit', id, input.value, restoreFocus);
      } else {
        this.runLocalHooks('tabRenameCancel', id, restoreFocus);
      }
    };

    this.#cancelRename = () => finish(false, false);

    input.className = 'ht-sheets-bar__tab-rename';
    input.value = label.textContent ?? '';
    input.dir = 'auto';
    input.setAttribute('data-hot-input', '');
    setAttribute(input, [A11Y_LABEL(this.#translate(C.SHEETS_BAR_RENAME_SHEET))]);
    input.addEventListener('keydown', (event) => {
      // Mid-composition, Enter and Escape belong to the IME: they confirm or discard the
      // candidate, not the name. The browser reports either as an unfinished character.
      if (event.isComposing || event.keyCode === 229) {
        return;
      }

      if (event.key !== 'Enter' && event.key !== 'Escape') {
        return;
      }

      // Ending the edit hands the focus back to the tab while this keystroke is still on its way
      // to the document, where the bar's shortcuts would read the same Enter as an activation of
      // the tab it just landed on. The input owns its keys; nothing above it gets them.
      event.stopPropagation();
      stopImmediatePropagation(event);
      finish(event.key === 'Enter', true);
    });
    input.addEventListener('blur', () => finish(true, false));
    input.addEventListener('input', () => {
      // The limit is counted the way the model counts it — in characters a reader sees, so an
      // emoji costs one — rather than through the input's own `maxlength`, which counts UTF-16
      // units and would stop an emoji-heavy name at half the length the API accepts.
      const limited = truncateSheetName(input.value);

      if (limited !== input.value) {
        input.value = limited;
      }

      this.#syncRenameWidth(input, mirror, widthFloor);
    });

    mirror.className = 'ht-sheets-bar__tab-rename-mirror';
    mirror.setAttribute('aria-hidden', 'true');

    // The renaming class hides the menu chevron for the duration of the edit: the tab is a
    // text field at that point, and the trigger would open a menu acting on a name the user
    // is still typing. The button role goes with it — a button's children are presentational
    // to assistive technology, which would take the input out of the accessibility tree.
    addClass(tab, 'ht-sheets-bar__tab--renaming');
    removeAttribute(tab, ['role', 'aria-haspopup', 'aria-expanded']);
    label.replaceWith(input);
    tab.appendChild(mirror);
    this.#syncRenameWidth(input, mirror, 0);

    // Entering the edit removes the label, the gap, and the chevron from the tab, which would
    // otherwise make it visibly narrower the moment it is double-clicked. Whatever width that
    // frees is handed to the input, so the tab keeps its size and the field simply flows into
    // the space the trigger left behind. It stays the floor for the rest of the edit, so
    // clearing the name does not collapse the tab either.
    //
    // The deficit is added to the width the input actually renders at, not to the width just
    // asked for: the CSS `min-width` can be holding it wider than its text, and adding to the
    // narrower number would leave the tab short by that difference.
    const deficit = tabWidthBeforeEdit - tab.getBoundingClientRect().width;

    if (deficit > 0) {
      widthFloor = this.#contentWidthOf(input) + deficit;
      this.#syncRenameWidth(input, mirror, widthFloor);
    }

    // The rename always starts from something the user just clicked, so the field is on
    // screen already; letting focus scroll to it only jerks the page under them.
    input.focus({ preventScroll: true });
    input.select();
  }

  /**
   * Grows the rename input to fit the text it holds, the way a spreadsheet tab does.
   *
   * The value is measured on a mirror element that sits inside the same tab and therefore
   * inherits the input's typography, so the width follows the rendered text rather than a
   * character count — proportional fonts make those two disagree. The absolute bounds stay
   * in CSS as `min-width`/`max-width`, leaving only the measured value here.
   *
   * @param {HTMLInputElement} input The rename input being edited.
   * @param {HTMLElement} mirror The hidden element the value is measured on.
   * @param {number} floor Width the input keeps even when its text is narrower, in pixels.
   */
  #syncRenameWidth(input: HTMLInputElement, mirror: HTMLElement, floor: number): void {
    mirror.textContent = input.value;
    input.style.width = `${Math.max(mirror.getBoundingClientRect().width, floor)}px`;
  }

  /**
   * Measures an element's content box, which is what a `width` set on an `input` addresses —
   * the base styles normalize inputs to `content-box`, so its border box carries the padding
   * and border on top of whatever width was assigned.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number} The content-box width in pixels.
   */
  #contentWidthOf(element: HTMLElement): number {
    const view = element.ownerDocument.defaultView;
    const borderBox = element.getBoundingClientRect().width;

    if (!view) {
      return borderBox;
    }

    const styles = view.getComputedStyle(element);
    const edges = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;

    return edges.reduce((width, edge) => width - (parseFloat(styles[edge]) || 0), borderBox);
  }

  /**
   * Moves the browser focus onto a tab, when it still exists. The tab is the control, so this
   * is where every focus restore lands.
   *
   * @param {number} id The sheet whose tab to focus.
   */
  focusTab(id: number): void {
    this.getTab(id)?.focus();
  }

  /**
   * Returns a sheet's tab as it stands now.
   *
   * @param {number} id The sheet's id.
   * @returns {HTMLElement|null} The tab, or `null` when the sheet has none.
   */
  getTab(id: number): HTMLElement | null {
    const tab = this.#host.querySelector(`[data-sheet-id="${id}"]`);

    return isHTMLElement(tab) ? tab : null;
  }

  /**
   * Returns the tabs in strip order.
   *
   * @returns {HTMLElement[]} The tab elements.
   */
  #tabs(): HTMLElement[] {
    return Array.from(this.#host.querySelectorAll('.ht-sheets-bar__tab')).filter(isHTMLElement);
  }

  /**
   * Writes ARIA attributes when the grid emits them.
   *
   * @param {HTMLElement} element The element to decorate.
   * @param {Array} attributes `[name, value]` pairs.
   */
  #setAria(element: HTMLElement, attributes: string[][]): void {
    if (this.#ariaTags) {
      setAttribute(element, attributes as Array<[string, string]>);
    }
  }

  /**
   * Checks whether an event comes from the inline-rename input, which owns its own text
   * interactions and must keep them.
   *
   * @param {Event} event The event to classify.
   * @returns {boolean} `true` when the event originates inside the rename input.
   */
  #isWithinRenameInput(event: Event): boolean {
    return isHTMLElement(event.target) && event.target.closest('.ht-sheets-bar__tab-rename') !== null;
  }

  /**
   * Clears the strip contents and local hooks.
   */
  destroy(): void {
    this.#drag.destroy();
    this.clearLocalHooks();
    this.#host.textContent = '';
  }
}

mixin(TabStrip, localHooks);
