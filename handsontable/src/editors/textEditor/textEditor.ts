import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { BaseEditor, EDITOR_STATE } from '../baseEditor';
import EventManager from '../../eventManager';
import { isEdge, isIOS } from '../../helpers/browser';
import {
  addClass,
  getDeepActiveElement,
  isInternalElement,
  setCaretPosition,
  hasClass,
  removeClass,
  setAttribute,
} from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { createInputElementResizer } from '../../utils/autoResize';
import { isDefined } from '../../helpers/mixed';
import { updateCaretPosition } from './caretPositioner';
import {
  A11Y_TABINDEX,
} from '../../helpers/a11y';

const EDITOR_VISIBLE_CLASS_NAME = 'ht_editor_visible';
const EDITOR_HIDDEN_CLASS_NAME = 'ht_editor_hidden';
const SHORTCUTS_GROUP = 'textEditor';

export const EDITOR_TYPE = 'text';

/**
 * @private
 * @class TextEditor
 */
export class TextEditor extends BaseEditor {
  /**
   * Returns the unique editor type identifier for the text editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Instance of {@link EventManager}.
   *
   * @private
   * @type {EventManager}
   */
  eventManager: EventManager = new EventManager(this);
  /**
   * Autoresize instance. Automagically resizes editor after changes.
   *
   * @private
   * @type {Function}
   */
  autoResize = createInputElementResizer(this.hot.rootDocument);
  /**
   * An TEXTAREA element.
   *
   * @private
   * @type {HTMLTextAreaElement}
   */
  declare TEXTAREA: HTMLTextAreaElement | HTMLInputElement;
  /**
   * Style declaration object of the TEXTAREA element.
   *
   * @private
   * @type {CSSStyleDeclaration}
   */
  declare textareaStyle: CSSStyleDeclaration;
  /**
   * Parent element of the TEXTAREA.
   *
   * @private
   * @type {HTMLDivElement}
   */
  declare TEXTAREA_PARENT: HTMLElement;
  /**
   * Style declaration object of the TEXTAREA_PARENT element.
   *
   * @private
   * @type {CSSStyleDeclaration}
   */
  declare textareaParentStyle: CSSStyleDeclaration;
  /**
   * Z-index class style for the editor.
   *
   * @private
   * @type {string}
   */
  declare layerClass: string;
  /**
   * Coordinates of the last cell this editor tried to finish after it was hidden, as `row,col`.
   * Guards against re-attempting the same cell when a failed validation restores the editing
   * state on a cell that is still hidden.
   */
  #hiddenCellFinishAttempt: string | null = null;

  /**
   * @param {Core} hotInstance The Handsontable instance.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);
    this.eventManager = new EventManager(this);

    this.createElements();
    this.bindEvents();

    this.hot.addHookOnce('afterDestroy', () => this.destroy());
  }

  /**
   * Gets current value from editable element.
   *
   * @returns {number}
   */
  getValue(): unknown {
    return this.TEXTAREA.value;
  }

  /**
   * Sets new value into editable element.
   *
   * @param {*} newValue The editor value.
   */
  setValue(newValue?: unknown): void {
    this.TEXTAREA.value = newValue as string;
  }

  /**
   * Opens the editor and adjust its size.
   */
  open(): void {
    this._opened = true;
    this.#hiddenCellFinishAttempt = null;
    this.refreshDimensions(); // need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348
    this.showEditableElement();
    this.hot.getShortcutManager().setActiveContextName('editor');
    this.registerShortcuts();
  }

  /**
   * Closes the editor.
   */
  close(): void {
    this._opened = false;
    this.autoResize.unObserve();

    if (isInternalElement(getDeepActiveElement(this.hot.rootDocument) as HTMLElement, this.hot.rootElement)) {
      this.hot.listen(); // don't refocus the table if user focused some cell outside of HT on purpose
    }

    this.hideEditableElement();
    this.unregisterShortcuts();
  }

  /**
   * Prepares editor's meta data.
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
    const previousState = this.state;

    super.prepare(row, col, prop, td, value, cellProperties);

    if (!cellProperties.readOnly) {
      this.refreshDimensions(true);

      const {
        allowInvalid,
      } = cellProperties;

      if (allowInvalid && !this.isOpened()) {
        // Remove an empty space from textarea (added by copyPaste plugin to make copy/paste
        // functionality work with IME)
        this.TEXTAREA.value = '';
      }

      if (previousState !== EDITOR_STATE.FINISHED && !this.isOpened()) {
        this.hideEditableElement();
      }
    }
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue The editor initial value.
   * @param {Event} event The keyboard event object.
   */
  beginEditing(newInitialValue?: unknown, event?: Event): void {
    if (this.state !== EDITOR_STATE.VIRGIN) {
      return;
    }

    this.TEXTAREA.value = ''; // Remove an empty space from textarea (added by copyPaste plugin to make copy/paste functionality work with IME).
    super.beginEditing(newInitialValue, event);
  }

