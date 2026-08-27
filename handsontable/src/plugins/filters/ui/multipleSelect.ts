import type { HotInstance } from '../../../core/types';
import { addClass, eventTargetEl, getScrollbarWidth } from '../../../helpers/dom/element';
import { clone, extend } from '../../../helpers/object';
import { isKey } from '../../../helpers/unicode';
import { dataRowToChangesArray } from '../../../helpers/data';
import * as C from '../../../i18n/constants';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { localeLowerCase } from '../../../helpers/string';
import type { BaseUIOptions } from './_base';
import { BaseUI } from './_base';
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
  /**
   * Returns the default configuration options for the multiple select UI component.
   */
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
  /**
   * Nested Handsontable instance used to render the list of selectable filter values.
   */
  #itemsBox: HotInstance | null = null;
  /**
   * Lowercased form of every item's value, aligned by index with `#items`. Built lazily on the
   * first search keystroke and reused for subsequent ones — the lowercase form of an item never
   * changes between keystrokes. Invalidated when the items or the locale change.
   */
  #lowerCaseItemValues: string[] | null = null;
  /**
   * Current locale string used for sorting and comparing filter values.
   */
  #locale: string = '';
  /**
   * Input component for searching within the list of selectable filter values.
   */
  #searchInput: InputUI | null = null;
  /**
   * Link component for selecting all available filter values at once.
   */
  #selectAllUI: LinkUI | null = null;
  /**
   * Link component for clearing all selected filter values at once.
   */
  #clearAllUI: LinkUI | null = null;
  /**
   * Selected values missing from the item list, cached against `#items`. Rebuilt on the first read
   * after the list or the selection changes — `getState()` asks for it four times per confirmation,
   * and on a column with many distinct values the Set build dominates that call.
   */
  #unlistedValue: unknown[] | null = null;
  /**
   * Whether the user emptied the box with "Clear". An empty list cannot say on its own whether the
   * column filters nothing or excludes everything, so the answer is recorded when it is given.
   */
  #cleared = false;

  /**
   * Initializes the multiple select UI component, creates child input and link components, and registers event hooks.
   */
  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(
      MultipleSelectUI.DEFAULTS as Record<string, unknown>, options
    ) as Record<string, unknown>);

    this.#searchInput = new InputUI(hotInstance, {
      placeholder: C.FILTERS_BUTTONS_PLACEHOLDER_SEARCH,
      className: 'htUIMultipleSelectSearch',
    });
    this.#selectAllUI = new LinkUI(hotInstance, {
      textContent: C.FILTERS_BUTTONS_SELECT_ALL,
      className: 'htUISelectAll',
    });
    this.#clearAllUI = new LinkUI(hotInstance, {
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
    this.#searchInput?.addLocalHook('keydown', (event: KeyboardEvent) => this.#onInputKeyDown(event));
    this.#searchInput?.addLocalHook('input', (event: Event) => this.#onInput(event));
    this.#selectAllUI?.addLocalHook('click', (event: Event) => this.#onSelectAllClick(event));
    this.#clearAllUI?.addLocalHook('click', (event: Event) => this.#onClearAllClick(event));
  }

  /**
   * Set available options.
   *
   * @param {Array} items Array of objects with `checked` and `label` property.
   */
  setItems(items: Record<string, unknown>[]) {
    this.#items = items as SelectItem[];
    this.#lowerCaseItemValues = null;
    this.#unlistedValue = null;
    this.#cleared = false;
    this.#itemsBox?.loadData(this.#items);
  }

  /**
   * Set element value. Recorded whole, so the values the item list cannot show are not lost.
   *
   * @param {*} value The selected values.
   */
  setValue(value: unknown) {
    this.#unlistedValue = null;
    this.#cleared = false;
    super.setValue(value);
  }

  /**
   * Record whether an empty selection is the user's own doing.
   *
   * An empty box with an empty list reads the same whether the column filters nothing or excludes
   * everything, and only the caller knows which. `setItems()` and `setValue()` reset the answer to
   * "filters nothing", so this runs after them - see `ValueComponent.setState()`, the one place
   * that can tell the two apart.
   *
   * @param {boolean} cleared `true` when the empty selection means "exclude everything".
   */
  setCleared(cleared: boolean) {
    this.#cleared = cleared;
  }

  /**
   * Set a locale for the component.
   *
   * @param {string} locale Locale used for filter actions performed on data, ie. `en-US`.
   */
  setLocale(locale: string) {
    if (this.#locale !== locale) {
      this.#lowerCaseItemValues = null;
    }
    this.#locale = locale;
  }

  /**
   * Gets the lowercased form of every item's value, building the cache on first access.
   *
   * @returns {string[]} Array aligned by index with the items list.
   */
  #getLowerCaseItemValues(): string[] {
    if (this.#lowerCaseItemValues === null) {
      this.#lowerCaseItemValues = this.#items
        .map(item => localeLowerCase(`${item.value}`, this.getLocale()));
    }

    return this.#lowerCaseItemValues;
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
   * The list only ever holds the values present in the rows that pass the other columns' filters,
   * so a selected value whose rows are currently filtered out has no checkbox to read. Those values
   * are carried through untouched instead of being dropped - otherwise confirming the menu would
   * silently shrink the column's condition to whatever happens to be on screen.
   *
   * @returns {Array} Array of selected values.
   */
  getValue() {
    return itemsToValue(this.#items).concat(this.#getUnlistedValue());
  }

  /**
   * The selected values that the current list cannot show, and that the user therefore cannot
   * toggle. Reading them from the restored selection keeps them stable while the user works with
   * the checkboxes, because only listed values can ever be checked or unchecked.
   *
   * @returns {Array} Selected values missing from the item list.
   */
  #getUnlistedValue(): unknown[] {
    if (this.#unlistedValue !== null) {
      return this.#unlistedValue;
    }

    const value = (this.options as Record<string, unknown>).value as unknown[] | undefined;

    if (!Array.isArray(value) || value.length === 0) {
      this.#unlistedValue = [];

      return this.#unlistedValue;
    }

    const isListed = createArrayAssertion(this.#items.map(item => item.value));

    this.#unlistedValue = value.filter(item => !isListed(item));

    return this.#unlistedValue;
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
    // Two conditions, not one count. Every listed value has to be ticked AND nothing may be
    // selected outside the list. Ticking everything on screen does NOT mean the column filters
    // nothing - the values the list cannot show are still excluding rows, and answering `true`
    // here makes `getState()` report "no condition", which deletes them.
    // Comparing `#items.length` against the whole selection would not do: a list holding one
    // unticked value plus one selected unlisted value has matching counts and different sets.
    // An empty list with an empty selection answers `true`, which is what lets a column with
    // nothing to filter by report "no condition" - unless the box was emptied on purpose, which
    // means the opposite and is recorded rather than guessed. That only holds while the selection
    // is still empty: tick something and the ordinary comparison takes over again, so re-selecting
    // everything releases the column instead of leaving a condition that filters nothing.
    const selectedValues = this.getValue();

    if (this.#cleared && selectedValues.length === 0) {
      return false;
    }

    return this.#items.length === itemsToValue(this.#items).length && this.#getUnlistedValue().length === 0;
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    if (!this.hot || !this._element) {
      return;
    }

    const hot = this.hot;
    const rootElement = this._element;
    const { rootDocument } = hot;
    const itemsBoxWrapper = rootDocument.createElement('div');
    const selectionControl = new BaseUI(hot, {
      className: 'htUISelectionControls',
      children: [this.#selectAllUI, this.#clearAllUI].filter((x): x is LinkUI => x !== null),
    });

    const searchEl = this.#searchInput?.element;
    const selectionEl = selectionControl.element;

    if (searchEl) {
      rootElement.appendChild(searchEl);
    }
    if (selectionEl) {
      rootElement.appendChild(selectionEl);
    }
    rootElement.appendChild(itemsBoxWrapper);

    this.#itemsBox?.destroy();
    addClass(itemsBoxWrapper, 'htUIMultipleSelectHot');

    // Constructs and initializes a new Handsontable instance
    this.#itemsBox = new (
      hot.constructor as new (element: HTMLElement, settings: object) => HotInstance
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
        this.#itemsBox?.listen();
      },
      modifyColWidth: (width: number | undefined) => {
        const minWidth = (this.#itemsBox?.container.scrollWidth ?? 0) - getScrollbarWidth(rootDocument);

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
      themeName: hot.getCurrentThemeName(),
      layoutDirection: hot.isRtl() ? 'rtl' : 'ltr',
    });
    this.#itemsBox.init();

    const shortcutManager = this.#itemsBox.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    if (!gridContext) {
      return;
    }

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
        this.#itemsBox?.deselectCell();

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
      this.#itemsBox?.listen();
    }
  }

  /**
   * Reset DOM structure.
   */
  reset() {
    this.#searchInput?.reset();
    this.#selectAllUI?.reset();
    this.#clearAllUI?.reset();
  }

  /**
   * Update DOM structure.
   */
  update() {
    if (!this.isBuilt() || !this.#itemsBox || this.#itemsBox.rootElement.offsetHeight === 0) {
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
    this.#searchInput?.destroy();
    this.#clearAllUI?.destroy();
    this.#selectAllUI?.destroy();

    this.#searchInput = null;
    this.#clearAllUI = null;
    this.#selectAllUI = null;
    this.#itemsBox = null;
    this.#items.length = 0;
    this.#lowerCaseItemValues = null;
    super.destroy();
  }

  /**
   * 'input' event listener for input element.
   *
   * @param {Event} event DOM event.
   */
  #onInput(event: Event) {
    const trimmed = eventTargetEl<HTMLInputElement>(event)!.value.trim();
    const value = localeLowerCase(trimmed, this.getLocale());

    const lowerCaseValues = this.#getLowerCaseItemValues();

    if ((this.options as Record<string, unknown>).searchMode === 'apply') {
      const hiddenRows = this.#itemsBox?.getPlugin('hiddenRows');
      const rowsToHide: number[] = [];

      if (hiddenRows) {
        hiddenRows.showRows(hiddenRows.getHiddenRows());
      }

      // The search term now owns the selection outright, so the values the list cannot show are no
      // longer part of it. Leaving them in would confirm a wider set than the box displays.
      (this.options as Record<string, unknown>).value = [];
      this.#unlistedValue = null;
      this.#cleared = false;

      this.#items.forEach((item, index) => {
        item.checked = lowerCaseValues[index].indexOf(value) >= 0;

        if (!item.checked) {
          rowsToHide.push(index);
        }
      });

      if (hiddenRows) {
        hiddenRows.hideRows(rowsToHide);
      }
      this.#itemsBox?.view.adjustElementsSize();
      this.#itemsBox?.render();
    } else {
      let filteredItems;

      if (value === '') {
        filteredItems = [...this.#items];
      } else {
        filteredItems = this.#items
          .filter((item, index) => lowerCaseValues[index].indexOf(value) >= 0);
      }

      this.#itemsBox?.loadData(filteredItems);
    }
  }

  /**
   * 'keydown' event listener for input element.
   *
   * @param {Event} event DOM event.
   */
  #onInputKeyDown(event: KeyboardEvent) {
    this.runLocalHooks('keydown', event, this);

    if (isKey(event.keyCode, 'ARROW_DOWN')) {
      event.preventDefault();
      stopImmediatePropagation(event);
      this.#itemsBox?.listen();
      this.#itemsBox?.selectCell(0, 0);
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

    if (!this.#itemsBox) {
      return;
    }

    // "Select all" means the column stops filtering, so the selected values the list cannot show
    // have to go as well. Leaving them behind keeps `isSelectedAllValues()` false, and the column
    // would still export a condition and still read as filtered with every box ticked.
    (this.options as Record<string, unknown>).value = [];
    this.#unlistedValue = null;
    this.#cleared = false;

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

    if (!this.#itemsBox) {
      return;
    }

    // Drop the selected values the list cannot show as well. Without this they would survive into
    // `getValue()` and the filter would keep matching rows the emptied box no longer accounts for.
    // Note this still unchecks only the rows the box currently holds, so with an active search term
    // the values it filtered out keep their state - long-standing behavior, unchanged here.
    (this.options as Record<string, unknown>).value = [];
    this.#unlistedValue = null;
    // An empty list plus an empty selection is ambiguous - it reads the same whether the column
    // filters nothing or excludes everything. Record that the user asked for the second one.
    this.#cleared = true;

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
