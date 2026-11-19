import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { TextEditor } from '../textEditor';
import { EDITOR_STATE } from '../baseEditor';
import {
  setCaretPosition, getFixedContainingBlockRect, isHTMLElement, setAttribute, removeAttribute,
} from '../../helpers/dom/element';
import { getWindowScrollInlineMetrics } from '../utils/windowScrollInlineMetrics';
import { getVerticalRoom, getVisibleVerticalRange } from '../utils/visibleVerticalRange';
import {
  stopImmediatePropagation,
} from '../../helpers/dom/event';
import { extend } from '../../helpers/object';
import { stringify } from '../../helpers/mixed';
import { EDITOR_EDIT_GROUP } from '../../shortcuts/contexts';
import {
  A11Y_ACTIVEDESCENDANT,
  A11Y_COMBOBOX,
  A11Y_CONTROLS,
  A11Y_EXPANDED,
  A11Y_GRID,
  A11Y_HASPOPUP,
} from '../../helpers/a11y';
import { CELL_EDITOR_PHRASES, setCellInputName } from '../../utils/cellInputName';

const SHORTCUTS_GROUP = 'handsontableEditor';

export const EDITOR_TYPE = 'handsontable';

/**
 * @private
 * @class HandsontableEditor
 */
export class HandsontableEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the Handsontable editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * The internal Handsontable instance used as the editor's dropdown.
   *
   * @type {Core}
   */
  declare htEditor: HotInstance;
  /**
   * The container element for the internal Handsontable instance.
   *
   * @type {HTMLElement}
   */
  declare htContainer: HTMLElement;
  /**
   * The options object for the internal Handsontable instance.
   *
   * @type {object}
   */
  declare htOptions: Record<string, unknown>;
  /**
   * The single-line text input the editor edits in (the property keeps the name `TextEditor` gave it).
   *
   * @type {HTMLInputElement}
   */
  declare TEXTAREA: HTMLInputElement;

  // Mixin methods from hooksRefRegisterer (applied to BaseEditor at runtime).
  /**
   * Registers a hook callback for the given hook name on this editor instance.
   */
  declare addHook: (...args: unknown[]) => unknown;
  /**
   * Removes all hook callbacks registered under the given key on this editor instance.
   */
  declare removeHooksByKey: (...args: unknown[]) => unknown;

  /**
   * The flag determining if the editor is flipped vertically (rendered on
   * the top of the edited cell) or not.
   *
   * @type {boolean}
   */
  isFlippedVertically: boolean = false;
  /**
   * The flag determining if the editor is flipped horizontally (rendered on
   * the inline start of the edited cell) or not.
   *
   * @type {boolean}
   */
  isFlippedHorizontally: boolean = false;
  /**
   * How the inner grid's current selection came about: `'user'` for an explicit pick (the arrow
   * keys or a click on a choice), `'auto'` for one the editor derived from the value being typed,
   * `null` for no selection.
   *
   * `finishEditing()` commits the inner grid's value over the typed one, and only the origin tells
   * the two apart - the selection itself looks the same either way.
   */
  protected innerSelectionOrigin: 'user' | 'auto' | null = null;

  /**
   * Whether the document scroll listener that keeps the list on its cell is bound.
   */
  #scrollFollowBound = false;

  /**
   * The height the list wants, measured once per `open()` before anything caps it.
   *
   * `getTargetDropdownHeight()` measures the RENDERED sub-grid, so once {@link
   * HandsontableEditor#limitDropdownIfNeeded} has shrunk the list the wanted height can no longer
   * be read back from the DOM - the same circular read that let a trimmed list freeze at its edge
   * size. Kept per open rather than for the editor's life: the choices and the theme can both
   * change in between.
   */
  #wantedDropdownHeight = 0;

  /**
   * The height last written to the sub-grid, so a scroll that changes nothing writes nothing.
   *
   * Compared against the value this editor WROTE, never against `getDropdownHeight()`: that reads
   * `offsetHeight`, which comes back a pixel or two off the height that was set, so a gate on it
   * would never match and every scroll event would pay a sub-grid render.
   *
   * `protected` rather than private because {@link AutocompleteEditor} writes the height through
   * its own `setDropdownHeight()` and needs the same gate - without it a trimmed list re-wrote the
   * identical height twice per scroll event.
   */
  protected appliedDropdownHeight = 0;

  /**
   * The text the editor opened with when it was seeded from the cell, or `null` when it opened with
   * text of its own (a fast edit, `beginEditing('x')`) or is closed. While the editor still holds it,
   * the user has changed nothing, and confirming must not replace the cell's value
   * (`isEditUnchanged()`). It is the text the input holds, not the stored value: a single-line input
   * drops a line break the stored value has.
   *
   * @type {string | null}
   */
  #openedText: string | null = null;
  /**
   * Whether the input dropped part of the text the editor opened with (a line break), so the base
   * unchanged-edit rule, which compares with the seeded value, cannot see that the user typed nothing.
   *
   * @type {boolean}
   */
  #openedTextIsLossy = false;
  /**
   * Whether the input dropped part of the text the last `setValue()` call gave it.
   *
   * @type {boolean}
   */
  #lastValueIsLossy = false;
  /**
   * The wait for a list cell the field should name but the list has not drawn yet: the list grid it
   * waits on and the `afterScrollVertically` listener. At most one wait is pending; a newer point at a
   * cell, or the removal of the field's references, cancels it.
   */
  #pendingListCellPoint: { listGrid: HotInstance, callback: () => void } | null = null;
  /**
   * The number of ids this editor gave to list cells that had none, so every id it writes is unique:
   * the list recycles its cells across rows, so an id built from the coordinates could be repeated.
   */
  #listCellIdCount = 0;

  /**
   * Whether the field exposes the list as a grid popup: `combobox` with `aria-haspopup="grid"`, the
   * list a named `grid` of `gridcell`s, and ArrowLeft and ArrowRight moving across the list's columns.
   * `AutocompleteEditor` exposes its list as a `listbox` instead, and answers `false`.
   *
   * @private
   * @returns {boolean}
   */
  protected exposesGridPopup(): boolean {
    return true;
  }

  /**
   * The value the inner grid contributes to the commit, or `undefined` to leave the typed value
   * alone.
   *
   * Here that is simply whatever the inner grid has selected: it is selected either by the user or
   * by `open()`, and both describe the list on screen by construction. `AutocompleteEditor` derives
   * its selection from the typed value through a DEFERRED query, so its selection can describe
   * older text than the value being committed, and it overrides this.
   *
   * @private
   * @returns {*}
   */
  resolveInnerSelectionValue(): unknown {
    if (!this.htEditor || !this.htEditor.getSelectedActive()) {
      return undefined;
    }

    return this.htEditor.getValue();
  }

  /**
   * Opens the editor and adjust its size.
   */
  open(): void {
    super.open();

    const containerStyle = this.htContainer.style;

    if (this.htEditor) {
      this.htEditor.rootPortalElement = null as unknown as HTMLElement;
      this.htEditor.destroy();
      containerStyle.width = '';
      containerStyle.height = '';
      containerStyle.overflow = '';
      this.#clearGridPopupRoot();
    }

    if (containerStyle.display === 'none') {
      containerStyle.display = '';
    }

    // Constructs and initializes a new Handsontable instance
    type HotCtor = new (element: HTMLElement, settings: object) => HotInstance;
    this.htEditor = new (this.hot.constructor as HotCtor)(this.htContainer, this.htOptions);
    this.htEditor.rootPortalElement = this.hot.rootPortalElement;
    this.htEditor.init();
    this.htEditor.rootElement.style.display = '';

    if (this.cellProperties.strict) {
      this.htEditor.selectCell(0, 0);
      this.innerSelectionOrigin = 'auto';
    } else {
      this.htEditor.deselectCell();
      this.innerSelectionOrigin = null;
    }

    setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);

    // Read BEFORE the write, while the sub-grid still sits at its natural size. A cap from a
    // previous open does not survive into this one (measured: the reading comes back uncapped),
    // so this is the list's true wanted height.
    this.#wantedDropdownHeight = this.getTargetDropdownHeight();
    this.appliedDropdownHeight = this.#wantedDropdownHeight;

    this.htEditor.updateSettings({
      width: this.getTargetDropdownWidth(),
      height: this.#wantedDropdownHeight,
    });

    // `refreshDimensions()` places the holder and then repositions the list through
    // `#repositionDropdown()`, which re-decides both flips. Calling the two `...IfNeeded()`
    // methods again here would place the list twice, and the first placement would read flip
    // flags still holding the previously edited cell's answers.
    this.refreshDimensions();
    this.#bindScrollFollow();
    this.#keepListOutOfTabOrder();
    this.#wireGridPopup();
  }

  /**
   * Keeps every element of the opened list out of the focus order while the grid's `ariaTags` is on: the
   * browser focus stays in the field, whether the list is a grid popup or (in `AutocompleteEditor`) a
   * listbox. The list's engine writes `tabindex="-1"` on its scroll holders (the master table's and each
   * overlay clone's) and, with the list's own `ariaTags` on, on its drawn cells. A focusable holder under
   * the presentational table markup is a child neither the `grid` nor the `listbox` role allows, so the
   * attribute is removed now and after every render and scroll (a scroll draws the list without
   * `afterRender`). The list grid is built anew on every open, so its hooks go with it.
   */
  #keepListOutOfTabOrder(): void {
    if (!this.hot.getSettings().ariaTags) {
      return;
    }

    this.htEditor.addHook('afterRender', this.#removeListTabIndex);
    this.htEditor.addHook('afterScrollVertically', this.#removeListTabIndex);
    this.htEditor.addHook('afterScrollHorizontally', this.#removeListTabIndex);
    this.#removeListTabIndex();
  }

  /**
   * Exposes the opened list as the field's grid popup: raises `aria-expanded`, gives the list the role
   * `grid` and the field's name (`A, row 1`), points `aria-controls` at it, and names the highlighted
   * cell through `aria-activedescendant` from now on. Written only while the grid's `ariaTags` is on;
   * the list's own `ariaTags` (the cell's `handsontable` settings can turn it off) decides whether the
   * list is exposed as a grid at all.
   */
  #wireGridPopup(): void {
    if (!this.hot.getSettings().ariaTags || !this.exposesGridPopup()) {
      return;
    }

    setAttribute(this.TEXTAREA, ...A11Y_EXPANDED('true'));

    if (!this.htEditor.getSettings().ariaTags) {
      this.removeListReferences();

      return;
    }

    const listRoot = this.htEditor.rootElement;

    // The nested grid names its root `treegrid`, which is not a popup role a combobox can control. The
    // list picks one cell at a time, so it is not multiselectable either.
    setAttribute(listRoot, [A11Y_GRID()]);
    removeAttribute(listRoot, 'aria-multiselectable');
    // Not through `aria-labelledby` pointing at the field: a combobox referenced that way lends the grid
    // its value (the typed text), not its name.
    setCellInputName(this.hot, listRoot, CELL_EDITOR_PHRASES, this.row ?? -1, this.col ?? -1);
    setAttribute(this.TEXTAREA, ...A11Y_CONTROLS(listRoot.id));

    // A closed list (`afterSetTheme` closes the editor without ending the edit) and a list hidden for a scroll keep
    // their selection and take keys; the field names their cells only while the list is shown.
    this.htEditor.addHook('afterSelectionEnd', (row: number, col: number) => {
      if (this.isOpened()) {
        this.pointFieldAtListCell(row, col);
      }
    });
    this.htEditor.addHook('afterDeselect', () => this.#removeActiveDescendant());
    // A scroll draws the list without `afterRender`, so the scroll hooks run the same pass.
    this.htEditor.addHook('afterRender', this.#onListRender);
    this.htEditor.addHook('afterScrollVertically', this.#onListRender);
    this.htEditor.addHook('afterScrollHorizontally', this.#onListRender);

    const active = this.htEditor.getSelectedActive();

    if (active) {
      this.pointFieldAtListCell(active[0], active[1]);
    } else {
      this.#removeActiveDescendant();
    }
  }

  /**
   * After every render and scroll of the list: points the field at the highlighted cell again while the list
   * is shown. The list draws the rows it scrolls to in the cells it already has, so the cell the field named
   * may now show another row.
   */
  #onListRender = (): void => {
    const active = this.htEditor.getSelectedActive();

    if (active && this.isOpened()) {
      this.pointFieldAtListCell(active[0], active[1]);
    }
  };

  /**
   * Removes the `tabindex="-1"` the list's engine puts on its drawn cells (with its `ariaTags` on) and on
   * its scroll holders (see {@link HandsontableEditor#keepListOutOfTabOrder}).
   */
  #removeListTabIndex = (): void => {
    this.htEditor.rootElement.querySelectorAll<HTMLElement>('td[tabindex], .wtHolder[tabindex]').forEach((element) => {
      removeAttribute(element, 'tabindex');
    });
  };

  /**
   * Removes what the grid popup wiring and the destroyed list grid left on the list's root element,
   * which outlives the grid: the next list may be built with its `ariaTags` off.
   */
  #clearGridPopupRoot(): void {
    if (this.hot.getSettings().ariaTags && this.exposesGridPopup()) {
      removeAttribute(this.htContainer, [
        'role', 'aria-label', 'aria-rowcount', 'aria-colcount', 'aria-multiselectable',
      ]);
    }
  }

  /**
   * Points the field's `aria-activedescendant` at the list cell at the given coordinates, giving the cell
   * an id when it has none. A cell that is not drawn yet is named once the list has scrolled to it, and
   * only if the list still highlights it then, so the field never names an element that is not there or
   * a cell the list no longer highlights. The list's selection marks the cell `aria-selected` itself.
   *
   * @private
   * @param {number} row The visual row of the cell in the list.
   * @param {number} col The visual column of the cell in the list.
   */
  protected pointFieldAtListCell(row: number, col: number): void {
    this.#cancelPendingListCellPoint();

    if (row < 0 || col < 0) {
      removeAttribute(this.TEXTAREA, 'aria-activedescendant');

      return;
    }

    const listGrid = this.htEditor;
    const TD = listGrid.getCell(row, col, true);

    if (TD !== null) {
      this.#pointFieldAt(TD);

      return;
    }

    // Until the cell is drawn, the field names nothing rather than the cell it named before.
    removeAttribute(this.TEXTAREA, 'aria-activedescendant');

    const callback = () => {
      this.#cancelPendingListCellPoint();

      const active = listGrid.getSelectedActive();

      if (listGrid !== this.htEditor || !this.isOpened() || !active || active[0] !== row || active[1] !== col) {
        return;
      }

      const renderedTD = listGrid.getCell(row, col, true);

      if (renderedTD !== null) {
        this.#pointFieldAt(renderedTD);
      }
    };

    listGrid.addHook('afterScrollVertically', callback);
    this.#pendingListCellPoint = { listGrid, callback };
  }

  /**
   * Removes the field's references to the list and its cells, for a list that is no longer shown, and
   * cancels a pending wait for a list cell.
   *
   * @private
   */
  protected removeListReferences(): void {
    this.#cancelPendingListCellPoint();
    removeAttribute(this.TEXTAREA, ['aria-controls', 'aria-activedescendant']);
  }

  /**
   * Points the field's `aria-activedescendant` at a drawn list cell.
   *
   * @param {HTMLTableCellElement} TD The list cell.
   */
  #pointFieldAt(TD: HTMLTableCellElement): void {
    if (!TD.id) {
      this.#listCellIdCount += 1;
      setAttribute(TD, [['id', `${this.htEditor.rootElement.id}-cell-${this.#listCellIdCount}`]]);
    }

    setAttribute(this.TEXTAREA, ...A11Y_ACTIVEDESCENDANT(TD.id));
  }

  /**
   * Removes the field's reference to a list cell, for a list that highlights none.
   */
  #removeActiveDescendant(): void {
    this.#cancelPendingListCellPoint();
    removeAttribute(this.TEXTAREA, 'aria-activedescendant');
  }

  /**
   * Cancels the pending wait for a list cell, if there is one.
   */
  #cancelPendingListCellPoint(): void {
    const pending = this.#pendingListCellPoint;

    if (pending === null) {
      return;
    }

    this.#pendingListCellPoint = null;

    if (!pending.listGrid.isDestroyed) {
      pending.listGrid.removeHook('afterScrollVertically', pending.callback);
    }
  }

  /**
   * Closes the editor.
   */
  close(): void {
    // Deliberately NOT clearing `innerSelectionOrigin` here. `afterSetTheme` calls `close()` without
    // ending the edit - `state` stays `EDITING` and the inner grid keeps its selection - so clearing
    // here would throw away a pick the user could still see and had not finished with. (A scroll-out
    // of the rendered range no longer reaches `close()`; it goes through `hideForScroll()`, which also
    // preserves the selection.) `open()` sets the origin on every real re-open, which is what resets it.
    if (this.htEditor) {
      this.htEditor.rootElement.style.display = 'none';
    }

    this.#openedText = null;
    this.#openedTextIsLossy = false;
    this.removeHooksByKey('beforeKeyDown');
    super.close();
    this.#collapseGridPopup();
  }

  /**
   * Lowers the field's `aria-expanded` and removes its references to the list, for a list that is no
   * longer shown.
   */
  #collapseGridPopup(): void {
    if (this.hot.getSettings().ariaTags && this.exposesGridPopup()) {
      setAttribute(this.TEXTAREA, ...A11Y_EXPANDED('false'));
      this.removeListReferences();
    }
  }

  /**
   * Hides the nested grid because the edited cell scrolled out of the rendered range, without ending
   * the edit. Only the display and the `_opened` flag change; the `beforeKeyDown` hook, the shortcut
   * group, and the nested grid's data and selection are all preserved (unlike {@link HandsontableEditor#close},
   * which tears them down). This is what lets the list re-show still populated, and typing and arrow
   * navigation keep working, after a scroll round-trip.
   *
   * @private
   * @returns {boolean} Always `true` - the hide is transient and the layer must be re-shown on scroll-back.
   */
  hideForScroll(): boolean {
    this._opened = false;
    this.hideEditableElement();

    if (this.htEditor) {
      this.htEditor.rootElement.style.display = 'none';
    }

    this.#collapseGridPopup();

    return true;
  }

  /**
   * Re-shows the nested grid after the edited cell scrolled back into the rendered range, re-anchoring
   * it to the cell. The grid's data and selection were preserved by {@link HandsontableEditor#hideForScroll},
   * so nothing is reloaded here.
   *
   * @private
   */
  showAfterScroll(): void {
    if (this.htEditor) {
      this.htEditor.rootElement.style.display = '';
      this.reflowDropdown();
      this.#restoreGridPopup();
    }
  }

  /**
   * Raises the field's `aria-expanded` again after a scroll round-trip, and restores the references
   * `hideForScroll()` removed. The list kept its selection, so the field names its highlighted cell again.
   */
  #restoreGridPopup(): void {
    if (!this.hot.getSettings().ariaTags || !this.exposesGridPopup()) {
      return;
    }

    setAttribute(this.TEXTAREA, ...A11Y_EXPANDED('true'));

    if (!this.htEditor.getSettings().ariaTags) {
      return;
    }

    setAttribute(this.TEXTAREA, ...A11Y_CONTROLS(this.htEditor.rootElement.id));

    const active = this.htEditor.getSelectedActive();

    if (active) {
      this.pointFieldAtListCell(active[0], active[1]);
    }
  }

  /**
   * Re-anchors the re-shown dropdown to the edited cell's new viewport position. Split from
   * {@link HandsontableEditor#showAfterScroll} so {@link AutocompleteEditor} can re-measure the list to
   * its choices before the flip pass reads its size.
   *
   * @private
   */
  reflowDropdown(): void {
    this.flipDropdownVerticallyIfNeeded();
    this.flipDropdownHorizontallyIfNeeded();
  }

  /**
   * Prepares editor's meta data and configuration of the internal Handsontable's instance.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(
    row: number, col: number, prop: string | number,
    td: HTMLTableCellElement, value: unknown, cellProperties: CellProperties): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    const { hot } = this;
    const setValue = this.setValue.bind(this);
    const markUserPick = () => {
      this.innerSelectionOrigin = 'user';
    };
    const options: Record<string, unknown> = {
      startRows: 0,
      startCols: 0,
      minRows: 0,
      minCols: 0,
      className: 'listbox',
      copyPaste: false,
      autoColumnSize: false,
      autoRowSize: false,
      readOnly: true,
      fillHandle: false,
      autoWrapCol: false,
      autoWrapRow: false,
      // The list follows the grid's ARIA when the field exposes it as a grid popup; the autocomplete
      // listbox builds its own roles over a list without them.
      ariaTags: this.exposesGridPopup() ? this.hot.getSettings().ariaTags : false,
      themeName: this.hot.getCurrentThemeName(),
      afterOnCellMouseDown(this: HotInstance, _: Event, coords: Record<string, number>) {
        if (coords.row < 0 || coords.col < 0) {
          return;
        }

        const sourceValue = this.getDataAtCell(coords.row, coords.col);

        markUserPick();

        // if the value is undefined then it means we don't want to set the value
        if (sourceValue !== undefined) {
          setValue(sourceValue);
        }
        hot.destroyEditor();

        // A click commits without moving the selection, so nothing else moves the browser focus off the
        // closed editor's field: the focus goes to the edited cell, as after a commit with the keyboard. With
        // `imeFastEdit` the field keeps the focus by design.
        if (!hot.isDestroyed && hot.getFocusManager().getFocusMode() === 'cell') {
          hot.getFocusManager().focusOnHighlightedCell();
        }
      },
      preventWheel: true,
      layoutDirection: this.hot.isRtl() ? 'rtl' : 'ltr',
    };

    if (this.cellProperties.handsontable) {
      extend(options, cellProperties.handsontable as Record<string, unknown>);
    }
    this.htOptions = options;
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue The editor initial value.
   * @param {*} event The keyboard event object.
   */
  beginEditing(newInitialValue?: unknown, event?: Event): void {
    const onBeginEditing = this.hot.getSettings().onBeginEditing as (() => boolean | undefined) | undefined;

    if (onBeginEditing && onBeginEditing() === false) {
      return;
    }

    // An editor already open is left as it is, as the base class leaves it: a double-click on the
    // edited cell calls this again, and taking the typed text as the opening text would stop strict
    // mode from completing it.
    if (this.state !== EDITOR_STATE.VIRGIN) {
      super.beginEditing(newInitialValue, event);

      return;
    }

    const opensOnCellValue = typeof newInitialValue !== 'string' && this.isInFullEditMode();

    this.#openedText = null;
    super.beginEditing(newInitialValue, event);

    // Read after the seed, before the autocomplete editor's deferred first query: the query compares
    // against it.
    if (opensOnCellValue && this.isOpened()) {
      this.#openedText = this.TEXTAREA.value;
      this.#openedTextIsLossy = this.#lastValueIsLossy;
    }
  }

  /**
   * Sets the editor value, and notes whether the single-line input dropped part of it (a line break).
   *
   * @param {*} [newValue] The value to set.
   */
  setValue(newValue?: unknown): void {
    super.setValue(newValue);

    this.#lastValueIsLossy = stringify(newValue) !== this.TEXTAREA.value;
  }

  /**
   * Tells whether the editor still holds the non-empty text it was seeded with from the cell.
   *
   * @private
   * @returns {boolean}
   */
  protected holdsOpeningText(): boolean {
    const openedWith = this.#openedText;

    return openedWith !== null && openedWith !== '' && this.TEXTAREA.value === openedWith;
  }

  /**
   * Tells whether the edit being confirmed leaves the cell as it was. Besides the base rule, an edit
   * that opened on a value the single-line input could not hold whole (a value with a line break), and
   * whose text and list the user never changed, is unchanged: the input opened without the line break,
   * so the base comparison with the seeded value fails although the user typed nothing. Nothing is
   * written then, the cell's value is validated as it is, and no `afterChange` fires. Any other edit
   * keeps the base rule, so an untouched value still goes through `trimWhitespace` and `valueParser`.
   *
   * @private
   * @param {*} held The editor value after `trimWhitespace`.
   * @param {*} value The value that would be written, after `valueParser`.
   * @returns {boolean}
   */
  protected isEditUnchanged(held: unknown, value: unknown): boolean {
    return super.isEditUnchanged(held, value) ||
      (this.#openedTextIsLossy && this.innerSelectionOrigin !== 'user' && this.holdsOpeningText());
  }

  /**
   * Re-seeds the unchanged-edit baseline after the open editor took the cell's value again
   * (`TextEditor#refreshValue()`, after `setSourceDataAtCell()` on the edited cell), and the opening
   * text with it.
   */
  protected resetValueBeforeEdit(): void {
    super.resetValueBeforeEdit();

    if (this.#openedText !== null) {
      this.#openedText = this.TEXTAREA.value;
      this.#openedTextIsLossy = this.#lastValueIsLossy;
    }
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames. The editor edits in a single-line
   * `<input type="text">`, not the `<textarea>` of `TextEditor`: the autocomplete and dropdown editors
   * built on it expose the field as a combobox, a role ARIA in HTML does not allow on a textarea.
   */
  createElements(): void {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'text');

    if (this.hot.getSettings().ariaTags && this.exposesGridPopup()) {
      setAttribute(this.TEXTAREA, [
        A11Y_COMBOBOX(),
        A11Y_HASPOPUP('grid'),
        A11Y_EXPANDED('false'),
      ]);
    }

    const DIV = this.hot.rootDocument.createElement('DIV');

    DIV.className = 'handsontableEditor';
    this.TEXTAREA_PARENT.appendChild(DIV);

    this.htContainer = DIV;
    this.assignHooks();
  }

  /**
   * Finishes editing and start saving or restoring process for the editing cell, or for every selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in every selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: () => void): void {
    if (this.htEditor && this.htEditor.isListening()) { // if focus is still in the HOT editor
      this.hot.listen(); // return the focus to the parent HOT instance
    }

    const innerValue = this.resolveInnerSelectionValue();

    if (innerValue !== undefined) { // if the value is undefined then it means we don't want to set the value
      this.setValue(innerValue);
    }

    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * The edited cell's rectangle in viewport coordinates - the frame the list is positioned in.
   * `getEditedCellRect()` answers relative to the grid root, which the list's box no longer
   * follows: the list stays a child of the editor holder in the DOM (focus, ARIA, and
   * outside-click handling are untouched), but it is positioned `fixed`, so the grid root's
   * `overflow: clip` and any scrolling ancestor cannot cut it (#8688).
   *
   * @returns {DOMRect | undefined}
   */
  #getCellViewportRect(): DOMRect | undefined {
    return this.getEditedCell()?.getBoundingClientRect();
  }

  /**
   * Re-places the list on the edited cell after something moved one of them.
   *
   * This re-DECIDES both flips rather than re-applying the current ones. The cheaper option -
   * moving the box the flip already chose - is what the first version did, and it is wrong: the
   * cell moves relative to the containing block as the page scrolls, so the answer goes stale,
   * and re-applying a stale "flipped" answer walks the list off the top edge.
   *
   * The cost is that `AutocompleteEditor` re-clamps the list through `updateSettings()` here,
   * which is a sub-grid render. It only fires while the list does not fit the space it has
   * (`limitDropdownIfNeeded()` returns early otherwise), so a list with room around it pays two
   * `getBoundingClientRect()` reads and a couple of style writes per event.
   */
  #repositionDropdown(): void {
    // `isDestroyed` first, because `getEditedCell()` throws on a destroyed instance. A scroll
    // listener can outlive the grid: `scroll` is delivered asynchronously, so one dispatched
    // just before `destroy()` can run after it returns, and an editor whose own `destroy()`
    // does not release its event manager keeps the listener attached for good - which is how
    // `MultiSelectEditor` leaked 88 of them before its teardown was fixed.
    if (this.hot.isDestroyed || !this.htEditor || this.htEditor.rootElement.style.display === 'none'
      || !this.getEditedCell()) {
      return;
    }

    // Re-decide the flip rather than only re-applying it. The cell moves relative to the
    // viewport as the page scrolls, so a list that fitted below its cell when it opened can stop
    // fitting, and one that had to flip up can gain room below. Re-applying the old answer
    // instead would push a flipped list off the top edge, where a `fixed` box adds no scrollable
    // overflow and the first options become unreachable.
    this.flipDropdownVerticallyIfNeeded();
    this.flipDropdownHorizontallyIfNeeded();
  }

  /**
   * Refreshes the editor's size and position, then moves the list along with it.
   *
   * @private
   * @param {boolean} force Indicates if the refreshing editor dimensions should be triggered.
   */
  refreshDimensions(force: boolean = false): void {
    super.refreshDimensions(force);
    this.#repositionDropdown();
  }

  /**
   * Calculates the space above and below the editor and flips it vertically if needed.
   *
   * The list is positioned `fixed`, so the only edge that can cut it is the viewport's - not
   * the grid root's clip and not a scrolling ancestor. Free space is measured against the
   * window on both sides, not against the grid's workspace.
   *
   * @private
   * @returns {{ isFlipped: boolean, spaceAbove: number, spaceBelow: number}}
   */
  flipDropdownVerticallyIfNeeded(): { isFlipped: boolean, spaceAbove: number, spaceBelow: number } {
    const cellRect = this.#getCellViewportRect();

    if (!cellRect) {
      return { isFlipped: false, spaceAbove: 0, spaceBelow: 0 };
    }

    // Measured against the box the `fixed` list is laid out in, which is the viewport unless an
    // ancestor establishes a containing block for it. Never `rootWindow.innerHeight`: that
    // includes the classic horizontal scrollbar's gutter and, on mobile, the area under
    // collapsible browser chrome and the software keyboard - which is up precisely because a
    // text editor has focus, so the list would be positioned into space the user cannot see.
    //
    // Only the part of that box the viewport shows counts: a transformed ancestor scrolls with the
    // page, so its bottom can lie below the viewport's.
    const { spaceAbove, spaceBelow } = getVerticalRoom(
      cellRect,
      this.#containingBlockRect(),
      this.hot.rootDocument.documentElement.clientHeight
    );
    const dropdownTargetHeight = this.getDropdownHeight();
    const flipNeeded = dropdownTargetHeight > spaceBelow && spaceAbove > spaceBelow + cellRect.height;

    if (flipNeeded) {
      this.flipDropdownVertically();
    } else {
      this.unflipDropdownVertically();
    }

    this.limitDropdownIfNeeded(flipNeeded ? spaceAbove : spaceBelow);

    return {
      isFlipped: flipNeeded,
      spaceAbove,
      spaceBelow,
    };
  }

  /**
   * Caps the list at the free space on the side the flip just chose.
   *
   * A `fixed` box adds no scrollable overflow, so whatever hangs past the containing block cannot
   * be reached by scrolling the page - and the sub-grid's own holder only scrolls WITHIN the
   * height the list is given. An uncapped list therefore keeps its last rows permanently off
   * screen: measured at 19 of 20 options reachable in a 400px viewport, against 20 of 20 before
   * the list became `fixed`, where the overhang still added to the page's own scroll height.
   *
   * Capping to the free space rather than to the whole containing block keeps the edited cell
   * visible, which is what the `absolute` rules did.
   *
   * {@link AutocompleteEditor} overrides this to trim to whole rows against the choices it holds.
   *
   * @param {number} spaceAvailable The free space in px on the side the list is placed.
   */
  limitDropdownIfNeeded(spaceAvailable: number): void {
    // Never collapse to a sliver that hides every choice - the flexbox-squeezed grids of #8872.
    // One row is the same floor `AutocompleteEditor` and the MultiSelect controller keep.
    const rowHeight = this.htEditor.stylesHandler.getDefaultRowHeight() ?? 0;
    const height = Math.max(Math.min(this.#wantedDropdownHeight, spaceAvailable), rowHeight || 1);

    if (height === this.appliedDropdownHeight) {
      return;
    }

    this.appliedDropdownHeight = height;
    this.htEditor.updateSettings({ height });
    this.replaceDropdownVertically();
  }

  /**
   * Re-applies the vertical flip the list already has, after its height changed.
   *
   * Both writers resolve `top` against the containing block and clamp it to that box, and both
   * need the NEW height to do it - which is why a changed height cannot be answered by editing
   * `style.top` by hand.
   *
   * @private
   */
  replaceDropdownVertically(): void {
    if (this.isFlippedVertically) {
      this.flipDropdownVertically();
    } else {
      this.unflipDropdownVertically();
    }
  }

  /**
   * Adjusts the editor's container to flip vertically, positioning it from
   * the bottom to the top of the edited cell.
   *
   * @private
   */
  flipDropdownVertically(): void {
    // The old `absolute` rule was `top: -dropdownHeight` against the holder - see
    // `#holderRect()` for why the holder, not the cell, is the origin.
    this.#writeDropdownTop(this.#holderRect().top - this.getDropdownHeight());

    this.isFlippedVertically = true;
  }

  /**
   * Adjusts the editor's container to unflip vertically, positioning it from
   * the top to the bottom of the edited cell.
   *
   * @private
   */
  unflipDropdownVertically(): void {
    // The old `absolute` rule cleared `top`, leaving the list at its static position inside the
    // holder - directly under the textarea, which is the holder's own bottom edge.
    this.#writeDropdownTop(this.#holderRect().bottom);

    this.isFlippedVertically = false;
  }

  /**
   * Calculates the space on the inline-start and inline-end sides of the editor and flips it
   * horizontally if needed.
   *
   * @private
   * @returns {{ isFlipped: boolean, spaceInlineStart: number, spaceInlineEnd: number}}
   */
  flipDropdownHorizontallyIfNeeded(): { isFlipped: boolean, spaceInlineStart: number, spaceInlineEnd: number } {
    const { view } = this.hot;
    const cellRect = this.getEditedCellRect();

    if (!cellRect) {
      return { isFlipped: false, spaceInlineStart: 0, spaceInlineEnd: 0 };
    }

    // Deliberately still measured against the GRID's workspace, unlike the vertical axis. #8688 is
    // a vertical defect: the list was cut off below the cell. Sideways the old rule already put the
    // list where it fits, and a list kept inside the grid's width is inside the viewport too, so
    // widening this to the viewport would only let the list hang off the grid's side for no gain.
    let spaceInlineStart = cellRect.start + cellRect.width;
    let workspaceWidth = view.getWorkspaceWidth();

    if (view.isHorizontallyScrollableByWindow()) {
      const windowScroll = getWindowScrollInlineMetrics(this.hot);

      spaceInlineStart = Math.max(spaceInlineStart + windowScroll.inlineStartOffset, 0);
      workspaceWidth = windowScroll.viewportWidth;
    }

    const dropdownTargetWidth = this.getDropdownWidth();
    const spaceInlineEnd = workspaceWidth - spaceInlineStart + cellRect.width;
    const flipNeeded = dropdownTargetWidth > spaceInlineEnd && spaceInlineStart > spaceInlineEnd;

    if (flipNeeded) {
      this.flipDropdownHorizontally();
    } else {
      this.unflipDropdownHorizontally();
    }

    return {
      isFlipped: flipNeeded,
      spaceInlineStart,
      spaceInlineEnd,
    };
  }

  /**
   * Adjusts the editor's container to flip horizontally, positioning it from
   * the inline end (right) to the inline start (left) of the edited cell.
   *
   * @private
   */
  flipDropdownHorizontally(): void {
    const { width } = this.getEditedCellRect() ?? { width: 0 };

    // The same offset the old `absolute` rule used: `-(dropdownWidth - cellWidth)` on the
    // inline-start property, which moves the list back by everything it overhangs the cell by.
    this.#writeDropdownInlineStart(-(this.getDropdownWidth() - width));

    this.isFlippedHorizontally = true;
  }

  /**
   * Adjusts the editor's container to unflip horizontally, positioning it from
   * the inline start (left) to the inline end (right) of the edited cell.
   *
   * @private
   */
  unflipDropdownHorizontally(): void {
    // The old `absolute` rule cleared the offset, leaving the list on the holder's own
    // inline-start edge.
    this.#writeDropdownInlineStart(0);

    this.isFlippedHorizontally = false;
  }

  /**
   * Places the list's inline-start edge `offset` pixels from the holder's inline-start edge -
   * the same quantity the old `absolute` rules wrote, resolved against the viewport.
   *
   * Writes the same physical property the old rules did: `left` under LTR, `right` under RTL.
   * Mirroring RTL into a `left` value instead would have to assume the holder is exactly as wide
   * as the cell, which is what put the flipped list 2px off its edge. Only one of the two is ever
   * set; the other is cleared, or a stale value from the previous direction fights the new one.
   *
   * @param {number} offset Pixels from the holder's inline-start edge; negative moves the list
   *                        back towards the inline end, which is how a flip is expressed.
   */
  #writeDropdownInlineStart(offset: number): void {
    const dropdownStyle = this.htEditor.rootElement.style;
    const holderRect = this.#holderRect();
    const block = this.#containingBlockRect();

    dropdownStyle.position = 'fixed';

    if (this.hot.isRtl()) {
      // `right: offset` against the holder put the list's right edge `offset` px LEFT of the
      // holder's, so the distance grows with the offset - the opposite sign to `left`. Measured
      // from the containing block's own right edge, never `documentElement.clientWidth`: on an
      // RTL page with classic scrollbars the gutter sits on the left, inside the rect origin, so
      // mixing the two moved the list by the scrollbar's width.
      dropdownStyle.left = '';
      dropdownStyle.right = `${(block.left + block.width) - holderRect.right + offset}px`;

      return;
    }

    dropdownStyle.right = '';
    dropdownStyle.left = `${holderRect.left + offset - block.left}px`;
  }

  /**
   * Places the list's top edge at `viewportTop`, clamped so it cannot leave the box it is laid
   * out in.
   *
   * The clamp is what stops #8688 reappearing against the window's edge instead of the grid's: a
   * page scroll re-anchors the list without re-measuring, so a flipped list would otherwise be
   * pushed above the top edge, where a `fixed` box adds no scrollable overflow and the first
   * options become unreachable with no scrollbar anywhere to reveal them.
   *
   * @param {number} viewportTop The desired top edge, in viewport coordinates.
   */
  #writeDropdownTop(viewportTop: number): void {
    const dropdownStyle = this.htEditor.rootElement.style;
    const block = this.#containingBlockRect();
    const visible = getVisibleVerticalRange(block, this.hot.rootDocument.documentElement.clientHeight);
    const height = this.getDropdownHeight();
    // A list taller than the visible part of the box pins to its top: showing the first options
    // beats showing the middle of the list.
    const maxTop = Math.max(visible.bottom - height, visible.top);
    const clamped = Math.min(Math.max(viewportTop, visible.top), maxTop);

    dropdownStyle.position = 'fixed';
    dropdownStyle.top = `${clamped - block.top}px`;
  }

  /**
   * The box the `fixed` list is laid out in, in viewport coordinates: the viewport itself, or the
   * nearest ancestor that establishes a containing block for fixed descendants.
   *
   * @returns {{ top: number, left: number, width: number, height: number }}
   */
  #containingBlockRect(): { top: number, left: number, width: number, height: number } {
    return getFixedContainingBlockRect(this.htEditor.rootElement);
  }

  /**
   * Keeps the `fixed` list attached to its cell while something outside the grid scrolls: the
   * page, or an ancestor of the grid. The grid's own scroll already reaches `refreshDimensions()`
   * through the `afterScroll*` hooks. Capture phase, because `scroll` does not bubble. Bound once
   * for the editor's life; `#repositionDropdown()` is a no-op while the list is hidden, and the
   * event manager releases the listener with the editor.
   */
  #bindScrollFollow(): void {
    if (this.#scrollFollowBound) {
      return;
    }

    this.eventManager.addEventListener(this.hot.rootDocument, 'scroll', (event: Event) => {
      // The grid's OWN scroll already reaches `refreshDimensions()` through the `afterScroll*`
      // hooks. A capture listener on the document is on the propagation path for it too, and it
      // runs BEFORE the target-phase handler that re-places the holder, so acting on it would
      // reposition from a stale holder rect and then immediately do it again.
      // `isHTMLElement()`, not `instanceof Node`: the check has to hold for a node from another
      // realm - a grid built inside an iframe from the parent's constructor - and a bare
      // `instanceof` is bound to the realm this file was compiled in, so it answers `false`
      // there and the skip silently stops working.
      //
      // The liveness check comes FIRST, the order `handsontable/AGENTS.md` requires of any
      // callback that can outlive a task boundary: `Core#destroy()` nulls `rootElement` on its
      // way past, so reading it before asking whether the grid is gone would throw rather than
      // return.
      if (this.hot.isDestroyed || !this.hot.rootElement) {
        return;
      }

      if (isHTMLElement(event.target) && this.hot.rootElement.contains(event.target)) {
        return;
      }

      this.#repositionDropdown();
    }, { capture: true, passive: true });
    this.#scrollFollowBound = true;

    // A layout change that moves the cell without scrolling anything strands a `fixed` list,
    // which an `absolute` one never did because it rode along with the holder. A window resize
    // and a device rotation are the cases worth a listener. A page reflow that moves the grid
    // without either - a lazy image landing above it, a sibling expanding - is a known gap: it
    // needs the list to observe its own anchor, which is the portal work in DEV-1656.
    this.eventManager.addEventListener(this.hot.rootWindow, 'resize', () => this.#repositionDropdown(), {
      passive: true,
    });
  }

  /**
   * The editor holder's box in viewport coordinates - the origin every list coordinate is
   * resolved against.
   *
   * The holder, not the cell. `TextEditor#refreshDimensions()` has already placed the holder at
   * exactly the offset the old `absolute` rules resolved against, border compensation included,
   * so reading it keeps the list's geometry identical to what those rules produced and only
   * changes the coordinate space. That compensation is conditional
   * (`BaseEditor#getEditedCellRect()` cancels a 1px shift for a cell that draws its own
   * inline-start border or stands behind a row header, which depends on which columns are
   * rendered), so a hardcoded 1px against the cell lands the list a pixel off on some columns and
   * not others.
   *
   * @returns {DOMRect}
   */
  #holderRect(): DOMRect {
    return this.TEXTAREA_PARENT.getBoundingClientRect();
  }

  /**
   * Return the DOM height of the editor's container.
   *
   * @returns {number}
   */
  getDropdownHeight(): number {
    return this.htEditor.getTableHeight();
  }

  /**
   * Return the DOM width of the editor's container.
   *
   * @returns {number}
   */
  getDropdownWidth(): number {
    return this.htEditor.getTableWidth();
  }

  /**
   * Calculates the proposed/target editor width that should be set once the editor is opened.
   * The method may be overwritten in the child class to provide a custom size logic.
   *
   * @returns {number}
   */
  getTargetDropdownWidth(): number {
    return this.htEditor.view.getTableWidth();
  }

  /**
   * Calculates the proposed/target editor height that should be set once the editor is opened.
   * The method may be overwritten in the child class to provide a custom size logic.
   *
   * @returns {number}
   */
  getTargetDropdownHeight(): number {
    return this.htEditor.view.getTableHeight() + 1;
  }

  /**
   * Assigns afterDestroy callback to prevent memory leaks.
   *
   * @private
   */
  assignHooks(): void {
    this.hot.addHook('afterDestroy', () => {
      if (this.htEditor) {
        this.htEditor.rootPortalElement = null as unknown as HTMLElement;
        this.htEditor.destroy();
      }
    });

    this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
      if (!firstRun) {
        this.close();
      }
    });
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  registerShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    super.registerShortcuts();

    const contextConfig = {
      group: SHORTCUTS_GROUP,
      relativeToGroup: EDITOR_EDIT_GROUP,
      position: 'before' as const,
    };

    const action = (rowToSelect: number | undefined, event: KeyboardEvent) => {
      const innerHOT = this.htEditor;

      if (rowToSelect !== undefined) {
        if (rowToSelect < 0 || (this.isFlippedVertically && rowToSelect > innerHOT.countRows() - 1)) {
          innerHOT.deselectCell();
          this.innerSelectionOrigin = null;
        } else {
          // A move between rows keeps the column the list highlights (ArrowLeft and ArrowRight move it).
          innerHOT.selectCell(rowToSelect, innerHOT.getSelectedActive()?.[1] ?? 0);
          this.innerSelectionOrigin = 'user';
        }
        if (innerHOT.getData().length) {
          event.preventDefault();
          stopImmediatePropagation(event);

          this.hot.listen();
          this.TEXTAREA.focus();

          return false;
        }
      }
    };

    editorContext!.addShortcuts([{
      keys: [['ArrowUp']],
      callback: (event: KeyboardEvent) => {
        const innerHOT = this.htEditor;
        let rowToSelect;
        let selectedRow;

        if (!innerHOT.getSelectedActive() && this.isFlippedVertically) {
          rowToSelect = innerHOT.countRows() - 1;

        } else if (innerHOT.getSelectedActive()) {
          const active = innerHOT.getSelectedActive()!;

          if (this.isFlippedVertically) {
            selectedRow = active[0];
            rowToSelect = Math.max(0, selectedRow - 1);
          } else {
            selectedRow = active[0];
            rowToSelect = selectedRow - 1;
          }
        }

        return action(rowToSelect, event);
      },
      preventDefault: false, // Doesn't block default behavior (navigation) for a `textArea` HTMLElement.
    }, {
      keys: [['ArrowDown']],
      callback: (event: KeyboardEvent) => {
        const innerHOT = this.htEditor;
        let rowToSelect;
        let selectedRow;

        if (!innerHOT.getSelectedActive() && !this.isFlippedVertically) {
          rowToSelect = 0;

        } else if (innerHOT.getSelectedActive()) {
          const active = innerHOT.getSelectedActive()!;

          if (this.isFlippedVertically) {
            rowToSelect = active[0] + 1;

          } else if (!this.isFlippedVertically) {
            const lastRow = innerHOT.countRows() - 1;

            selectedRow = active[0];
            rowToSelect = Math.min(lastRow, selectedRow + 1);
          }
        }

        return action(rowToSelect, event);
      },
      preventDefault: false, // Doesn't block default behavior (navigation) for a `textArea` HTMLElement.
    }, {
      keys: [['ArrowLeft']],
      callback: (event: KeyboardEvent) => this.#moveListColumn(event, -this.hot.getDirectionFactor()),
      runOnlyIf: () => this.#canMoveListColumn(),
    }, {
      keys: [['ArrowRight']],
      callback: (event: KeyboardEvent) => this.#moveListColumn(event, this.hot.getDirectionFactor()),
      runOnlyIf: () => this.#canMoveListColumn(),
    }], contextConfig);
  }

  /**
   * Whether ArrowLeft and ArrowRight move across the list's columns: in a grid popup (not the
   * autocomplete listbox) that highlights a row and has more than one column. Otherwise the keys move
   * the caret, or close the editor, as they do in any text editor.
   *
   * @returns {boolean}
   */
  #canMoveListColumn(): boolean {
    return this.exposesGridPopup() && !!this.htEditor && !!this.htEditor.getSelectedActive() &&
      this.htEditor.countCols() > 1;
  }

  /**
   * Moves the list's highlight one column, clamped at the first and last column, and keeps the caret
   * and the focus in the field.
   *
   * @param {KeyboardEvent} event The key's event.
   * @param {number} step `1` to the next column, `-1` to the previous one.
   * @returns {boolean} `false`, so no later shortcut handles the key.
   */
  #moveListColumn(event: KeyboardEvent, step: number): boolean {
    const innerHOT = this.htEditor;
    const [row, col] = innerHOT.getSelectedActive()!;
    const colToSelect = Math.min(Math.max(col + step, 0), innerHOT.countCols() - 1);

    if (colToSelect !== col) {
      innerHOT.selectCell(row, colToSelect);
      this.innerSelectionOrigin = 'user';
    }

    event.preventDefault();
    stopImmediatePropagation(event);

    this.hot.listen();
    this.TEXTAREA.focus();

    return false;
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  unregisterShortcuts(): void {
    super.unregisterShortcuts();

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext!.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }
}
