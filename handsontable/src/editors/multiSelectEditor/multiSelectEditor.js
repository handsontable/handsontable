import { TextEditor } from '../textEditor';
import { DropdownElement } from './dropdown';
import { isJSON } from '../../helpers/string';
import { arrayToString } from '../../helpers/array';

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
  selectedValues = new Set();

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

    this.dropdown.addLocalHook('dropdownItemChecked', (selectedValue) => this.#addSelectedValue(selectedValue));
    this.dropdown.addLocalHook('dropdownItemUnchecked', (deselectedValue) => this.#removeSelectedValue(deselectedValue));
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

    const valuesArray = isJSON(value) ? JSON.parse(value) : [];

    this.#syncSelectedValues(valuesArray);

    this.dropdown.fillDropdown(this.cellProperties.source, valuesArray);
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
      this.setValue(JSON.stringify(Array.from(this.selectedValues)));
    }

    return super.finishEditing(restoreOriginalValue, ctrlDown, callback);
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
  #addSelectedValue(selectedValue) {
    this.selectedValues.add(selectedValue);

    this.setValue(arrayToString(Array.from(this.selectedValues), ', '));
    this.refreshDimensions();
  }

  /**
   * Removes a deselected dropdown value from the selection set and updates the textarea.
   *
   * @private
   * @param {*} deselectedValue Value emitted when a dropdown checkbox becomes unchecked.
   */
  #removeSelectedValue(deselectedValue) {
    this.selectedValues.delete(deselectedValue);

    this.setValue(arrayToString(Array.from(this.selectedValues), ', '));
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
      this.selectedValues = new Set(valuesArray);
    } else {
      this.selectedValues = new Set();
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