  /**
   * Sets focus state on the select element.
   */
  focus(): void {
    // For IME editor textarea element must be focused using ".select" method.
    // Using ".focus" browser automatically scroll into the focused element which
    // is undesired effect.
    this.TEXTAREA.select();
    setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length, this.TEXTAREA.value.length);
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   *
   * @param {string} type The type of the element to create.
   */
  createElements(type: string = 'textarea'): void {
    const { rootDocument } = this.hot;

    this.TEXTAREA = rootDocument.createElement(type) as HTMLTextAreaElement;

    // Makes the element recognizable by Hot as its own
    // component's element.
    setAttribute(this.TEXTAREA, [
      ['data-hot-input', ''],
      A11Y_TABINDEX(-1),
    ]);

    addClass(this.TEXTAREA, 'handsontableInput');

    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';
    this.textareaStyle.overflowY = 'visible';

    this.TEXTAREA_PARENT = rootDocument.createElement('DIV');
    addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

    if (hasClass(this.TEXTAREA_PARENT, this.layerClass)) {
      removeClass(this.TEXTAREA_PARENT, this.layerClass);
    }

    addClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME);

    this.textareaParentStyle = this.TEXTAREA_PARENT.style;

    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
    this.hot.rootElement.appendChild(this.TEXTAREA_PARENT);
  }

  /**
   * Moves an editable element out of the viewport, but element must be able to hold focus for IME support.
   *
   * @private
   */
  hideEditableElement(): void {
    if (isEdge()) {
      this.textareaStyle.textIndent = '-99999px';
    }

    this.textareaStyle.overflowY = 'visible';
    this.textareaParentStyle.opacity = '0';
    this.textareaParentStyle.height = '1px';

    removeClass(this.TEXTAREA_PARENT, this.layerClass);
    addClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME);
  }

  /**
   * Resets an editable element position.
   *
   * @private
   */
  showEditableElement(): void {
    this.textareaParentStyle.height = '';
    this.textareaParentStyle.overflow = '';
    this.textareaParentStyle.position = '';
    this.textareaParentStyle[this.hot.isRtl() ? 'left' : 'right'] = 'auto';
    this.textareaParentStyle.opacity = '1';

    this.textareaStyle.textIndent = '';

    const childNodes = this.TEXTAREA_PARENT.childNodes;
    let hasClassHandsontableEditor = false;

    rangeEach(childNodes.length - 1, ((index: number) => {
      const childNode = childNodes[index];

      if (hasClass(childNode as HTMLElement, 'handsontableEditor')) {
        hasClassHandsontableEditor = true;

        return false;
      }
    }));

    if (hasClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME)) {
      removeClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME);
    }

    if (hasClassHandsontableEditor) {
      this.layerClass = EDITOR_VISIBLE_CLASS_NAME;

      addClass(this.TEXTAREA_PARENT, this.layerClass);

    } else {
      this.layerClass = this.getEditedCellsLayerClass();

      addClass(this.TEXTAREA_PARENT, this.layerClass);
    }
  }

  /**
   * Refreshes editor's value using source data.
   *
   * @private
   */
  refreshValue(): void {
    const physicalRow = this.hot.toPhysicalRow(this.row!);
    const sourceData = this.hot.getSourceDataAtCell(physicalRow, this.col!);

    this.originalValue = sourceData;

    this.setValue(sourceData);
    this.refreshDimensions();
  }

  /**
   * Refreshes editor's size and position.
   *
   * @private
   * @param {boolean} force Indicates if the refreshing editor dimensions should be triggered.
   */
  refreshDimensions(force: boolean = false): void {
    if (this.state !== EDITOR_STATE.EDITING && !force) {
      return;
    }
    this.TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!this.TD) {
      if (!force) {
        this.close(); // TODO shouldn't it be this.finishEditing() ?
      }

      return;
    }

    const cellRect = this.getEditedCellRect();

    if (!cellRect) {
      return;
    }

    const { top, start, width, maxWidth, height, maxHeight } = cellRect;

    this.textareaParentStyle.top = `${top}px`;
    this.textareaParentStyle[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;
    this.showEditableElement();

    const cellComputedStyle = this.hot.rootWindow.getComputedStyle(this.TD);

    this.TEXTAREA.style.fontSize = cellComputedStyle.fontSize;
    this.TEXTAREA.style.fontFamily = cellComputedStyle.fontFamily;
    this.TEXTAREA.style.backgroundColor = this.TD.style.backgroundColor;

    this.autoResize.init(this.TEXTAREA, {
      minWidth: Math.min(width, maxWidth),
      minHeight: Math.min(height, maxHeight),
      // TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      maxWidth,
      maxHeight,
    }, true);
  }

  /**
   * Ends editing when a re-render HIDES the edited cell while the editor is still open.
   *
   * A hiding index map (Pagination turning the page, `hiddenRows`, `hiddenColumns`) drops the cell
   * from the DOM while its visual index stays valid. The editor used to stay open, pinned to its
   * original pixel position over whatever row moved into that spot, still bound to its original
   * coordinates, and committed only on a later click - to a row the user could no longer see.
   *
   * Test on `isHidden()`, NOT on whether `getEditedCell()` still resolves. That method returns
   * `null` for a cell merely scrolled out of the rendered window too, and closing the editor there
   * would silently commit an in-progress edit on every scroll away, which is long-standing
   * behavior in the other direction: `refreshDimensions()` hides the editor on scroll but leaves
   * `state` at `EDITING` so the edit survives until the user comes back.
   *
   * A TRIMMING map (Filters, `trimRows`) is deliberately out of scope. It collapses the visual
   * index space instead of preserving it, so the edited coordinates silently rebind to a different
   * row that is still rendered, `isHidden()` is false, and the value lands on the wrong record.
   * That defect predates this method and is not fixed here.
   *
   * The edit is committed rather than discarded, to match what a click on the pagination bar
   * already does (it is an outside click, so it deselects, which finishes editing).
   *
   * @private
   */
  #finishEditingWhenCellHidden(): void {
    if (this.state !== EDITOR_STATE.EDITING || this.row === null || this.col === null) {
      return;
    }

    // `isHidden()` takes a PHYSICAL index while `this.row`/`this.col` are visual, so convert.
    // The two coincide only while no sorting, move, or trimming map is active. Under
    // `columnSorting` the raw visual index reads another row's hidden flag, which both tears down
    // an edit on a fully visible cell and misses the hidden cell this method exists for. Same
    // conversion as `editorManager.isCellEditable()`.
    const isHidden = this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(this.row)) ||
      this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(this.col));

    if (!isHidden) {
      return;
    }

    // A failed validation with `allowInvalid: false` puts the editor back into `EDITING` on the
    // same still-hidden cell, which would satisfy this guard again on the next render. Attempt any
    // one coordinate pair once; `open()` clears the latch when the editor is reused elsewhere.
    const attemptKey = `${this.row},${this.col}`;

    if (this.#hiddenCellFinishAttempt === attemptKey) {
      return;
    }

    this.#hiddenCellFinishAttempt = attemptKey;

    // `finishEditing()` writes through `setDataAtCell`, which renders. Defer so the write never
    // re-enters the render that is still unwinding. `_registerTimeout` is cleared on `destroy()`,
    // but the instance can still be torn down between scheduling and delivery.
    this.hot._registerTimeout(() => {
      if (!this.hot || this.hot.isDestroyed || this.state !== EDITOR_STATE.EDITING) {
        return;
      }

      this.finishEditing(false);
    }, 0);
  }

  /**
   * Binds events and hooks.
   *
   * @private
   */
  bindEvents(): void {
    if (isIOS()) {
      // on iOS after click "Done" the edit isn't hidden by default, so we need to handle it manually.
      this.eventManager.addEventListener(this.TEXTAREA, 'focusout', () => this.finishEditing(false));
    }

    this.addHook('afterScrollHorizontally', () => this.refreshDimensions());
    this.addHook('afterScrollVertically', () => this.refreshDimensions());
    this.addHook('afterViewRender', () => this.#finishEditingWhenCellHidden());

    this.addHook('afterColumnResize', () => {
      this.refreshDimensions();

      if (this.state === EDITOR_STATE.EDITING) {
        this.focus();
      }
    });

    this.addHook('afterRowResize', () => {
      this.refreshDimensions();

      if (this.state === EDITOR_STATE.EDITING) {
        this.focus();
      }
    });
  }

  /**
   * Destroys the internal event manager and clears attached hooks.
   *
   * @private
   */
  destroy(): void {
    this.eventManager.destroy();
    this.clearHooks();
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  registerShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      runOnlyIf: () => isDefined(this.hot.getSelected()),
      group: SHORTCUTS_GROUP,
    };

    const insertNewLine = () => {
      this.hot.rootDocument.execCommand('insertText', false, '\n');
    };

    editorContext!.addShortcuts([{
      keys: [['Control', 'Enter']],
      callback: () => {
        insertNewLine();

        return false; // Will block closing editor.
      },
      runOnlyIf: (event?: KeyboardEvent) => !this.hot.selection.isMultiple() && // We trigger a data population for multiple selection.
        // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        !event?.altKey,
    }, {
      keys: [['Meta', 'Enter']],
      callback: () => {
        insertNewLine();

        return false; // Will block closing editor.
      },
      runOnlyIf: () => !this.hot.selection.isMultiple(), // We trigger a data population for multiple selection.
    }, {
      keys: [['Alt', 'Enter']],
      callback: () => {
        insertNewLine();

        return false; // Will block closing editor.
      },
    }, {
      keys: [['Home']],
      callback: (_event: KeyboardEvent, keys?: string[]) => {
        updateCaretPosition(keys?.[0] ?? '', this.TEXTAREA);
      },
    }, {
      keys: [['End']],
      callback: (_event: KeyboardEvent, keys?: string[]) => {
        updateCaretPosition(keys?.[0] ?? '', this.TEXTAREA);
      },
    }], contextConfig);
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  unregisterShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext!.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }
}
