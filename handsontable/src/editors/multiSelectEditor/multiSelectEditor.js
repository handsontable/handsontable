import { TextEditor } from '../textEditor';
import { DropdownController } from './controllers/dropdownController';
import { SelectedItemsController } from './controllers/selectedItemsController';
import { InputController } from './controllers/inputController';
import {
  getValuesIntersection,
  parseStringifiedValue,
  getSourceItemByValue,
} from './utils/utils';

export const EDITOR_TYPE = 'multiSelect';
const DROPDOWN_ELEMENT_CSS_CLASSNAME = 'htMultiSelectEditor';
const SHORTCUTS_GROUP = 'multiSelectEditor';

/**
 * @private
 * @class MultiSelectEditor
 */
export class MultiSelectEditor extends TextEditor {
  /**
   * Container element that hosts the dropdown with checkbox options.
   *
   * @private
   * @type {HTMLDivElement}
   */
  dropdownContainerElement;
  /**
   * Dropdown controller responsible for rendering and syncing option states.
   *
   * @private
   * @type {DropdownController|null}
   */
  dropdownController = this.dropdownController ?? null;

  /**
   * Set of values that are currently checked in the dropdown.
   *
   * @private
   * @type {Set<*>}
   */
  selectedItems = new SelectedItemsController();

  /**
   * Input controller responsible for managing the input.
   *
   * @private
   * @type {InputController}
   */
  inputController = this.inputController ?? null;

