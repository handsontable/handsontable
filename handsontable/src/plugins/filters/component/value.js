import { addClass } from '../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach, arrayFilter, arrayMap } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import * as C from '../../../i18n/constants';
import { unifyColumnValues, intersectValues, toEmptyString } from '../utils';
import { BaseComponent } from './_base';
import { MultipleSelectUI } from '../ui/multipleSelect';
import { CONDITION_BY_VALUE, CONDITION_NONE } from '../constants';
import { getConditionDescriptor } from '../conditionRegisterer';
import { getRenderedValue as getRenderedNumericValue } from '../../../renderers/numericRenderer';

/**
 * @private
 * @class ValueComponent
 */
export class ValueComponent extends BaseComponent {
  /**
   * The name of the component.
   *
   * @type {string}
   */
  name = '';

  constructor(hotInstance, options) {
    super(hotInstance, {
      id: options.id,
      stateless: false,
    });

    this.name = options.name;
    this.elements.push(new MultipleSelectUI(this.hot));

    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getMultipleSelectElement()
      .addLocalHook('keydown', event => this.#onInputKeyDown(event))
      .addLocalHook('listTabKeydown', event => this.runLocalHooks('listTabKeydown', event));

    this.hot
      .addHook('modifyFiltersMultiSelectValue', (value, meta) => this.#onModifyDisplayedValue(value, meta));
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
  setState(value) {
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
  getState() {
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
  updateState(stateInfo) {
    const updateColumnState = (
      physicalColumn,
      conditions,
      conditionArgsChange,
      filteredRowsFactory,
      conditionsStack,
    ) => {
      const [firstByValueCondition] = arrayFilter(conditions, condition => condition.name === CONDITION_BY_VALUE);
      const state = {};
      const defaultBlankCellValue = this.hot.getTranslatedPhrase(C.FILTERS_VALUES_BLANK_CELLS);

      if (firstByValueCondition) {
        const filteredRows = filteredRowsFactory(physicalColumn, conditionsStack);
        const rowValues = arrayMap(filteredRows, row => row.value);
        const rowMetaMap = new Map(
          filteredRows.map(row => [row.value, this.hot.getCellMeta(row.meta.visualRow, row.meta.visualCol)])
        );
        const unifiedRowValues = unifyColumnValues(rowValues);

        if (conditionArgsChange) {
          firstByValueCondition.args[0] = conditionArgsChange;
        }

        const selectedValues = [];
        const itemsSnapshot = intersectValues(
          unifiedRowValues,
          firstByValueCondition.args[0],
          defaultBlankCellValue,
          (item) => {
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
    if (stateInfo.dependentConditionStacks.length) {
      updateColumnState(
        stateInfo.dependentConditionStacks[0].column,
        stateInfo.dependentConditionStacks[0].conditions,
        stateInfo.conditionArgsChange,
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
    return this.elements.filter(element => element instanceof MultipleSelectUI)[0];
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
      hidden: () => this.isHidden(),
      renderer: (hot, wrapper, row, col, prop, value) => {
        addClass(wrapper.parentNode, 'htFiltersMenuValue');

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
    const values = unifyColumnValues(rowValues);
    const items = intersectValues(values, values, defaultBlankCellValue, (item) => {
      this.#triggerModifyMultipleSelectionValueHook(item, rowMetaMap);
    });

    this.getMultipleSelectElement().setItems(items);
    super.reset();
    this.getMultipleSelectElement().setValue(values);

    const selectedColumn = this.hot.getPlugin('filters').getSelectedColumn();

    if (selectedColumn !== null) {
      this.getMultipleSelectElement().setLocale(this.hot.getCellMeta(0, selectedColumn.visualIndex).locale);
    }
  }

  /**
   * Key down listener.
   *
   * @param {Event} event The DOM event object.
   */
  #onInputKeyDown(event) {
    if (isKey(event.keyCode, 'ESCAPE')) {
      this.runLocalHooks('cancel');
      stopImmediatePropagation(event);
    }
  }

  /**
   * Trigger the `modifyFiltersMultiSelectValue` hook.
   *
   * @param {object} item Item from the multiple select list.
   * @param {Map} metaMap Map of row meta objects.
   */
  #triggerModifyMultipleSelectionValueHook(item, metaMap) {
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
  #onModifyDisplayedValue(value, meta) {
    switch (meta.type) {
      case 'numeric':
        return getRenderedNumericValue(value, meta);
      default:
        return value;
    }
  }

  /**
   * Get data for currently selected column.
   *
   * @returns {Array}
   * @private
   */
  _getColumnVisibleValues() {
    const selectedColumn = this.hot.getPlugin('filters').getSelectedColumn();

    if (selectedColumn === null) {
      return [];
    }

    return arrayMap(this.hot.getDataAtCol(selectedColumn.visualIndex), (v, rowIndex) => {
      return {
        value: toEmptyString(v),
        meta: this.hot.getCellMeta(rowIndex, selectedColumn.visualIndex),
      };
    });
  }
}
