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
import { getCharacterLength, removeCharactersBefore } from '../../helpers/string';
import { isMaxLengthActive } from '../../validators/maxLengthValidator';
import { updateCaretPosition } from './caretPositioner';
import { selectionFillsOtherCells } from '../../selection/fillSelection';
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
   * Tracks whether the editor was transiently hidden because its edited cell scrolled out of the
   * rendered range (as opposed to the edit ending). Set from the return value of
   * {@link TextEditor#hideForScroll}, read in {@link TextEditor#refreshDimensions} to re-show a
   * layered editor's UI once the cell scrolls back into view.
   *
   * @type {boolean}
   */
  #hiddenByScroll = false;

  /**
   * The length of the editor's content in characters, and the length of the part of it that is
   * selected, taken just before the user changes the content. It tells the `maxLength` cap how much
   * of the content is new. It is `null` when no change is pending.
   *
   * @type {{length: number, selectedLength: number} | null}
   */
  #contentBeforeChange: { length: number, selectedLength: number } | null = null;

  /**
   * Returns the `maxLength` of the edited cell when this editor caps its input and the cell has a
   * finite limit.
   *
   * @returns {number|null} The limit, or `null` when the editor does not cap the input.
   */
  #getLengthLimit = (): number | null => {
    const { maxLength } = this.cellProperties;

    return this.capsLength && isMaxLengthActive(maxLength) ? maxLength : null;
  };

  /**
   * Counts the characters of the editor's content the way the validator counts the cell's value: after
   * `trimWhitespace`, when the cell has it on, so a pasted text with a leading space is not cut for
   * a character that the commit would trim anyway.
   *
   * @param {string} value The content of the editor.
   * @returns {number} The number of characters.
   */
  #measureContent = (value: string): number => {
    return getCharacterLength(this.cellProperties.trimWhitespace ? value.trim() : value);
  };

  /**
   * Remembers the content of the editor before a change, for the `maxLength` cap. A change made
   * during an IME composition is remembered at `compositionstart` instead, because the value belongs
   * to the IME until `compositionend`. Also called right before the editor inserts text itself.
   *
   * @param {Event} [event] The `beforeinput` or `compositionstart` event of the editor's element.
   */
  #rememberContent = (event?: Event): void => {
    const { isComposing = false }: Partial<InputEvent> = event ?? {};

    if (isComposing || this.#getLengthLimit() === null) {
      return;
    }

    const { value, selectionStart, selectionEnd } = this.TEXTAREA;
    const start = selectionStart ?? value.length;

    this.#contentBeforeChange = {
      length: this.#measureContent(value),
      selectedLength: getCharacterLength(value.slice(start, selectionEnd ?? start)),
    };
  };

  /**
   * Keeps the editor's content within the cell's `maxLength` after the user inserts text.
   *
   * The limit is counted in the characters a reader sees (grapheme clusters), so a flag counts as
   * one. The excess is removed from just before the end of the selection, which is where the
   * inserted text ends, so typing at the end of a full cell does nothing, and a paste that does not
   * fit is cut at the limit. Only the inserted text is removed, so typing into a value that was
   * already too long never eats the text that was there.
   *
   * The cap leaves four cases alone. Deleting and stepping through the undo history only remove or
   * restore text the user already had, so a value that was too long can be shortened by hand. A drop
   * can move text that is already in the value, which looks like an insert of that text, so it is
   * left alone too. While an IME composition is in progress the value belongs to the IME, so the cap
   * waits for `compositionend`. An insert that no `beforeinput` announced leaves the value as it is,
   * because there is no way to tell which part of it is new. The validator still marks such a value.
   *
   * The editor counts the characters the way the validator does, after `trimWhitespace`.
   *
   * @param {Event} event The `input` or `compositionend` event of the editor's element.
   */
  #capLength = (event: Event): void => {
    const { isComposing = false, inputType = '' }: Partial<InputEvent> = event;
    const maxLength = this.#getLengthLimit();

    if (maxLength === null || isComposing) {
      return;
    }

    const before = this.#contentBeforeChange;

    this.#contentBeforeChange = null;

    if (before === null || /^(delete|history|insertFromDrop)/.test(inputType)) {
      return;
    }

    const { value, selectionEnd } = this.TEXTAREA;
    const length = this.#measureContent(value);
    const excess = length - maxLength;

    if (excess <= 0) {
      return;
    }

    const inserted = length - (before.length - before.selectedLength);
    const capped = removeCharactersBefore(value, selectionEnd ?? value.length, Math.min(excess, inserted));

    if (capped.value !== value) {
      this.TEXTAREA.value = capped.value;
      setCaretPosition(this.TEXTAREA, capped.index, capped.index);
    }
  };

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
   * Tells whether the editor stops the user from typing or pasting more characters than the
   * [`maxLength`](@/api/options.md#maxlength) of the cell allows. An editor that extends this one
   * inherits the cap. The built-in editors that have their own input rules turn it off by
   * overriding this getter to return `false`.
   *
   * @returns {boolean}
   */
  protected get capsLength(): boolean {
    return true;
  }

  /**
   * Opens the editor and adjust its size.
   */
  open(): void {
    this._opened = true;
    this.#hiddenByScroll = false;
    this.#contentBeforeChange = null;
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
    this.#hiddenByScroll = false;
    this.#contentBeforeChange = null;
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
    // The editor now shows the cell's own value again, so the unchanged-edit baseline has to follow
    // it. Leaving the opening value in place would compare the user's next confirm against content
    // the editor no longer holds.
    this.resetValueBeforeEdit();
    this.refreshDimensions();
  }

  /**
   * Hides the editor because its edited cell scrolled out of the rendered range. This is a transient,
   * reversible hide, not the end of the edit. The base editor has no persistent layer of its own, so
   * it delegates to the destructive {@link TextEditor#close} to preserve the historic inline-editor
   * behavior, and reports that the hide was not transient. Layered editors (Handsontable, autocomplete,
   * dropdown) override this to hide only their UI while keeping the edit alive, and return `true`.
   *
   * @private
   * @returns {boolean} `true` when the hide is transient and the layer must be re-shown on scroll-back.
   */
  hideForScroll(): boolean {
    this.close();

    return false;
  }

  /**
   * Re-shows the editor's layer after its edited cell scrolled back into the rendered range. No-op for
   * the base editor, which has no persistent layer. Layered editors override this to restore their UI.
   *
   * @private
   */
  showAfterScroll(): void {}

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
        // Hide the editor for now; the edit stays alive. A layered editor keeps its list state so it
        // can be re-shown, still populated, once the cell scrolls back (see the tail of this method).
        this.#hiddenByScroll = this.hideForScroll();
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

    // The cell scrolled back into the rendered range after a transient scroll-hide. The textarea has
    // just been restored above; restore `_opened` and let a layered editor restore and re-anchor its
    // UI too. Restoring `_opened` here is required: `hideForScroll()` cleared it, and while it is false
    // `Core#applyChanges()` treats the live edit as closed - the next data change runs `prepareEditor()`,
    // which resets the editor to `VIRGIN` and blanks the value the user typed. It must be set on the way
    // back, not inside the overrides, because `AutocompleteEditor#showAfterScroll()` does not call
    // `super`. `open()` clears `#hiddenByScroll` up front, so its own `refreshDimensions()` cannot
    // trigger this; the `!force` gate covers `prepare()`, which calls `refreshDimensions(true)` before
    // any scroll-hide can occur.
    if (!force && this.#hiddenByScroll) {
      this.#hiddenByScroll = false;
      this._opened = true;
      this.showAfterScroll();
    }
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

    // Every listener ends at once for an editor that does not cap, or a cell without a limit.
    this.eventManager.addEventListener(this.TEXTAREA, 'beforeinput', this.#rememberContent);
    this.eventManager.addEventListener(this.TEXTAREA, 'compositionstart', this.#rememberContent);
    this.eventManager.addEventListener(this.TEXTAREA, 'input', this.#capLength);
    this.eventManager.addEventListener(this.TEXTAREA, 'compositionend', this.#capLength);

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
      // `execCommand()` fires `input` without a `beforeinput`, so the cap needs its snapshot first.
      this.#rememberContent();
      this.hot.rootDocument.execCommand('insertText', false, '\n');
    };

    // The newline is for a selection the editor's own save would not spread the value across. That
    // has to be the same question `finishEditing()` asks, or the two disagree and the keystroke both
    // inserts a line break and populates - `isMultiple()` alone reads the active layer only, so it
    // missed every other layer (DEV-103).
    const populatesOtherCells = () =>
      selectionFillsOtherCells(this.hot, this.getValue(), this.row, this.col);

    editorContext!.addShortcuts([{
      keys: [['Control', 'Enter']],
      callback: () => {
        insertNewLine();

        return false; // Will block closing editor.
      },
      runOnlyIf: (event?: KeyboardEvent) => !populatesOtherCells() && // We trigger a data population for multiple selection.
        // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        !event?.altKey,
    }, {
      keys: [['Meta', 'Enter']],
      callback: () => {
        insertNewLine();

        return false; // Will block closing editor.
      },
      runOnlyIf: () => !populatesOtherCells(), // We trigger a data population for multiple selection.
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
