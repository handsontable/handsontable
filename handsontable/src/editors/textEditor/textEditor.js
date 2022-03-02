import { BaseEditor, EDITOR_STATE } from '../baseEditor';
import EventManager from '../../eventManager';
import { isMobileBrowser, isIE, isEdge, isIOS } from '../../helpers/browser';
import {
  addClass,
  getCaretPosition,
  getComputedStyle,
  setCaretPosition,
  hasClass,
  removeClass,
} from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { KEY_CODES } from '../../helpers/unicode';
import { autoResize } from '../../3rdparty/autoResize';
import { isDefined } from '../../helpers/mixed';
import { SHORTCUTS_GROUP_NAVIGATION } from '../../editorManager';
import { SHORTCUTS_GROUP_EDITOR } from '../baseEditor/baseEditor';

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
   * @param {Core} instance The Handsontable instance.
   */
  constructor(instance) {
    super(instance);
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Autoresize instance. Automagically resizes editor after changes.
     *
     * @private
     * @type {autoResize}
     */
    this.autoResize = autoResize();
    /**
     * An TEXTAREA element.
     *
     * @private
     * @type {HTMLTextAreaElement}
     */
    this.TEXTAREA = void 0;
    /**
     * Style declaration object of the TEXTAREA element.
     *
     * @private
     * @type {CSSStyleDeclaration}
     */
    this.textareaStyle = void 0;
    /**
     * Parent element of the TEXTAREA.
     *
     * @private
     * @type {HTMLDivElement}
     */
    this.TEXTAREA_PARENT = void 0;
    /**
     * Style declaration object of the TEXTAREA_PARENT element.
     *
     * @private
     * @type {CSSStyleDeclaration}
     */
    this.textareaParentStyle = void 0;
    /**
     * Z-index class style for the editor.
     *
     * @private
     * @type {string}
     */
    this.layerClass = void 0;

    this.createElements();
    this.bindEvents();

    this.hot.addHookOnce('afterDestroy', () => this.destroy());
  }

  /**
   * Gets current value from editable element.
   *
   * @returns {number}
   */
  getValue() {
    return this.TEXTAREA.value;
  }

  /**
   * Sets new value into editable element.
   *
   * @param {*} newValue The editor value.
   */
  setValue(newValue) {
    this.TEXTAREA.value = newValue;
  }

  /**
   * Opens the editor and adjust its size.
   */
  open() {
    this.refreshDimensions(); // need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348
    this.showEditableElement();

    const shortcutManager = this.hot.getShortcutManager();

    shortcutManager.setActiveContextName('editor');

    this.addHook('afterDocumentKeyDown', event => this.onAfterDocumentKeyDown(event));

    this.registerShortcuts();
  }

  /**
   * Closes the editor.
   */
  close() {
    this.autoResize.unObserve();

    if (this.hot.rootDocument.activeElement === this.TEXTAREA) {
      this.hot.listen(); // don't refocus the table if user focused some cell outside of HT on purpose
    }

    this.hideEditableElement();
    this.unregisterShortcuts();
    this.removeHooksByKey('afterDocumentKeyDown');
  }

  /**
   * Prepares editor's meta data.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
   */
  prepare(row, col, prop, td, value, cellProperties) {
    const previousState = this.state;

    super.prepare(row, col, prop, td, value, cellProperties);

    if (!cellProperties.readOnly) {
      this.refreshDimensions(true);

      const {
        allowInvalid,
        fragmentSelection,
      } = cellProperties;

      if (allowInvalid) {
        // Remove an empty space from textarea (added by copyPaste plugin to make copy/paste
        // functionality work with IME)
        this.TEXTAREA.value = '';
      }

      if (previousState !== EDITOR_STATE.FINISHED) {
        this.hideEditableElement();
      }

      // @TODO: The fragmentSelection functionality is conflicted with IME. For this feature
      // refocus has to be disabled (to make IME working).
      const restoreFocus = !fragmentSelection;

      if (restoreFocus && !isMobileBrowser()) {
        this.focus();
      }
    }
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * @param {*} newInitialValue The editor initial value.
   * @param {Event} event The keyboard event object.
   */
  beginEditing(newInitialValue, event) {
    if (this.state !== EDITOR_STATE.VIRGIN) {
      return;
    }

    this.TEXTAREA.value = ''; // Remove an empty space from textarea (added by copyPaste plugin to make copy/paste functionality work with IME).
    super.beginEditing(newInitialValue, event);
  }

  /**
   * Sets focus state on the select element.
   */
  focus() {
    // For IME editor textarea element must be focused using ".select" method.
    // Using ".focus" browser automatically scroll into the focused element which
    // is undesired effect.
    this.TEXTAREA.select();
    setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements() {
    const { rootDocument } = this.hot;

    this.TEXTAREA = rootDocument.createElement('TEXTAREA');
    this.TEXTAREA.setAttribute('data-hot-input', ''); // Makes the element recognizable by Hot as its own component's element.
    this.TEXTAREA.tabIndex = -1;

    addClass(this.TEXTAREA, 'handsontableInput');

    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;
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
  hideEditableElement() {
    if (isIE() || isEdge()) {
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
  showEditableElement() {
    this.textareaParentStyle.height = '';
    this.textareaParentStyle.overflow = '';
    this.textareaParentStyle.position = '';
    this.textareaParentStyle[this.hot.isRtl() ? 'left' : 'right'] = 'auto';
    this.textareaParentStyle.opacity = '1';

    this.textareaStyle.textIndent = '';
    this.textareaStyle.overflowY = 'hidden';

    const childNodes = this.TEXTAREA_PARENT.childNodes;
    let hasClassHandsontableEditor = false;

    rangeEach(childNodes.length - 1, (index) => {
      const childNode = childNodes[index];

      if (hasClass(childNode, 'handsontableEditor')) {
        hasClassHandsontableEditor = true;

        return false;
      }
    });

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
  refreshValue() {
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
  refreshDimensions(force = false) {
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

    const cellComputedStyle = getComputedStyle(this.TD, this.hot.rootWindow);

    this.TEXTAREA.style.fontSize = cellComputedStyle.fontSize;
    this.TEXTAREA.style.fontFamily = cellComputedStyle.fontFamily;
    this.TEXTAREA.style.backgroundColor = this.TD.style.backgroundColor;

    const textareaComputedStyle = getComputedStyle(this.TEXTAREA);

    const horizontalPadding = parseInt(textareaComputedStyle.paddingLeft, 10) +
      parseInt(textareaComputedStyle.paddingRight, 10);
    const verticalPadding = parseInt(textareaComputedStyle.paddingTop, 10) +
      parseInt(textareaComputedStyle.paddingBottom, 10);

    const finalWidth = width - horizontalPadding;
    const finalHeight = height - verticalPadding;
    const finalMaxWidth = maxWidth - horizontalPadding;
    const finalMaxHeight = maxHeight - verticalPadding;

    this.autoResize.init(this.TEXTAREA, {
      minWidth: Math.min(finalWidth, finalMaxWidth),
      minHeight: Math.min(finalHeight, finalMaxHeight),
      // TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      maxWidth: finalMaxWidth,
      maxHeight: finalMaxHeight,
    }, true);
  }

  /**
   * Binds events and hooks.
   *
   * @private
   */
  bindEvents() {
    this.eventManager.addEventListener(this.TEXTAREA, 'cut', event => event.stopPropagation());
    this.eventManager.addEventListener(this.TEXTAREA, 'paste', event => event.stopPropagation());

    if (isIOS()) {
      // on iOS after click "Done" the edit isn't hidden by default, so we need to handle it manually.
      this.eventManager.addEventListener(this.TEXTAREA, 'focusout', () => this.finishEditing(false));
    }

    this.addHook('afterScrollHorizontally', () => this.refreshDimensions());
    this.addHook('afterScrollVertically', () => this.refreshDimensions());

    this.addHook('afterColumnResize', () => {
      this.refreshDimensions();
      this.focus();
    });

    this.addHook('afterRowResize', () => {
      this.refreshDimensions();
      this.focus();
    });
  }

  /**
   * Ugly hack for autocompleteEditor.
   *
   * @private
   */
  allowKeyEventPropagation() {}

  /**
   * Destroys the internal event manager and clears attached hooks.
   *
   * @private
   */
  destroy() {
    this.eventManager.destroy();
    this.clearHooks();
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      runOnlyIf: () => isDefined(this.hot.getSelected()),
      group: SHORTCUTS_GROUP,
    };

    const setNewValue = () => {
      const caretPosition = getCaretPosition(this.TEXTAREA);
      const value = this.getValue();
      const newValue = `${value.slice(0, caretPosition)}\n${value.slice(caretPosition)}`;

      this.setValue(newValue);

      setCaretPosition(this.TEXTAREA, caretPosition + 1);
    };

    editorContext.addShortcuts([{
      keys: [['Tab']],
      // TODO: Duplicated part of code.
      callback: (event) => {
        const tableMeta = this.hot.getSettings();
        const tabMoves = typeof tableMeta.tabMoves === 'function'
          ? tableMeta.tabMoves(event)
          : tableMeta.tabMoves;

        this.hot.selection.transformStart(tabMoves.row, tabMoves.col, true);
      },
    }, {
      keys: [['Shift', 'Tab']],
      // TODO: Duplicated part of code.
      callback: (event) => {
        const tableMeta = this.hot.getSettings();
        const tabMoves = typeof tableMeta.tabMoves === 'function'
          ? tableMeta.tabMoves(event)
          : tableMeta.tabMoves;

        this.hot.selection.transformStart(-tabMoves.row, -tabMoves.col);
      },
    }, {
      keys: [['Control', 'Enter']],
      callback: () => {
        setNewValue();
      },
      runOnlyIf: event => !this.hot.selection.isMultiple() &&
        // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        !event.altKey,
    }, {
      keys: [['Alt', 'Enter']],
      callback: () => {
        setNewValue();
      },
      runOnlyIf: () => true,
    }], contextConfig);
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP_NAVIGATION);
    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP_EDITOR);
  }

  /**
   * OnAfterDocumentKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event The keyboard event object.
   */
  onAfterDocumentKeyDown(event) {
    const arrowKeyCodes = [KEY_CODES.ARROW_UP, KEY_CODES.ARROW_RIGHT, KEY_CODES.ARROW_DOWN, KEY_CODES.ARROW_LEFT];

    if (arrowKeyCodes.indexOf(event.keyCode) === -1) {
      this.autoResize.resize(String.fromCharCode(event.keyCode));
    }
  }
}
