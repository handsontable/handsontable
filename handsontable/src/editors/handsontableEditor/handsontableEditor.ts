import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { TextEditor } from '../textEditor';
import { setCaretPosition } from '../../helpers/dom/element';
import {
  stopImmediatePropagation,
} from '../../helpers/dom/event';
import { extend } from '../../helpers/object';
import { EDITOR_EDIT_GROUP } from '../../shortcuts/contexts';

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

    this.htEditor.updateSettings({
      width: this.getTargetDropdownWidth(),
      height: this.getTargetDropdownHeight(),
    });

    this.refreshDimensions();
    this.flipDropdownVerticallyIfNeeded();
    this.flipDropdownHorizontallyIfNeeded();
    this.#bindScrollFollow();
  }

  /**
   * Closes the editor.
   */
  close(): void {
    // Deliberately NOT clearing `innerSelectionOrigin` here. `TextEditor#refreshDimensions()` calls
    // `close()` as "hide for now" when the edited cell scrolls out of the rendered range, and
    // `afterSetTheme` does the same - neither ends the edit, `state` stays `EDITING` and the inner
    // grid keeps its selection. Clearing here threw away a pick the user could still see and had
    // not finished with. `open()` sets the origin on every real re-open, which is what resets it.
    if (this.htEditor) {
      this.htEditor.rootElement.style.display = 'none';
    }

    this.removeHooksByKey('beforeKeyDown');
    super.close();
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
      ariaTags: false,
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

    super.beginEditing(newInitialValue, event);
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements(): void {
    super.createElements();

    const DIV = this.hot.rootDocument.createElement('DIV');

    DIV.className = 'handsontableEditor';
    this.TEXTAREA_PARENT.appendChild(DIV);

    this.htContainer = DIV;
    this.assignHooks();
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
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
   * Re-applies the current flip state's coordinates so the list follows the edited cell after
   * a scroll. Deliberately not the `...IfNeeded()` pair: those re-measure and, in the
   * autocomplete editor, re-clamp the list through `updateSettings()` - a full sub-grid render
   * per scroll event. A follow only moves the box the flip already decided.
   */
  #repositionDropdown(): void {
    // `isDestroyed` first: tearing the grid down shrinks the document, the window's scroll
    // position clamps, and that `scroll` event reaches the follow listener before the event
    // manager releases it - and `getEditedCell()` throws on a destroyed instance.
    if (this.hot.isDestroyed || !this.htEditor || this.htEditor.rootElement.style.display === 'none'
      || !this.getEditedCell()) {
      return;
    }

    if (this.isFlippedVertically) {
      this.flipDropdownVertically();
    } else {
      this.unflipDropdownVertically();
    }

    if (this.isFlippedHorizontally) {
      this.flipDropdownHorizontally();
    } else {
      this.unflipDropdownHorizontally();
    }
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

    const spaceAbove = Math.max(cellRect.top, 0);
    const spaceBelow = Math.max(this.hot.rootWindow.innerHeight - cellRect.bottom, 0);
    const dropdownTargetHeight = this.getDropdownHeight();
    const flipNeeded = dropdownTargetHeight > spaceBelow && spaceAbove > spaceBelow + cellRect.height;

    if (flipNeeded) {
      this.flipDropdownVertically();
    } else {
      this.unflipDropdownVertically();
    }

    return {
      isFlipped: flipNeeded,
      spaceAbove,
      spaceBelow,
    };
  }

  /**
   * Adjusts the editor's container to flip vertically, positioning it from
   * the bottom to the top of the edited cell.
   *
   * @private
   */
  flipDropdownVertically(): void {
    const dropdownStyle = this.htEditor.rootElement.style;

    // The old `absolute` rule was `top: -dropdownHeight` against the holder - see
    // `#dropdownOriginLeft()` for why the holder, not the cell, is the origin.
    dropdownStyle.position = 'fixed';
    dropdownStyle.top = `${this.#holderRect().top - this.getDropdownHeight()}px`;

    this.isFlippedVertically = true;
  }

  /**
   * Adjusts the editor's container to unflip vertically, positioning it from
   * the top to the bottom of the edited cell.
   *
   * @private
   */
  unflipDropdownVertically(): void {
    const dropdownStyle = this.htEditor.rootElement.style;

    // The old `absolute` rule cleared `top`, leaving the list at its static position inside the
    // holder - directly under the textarea, which is the holder's own bottom edge.
    dropdownStyle.position = 'fixed';
    dropdownStyle.top = `${this.#holderRect().bottom}px`;

    this.isFlippedVertically = false;
  }

  /**
   * Calculates the space above and below the editor and flips it vertically if needed.
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
      const inlineStartOffset = view.getTableOffset().left - this.hot.rootWindow.scrollX;

      spaceInlineStart = Math.max(spaceInlineStart + inlineStartOffset, 0);
      // For window-scrollable tables, spaceInlineStart is viewport-relative so the right
      // boundary must also be viewport width, not the holder's offsetWidth.
      workspaceWidth = this.hot.rootDocument.documentElement.clientWidth;
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

    dropdownStyle.position = 'fixed';

    if (this.hot.isRtl()) {
      const viewportWidth = this.hot.rootDocument.documentElement.clientWidth;

      // `right: offset` against the holder put the list's right edge `offset` px LEFT of the
      // holder's, so the viewport distance grows with the offset - the opposite sign to `left`.
      dropdownStyle.left = '';
      dropdownStyle.right = `${viewportWidth - holderRect.right + offset}px`;

      return;
    }

    dropdownStyle.right = '';
    dropdownStyle.left = `${holderRect.left + offset}px`;
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

    this.eventManager.addEventListener(this.hot.rootDocument, 'scroll', () => this.#repositionDropdown(), {
      capture: true,
      passive: true,
    });
    this.#scrollFollowBound = true;
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
   * inline-start border, which depends on row headers and on which columns are rendered), so a
   * hardcoded 1px against the cell lands the list a pixel off on some columns and not others.
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
          innerHOT.selectCell(rowToSelect, 0);
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
      preventDefault: false, // Doesn't block default behaviour (navigation) for a `textArea` HTMLElement.
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
      preventDefault: false, // Doesn't block default behaviour (navigation) for a `textArea` HTMLElement.
    }], contextConfig);
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
