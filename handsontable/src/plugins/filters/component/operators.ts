import type { HotInstance } from '../../../core/types';
import { addClass, eventTargetEl, isHTMLElement } from '../../../helpers/dom/element';
import { throwWithCause } from '../../../helpers/errors';
import { arrayEach } from '../../../helpers/array';
import { toSingleLine } from '../../../helpers/templateLiteralTag';
import { BaseComponent } from './_base';
import { getOperationName } from '../logicalOperationRegisterer';
import { OPERATION_ID as OPERATION_AND } from '../logicalOperations/conjunction';
import { OPERATION_ID as OPERATION_OR } from '../logicalOperations/disjunction';
import { OPERATION_ID as OPERATION_OR_THEN_VARIABLE } from '../logicalOperations/disjunctionWithExtraCondition';
import { RadioInputUI } from '../ui/radioInput';
import type { BaseUI } from '../ui/_base';

const SELECTED_AT_START_ELEMENT_INDEX = 0;

/**
 * @private
 * @class OperatorsComponent
 */
export class OperatorsComponent extends BaseComponent {
  /**
   * The name of the component.
   *
   * @type {string}
   */
  name = '';

  constructor(hotInstance: HotInstance, options: { id: string; name: string }) {
    super(hotInstance, {
      id: options.id,
      stateless: false,
    });

    this.name = options.name;

    this.buildOperatorsElement();
  }

  /**
   * Get menu object descriptor.
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
      renderer: (hot: HotInstance, wrapper: HTMLTableCellElement) => {
        if (isHTMLElement(wrapper.parentNode)) {
          addClass(wrapper.parentNode, 'htFiltersMenuOperators');
        }
        arrayEach(this.elements as BaseUI[], (ui: BaseUI) => wrapper.appendChild(ui.element));

        return wrapper;
      }
    };
  }

  /**
   * Add RadioInputUI elements to component.
   *
   * @private
   */
  buildOperatorsElement() {
    const operationKeys = [OPERATION_AND, OPERATION_OR];

    arrayEach(operationKeys, (operation: string) => {
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

      radioInput.addLocalHook('change', (event: Event) => this.#onRadioInputChange(event));
      this.elements.push(radioInput);
    });
  }

  /**
   * Set state of operators component to check radio input at specific `index`.
   *
   * @param {number} searchedIndex Index of radio input to check.
   */
  setChecked(searchedIndex: number) {
    if (this.elements.length < searchedIndex) {
      throwWithCause(toSingleLine`Radio button with index ${searchedIndex} doesn't exist.`);
    }

    arrayEach(this.elements as RadioInputUI[], (element: RadioInputUI, index: number) => {
      element.setChecked(index === searchedIndex);
    });
  }

  /**
   * Get `id` of active operator.
   *
   * @returns {string}
   */
  getActiveOperationId() {
    const operationElement = this.elements.find(element => element instanceof RadioInputUI && element.isChecked());

    if (operationElement) {
      return (operationElement as RadioInputUI).getValue();
    }

    return OPERATION_AND;
  }

  /**
   * Export state of the component (get selected operator).
   *
   * @returns {string} Returns `id` of selected operator.
   */
  getState() {
    return this.getActiveOperationId();
  }

  /**
   * Set state of the component.
   *
   * @param {object} value State to restore.
   */
  setState(value?: unknown) {
    this.reset();

    if (value && this.getActiveOperationId() !== value) {
      arrayEach(this.elements as RadioInputUI[], (element: RadioInputUI) => {
        element.setChecked(element.getValue() === value);
      });
    }
  }

  /**
   * Update state of component.
   *
   * @param {string} [operationId='conjunction'] Id of selected operation.
   * @param {number} column Physical column index.
   */
  updateState(operationId: string = OPERATION_AND, column: number) {
    let selectedOperationId = operationId;

    if (selectedOperationId === OPERATION_OR_THEN_VARIABLE) {
      selectedOperationId = OPERATION_OR;
    }

    this.state.setValueAtIndex(column, selectedOperationId);
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
   * @param {Event} event The DOM event object.
   */
  #onRadioInputChange(event: Event) {
    this.setState(eventTargetEl<HTMLInputElement>(event)!.value);
  }
}
