import type { HotInstance } from '../../core/types';
import { BaseEditor, EDITOR_STATE } from '../baseEditor';
import EventManager from '../../eventManager';
import { isEdge, isIOS } from '../../helpers/browser';
import {
  addClass,
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

    if (isInternalElement(this.hot.rootDocument.activeElement as HTMLElement, this.hot.rootElement)) {
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
    td: HTMLTableCellElement, value: unknown, cellProperties: Record<string, unknown>): void {
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
    const physicalRow = this.hot.toPhysicalRow(this.row);
    const sourceData = this.hot.getSourceDataAtCell(physicalRow, this.col);

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

    const {
      top,
      start,
      width,
      maxWidth,
      height,
      maxHeight
    } = this.getEditedCellRect();

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

    editorContext.addShortcuts([{
      keys: [['Control', 'Enter']],
      callback: () => {
        insertNewLine();

        return false; // Will block closing editor.
      },
      runOnlyIf: (event: KeyboardEvent) => !this.hot.selection.isMultiple() && // We trigger a data population for multiple selection.
        // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        !event.altKey,
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
      callback: (event: KeyboardEvent, [keyName]: string[]) => {
        updateCaretPosition(keyName, this.TEXTAREA);
      },
    }, {
      keys: [['End']],
      callback: (event: KeyboardEvent, [keyName]: string[]) => {
        updateCaretPosition(keyName, this.TEXTAREA);
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

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }
}
