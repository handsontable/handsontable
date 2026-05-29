import type { HotInstance } from '../../core/types';
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
  declare addHook: (...args: unknown[]) => unknown;
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
    } else {
      this.htEditor.deselectCell();
    }

    setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);

    this.htEditor.updateSettings({
      width: this.getTargetDropdownWidth(),
      height: this.getTargetDropdownHeight(),
    });

    this.refreshDimensions();
    this.flipDropdownVerticallyIfNeeded();
    this.flipDropdownHorizontallyIfNeeded();
  }

  /**
   * Closes the editor.
   */
  close(): void {
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
    td: HTMLTableCellElement, value: unknown, cellProperties: Record<string, unknown>): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    const parent = this;
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
      afterOnCellMouseDown(_: Event, coords: Record<string, number>) {
        if (coords.row < 0 || coords.col < 0) {
          return;
        }

        const sourceValue = this.getDataAtCell(coords.row, coords.col);

        // if the value is undefined then it means we don't want to set the value
        if (sourceValue !== undefined) {
          parent.setValue(sourceValue);
        }
        parent.hot.destroyEditor();
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

    if (this.htEditor && this.htEditor.getSelectedActive()) {
      const value = this.htEditor.getValue();

      if (value !== undefined) { // if the value is undefined then it means we don't want to set the value
        this.setValue(value);
      }
    }

    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * Calculates the space above and below the editor and flips it vertically if needed.
   *
   * @private
   * @returns {{ isFlipped: boolean, spaceAbove: number, spaceBelow: number}}
   */
  flipDropdownVerticallyIfNeeded(): { isFlipped: boolean, spaceAbove: number, spaceBelow: number } {
    const { view } = this.hot;
    const cellRect = this.getEditedCellRect();

    if (!cellRect) {
      return { isFlipped: false, spaceAbove: 0, spaceBelow: 0 };
    }

    let spaceAbove = cellRect.top;

    if (view.isVerticallyScrollableByWindow()) {
      const topOffset = view.getTableOffset().top - this.hot.rootWindow.scrollY;

      spaceAbove = Math.max(spaceAbove + topOffset, 0);
    }

    const dropdownTargetHeight = this.getDropdownHeight();
    const spaceBelow = view.getWorkspaceHeight() - spaceAbove - cellRect.height;
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

    dropdownStyle.position = 'absolute';
    dropdownStyle.top = `${-this.getDropdownHeight()}px`;

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

    dropdownStyle.position = 'absolute';
    dropdownStyle.top = '';

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
    const dropdownStyle = this.htEditor.rootElement.style;
    const { width } = this.getEditedCellRect() ?? { width: 0 };

    dropdownStyle.position = 'absolute';
    dropdownStyle[this.hot.isRtl() ? 'right' : 'left'] = `${-(this.getDropdownWidth() - width)}px`;

    this.isFlippedHorizontally = true;
  }

  /**
   * Adjusts the editor's container to unflip horizontally, positioning it from
   * the inline start (left) to the inline end (right) of the edited cell.
   *
   * @private
   */
  unflipDropdownHorizontally(): void {
    const dropdownStyle = this.htEditor.rootElement.style;

    dropdownStyle.position = 'absolute';
    dropdownStyle[this.hot.isRtl() ? 'right' : 'left'] = '';

    this.isFlippedHorizontally = false;
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
        } else {
          innerHOT.selectCell(rowToSelect, 0);
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
