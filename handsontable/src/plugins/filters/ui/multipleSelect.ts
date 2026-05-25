import type { HotInstance } from '../../../core/types';
import { addClass, eventTargetEl, getScrollbarWidth } from '../../../helpers/dom/element';
import { clone, extend } from '../../../helpers/object';
import { isKey } from '../../../helpers/unicode';
import { partial } from '../../../helpers/function';
import { dataRowToChangesArray } from '../../../helpers/data';
import * as C from '../../../i18n/constants';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { BaseUI, BaseUIOptions } from './_base';
import { InputUI } from './input';
import { LinkUI } from './link';
import { createArrayAssertion } from '../utils';

const SHORTCUTS_GROUP = 'multipleSelect.itemBox';

interface SelectItem {
  checked: boolean;
  value: unknown;
  visualValue?: string;
  [key: string]: unknown;
}

/**
 * @private
 * @class MultipleSelectUI
 */
export class MultipleSelectUI extends BaseUI {
  static get DEFAULTS(): BaseUIOptions {
    return clone({
      className: 'htUIMultipleSelect',
      value: [],
    }) as BaseUIOptions;
  }

  /**
   * List of available select options.
   *
   * @type {Array}
   */
  #items: SelectItem[] = [];
  #itemsBox: HotInstance;
  #locale: string;
  #searchInput;
  #selectAllUI;
  #clearAllUI;

  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(
      MultipleSelectUI.DEFAULTS as Record<string, unknown>, options
    ) as Record<string, unknown>);

    this.#searchInput = new InputUI(this.hot, {
      placeholder: C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH,
      className: 'htUIMultipleSelectSearch',
    });
    this.#selectAllUI = new LinkUI(this.hot, {
      textContent: C.FILTERS_BUTTONS_SELECT_ALL,
      className: 'htUISelectAll',
    });
    this.#clearAllUI = new LinkUI(this.hot, {
      textContent: C.FILTERS_BUTTONS_CLEAR,
      className: 'htUIClearAll',
    });

    this.registerHooks();
  }

  /**
   * Gets the instance of the internal Handsontable that acts here as a listbox component.
   *
   * @returns {Handsontable}
   */
  getItemsBox() {
    return this.#itemsBox;
  }

  /**
   * Register all necessary hooks.
   */
  registerHooks() {
    this.#searchInput.addLocalHook('keydown', (event: KeyboardEvent) => this.#onInputKeyDown(event));
    this.#searchInput.addLocalHook('input', (event: Event) => this.#onInput(event));
    this.#selectAllUI.addLocalHook('click', (event: Event) => this.#onSelectAllClick(event));
    this.#clearAllUI.addLocalHook('click', (event: Event) => this.#onClearAllClick(event));
  }

  /**
   * Set available options.
   *
   * @param {Array} items Array of objects with `checked` and `label` property.
   */
  setItems(items: Record<string, unknown>[]) {
    this.#items = items as SelectItem[];
    this.#itemsBox?.loadData(this.#items);
  }

  /**
   * Set a locale for the component.
   *
   * @param {string} locale Locale used for filter actions performed on data, ie. `en-US`.
   */
  setLocale(locale: string) {
    this.#locale = locale;
  }

  /**
   * Get a locale for the component.
   *
   * @returns {string}
   */
  getLocale() {
    return this.#locale;
  }

  /**
   * Get all available options.
   *
   * @returns {Array}
   */
  getItems() {
    return [...this.#items];
  }

  /**
   * Get element value.
   *
   * @returns {Array} Array of selected values.
   */
  getValue() {
    return itemsToValue(this.#items);
  }

  /**
   * Gets the instance of the search input element.
   *
   * @returns {InputUI}
   */
  getSearchInputElement() {
    return this.#searchInput;
  }

  /**
   * Gets the instance of the "select all" link element.
   *
   * @returns {LinkUI}
   */
  getSelectAllElement() {
    return this.#selectAllUI;
  }

  /**
   * Gets the instance of the "clear" link element.
   *
   * @returns {LinkUI}
   */
  getClearAllElement() {
    return this.#clearAllUI;
  }

  /**
   * Check if all values listed in element are selected.
   *
   * @returns {boolean}
   */
  isSelectedAllValues() {
    return this.#items.length === this.getValue().length;
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    const { rootDocument } = this.hot;
    const itemsBoxWrapper = rootDocument.createElement('div');
    const selectionControl = new BaseUI(this.hot, {
      className: 'htUISelectionControls',
      children: [this.#selectAllUI, this.#clearAllUI],
    });

    this._element.appendChild(this.#searchInput.element);
    this._element.appendChild(selectionControl.element);
    this._element.appendChild(itemsBoxWrapper);

    this.#itemsBox?.destroy();
    addClass(itemsBoxWrapper, 'htUIMultipleSelectHot');

    // Constructs and initializes a new Handsontable instance
    this.#itemsBox = new (
      this.hot.constructor as new (element: HTMLElement, settings: object) => HotInstance
    )(itemsBoxWrapper, {
      data: [[]],
      columns: [{
        data: 'checked',
        type: 'checkbox',
        label: {
          property: 'visualValue',
          position: 'after'
        },
      }],
      beforeRenderer: (
        TD: HTMLTableCellElement, row: number, col: number, prop: string | number,
        value: unknown, cellProperties: Record<string, unknown>
      ) => {
        const cp = cellProperties as { instance: HotInstance; label: { property: string } };

        TD.title = cp.instance.getDataAtRowProp(row, cp.label.property) as string;
      },
      afterListen: () => {
        this.runLocalHooks('focus', this);
      },
      beforeOnCellMouseUp: () => {
        this.#itemsBox.listen();
      },
      modifyColWidth: (width: number | undefined) => {
        const minWidth = this.#itemsBox.container.scrollWidth - getScrollbarWidth(rootDocument);

        if (width !== undefined && width < minWidth) {
          return minWidth;
        }

        return width;
      },
      autoColumnSize: true,
      autoRowSize: false,
      hiddenRows: true,
      maxCols: 1,
      autoWrapCol: true,
      height: 110,
      copyPaste: false,
      disableVisualSelection: 'area',
      fillHandle: false,
      fragmentSelection: 'cell',
      tabMoves: { row: 1, col: 0 },
      themeName: this.hot.getCurrentThemeName(),
      layoutDirection: this.hot.isRtl() ? 'rtl' : 'ltr',
    });
    this.#itemsBox.init();

    const shortcutManager = this.#itemsBox.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.removeShortcutsByKeys(['Tab']);
    gridContext.removeShortcutsByKeys(['Shift', 'Tab']);
    gridContext.addShortcut({
      keys: [['Escape']],
      callback: (event: KeyboardEvent) => {
        this.runLocalHooks('keydown', event, this);
      },
      group: SHORTCUTS_GROUP
    });
    gridContext.addShortcut({
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event: KeyboardEvent) => {
        this.#itemsBox.deselectCell();

        this.runLocalHooks('keydown', event, this);
        this.runLocalHooks('listTabKeydown', event, this);
      },
      group: SHORTCUTS_GROUP
    });
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.#itemsBox.listen();
    }
  }

  /**
   * Reset DOM structure.
   */
  reset() {
    this.#searchInput.reset();
    this.#selectAllUI.reset();
    this.#clearAllUI.reset();
  }

  /**
   * Update DOM structure.
   */
  update() {
    if (!this.isBuilt() || this.#itemsBox.rootElement.offsetHeight === 0) {
      return;
    }

    this.#itemsBox.updateSettings({
      data: valueToItems(this.#items, (this.options as Record<string, unknown>).value as unknown[]),
    });

    super.update();
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.#itemsBox?.destroy();
    this.#searchInput.destroy();
    this.#clearAllUI.destroy();
    this.#selectAllUI.destroy();

    this.#searchInput = null;
    this.#clearAllUI = null;
    this.#selectAllUI = null;
    this.#itemsBox = null;
    this.#items = null;
    super.destroy();
  }

  /**
   * 'input' event listener for input element.
   *
   * @param {Event} event DOM event.
   */
  #onInput(event: Event) {
    const trimmed = eventTargetEl<HTMLInputElement>(event)!.value.trim();
    const value = trimmed.toLocaleLowerCase(this.getLocale());

    if ((this.options as Record<string, unknown>).searchMode === 'apply') {
      const hiddenRows = this.#itemsBox.getPlugin('hiddenRows');
      const rowsToHide: number[] = [];

      hiddenRows.showRows(hiddenRows.getHiddenRows());

      this.#items.forEach((item, index) => {
        item.checked = `${item.value}`.toLocaleLowerCase(this.getLocale()).indexOf(value) >= 0;

        if (!item.checked) {
          rowsToHide.push(index);
        }
      });

      hiddenRows.hideRows(rowsToHide);
      this.#itemsBox.view.adjustElementsSize();
      this.#itemsBox.render();
    } else {
      let filteredItems;

      if (value === '') {
        filteredItems = [...this.#items];
      } else {
        filteredItems = this.#items
          .filter(item => (`${item.value}`).toLocaleLowerCase(this.getLocale()).indexOf(value) >= 0);
      }

      this.#itemsBox.loadData(filteredItems);
    }
  }

  /**
   * 'keydown' event listener for input element.
   *
   * @param {Event} event DOM event.
   */
  #onInputKeyDown(event: KeyboardEvent) {
    this.runLocalHooks('keydown', event, this);

    const isKeyCode = partial(isKey, event.keyCode);

    if (isKeyCode('ARROW_DOWN')) {
      event.preventDefault();
      stopImmediatePropagation(event);
      this.#itemsBox.listen();
      this.#itemsBox.selectCell(0, 0);
    }
  }

  /**
   * On click listener for "Select all" link.
   *
   * @param {DOMEvent} event The mouse event object.
   */
  #onSelectAllClick(event: Event) {
    const changes: unknown[][] = [];

    event.preventDefault();

    (this.#itemsBox.getSourceData() as SelectItem[]).forEach((row, rowIndex) => {
      row.checked = true;

      changes.push(dataRowToChangesArray(row, rowIndex)[0]);
    });

    this.#itemsBox.setSourceDataAtCell(changes);
  }

  /**
   * On click listener for "Clear" link.
   *
   * @param {DOMEvent} event The mouse event object.
   */
  #onClearAllClick(event: Event) {
    const changes: unknown[][] = [];

    event.preventDefault();
    (this.#itemsBox.getSourceData() as SelectItem[]).forEach((row, rowIndex) => {
      row.checked = false;

      changes.push(dataRowToChangesArray(row, rowIndex)[0]);
    });

    this.#itemsBox.setSourceDataAtCell(changes);
  }
}

export default MultipleSelectUI;

/**
 * Pick up object items based on selected values.
 *
 * @param {Array} availableItems Base collection to compare values.
 * @param {Array} selectedValue Flat array with selected values.
 * @returns {Array}
 */
function valueToItems(availableItems: SelectItem[], selectedValue: unknown[]) {
  const arrayAssertion = createArrayAssertion(selectedValue);

  return availableItems.map((item) => {
    item.checked = arrayAssertion(item.value);

    return item;
  });
}

/**
 * Convert all checked items into flat array.
 *
 * @param {Array} availableItems Base collection.
 * @returns {Array}
 */
function itemsToValue(availableItems: SelectItem[]) {
  const items: unknown[] = [];

  availableItems.forEach((item) => {
    if (item.checked) {
      items.push(item.value);
    }
  });

  return items;
}
