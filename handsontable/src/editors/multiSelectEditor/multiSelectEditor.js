import { TextEditor } from '../textEditor';
import { DropdownElement } from './dropdown';
import { SelectedItemsController } from './utils/selectedItemsController';
import {
  getValuesFromTextarea,
  getItemElementByValue,
  getValuesIntersection,
  parseStringifiedValue,
  getSourceItemByValue,
} from './utils/utils';

const EDITOR_TYPE = 'multiSelect';
const DROPDOWN_ELEMENT_CSS_CLASSNAME = 'htMultiSelectEditor';
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
   * @type {DropdownElement|null}
   */
  dropdown = this.dropdown ?? null;

  /**
   * Set of values that are currently checked in the dropdown.
   *
   * @private
   * @type {Set<*>}
   */
  selectedItems = new SelectedItemsController();

  /**
   * Returns the editor type.
   *
   * @returns {string} Returns `'multiSelect'`.
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
    this.dropdownContainerElement.className = DROPDOWN_ELEMENT_CSS_CLASSNAME;

    this.TEXTAREA_PARENT.appendChild(this.dropdownContainerElement);

    this.dropdown = new DropdownElement(this.dropdownContainerElement);

    this.dropdown.addLocalHook('dropdownItemChecked', (selectedKey, selectedValue) => this.#addSelectedValue(selectedKey, selectedValue));
    this.dropdown.addLocalHook('dropdownItemUnchecked', (deselectedKey, deselectedValue) => this.#removeSelectedValue(deselectedKey, deselectedValue));
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

    this.dropdown.fillDropdown(this.cellProperties.source, valuesIntersection);
    this.dropdown.updateDimensions(this.cellProperties.source.length, this.#getEditorSetting('visibleRows'));
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

    return super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * Binds events to the editor.
   *
   * @private
   */
  bindEvents() {
    super.bindEvents();

    this.eventManager.addEventListener(this.TEXTAREA, 'keyup', (event) => this.#handleTextareaChange(event));
  }


  /**
   * Returns the editor's value.
   *
   * @returns {string} The editor's value.
   */
  getValue() {
    return this.selectedItems.stringifyItems();
  }
  /**
   * Handles textarea change event.
   *
   * @private
   * @param {*} event The textarea change event.
   */
  #handleTextareaChange(event) {
    const values = getValuesFromTextarea(this.TEXTAREA.value);

    this.selectedItems.clear();
    this.dropdown.deselectAllItems();

    values?.forEach(value => {
      const itemElement = getItemElementByValue(value, this.dropdown.dropdownListElement);

      if (itemElement) {
        this.dropdown.selectItem(itemElement);
        this.selectedItems.add(getSourceItemByValue(value, this.cellProperties.source));
      }
    });
  }
  // /**
  //  * Register shortcuts responsible for handling editor.
  //  *
  //  * @private
  //  */
  // registerShortcuts() {
  //   return super.registerShortcuts();
  // }
  //
  // /**
  //  * Unregister shortcuts responsible for handling editor.
  //  *
  //  * @private
  //  */
  // unregisterShortcuts() {
  //   return super.unregisterShortcuts();
  // }

  /**
   * Adds a value reported by the dropdown to the selection set and mirrors it in the textarea.
   *
   * @private
   * @param {*} selectedValue Value emitted when a dropdown checkbox becomes checked.
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
   * @param {*} deselectedValue Value emitted when a dropdown checkbox becomes unchecked.
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
