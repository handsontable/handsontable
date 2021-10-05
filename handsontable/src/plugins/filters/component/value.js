import { addClass } from '../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach, arrayFilter, arrayMap } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import * as C from '../../../i18n/constants';
import { unifyColumnValues, intersectValues, toEmptyString } from '../utils';
import BaseComponent from './_base';
import MultipleSelectUI from '../ui/multipleSelect';
import { CONDITION_BY_VALUE, CONDITION_NONE } from '../constants';
import { getConditionDescriptor } from '../conditionRegisterer';

/**
 * @class ValueComponent
 * @plugin Filters
 */
class ValueComponent extends BaseComponent {
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
    this.getMultipleSelectElement().addLocalHook('keydown', event => this.onInputKeyDown(event));
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
        const rowValues = unifyColumnValues(
          arrayMap(filteredRowsFactory(physicalColumn, conditionsStack), row => row.value)
        );

        if (conditionArgsChange) {
          firstByValueCondition.args[0] = conditionArgsChange;
        }

        const selectedValues = [];
        const itemsSnapshot = intersectValues(
          rowValues,
          firstByValueCondition.args[0],
          defaultBlankCellValue,
          (item) => {
            if (item.checked) {
              selectedValues.push(item.value);
            }
          }
        );

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

        if (!wrapper.parentNode.hasAttribute('ghost-table')) {
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
    const values = unifyColumnValues(this._getColumnVisibleValues());
    const items = intersectValues(values, values, defaultBlankCellValue);

    this.getMultipleSelectElement().setItems(items);
    super.reset();
    this.getMultipleSelectElement().setValue(values);
  }

  /**
   * Key down listener.
   *
   * @private
   * @param {Event} event The DOM event object.
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

    return arrayMap(this.hot.getDataAtCol(visualIndex), v => toEmptyString(v));
  }
}

export default ValueComponent;
