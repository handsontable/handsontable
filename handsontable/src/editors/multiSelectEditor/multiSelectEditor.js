import { BaseEditor } from '../baseEditor';
import EventManager from '../../eventManager';
import { DropdownController } from './controllers/dropdownController';
import { SelectedItemsController } from './controllers/selectedItemsController';
import { addClass } from '../../helpers/dom/element';
import { EDITOR_EDIT_GROUP } from '../../shortcutContexts/constants';
import {
  getValuesIntersection,
  parseStringifiedValue,
} from './utils/utils';

export const EDITOR_TYPE = 'multiSelect';

const DROPDOWN_ELEMENT_CSS_CLASSNAME = 'ht-multi-select-editor';
const SHORTCUTS_GROUP = 'multiSelectEditor';
const EDITOR_VISIBLE_CLASS_NAME = 'ht_editor_visible';

/**
 * @private
 * @class MultiSelectEditor
 */
export class MultiSelectEditor extends BaseEditor {
  /**
   * Prevent the editor from closing after data change.
   *
   * @type {boolean}
   */
  _closeAfterDataChange = false;

  /**
   * Set of values that are currently checked in the dropdown.
   *
   * @private
   * @type {SelectedItemsController}
   */
  #selectedItems = new SelectedItemsController();

  /**
   * Container element that hosts the editor.
   *
   * @private
   * @type {HTMLDivElement}
   */
  #editorContainer = null;

  /**
   * Container element that hosts the dropdown with checkbox options.
   *
   * @private
   * @type {HTMLDivElement}
   */
  dropdownContainerElement = null;

  /**
   * Dropdown controller responsible for rendering and syncing option states.
   *
   * @private
   * @type {DropdownController|null}
   */
  dropdownController = this.dropdownController ?? null;

