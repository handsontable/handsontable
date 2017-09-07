import {addClass} from 'handsontable/helpers/dom/element';
import {stopImmediatePropagation} from 'handsontable/helpers/dom/event';
import {arrayEach, arrayUnique, arrayFilter, arrayMap, arrayIncludes} from 'handsontable/helpers/array';
import {mergeSort} from 'handsontable/utils/sortingAlgorithms/mergeSort';
import {deepClone} from 'handsontable/helpers/object';
import {stringify} from 'handsontable/helpers/string';
import {isKey} from 'handsontable/helpers/unicode';
import {unifyColumnValues, intersectValues, toEmptyString} from './../utils';
import BaseComponent from './_base';
import MultipleSelectUI from './../ui/multipleSelect';
import {CONDITION_BY_VALUE, CONDITION_NONE} from './../constants';
import {getConditionDescriptor} from './../conditionRegisterer';

/**
 * @class ValueComponent
 * @plugin Filters
 */
class ValueComponent extends BaseComponent {
  constructor(hotInstance, options) {
    super(hotInstance);

    this.id = options.id;
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
    this.getMultipleSelectElement().addLocalHook('keydown', (event) => this.onInputKeyDown(event));
  }

  /**
   * Set state of the component.
   *
   * @param {Object} value
   */
  setState(value) {
    this.reset();

    if (value && value.command.key === CONDITION_BY_VALUE) {
      const select = this.getMultipleSelectElement();

      select.setItems(value.itemsSnapshot);
      select.setValue(value.args[0]);
    }
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {Object} Returns object where `command` key keeps used condition filter and `args` key its arguments.
   */
  getState() {
    const select = this.getMultipleSelectElement();
    const availableItems = select.getItems();

    return {
      command: {key: select.isSelectedAllValues() || !availableItems.length ? CONDITION_NONE : CONDITION_BY_VALUE},
      args: [select.getValue()],
      itemsSnapshot: availableItems
    };
  }

  /**
   * Update state of component.
   *
   * @param {Object} stateInfo Information about state containing stack of edited column,
   * stack of dependent conditions, data factory and optional condition arguments change. It's described by object containing keys:
   * `editedConditionStack`, `dependentConditionStacks`, `visibleDataFactory` and `conditionArgsChange`.
   */
  updateState(stateInfo) {
    const updateColumnState = (column, conditions, conditionArgsChange, filteredRowsFactory, conditionsStack) => {
      const [condition] = arrayFilter(conditions, (condition) => condition.name === CONDITION_BY_VALUE);
      const state = {};

      if (condition) {
        let rowValues = arrayMap(filteredRowsFactory(column, conditionsStack), (row) => row.value);

        rowValues = unifyColumnValues(rowValues);

        if (conditionArgsChange) {
          condition.args[0] = conditionArgsChange;
        }

        const selectedValues = [];
        const itemsSnapshot = intersectValues(rowValues, condition.args[0], (item) => {
          if (item.checked) {
            selectedValues.push(item.value);
          }
        });

        state.args = [selectedValues];
        state.command = getConditionDescriptor(CONDITION_BY_VALUE);
        state.itemsSnapshot = itemsSnapshot;

      } else {
        state.args = [];
        state.command = getConditionDescriptor(CONDITION_NONE);
      }

      this.setCachedState(column, state);
    };

    updateColumnState(
      stateInfo.editedConditionStack.column,
      stateInfo.editedConditionStack.conditions,
      stateInfo.conditionArgsChange,
      stateInfo.filteredRowsFactory
    );

    // Shallow deep update of component state
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
    return this.elements.filter((element) => element instanceof MultipleSelectUI)[0];
  }

  /**
   * Get object descriptor for menu item entry.
   *
   * @returns {Object}
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

        let label = document.createElement('div');

        addClass(label, 'htFiltersMenuLabel');
        label.textContent = 'Filter by value:';

        wrapper.appendChild(label);
        arrayEach(this.elements, (ui) => wrapper.appendChild(ui.element));

        return wrapper;
      }
    };
  }

  /**
   * Reset elements to their initial state.
   */
  reset() {
    let values = unifyColumnValues(this._getColumnVisibleValues());
    let items = intersectValues(values, values);

    this.getMultipleSelectElement().setItems(items);
    super.reset();
    this.getMultipleSelectElement().setValue(values);
  }

  /**
   * Key down listener.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  onInputKeyDown(event) {
    if (isKey(event.keyCode, 'ESCAPE')) {
      this.runLocalHooks('cancel');
      stopImmediatePropagation(event);
    }
  }

  /**
   * Get data for currently selected column.
   *
   * @returns {Array}
   * @private
   */
  _getColumnVisibleValues() {
    const lastSelectedColumn = this.hot.getPlugin('filters').getSelectedColumn();
    const visualIndex = lastSelectedColumn && lastSelectedColumn.visualIndex;

    return arrayMap(this.hot.getDataAtCol(visualIndex), (v) => toEmptyString(v));
  }
}

export default ValueComponent;
