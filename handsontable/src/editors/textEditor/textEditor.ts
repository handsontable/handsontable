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
  getCaretPosition,
} from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { createInputElementResizer } from '../../utils/autoResize';
import { isDefined } from '../../helpers/mixed';
import { updateCaretPosition } from './caretPositioner';
import {
  A11Y_TABINDEX,
} from '../../helpers/a11y';
import { Handsontable, CellProperties, TextEditor as TextEditorInterface, CellOffset } from '../types';

const EDITOR_VISIBLE_CLASS_NAME = 'ht_editor_visible';
const EDITOR_HIDDEN_CLASS_NAME = 'ht_editor_hidden';
const SHORTCUTS_GROUP = 'textEditor';

export const EDITOR_TYPE = 'text';

/**
 * @private
 * @class TextEditor
 */
export class TextEditor extends BaseEditor implements TextEditorInterface {
  static get EDITOR_TYPE(): string {
    return EDITOR_TYPE;
  }

  /**
   * Instance of {@link EventManager}.
   *
   * @private
   * @type {EventManager}
   */
  eventManager: EventManager;
  /**
   * Autoresize instance. Automagically resizes editor after changes.
   *
   * @private
   * @type {Function}
   */
  autoResize: any;
  /**
   * An TEXTAREA element.
   *
   * @private
   * @type {HTMLTextAreaElement}
   */
  TEXTAREA!: HTMLTextAreaElement;
  /**
   * Style declaration object of the TEXTAREA element.
   *
   * @private
   * @type {CSSStyleDeclaration}
   */
  textareaStyle!: CSSStyleDeclaration;
  /**
   * Parent element of the TEXTAREA.
   *
   * @private
   * @type {HTMLDivElement}
   */
  TEXTAREA_PARENT!: HTMLDivElement;
  /**
   * Style declaration object of the TEXTAREA_PARENT element.
   *
   * @private
   * @type {CSSStyleDeclaration}
   */
  textareaParentStyle!: CSSStyleDeclaration;
  /**
   * Z-index class style for the editor.
   *
   * @private
   * @type {string}
   */
  layerClass!: string;

  /**
   * @param {Core} hotInstance The Handsontable instance.
   */
  constructor(hotInstance: Handsontable) {
    super(hotInstance);
    this.eventManager = new EventManager({} as any);
    this.autoResize = createInputElementResizer(this.hot.rootDocument);

    this.createElements();
    this.bindEvents();

    this.hot.addHookOnce('afterDestroy', () => this.destroy());
  }

  /**
   * Gets current value from editable element.
   *
   * @returns {number}
   */
  getValue(): string {
    return this.TEXTAREA.value;
  }

  /**
   * Sets new value into editable element.
   *
   * @param {*} newValue The editor value.
   */
  setValue(newValue: string): void {
    this.TEXTAREA.value = newValue;
  }

  /**
   * Opens the editor and adjust its size.
   */
  open(event?: Event): void {
    this.refreshDimensions(); // need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348
    this.showEditableElement();
    this.hot.getShortcutManager().setActiveContextName('editor');
    this.registerShortcuts();
  }

