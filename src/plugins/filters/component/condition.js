import { addClass } from 'handsontable/helpers/dom/element';
import { stopImmediatePropagation } from 'handsontable/helpers/dom/event';
import { arrayEach } from 'handsontable/helpers/array';
import { isKey } from 'handsontable/helpers/unicode';
import { clone } from 'handsontable/helpers/object';
import * as C from 'handsontable/i18n/constants';
import BaseComponent from './_base';
import getOptionsList, { CONDITION_NONE } from './../constants';
import InputUI from './../ui/input';
import SelectUI from './../ui/select';
import { getConditionDescriptor } from './../conditionRegisterer';

/**
 * @class ConditionComponent
 * @plugin Filters
 */
class ConditionComponent extends BaseComponent {
  constructor(hotInstance, options) {
    super(hotInstance);

    this.id = options.id;
    this.name = options.name;
    this.addSeparator = options.addSeparator;

    this.elements.push(new SelectUI(this.hot));
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
    this.getSelectElement().addLocalHook('select', command => this.onConditionSelect(command));
    this.getSelectElement().addLocalHook('afterClose', () => this.onSelectUIClosed());

    arrayEach(this.getInputElements(), (input) => {
      input.addLocalHook('keydown', event => this.onInputKeyDown(event));
    });
  }

  /**
   * Set state of the component.
   *
   * @param {Object} value State to restore.
   */
  setState(value) {
    this.reset();

    if (value) {
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
          setTimeout(() => element.focus(), 10);
        }
      });
    }
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {Object} Returns object where `command` key keeps used condition filter and `args` key its arguments.
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
   * @param {Object} condition Object with keys:
   *  * `command` Object, Command object with condition name as `key` property.
   *  * `args` Array, Condition arguments.
   * @param column Physical column index.
   */
  updateState(condition, column) {
    const command = condition ? getConditionDescriptor(condition.name) : getConditionDescriptor(CONDITION_NONE);

    this.setCachedState(column, {
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
   * @param {Number} index Index an array of elements.
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
        addClass(wrapper.parentNode, 'htFiltersMenuCondition');

        if (this.addSeparator) {
          addClass(wrapper.parentNode, 'border');
        }

        const label = document.createElement('div');

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
    const lastSelectedColumn = this.hot.getPlugin('filters').getSelectedColumn();
    const visualIndex = lastSelectedColumn && lastSelectedColumn.visualIndex;
    const columnType = this.hot.getDataType(...(this.hot.getSelectedLast() || [0, visualIndex]));
    const items = getOptionsList(columnType);

    arrayEach(this.getInputElements(), element => element.hide());
    this.getSelectElement().setItems(items);
    super.reset();
    // Select element as default 'None'
    this.getSelectElement().setValue(items[0]);
  }

  /**
   * On condition select listener.
   *
   * @private
   * @param {Object} command Menu item object (command).
   */
  onConditionSelect(command) {
    arrayEach(this.getInputElements(), (element, index) => {
      element[command.inputsCount > index ? 'show' : 'hide']();

      if (!index) {
        setTimeout(() => element.focus(), 10);
      }
    });

    this.runLocalHooks('change', command);
  }

  /**
   * On component SelectUI closed listener.
   *
   * @private
   */
  onSelectUIClosed() {
    this.runLocalHooks('afterClose');
  }

  /**
   * Key down listener.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  onInputKeyDown(event) {
    if (isKey(event.keyCode, 'ENTER')) {
      this.runLocalHooks('accept');
      stopImmediatePropagation(event);

    } else if (isKey(event.keyCode, 'ESCAPE')) {
      this.runLocalHooks('cancel');
      stopImmediatePropagation(event);
    }
  }
}

export default ConditionComponent;
