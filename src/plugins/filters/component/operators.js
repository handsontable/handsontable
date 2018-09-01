import { addClass } from 'handsontable/helpers/dom/element';
import { arrayEach } from 'handsontable/helpers/array';
import { toSingleLine } from 'handsontable/helpers/templateLiteralTag';
import BaseComponent from './_base';
import { getOperationName } from '../logicalOperationRegisterer';
import { OPERATION_ID as OPERATION_AND } from '../logicalOperations/conjunction';
import { OPERATION_ID as OPERATION_OR } from '../logicalOperations/disjunction';
import { OPERATION_ID as OPERATION_OR_THEN_VARIABLE } from '../logicalOperations/disjunctionWithExtraCondition';
import RadioInputUI from './../ui/radioInput';

const SELECTED_AT_START_ELEMENT_INDEX = 0;

/**
 * @class OperatorsComponent
 * @plugin Filters
 */
class OperatorsComponent extends BaseComponent {
  constructor(hotInstance, options) {
    super(hotInstance);

    this.id = options.id;
    this.name = options.name;

    this.buildOperatorsElement();
  }

  /**
   * Get menu object descriptor.
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
      renderer: (hot, wrapper) => {
        addClass(wrapper.parentNode, 'htFiltersMenuOperators');

        arrayEach(this.elements, ui => wrapper.appendChild(ui.element));

        return wrapper;
      }
    };
  }

  /**
   * Add RadioInputUI elements to component
   *
   * @private
   */
  buildOperatorsElement() {
    const operationKeys = [OPERATION_AND, OPERATION_OR];

    arrayEach(operationKeys, (operation) => {
      const radioInput = new RadioInputUI(this.hot, {
        name: 'operator',
        label: {
          htmlFor: operation,
          textContent: getOperationName(operation)
        },
        value: operation,
        checked: operation === operationKeys[SELECTED_AT_START_ELEMENT_INDEX],
        id: operation
      });

      radioInput.addLocalHook('change', event => this.onRadioInputChange(event));
      this.elements.push(radioInput);
    });
  }

  /**
   * Set state of operators component to check radio input at specific `index`.
   *
   * @param searchedIndex Index of radio input to check.
   */
  setChecked(searchedIndex) {
    if (this.elements.length < searchedIndex) {
      throw Error(toSingleLine`Radio button with index ${searchedIndex} doesn't exist.`);
    }

    arrayEach(this.elements, (element, index) => {
      element.setChecked(index === searchedIndex);
    });
  }

  /**
   * Get `id` of active operator
   *
   * @returns {String}
   */
  getActiveOperationId() {
    const operationElement = this.elements.find(element => element instanceof RadioInputUI && element.isChecked());

    if (operationElement) {
      return operationElement.getValue();
    }

    return OPERATION_AND;
  }

  /**
   * Export state of the component (get selected operator).
   *
   * @returns {String} Returns `id` of selected operator.
   */
  getState() {
    return this.getActiveOperationId();
  }

  /**
   * Set state of the component.
   *
   * @param {Object} value State to restore.
   */
  setState(value) {
    this.reset();

    if (value && this.getActiveOperationId() !== value) {
      arrayEach(this.elements, (element) => {
        element.setChecked(element.getValue() === value);
      });
    }
  }

  /**
   * Update state of component.
   * @param [operationId='conjunction'] Id of selected operation.
   * @param column Physical column index.
   */
  updateState(operationId = OPERATION_AND, column) {
    let selectedOperationId = operationId;

    if (selectedOperationId === OPERATION_OR_THEN_VARIABLE) {
      selectedOperationId = OPERATION_OR;
    }

    this.setCachedState(column, selectedOperationId);
  }

  /**
   * Reset elements to their initial state.
   */
  reset() {
    this.setChecked(SELECTED_AT_START_ELEMENT_INDEX);
  }

  /**
   * OnChange listener.
   *
   * @private
   * @param {Event} event DOM event
   */
  onRadioInputChange(event) {
    this.setState(event.realTarget.value);
  }
}

export default OperatorsComponent;
