import type { HotInstance } from '../../../core/types';
import { addClass, isHTMLElement } from '../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach, arrayFilter, arrayMap } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import * as C from '../../../i18n/constants';
import { unifyColumnValues, intersectValues, toEmptyString } from '../utils';
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
  value: unknown;
  meta: { visualRow: number; visualCol: number; [key: string]: unknown };
  [key: string]: unknown;
}

interface StateInfo {
  editedConditionStack: ConditionStack;
  dependentConditionStacks: ConditionStack[];
  conditionArgsChange: unknown;
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
    this.elements.push(new MultipleSelectUI(this.hot, {
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

    this.hot
      .addHook('modifyFiltersMultiSelectValue',
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
    this.reset();

    if (value && value.command.key === CONDITION_BY_VALUE) {
      const select = this.getMultipleSelectElement();

      select.setItems(value.itemsSnapshot);
      select.setValue(value.args[0]);
      select.setLocale(value.locale);
    }
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
   * stack of dependent conditions, data factory and optional condition arguments change. It's described by object containing keys:
   * `editedConditionStack`, `dependentConditionStacks`, `visibleDataFactory` and `conditionArgsChange`.
   */
  updateState(stateInfo: StateInfo) {
    const updateColumnState = (
      physicalColumn: number, conditions: ConditionEntry[], conditionArgsChange: unknown,
      filteredRowsFactory: (physicalColumn: number, conditionsStack?: ConditionStack) => FilteredRow[],
      conditionsStack?: ConditionStack
    ) => {
      const [firstByValueCondition] = arrayFilter(conditions,
        condition => condition.name === CONDITION_BY_VALUE);
      const state: Record<string, unknown> = {};
      const defaultBlankCellValue = this.hot.getTranslatedPhrase(C.FILTERS_VALUES_BLANK_CELLS);

      if (firstByValueCondition) {
        const filteredRows = filteredRowsFactory(physicalColumn, conditionsStack);
        const rowValues = arrayMap(filteredRows, row => row.value);
        const rowMetaMap = new Map(
          filteredRows.map((row: FilteredRow) =>
            [row.value, this.hot.getCellMeta(row.meta.visualRow, row.meta.visualCol)])
        );
        const columnMeta = filteredRows[0]?.meta;
        const comparator = getSortComparatorForMeta(columnMeta);
        const unifiedRowValues = unifyColumnValues(rowValues, comparator);

        if (conditionArgsChange) {
          firstByValueCondition.args[0] = conditionArgsChange;
        }

        const selectedValues: unknown[] = [];
        const itemsSnapshot = intersectValues(
          unifiedRowValues,
          firstByValueCondition.args[0] as unknown[],
          defaultBlankCellValue,
          (item: Record<string, unknown>) => {
            if (item.checked) {
              selectedValues.push(item.value);
            }

            this.#triggerModifyMultipleSelectionValueHook(item, rowMetaMap);
          }
        );

        const column = stateInfo.editedConditionStack.column;

        state.locale = this.hot.getCellMeta(0, column).locale;
        state.args = [selectedValues];
        state.command = getConditionDescriptor(CONDITION_BY_VALUE);
        state.itemsSnapshot = itemsSnapshot;

      } else {
        state.args = [];
        state.command = getConditionDescriptor(CONDITION_NONE);
      }

      this.state.setValueAtIndex(physicalColumn, state);
    };

    updateColumnState(
      stateInfo.editedConditionStack.column,
      stateInfo.editedConditionStack.conditions,
      stateInfo.conditionArgsChange,
      stateInfo.filteredRowsFactory
    );

    // Update the next "by_value" component (filter column conditions added after this condition).
    // Its list of values has to be updated. As the new values by default are unchecked,
    // the further component update is unnecessary.
    // `conditionArgsChange` is scoped to the edited column and must not be reapplied here -
    // doing so overwrites the dependent column's by_value args with the edited column's value set (issue #8874).
    if (stateInfo.dependentConditionStacks.length) {
      updateColumnState(
        stateInfo.dependentConditionStacks[0].column,
        stateInfo.dependentConditionStacks[0].conditions,
        undefined,
        stateInfo.filteredRowsFactory,
        stateInfo.editedConditionStack
      );
    }
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

        const label = this.hot.rootDocument.createElement('div');

        addClass(label, 'htFiltersMenuLabel');
        label.textContent = value;

        wrapper.appendChild(label);

        // The MultipleSelectUI should not extend the menu width (it should adjust to the menu item width only).
        // That's why it's skipped from rendering when the GhostTable tries to render it.
        if (!wrapper.parentElement.hasAttribute('ghost-table')) {
          arrayEach(this.elements, ui => wrapper.appendChild(ui.element));
        }

        return wrapper;
      }
    };
  }

  /**
   * Reset elements to their initial state.
   */
  reset() {
    const defaultBlankCellValue = this.hot.getTranslatedPhrase(C.FILTERS_VALUES_BLANK_CELLS);
    const rowEntries = this._getColumnVisibleValues();
    const rowValues = rowEntries.map(entry => entry.value);
    const rowMetaMap = new Map(rowEntries.map(row => [row.value, row.meta]));
    const columnMeta = rowEntries[0]?.meta;
    const comparator = getSortComparatorForMeta(columnMeta);
    const values = unifyColumnValues(rowValues, comparator);
    const items = intersectValues(values, values, defaultBlankCellValue, (item: Record<string, unknown>) => {
      this.#triggerModifyMultipleSelectionValueHook(item, rowMetaMap);
    });

    this.getMultipleSelectElement().setItems(items);
    super.reset();
    this.getMultipleSelectElement().setValue(values);

    const selectedColumn = this.hot.getPlugin('filters').getSelectedColumn();

    if (selectedColumn !== null) {
      this.getMultipleSelectElement().setLocale(this.hot.getCellMeta(0, selectedColumn.visualIndex).locale as string);
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
   * @param {Map} metaMap Map of row meta objects.
   */
  #triggerModifyMultipleSelectionValueHook(item: Record<string, unknown>, metaMap: Map<unknown, unknown>) {
    if (this.hot.hasHook('modifyFiltersMultiSelectValue')) {
      item.visualValue =
        this.hot.runHooks('modifyFiltersMultiSelectValue', item.visualValue, metaMap.get(item.value));
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
   * Get data for currently selected column.
   *
   * @returns {Array}
   * @private
   */
  _getColumnVisibleValues(): Array<{ value: string; meta: Record<string, unknown> }> {
    const selectedColumn = this.hot.getPlugin('filters').getSelectedColumn();

    if (selectedColumn === null) {
      return [];
    }

    return arrayMap(this.hot.getDataAtCol(selectedColumn.visualIndex), (v, rowIndex) => {
      return {
        value: toEmptyString(v) as string,
        meta: this.hot.getCellMeta(rowIndex, selectedColumn.visualIndex),
      };
    });
  }
}
