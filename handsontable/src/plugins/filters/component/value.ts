import type { HotInstance } from '../../../core/types';
import { addClass, isHTMLElement } from '../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach, arrayFilter, arrayMap } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import * as C from '../../../i18n/constants';
import { unifyColumnValues, intersectValues } from '../utils';
import { getSortComparatorForMeta } from '../sortComparators';
import { BaseComponent } from './_base';
import { MultipleSelectUI } from '../ui/multipleSelect';
import { CONDITION_BY_VALUE, CONDITION_NONE } from '../constants';
import { getConditionDescriptor } from '../conditionRegisterer';
import type { BaseUI } from '../ui/_base';

interface ConditionEntry {
  name: string;
  args: unknown[];
  [key: string]: unknown;
}

interface ConditionStack {
  column: number;
  conditions: ConditionEntry[];
  [key: string]: unknown;
}

interface FilteredRow {
  row: number;
  value: unknown;
  meta: { visualRow: number; visualCol: number; [key: string]: unknown };
  [key: string]: unknown;
}

export interface StateInfo {
  editedConditionStack: ConditionStack;
  dependentConditionStacks: ConditionStack[];
  filteredRowsFactory: (physicalColumn: number, conditionsStack?: ConditionStack) => FilteredRow[];
  [key: string]: unknown;
}

/**
 * @private
 * @class ValueComponent
 */
export class ValueComponent extends BaseComponent {
  /**
   * Narrowed element list — ValueComponent only ever holds MultipleSelectUI instances.
   */
  declare elements: BaseUI[];

  /**
   * The name of the component.
   *
   * @type {string}
   */
  name: string | (() => string) = '';

  /**
   * Whether to uncheck filtered queries.
   *
   * @type {string}
   */
  searchMode: unknown;
  /**
   * Callback that returns `true` when this menu item should be hidden.
   *
   * @type {function(): boolean | undefined}
   */
  hiddenWhen: (() => boolean) | undefined;

