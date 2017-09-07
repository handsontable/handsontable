import {addClass} from 'handsontable/helpers/dom/element';
import {stopImmediatePropagation} from 'handsontable/helpers/dom/event';
import {arrayEach, arrayFilter} from 'handsontable/helpers/array';
import {extend} from 'handsontable/helpers/object';
import {isKey} from 'handsontable/helpers/unicode';
import BaseComponent from './_base';
import getOptionsList, {CONDITION_NONE} from './../constants';
import InputUI from './../ui/input';
import SelectUI from './../ui/select';
import {getConditionDescriptor} from './../conditionRegisterer';

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
    this.elements.push(new InputUI(this.hot, {placeholder: 'Value'}));
    this.elements.push(new InputUI(this.hot, {placeholder: 'Second Value'}));
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getSelectElement().addLocalHook('select', (command) => this.onConditionSelect(command));
    this.getSelectElement().addLocalHook('afterClose', () => this.onSelectUIClosed());

    arrayEach(this.getInputElements(), (input) => {
      input.addLocalHook('keydown', (event) => this.onInputKeyDown(event));
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
      this.getSelectElement().setValue(value.command);
      arrayEach(value.args, (arg, index) => {
        if (index > value.command.inputsCount - 1) {
          return false;
        }

        let element = this.getInputElement(index);

        element.setValue(arg);
        element[value.command.inputsCount > index ? 'show' : 'hide']();

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
    let args = [];

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
    this.setCachedState(column, {
      command: condition ? getConditionDescriptor(condition.name) : getConditionDescriptor(CONDITION_NONE),
      args: condition ? condition.args : [],
    });

    if (!condition) {
      arrayEach(this.getInputElements(), (element) => element.setValue(null));
    }
  }

  /**
   * Get select element.
   *
   * @returns {SelectUI}
   */
  getSelectElement() {
    return this.elements.filter((element) => element instanceof SelectUI)[0];
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
    return this.elements.filter((element) => element instanceof InputUI);
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

        let label = document.createElement('div');

        addClass(label, 'htFiltersMenuLabel');
        label.textContent = this.name;

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
    const lastSelectedColumn = this.hot.getPlugin('filters').getSelectedColumn();
    const visualIndex = lastSelectedColumn && lastSelectedColumn.visualIndex;
    const columnType = this.hot.getDataType.apply(this.hot, this.hot.getSelected() || [0, visualIndex]);
    const items = getOptionsList(columnType);

    arrayEach(this.getInputElements(), (element) => element.hide());
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