  /**
   * Returns the editor type.
   *
   * @returns {string} The editor type.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * @param {Core} hotInstance The Handsontable instance.
   */
  constructor(hotInstance) {
    super(hotInstance);

    this.eventManager = new EventManager(this);

    this.createElements();
    this.bindEvents();
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements() {
    const { rootDocument } = this.hot;

    this.#editorContainer = rootDocument.createElement('div');
    addClass(this.#editorContainer, 'handsontableEditor');

    this.dropdownContainerElement = this.hot.rootDocument.createElement('div');
    this.dropdownContainerElement.className = `${DROPDOWN_ELEMENT_CSS_CLASSNAME} handsontableEditor`;

    this.#editorContainer.appendChild(this.dropdownContainerElement);
    this.hot.rootElement.appendChild(this.#editorContainer);

    this.dropdownController = new DropdownController(this.dropdownContainerElement);
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

    this.dropdownController.setSourceSortFunction(this.cellProperties.sourceSortFunction);

    this.dropdownController.fillDropdown(this.cellProperties.source, valuesIntersection);

    this.dropdownController.setVisibleRowsNumberSetting(this.#getEditorSetting('visibleRows'));

    if (cellProperties.maxSelections !== undefined) {
      this.#selectedItems.setMaxSelectionCount(cellProperties.maxSelections);
    }
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }

  /**
   * Binds events to the editor.
   *
   * @private
   */
  bindEvents() {
    this.dropdownController.addLocalHook('afterDropdownItemChecked',
      (selectedKey, selectedValue) => {
        this.#addSelectedValue(selectedKey, selectedValue);

        if (this.#selectedItems.getSize() >= this.cellProperties.maxSelections) {
          this.#blockNewSelections();
        }
      }
    );
    this.dropdownController.addLocalHook('afterDropdownItemUnchecked',
      (deselectedKey, deselectedValue) => {
        this.#removeSelectedValue(deselectedKey, deselectedValue);

        if (this.#selectedItems.getSize() < this.cellProperties.maxSelections) {
          this.#unblockNewSelections();
        }
      }
    );

    this.hot.addHook('afterDestroy', () => this.destroy());
    this.hot.addHook('afterSetSourceDataAtCell', (...args) => this.#onAfterSetSourceDataAtCell(...args));
    this.addHook('afterScrollHorizontally', () => this.refreshDimensions());
    this.addHook('afterScrollVertically', () => this.refreshDimensions());

    this.dropdownController.getInputController().addLocalHook('triggerFilter', value => this.#filterEntries(value));
  }

  /**
   * Opens the editor.
   */
  open() {
    this.#showEditableElement();
    this.refreshDimensions();
    this.hot.getShortcutManager().setActiveContextName('editor');
    this.#registerShortcuts();
    this.dropdownController.getInputController().listen();

    this.dropdownController.updateDimensions(this.#getAvailableSpace());
    this.dropdownController.focusFirstItem();
  }

  /**
   * Closes the editor.
   */
  close() {
    this.#hideEditableElement();
    this.#unregisterShortcuts();
    this.dropdownController.getInputController().unlisten();
    this.dropdownController.reset();
  }

  /**
   * Returns the editor's value.
   *
   * @returns {string} The editor's value.
   */
  getValue() {
    return this.#selectedItems.getItemsArray();
  }

  /**
   * Sets the editor's value.
   */
  setValue() {
    // Currently not implemented.
    //
    // As the MultiSelectEditor saves data after every change, there's no need to set the value when
    // the editor is closed.
    //
    // TODO: discuss this behavior and consider implementing an option for the data-saving strategy.
  }

  /**
   * Refreshes the editor's dimensions.
   */
  refreshDimensions() {
    // TD is outside of the viewport.
    if (!this.getEditedCell()) {
      this.close();

      return;
    }

    const { top, start, height } = this.getEditedCellRect();
    const editorStyle = this.#editorContainer.style;

    editorStyle.top = `${top + height}px`;
    editorStyle[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;

    addClass(this.#editorContainer, EDITOR_VISIBLE_CLASS_NAME);
  }

  /**
   * Focuses the editor.
   */
  focus() {
    this.dropdownController.focusFirstItem();
  }

  /**
   * Gets the input element.
   *
   * @returns {HTMLInputElement} The input element.
   */
  getInputElement() {
    return this.dropdownController.getInputController().getInputElement();
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  #registerShortcuts() {
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
        if (this.hot.rootDocument.activeElement === this.getInputElement()) {
          this.dropdownController.focusFirstItem();
        } else {
          this.dropdownController.focusNextItem();
        }
      },
    }], {
      group: SHORTCUTS_GROUP,
    });

    editorContext.addShortcuts([{
      keys: [['enter'], ['shift', 'enter'], ['control/meta', 'enter'], ['control/meta', 'shift', 'enter']],
      runOnlyIf: () => !this.#getEditorSetting('enterCommits'),
      callback: (event) => {
        const activeElement = this.hot.rootDocument.activeElement;

        if (activeElement.tagName === 'INPUT' && activeElement.type === 'checkbox') {
          activeElement.checked = !activeElement.checked;
          activeElement.dispatchEvent(new Event('change'));
        }

        event.preventDefault();

        return false;
      },
    }, {
      keys: [['space']],
      runOnlyIf: () => !this.#getEditorSetting('enterCommits'),
      callback: (event) => {
        event.preventDefault();
      },
    }], {
      group: SHORTCUTS_GROUP,
      relativeToGroup: EDITOR_EDIT_GROUP,
      position: 'before',
    });
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  #unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Called when the editor is destroyed.
   *
   * @private
   */
  destroy() {
    this.close();
    this.dropdownController.reset();
  }

  /**
   * Shows the editable element.
   */
  #showEditableElement() {
    this.#editorContainer.style.display = '';
  }

  /**
   * Hides the editable element.
   */
  #hideEditableElement() {
    this.#editorContainer.style.display = 'none';
  }

  /**
   * Blocks new selections.
   */
  #blockNewSelections() {
    this.dropdownController.disableCheckboxes();
  }

  /**
   * Unblocks new selections.
   */
  #unblockNewSelections() {
    this.dropdownController.enableCheckboxes();
  }

  /**
   * Filters the dropdown entries.
   *
   * @param {string} query The value of the input.
   * @param {boolean} keepSelectedItems If true, the selected items will be kept in the dropdown.
   */
  #filterEntries(query, keepSelectedItems = true) {
    const filteredItems = this.cellProperties.source.filter((item) => {
      const value = item?.value ?? item;

      if (keepSelectedItems && this.#selectedItems.has(item)) {
        return true;
      }

      if (this.cellProperties.filteringCaseSensitive) {
        return value.includes(query);
      }

      return value.toLowerCase().includes(query.toLowerCase());
    });

    this.dropdownController.fillDropdown(filteredItems, this.#selectedItems.getItemsArray());
    this.dropdownController.updateDimensions(this.#getAvailableSpace(), true);
  }

  /**
   * Gets the available space for the dropdown.
   *
   * @returns {{spaceAbove: number, spaceBelow: number, cellHeight: number}} The available space.
   */
  #getAvailableSpace() {
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
   * Saves the current selection state to the cell without closing the editor.
   *
   * @private
   */
  #saveCurrentSelection() {
    const value = this.#selectedItems.getItemsArray();

    this.saveValue([[value]]);
  }

  /**
   * Adds a value reported by the dropdown to the selection set and saves to the cell.
   *
   * @private
   * @param {string} selectedKey Key of the selected value.
   * @param {string} selectedValue Value of the selected value.
   */
  #addSelectedValue(selectedKey, selectedValue) {
    if (selectedKey) {
      this.#selectedItems.add({ key: selectedKey, value: selectedValue });

    } else {
      this.#selectedItems.add(selectedValue);
    }

    this.#saveCurrentSelection();
    this.refreshDimensions();
  }

  /**
   * Removes a deselected dropdown value from the selection set and saves to the cell.
   *
   * @private
   * @param {string} deselectedKey Key of the deselected value.
   * @param {string} deselectedValue Value of the deselected value.
   */
  #removeSelectedValue(deselectedKey, deselectedValue) {
    if (deselectedKey) {
      this.#selectedItems.remove({ key: deselectedKey, value: deselectedValue });

    } else {
      this.#selectedItems.remove(deselectedValue);
    }

    this.#saveCurrentSelection();
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
      this.#selectedItems = new SelectedItemsController(valuesArray);

    } else {
      this.#selectedItems = new SelectedItemsController();
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

  /**
   * `afterSetSourceDataAtCell` hook callback.
   *
   * @private
   * @param {Array<*>} changes The changes.
   * @param {string} source The source of the change.
   */
  #onAfterSetSourceDataAtCell(changes, source) {
    if (this.isOpened() && source === `${EDITOR_TYPE}-renderer`) {

      this.#syncSelectedValues(changes[0][3]);
      this.dropdownController.fillDropdown(this.cellProperties.source, this.#selectedItems.getItemsArray());
      this.dropdownController.focusItem(0);
    }
  }
}