  /**
   * Cache for the editor.
   *
   * @private
   * @type {object}
   */
  #cache = {
    lastTextareaValue: null,
  };

  /**
   * Returns the editor type.
   *
   * @returns {string} The editor type.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements() {
    super.createElements();

    this.dropdownContainerElement = this.hot.rootDocument.createElement('div');
    this.dropdownContainerElement.className = `${DROPDOWN_ELEMENT_CSS_CLASSNAME} handsontableEditor`;

    this.TEXTAREA_PARENT.appendChild(this.dropdownContainerElement);

    this.dropdownController = new DropdownController(this.dropdownContainerElement);

    this.inputController = new InputController({ input: this.TEXTAREA, eventManager: this.eventManager });
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
  prepare(row, col, prop, td, value, cellProperties) {
    super.prepare(row, col, prop, td, value, cellProperties);

    const parsedValue = parseStringifiedValue(value);
    const valuesArray = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
    const valuesIntersection = getValuesIntersection(valuesArray, this.cellProperties.source);

    this.#syncSelectedValues(valuesIntersection);

    this.dropdownController.fillDropdown(this.cellProperties.source, valuesIntersection);

    this.dropdownController.setVisibleRowsNumber(this.#getEditorSetting('visibleRows'));
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    if (!restoreOriginalValue) {
      this.setValue(this.selectedItems.stringifyValues());
    }

    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * Binds events to the editor.
   *
   * @private
   */
  bindEvents() {
    super.bindEvents();

    this.dropdownController.addLocalHook('dropdownItemChecked',
      (selectedKey, selectedValue) => this.#addSelectedValue(selectedKey, selectedValue)
    );
    this.dropdownController.addLocalHook('dropdownItemUnchecked',
      (deselectedKey, deselectedValue) => this.#removeSelectedValue(deselectedKey, deselectedValue)
    );
    this.dropdownController.addLocalHook('dropdownFocus', () => this.#onDropdownFocus());
    this.dropdownController.addLocalHook('dropdownDefocus', () => this.#onDropdownDefocus());

    this.inputController.addLocalHook('commit', (...args) => this.#onTextareaCommit(...args));
    this.inputController.addLocalHook('triggerFilter', wordAtCaret => this.filterEntries(wordAtCaret));
  }

  /**
   * Opens the editor.
   */
  open() {
    super.open();

    this.dropdownController.updateDimensions(this.getAvailableSpace());
  }

  /**
   * Closes the editor.
   */
  close() {
    super.close();

    this.dropdownController.reset();
    this.#cache = {};
  }

  /**
   * Returns the editor's value.
   *
   * @returns {string} The editor's value.
   */
  getValue() {
    return this.selectedItems.getItemsArray();
  }

  /**
   * Filters the dropdown entries.
   *
   * @param {string} wordAtCaret The word at the caret position.
   * @param {boolean} keepSelectedItems If true, the selected items will be kept in the dropdown.
   */
  filterEntries(wordAtCaret, keepSelectedItems = true) {
    const filteredItems = this.cellProperties.source.filter((item) => {
      const value = item?.value ?? item;

      if (keepSelectedItems && this.selectedItems.has(item)) {
        return true;
      }

      return value.toLowerCase().includes(wordAtCaret.toLowerCase());
    });

    this.dropdownController.fillDropdown(filteredItems, this.selectedItems.getItemsArray());
    this.dropdownController.updateDimensions(this.getAvailableSpace(), true);
  }

  /**
   * Gets the available space for the dropdown.
   *
   * @returns {{spaceAbove: number, spaceBelow: number, cellHeight: number}} The available space.
   */
  getAvailableSpace() {
    const cellRect = this.getEditedCellRect();
    const isVerticallyScrollableByWindow = this.hot.view.isVerticallyScrollableByWindow();
    const workspaceHeight = this.hot.view.getWorkspaceHeight();

    let spaceAbove = cellRect.top;

    if (isVerticallyScrollableByWindow) {
      const topOffset = this.hot.view.getTableOffset().top - this.hot.rootWindow.scrollY;

      spaceAbove = Math.max(spaceAbove + topOffset, 0);
    }

    const spaceBelow = workspaceHeight - spaceAbove - cellRect.height;

    return {
      spaceAbove,
      spaceBelow,
      cellHeight: cellRect.height,
    };
  }

  /**
   * Called when the editor is destroyed.
   *
   * @private
   */
  destroy() {
    this.super.destroy();

    this.inputController = null;
  }

  /**
   * Handles textarea commit event.
   *
   * @private
   * @param {string[]} values The values from the textarea.
   */
  #onTextareaCommit(values) {
    this.selectedItems.clear();
    this.selectedItems.add(values.map(value => getSourceItemByValue(value, this.cellProperties.source)));
    this.dropdownController.removeAllDropdownItems();
    this.dropdownController.fillDropdown(this.cellProperties.source, this.selectedItems.getItemsArray());
    this.dropdownController.updateDimensions(this.getAvailableSpace(), true);
  }

  /**
   * Called when the dropdown is focused.
   *
   * @private
   */
  #onDropdownFocus() {
    this.TEXTAREA.blur();
  }

  /**
   * Called when the dropdown is defocused.
   *
   * @private
   */
  #onDropdownDefocus() {
    this.TEXTAREA.focus();
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  registerShortcuts() {
    super.registerShortcuts();

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.addShortcuts([{
      keys: [['ArrowUp']],
      callback: () => {
        this.dropdownController.focusPreviousItem();
      },
    }, {
      keys: [['ArrowDown']],
      callback: () => {
        this.dropdownController.focusNextItem();
      },
    }], {
      group: SHORTCUTS_GROUP,
    });

    this.inputController.listen();
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  unregisterShortcuts() {
    super.unregisterShortcuts();

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);

    this.inputController.unlisten();
  }

  /**
   * Adds a value reported by the dropdown to the selection set and mirrors it in the textarea.
   *
   * @private
   * @param {string} selectedKey Key of the selected value.
   * @param {string} selectedValue Value of the selected value.
   */
  #addSelectedValue(selectedKey, selectedValue) {
    if (selectedKey) {
      this.selectedItems.add({ key: selectedKey, value: selectedValue });

    } else {
      this.selectedItems.add(selectedValue);
    }

    this.setValue(this.selectedItems.stringifyValues());
    this.refreshDimensions();
  }

  /**
   * Removes a deselected dropdown value from the selection set and updates the textarea.
   *
   * @private
   * @param {string} deselectedKey Key of the deselected value.
   * @param {string} deselectedValue Value of the deselected value.
   */
  #removeSelectedValue(deselectedKey, deselectedValue) {
    if (deselectedKey) {
      this.selectedItems.remove({ key: deselectedKey, value: deselectedValue });

    } else {
      this.selectedItems.remove(deselectedValue);
    }

    this.setValue(this.selectedItems.stringifyValues());
    this.refreshDimensions();
  }

  /**
   * Synchronizes the internal selection set with data deserialized from the cell value.
   *
   * @private
   * @param {Array<*>} valuesArray Values decoded from the stored JSON string.
   */
  #syncSelectedValues(valuesArray) {
    if (valuesArray.length > 0) {
      this.selectedItems = new SelectedItemsController(valuesArray);

    } else {
      this.selectedItems = new SelectedItemsController();
    }
  }

  /**
   * Helper for reading editor-related settings directly from the cell meta.
   *
   * @private
   * @param {string} settingKey Cell meta key to read.
   * @returns {*} Returns the stored value for the provided key.
   */
  #getEditorSetting(settingKey) {
    return this.cellProperties[settingKey];
  }
}