  /**
   * Initializes the value component with the given ID, display name, search mode, and optional visibility predicate.
   */
  constructor(hotInstance: HotInstance, options: {
    id: string; name: string | (() => string); searchMode: unknown; hiddenWhen?: (() => boolean);
  }) {
    super(hotInstance, {
      id: options.id,
      stateless: false,
    });

    this.name = options.name;
    this.searchMode = options.searchMode;
    /**
     * When set by the parent (Filters plugin), a callback that returns `true` when this menu item should be hidden
     * (e.g. server-side filtering active). Used only in the menu descriptor so the item is hidden when the dropdown is shown.
     *
     * @type {function(): boolean | undefined}
     */
    this.hiddenWhen = options.hiddenWhen;
    this.elements.push(new MultipleSelectUI(hotInstance, {
      searchMode: this.searchMode
    }));

    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getMultipleSelectElement()
      .addLocalHook('keydown', (event: KeyboardEvent) => this.#onInputKeyDown(event))
      .addLocalHook('listTabKeydown', (event: Event) => this.runLocalHooks('listTabKeydown', event));

    this.hot?.addHook('modifyFiltersMultiSelectValue',
      (value: string, meta: Record<string, unknown>) => this.#onModifyDisplayedValue(value, meta));
  }

  /**
   * Gets the list of elements from which the component is built.
   *
   * @returns {BaseUI[]}
   */
  getElements() {
    const selectElement = this.getMultipleSelectElement();

    return [
      selectElement.getSearchInputElement(),
      selectElement.getSelectAllElement(),
      selectElement.getClearAllElement(),
      this.getMultipleSelectElement(),
    ];
  }

  /**
   * Set state of the component.
   *
   * @param {object} value The component value.
   */
  setState(value?: {
    command: { key: string }; args: unknown[]; itemsSnapshot: Record<string, unknown>[]; locale: string;
  }) {
    if (value && value.command.key === CONDITION_BY_VALUE) {
      // The snapshot replaces the list, so only the surrounding UI is reset - rebuilding the list
      // from the data first would read the whole column just to throw the result away.
      super.reset();

      const select = this.getMultipleSelectElement();

      select.setItems(value.itemsSnapshot);
      select.setValue(value.args[0]);
      select.setLocale(value.locale);

      return;
    }

    this.reset();
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {object} Returns object where `command` key keeps used condition filter and `args` key its arguments.
   */
  getState(): { command: { key: string }; args: unknown[]; itemsSnapshot: unknown[] } {
    const select = this.getMultipleSelectElement();
    const availableItems = select.getItems();

    return {
      command: { key: select.isSelectedAllValues() || !availableItems.length ? CONDITION_NONE : CONDITION_BY_VALUE },
      args: [select.getValue()],
      itemsSnapshot: availableItems
    };
  }

  /**
   * Update state of component.
   *
   * @param {object} stateInfo Information about state containing stack of edited column,
   * stack of dependent conditions and the data factory. It's described by object containing keys:
   * `editedConditionStack`, `dependentConditionStacks` and `visibleDataFactory`.
   */
  updateState(stateInfo: StateInfo) {
    const updateColumnState = (
      physicalColumn: number, conditions: ConditionEntry[],
      filteredRowsFactory: (physicalColumn: number, conditionsStack?: ConditionStack) => FilteredRow[],
      conditionsStack?: ConditionStack
    ) => {
      const [firstByValueCondition] = arrayFilter(conditions,
        condition => condition.name === CONDITION_BY_VALUE);
      const state: Record<string, unknown> = {};

      if (firstByValueCondition) {
        const filteredRows = filteredRowsFactory(physicalColumn, conditionsStack);

        const { itemsSnapshot, selectedValues } = this.#buildItemsSnapshot(
          physicalColumn, filteredRows, firstByValueCondition.args[0] as unknown[]);

        const column = stateInfo.editedConditionStack.column;

        state.locale = this.hot?.getCellMetaTransient(0, column).locale;
        state.args = [selectedValues];
        state.command = getConditionDescriptor(CONDITION_BY_VALUE);
        state.itemsSnapshot = itemsSnapshot;

      } else {
        state.args = [];
        state.command = getConditionDescriptor(CONDITION_NONE);
      }

      this.state?.setValueAtIndex(physicalColumn, state);
    };

    // Both columns are refreshed the same way: the value list is rebuilt so newly introduced values
    // show up, and the checked set stays whatever the user picked, narrowed to the values that still
    // exist. Nothing here may re-select a value on the user's behalf - that is what made an edit in a
    // filtered column add its new value to the condition (issue #6471), and what leaked the edited
    // column's value set into the dependent column (issue #8874).
    updateColumnState(
      stateInfo.editedConditionStack.column,
      stateInfo.editedConditionStack.conditions,
      stateInfo.filteredRowsFactory
    );

    // Update the next "by_value" component (filter column conditions added after this condition).
    // Its list of values has to be updated. As the new values by default are unchecked,
    // the further component update is unnecessary.
    if (stateInfo.dependentConditionStacks.length) {
      updateColumnState(
        stateInfo.dependentConditionStacks[0].column,
        stateInfo.dependentConditionStacks[0].conditions,
        stateInfo.filteredRowsFactory,
        stateInfo.editedConditionStack
      );
    }
  }

  /**
   * Builds the item list shown in the "filter by value" box for a single column.
   *
   * @param {number} physicalColumn The physical column index the items belong to.
   * @param {Array} filteredRows Data-map entries of the rows the list is built from.
   * @param {Array} selectedArgs Values that stay checked.
   * @returns {{itemsSnapshot: Array, selectedValues: Array}} The item list and the checked values.
   */
  #buildItemsSnapshot(physicalColumn: number, filteredRows: FilteredRow[], selectedArgs: unknown[]) {
    const defaultBlankCellValue = this.hot?.getTranslatedPhrase(C.FILTERS_VALUES_BLANK_CELLS) ?? '';
    const rowValues = arrayMap(filteredRows, row => row.value);
    // The map feeds only the `modifyFiltersMultiSelectValue` hook. Building it costs one
    // meta-pipeline read per filtered row, so skip it when the hook is not registered.
    // The rows are addressed through the entry's own `row` property - the coordinate stamps
    // on `row.meta` are shared with other meta readers and may have been overwritten.
    const rowMetaMap = this.hot?.hasHook('modifyFiltersMultiSelectValue')
      ? new Map(
        filteredRows.map((row: FilteredRow) =>
          [row.value, this.hot?.getCellMetaTransient(row.row, physicalColumn)])
      )
      : null;
    const columnMeta = filteredRows[0]?.meta;
    const comparator = getSortComparatorForMeta(columnMeta);
    const unifiedRowValues = unifyColumnValues(rowValues, comparator);
    const selectedValues: unknown[] = [];
    const itemsSnapshot = intersectValues(
      unifiedRowValues,
      selectedArgs,
      defaultBlankCellValue,
      (item: Record<string, unknown>) => {
        if (item.checked) {
          selectedValues.push(item.value);
        }

        this.#triggerModifyMultipleSelectionValueHook(item, rowMetaMap);
      }
    );

    return { itemsSnapshot, selectedValues };
  }

  /**
   * Get multiple select element.
   *
   * @returns {MultipleSelectUI}
   */
  getMultipleSelectElement() {
    return this.elements.find((element): element is MultipleSelectUI => element instanceof MultipleSelectUI)!;
  }

  /**
   * Get object descriptor for menu item entry.
   *
   * @returns {object}
   */
  getMenuItemDescriptor() {
    return {
      key: this.id,
      name: this.name,
      isCommand: false,
      disableSelection: true,
      hidden: () => this.isHidden() || (typeof this.hiddenWhen === 'function' && this.hiddenWhen()),
      renderer: (hot: HotInstance, wrapper: HTMLTableCellElement, row: number, col: number,
                 prop: string | number, value: string) => {
        if (isHTMLElement(wrapper.parentNode)) {
          addClass(wrapper.parentNode, 'htFiltersMenuValue');
        }

        const label = this.hot?.rootDocument.createElement('div') ?? wrapper.ownerDocument.createElement('div');

        addClass(label, 'htFiltersMenuLabel');
        label.textContent = value;

        wrapper.appendChild(label);

        // The MultipleSelectUI should not extend the menu width (it should adjust to the menu item width only).
        // That's why it's skipped from rendering when the GhostTable tries to render it.
        if (!wrapper.parentElement?.hasAttribute('ghost-table')) {
          arrayEach(this.elements, (ui) => {
            const el = ui.element;

            if (el) {
              wrapper.appendChild(el);
            }
          });
        }

        return wrapper;
      }
    };
  }

  /**
   * Reset elements to their initial state.
   */
  reset() {
    const defaultBlankCellValue = this.hot?.getTranslatedPhrase(C.FILTERS_VALUES_BLANK_CELLS) ?? '';
    const rowEntries = this._getColumnVisibleValues();
    const rowValues = rowEntries.map(entry => entry.value);
    const rowMetaMap = this.hot?.hasHook('modifyFiltersMultiSelectValue')
      ? new Map<unknown, unknown>(rowEntries.map(row => [row.value, row.meta]))
      : null;
    const columnMeta = rowEntries[0]?.meta;
    const comparator = getSortComparatorForMeta(columnMeta);
    const values = unifyColumnValues(rowValues, comparator);
    const items = intersectValues(values, values, defaultBlankCellValue, (item: Record<string, unknown>) => {
      this.#triggerModifyMultipleSelectionValueHook(item, rowMetaMap);
    });

    this.getMultipleSelectElement().setItems(items);
    super.reset();
    this.getMultipleSelectElement().setValue(values);

    const selectedColumn = this.hot?.getPlugin('filters').getSelectedColumn() ?? null;

    if (selectedColumn !== null) {
      this.getMultipleSelectElement()
        .setLocale(this.hot?.getCellMetaTransient(0, selectedColumn.visualIndex).locale as string);
    }
  }

  /**
   * Key down listener.
   *
   * @param {Event} event The DOM event object.
   */
  #onInputKeyDown(event: KeyboardEvent) {
    if (isKey(event.keyCode, 'ESCAPE')) {
      this.runLocalHooks('cancel');
      stopImmediatePropagation(event);
    }

    if (isKey(event.keyCode, 'ENTER')) {
      if (this.searchMode === 'apply') {
        this.runLocalHooks('accept');
      }

      stopImmediatePropagation(event);
    }
  }