  /**
   * Closes the editor.
   */
  close(): void {
    this.autoResize.unObserve();

    if (isInternalElement(this.hot.rootDocument.activeElement, this.hot.rootElement)) {
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
  prepare(row: number, col: number, prop: number | string, td: HTMLTableCellElement, value: any, cellProperties: CellProperties): void {
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
  beginEditing(newInitialValue: string | null, event?: Event): void {
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
    setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements(): void {
    const { rootDocument } = this.hot;

    this.TEXTAREA = rootDocument.createElement('TEXTAREA') as HTMLTextAreaElement;

    // Makes the element recognizable by Hot as its own
    // component's element.
    setAttribute(this.TEXTAREA, [
      ['data-hot-input', ''],
      A11Y_TABINDEX(-1),
    ]);

    addClass(this.TEXTAREA, 'handsontableInput');

    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0px';
    this.textareaStyle.height = '0px';
    this.textareaStyle.overflowY = 'visible';

    this.TEXTAREA_PARENT = rootDocument.createElement('DIV') as HTMLDivElement;
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

    if (hasClass(this.TEXTAREA_PARENT, EDITOR_VISIBLE_CLASS_NAME)) {
      removeClass(this.TEXTAREA_PARENT, EDITOR_VISIBLE_CLASS_NAME);
    }

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
    this.textareaParentStyle.right = 'auto';
    this.textareaParentStyle.opacity = '1';

    this.textareaStyle.textIndent = '';
    this.textareaStyle.overflowY = 'hidden';

    const childNodes = this.TEXTAREA_PARENT.childNodes;
    let hasClassHandsontableEditor = false;

    rangeEach(childNodes.length - 1, (index) => {
      const childNode = childNodes[index];

      if (childNode.nodeName === void 0) {
        return true;
      }

      if (hasClass(childNode as HTMLElement, 'handsontableEditor')) {
        hasClassHandsontableEditor = true;

        return true;
      }
      
      return false;
    });

    if (hasClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME)) {
      removeClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME);
    }

    if (!hasClassHandsontableEditor) {
      addClass(this.TEXTAREA_PARENT, EDITOR_VISIBLE_CLASS_NAME);
    }
  }

  /**
   * Refreshes editor's value using source data.
   *
   * @private
   */
  refreshValue(): void {
    const physicalRow = this.hot.toPhysicalRow?.(this.row as number) ?? this.row;
    const sourceData = this.hot.getSourceDataAtCell?.(physicalRow, this.col as number) ?? '';
    this.originalValue = sourceData;

    this.setValue(sourceData ?? '');
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
      if (this.hot.view.wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder.contains(this.TEXTAREA)) {
        this.hot.view.wt.wtOverlays.inlineStartOverlay.removeChild(this.TEXTAREA_PARENT);
      }

      // @TODO: Refactor this to the new instance's structure API.
      if (this.hot.view._wt.wtTable.holder.contains(this.TEXTAREA)) {
        this.hot.view._wt.wtTable.holder.removeChild(this.TEXTAREA_PARENT);
      }

      return;
    }

    const cellOffset = this.getEditedCellRect();

    // If we have rendered an element outside the table viewport
    if (!cellOffset) {
      this.hideEditableElement();

      return;
    }

    // Setting HTMLElement size is useful only for the autocomplete and handsontable editors.
    // For other editors, autoresize is configured to resize outer element, which then will
    // have an impact on the textarea element.
    this.textareaParentStyle.top = `${cellOffset.top ?? 0}px`;
    this.textareaParentStyle.insetInlineStart = `${cellOffset.start ?? 0}px`;

    const width = cellOffset.width;
    const maxWidth = this.hot.view.maximumVisibleElementWidth(parseInt(`${cellOffset.start}`, 10));

    if (width > maxWidth) {
      this.textareaParentStyle.width = `${maxWidth}px`;
    } else {
      this.textareaParentStyle.width = `${width}px`;
    }

    const height = cellOffset.height;
    const maxHeight = this.hot.view.maximumVisibleElementHeight(parseInt(`${cellOffset.top}`, 10)) - 2;

    if (height > maxHeight) {
      this.textareaParentStyle.height = `${maxHeight}px`;
    } else {
      this.textareaParentStyle.height = `${height}px`;
    }

    // Move the textarea parent to the root table element if not exists.
    // TODO: Plugins should not manipulate the DOM tree. The editor instance should handle this.
    let nextParent = this.hot.view._wt.wtTable.holder;

    if (this.TD.firstChild) {
      const cellFragmentData = this.hot.view.getCellFragmentData(this.TD);

      if (cellFragmentData?.header && cellFragmentData.header.layer) {
        nextParent = cellFragmentData.header.layer.wtTable.holder;
      }
    }

    if (nextParent === this.TEXTAREA_PARENT.parentNode || nextParent.contains(this.TEXTAREA_PARENT)) {
      return;
    }

    nextParent.appendChild(this.TEXTAREA_PARENT);
  }

  /**
   * Binds events and hooks.
   *
   * @private
   */
  bindEvents(): void {
    const editor = this;

    this.eventManager.addEventListener(this.TEXTAREA, 'cut', (event: Event) => event.stopPropagation());
    this.eventManager.addEventListener(this.TEXTAREA, 'paste', (event: Event) => event.stopPropagation());

    this.addHook('afterScrollHorizontally', () => editor.refreshDimensions());
    this.addHook('afterScrollVertically', () => editor.refreshDimensions());

    this.addHook('afterColumnResize', () => {
      editor.refreshDimensions();
      editor.focus();
    });

    this.addHook('afterRowResize', () => {
      editor.refreshDimensions();
      editor.focus();
    });
  }

  /**
   * On before key down callback.
   *
   * @private
   */
  allowKeyEventPropagation(): void {}

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
   * Register shortcuts needed in the editor.
   *
   * @private
   */
  registerShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    const insertNewLine = (): void => {
      const caretPosition = getCaretPosition(this.TEXTAREA);
      const value = this.TEXTAREA.value;

      this.TEXTAREA.value = (value.slice(0, caretPosition) + '\n' + value.slice(caretPosition));
      setCaretPosition(this.TEXTAREA, caretPosition + 1);
    };

    // Dirty workaround.
    // Certain actions are executed by default on specific platforms and the TextEditor just inherits them.
    // Creating default shortuts will overwrite them, making them available only with a modifier key.
    if ((isIOS() && !this.hot.getSettings().autoWrapRow) ||
        (!isIOS() && !this.hot.getSettings().autoWrapCol)) {
      editorContext.addShortcut({
        keys: [['Enter']],
        callback: () => {
          this.hot.view.wt.wtOverlays.inlineStartOverlay.getScrollableElement().scrollLeft = 0;

          return true;
        },
        runOnlyIf: () => this.hot.getSettings().enterBeginsEditing,
        group: SHORTCUTS_GROUP,
      });
    }

    editorContext.addShortcut({
      keys: [['ArrowUp']],
      callback: () => {
        if (this.hot.isEditorOpened() && !this.isInFullEditMode()) {
          this.hot.selectCell(this.row as number - 1, this.col as number, void 0, void 0, void 0, false);
        }

        return true;
      },
      runOnlyIf: () => !this.isInFullEditMode(),
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcut({
      keys: [['ArrowDown']],
      callback: () => {
        if (this.hot.isEditorOpened() && !this.isInFullEditMode()) {
          this.hot.selectCell(this.row as number + 1, this.col as number, void 0, void 0, void 0, false);
        }

        return true;
      },
      runOnlyIf: () => !this.isInFullEditMode(),
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcut({
      keys: [['Enter']],
      callback: () => {
        if (this.hot.getSettings().enterBeginsEditing) {
          // If with pressed ENTER is connected more than one shortcut, the next shortcuts won't be executing.
          if (this.isInFullEditMode() && !this.hot.getSettings().autoWrapRow) {
            insertNewLine();

            return false;
          }
        }

        return true;
      },
      runOnlyIf: () => this.isInFullEditMode() && !this.hot.getSettings().autoWrapRow,
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcut({
      keys: [['Tab']],
      callback: () => {
        if (this.hot.isEditorOpened() && !this.isInFullEditMode()) {
          this.hot.selectCell(this.row as number, this.col as number + 1, void 0, void 0, void 0, false);
        }

        return false;
      },
      runOnlyIf: () => !this.isInFullEditMode(),
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcut({
      keys: [['Shift', 'Tab']],
      callback: () => {
        if (this.hot.isEditorOpened() && !this.isInFullEditMode()) {
          this.hot.selectCell(this.row as number, this.col as number - 1, void 0, void 0, void 0, false);
        }

        return false;
      },
      runOnlyIf: () => !this.isInFullEditMode(),
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcut({
      keys: [['Home']],
      callback: () => {
        if (this.isInFullEditMode()) {
          updateCaretPosition('home', this.TEXTAREA);

          return false;
        }

        return true;
      },
      runOnlyIf: () => this.isInFullEditMode(),
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcut({
      keys: [['End']],
      callback: () => {
        if (this.isInFullEditMode()) {
          updateCaretPosition('end', this.TEXTAREA);

          return false;
        }

        return true;
      },
      runOnlyIf: () => this.isInFullEditMode(),
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts needed in the editor.
   *
   * @private
   */
  unregisterShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }
}
