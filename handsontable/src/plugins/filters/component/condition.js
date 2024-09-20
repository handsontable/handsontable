import { addClass } from '../../../helpers/dom/element';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import { clone } from '../../../helpers/object';
import * as C from '../../../i18n/constants';
import { BaseComponent } from './_base';
import getOptionsList, { CONDITION_NONE } from '../constants';
import { InputUI } from '../ui/input';
import { SelectUI } from '../ui/select';
import { getConditionDescriptor } from '../conditionRegisterer';

/**
 * @private
 * @class ConditionComponent
 */
export class ConditionComponent extends BaseComponent {
  /**
   * The name of the component.
   *
   * @type {string}
   */
  name = '';
  /**
   * @type {boolean}
   */
  addSeparator = false;

  constructor(hotInstance, options) {
    super(hotInstance, {
      id: options.id,
      stateless: false,
    });

    this.name = options.name;
    this.addSeparator = options.addSeparator;

    this.elements.push(new SelectUI(this.hot, { menuContainer: options.menuContainer }));
    this.elements.push(new InputUI(this.hot, { placeholder: C.FILTERS_BUTTONS_PLACEHOLDER_VALUE }));
    this.elements.push(new InputUI(this.hot, { placeholder: C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE }));
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getSelectElement()
      .addLocalHook('select', command => this.#onConditionSelect(command))
      .addLocalHook('afterClose', () => this.runLocalHooks('afterClose'))
      .addLocalHook('tabKeydown', event => this.runLocalHooks('selectTabKeydown', event));

    arrayEach(this.getInputElements(), (input) => {
      input.addLocalHook('keydown', event => this.#onInputKeyDown(event));
    });
  }

  /**
   * Set state of the component.
   *
   * @param {object} value State to restore.
   */
  setState(value) {
    this.reset();

    if (!value) {
      return;
    }

    const copyOfCommand = clone(value.command);

    if (copyOfCommand.name.startsWith(C.FILTERS_CONDITIONS_NAMESPACE)) {
      copyOfCommand.name = this.hot.getTranslatedPhrase(copyOfCommand.name);
    }

    this.getSelectElement().setValue(copyOfCommand);
    arrayEach(value.args, (arg, index) => {
      if (index > copyOfCommand.inputsCount - 1) {
        return false;
      }

      const element = this.getInputElement(index);

      element.setValue(arg);
      element[copyOfCommand.inputsCount > index ? 'show' : 'hide']();

      if (!index) {
        this.hot._registerTimeout(() => element.focus(), 10);
      }
    });
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {object} Returns object where `command` key keeps used condition filter and `args` key its arguments.
   */
  getState() {
    const command = this.getSelectElement().getValue() || getConditionDescriptor(CONDITION_NONE);
    const args = [];

    arrayEach(this.getInputElements(), (element, index) => {
      if (command.inputsCount > index) {
        args.push(element.getValue());
      }
    });

    return {
      command,
      args,
    };
  }

  /**
   * Update state of component.
   *
   * @param {object} condition The condition object.
   * @param {object} condition.command The command object with condition name as `key` property.
   * @param {Array} condition.args An array of values to compare.
   * @param {number} column Physical column index.
   */
  updateState(condition, column) {
    const command = condition ? getConditionDescriptor(condition.name) : getConditionDescriptor(CONDITION_NONE);

    this.state.setValueAtIndex(column, {
      command,
      args: condition ? condition.args : [],
    });

    if (!condition) {
      arrayEach(this.getInputElements(), element => element.setValue(null));
    }
  }

  /**
   * Get select element.
   *
   * @returns {SelectUI}
   */
  getSelectElement() {
    return this.elements.filter(element => element instanceof SelectUI)[0];
  }

  /**
   * Get input element.
   *
   * @param {number} index Index an array of elements.
   * @returns {InputUI}
   */
  getInputElement(index = 0) {
    return this.getInputElements()[index];
  }

  /**
   * Get input elements.
   *
   * @returns {Array}
   */
  getInputElements() {
    return this.elements.filter(element => element instanceof InputUI);
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
      renderer: (hot, wrapper, row, col, prop, value) => {
        addClass(wrapper.parentNode, 'htFiltersMenuCondition');

        if (this.addSeparator) {
          addClass(wrapper.parentNode, 'border');
        }

        const label = this.hot.rootDocument.createElement('div');

        addClass(label, 'htFiltersMenuLabel');

        label.textContent = value;

        wrapper.appendChild(label);

        // The SelectUI should not extend the menu width (it should adjust to the menu item width only).
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
    const selectedColumn = this.hot.getPlugin('filters').getSelectedColumn();
    let items = [getConditionDescriptor(CONDITION_NONE)];

    if (selectedColumn !== null) {
      const { visualIndex } = selectedColumn;

      items = getOptionsList(this.hot.getDataType(0, visualIndex, this.hot.countRows(), visualIndex));
    }

    arrayEach(this.getInputElements(), element => element.hide());
    this.getSelectElement().setItems(items);
    super.reset();
    // Select element as default 'None'
    this.getSelectElement().setValue(items[0]);
  }

  /**
   * On condition select listener.
   *
   * @param {object} command Menu item object (command).
   */
  #onConditionSelect(command) {
    arrayEach(this.getInputElements(), (element, index) => {
      element[command.inputsCount > index ? 'show' : 'hide']();

      if (index === 0) {
        this.hot._registerTimeout(() => element.focus(), 10);
      }
    });

    this.runLocalHooks('change', command);
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
}