  /**
   * Trigger the `modifyFiltersMultiSelectValue` hook.
   *
   * @param {object} item Item from the multiple select list.
   * @param {Map|null} metaMap Map of row meta objects, or `null` when the hook is not registered.
   */
  #triggerModifyMultipleSelectionValueHook(item: Record<string, unknown>, metaMap: Map<unknown, unknown> | null) {
    if (metaMap && this.hot?.hasHook('modifyFiltersMultiSelectValue')) {
      item.visualValue =
        this.hot?.runHooks('modifyFiltersMultiSelectValue', item.visualValue, metaMap.get(item.value));
    }
  }

  /**
   * Modify the value displayed in the multiple select list.
   *
   * @param {*} value Cell value.
   * @param {object} meta The cell meta object.
   * @returns {*} Returns the modified value.
   */
  #onModifyDisplayedValue(value: unknown, meta: Record<string, unknown>) {
    if (meta.valueFormatter) {
      return (meta.valueFormatter as (value: unknown, meta: Record<string, unknown>) => unknown)(value, meta);
    }

    return value;
  }

  /**
   * Gets the values the list is built from for the currently selected column. The plugin decides
   * which rows those are - a filtered column skips its own conditions (issue #12226).
   *
   * @returns {Array} Array of objects with `value` and `meta`, one per row.
   * @private
   */
  _getColumnVisibleValues(): Record<string, unknown>[] {
    const filtersPlugin = this.hot?.getPlugin('filters');
    const selectedColumn = filtersPlugin?.getSelectedColumn() ?? null;

    if (!filtersPlugin || selectedColumn === null) {
      return [];
    }

    return filtersPlugin._getValueListDataAtColumn(selectedColumn.visualIndex);
  }
}
