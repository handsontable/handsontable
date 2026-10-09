import type { HotInstance } from '../../../core/types';
import { addClass, isHTMLElement } from '../../../helpers/dom/element';
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
import type { BaseUI } from '../ui/_base';

interface ConditionDescriptor {
  key?: string;
  name?: string;
  inputsCount?: number;
  inputType?: string;
  inputTypeByColumnType?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * @private
 * @class ConditionComponent
 */
export class ConditionComponent extends BaseComponent {
  /**
   * Narrowed element list — ConditionComponent only ever holds SelectUI and InputUI instances.
   */
  declare elements: BaseUI[];

  /**
   * The name of the component.
   *
   * @type {string}
   */
  name: string | (() => string) = '';
  /**
   * The data type of the column the menu is open for, computed once by `reset()`.
   */
  #columnType: string | undefined;
  /**
   * @type {boolean}
   */
  addSeparator = false;

  /**
   * Initializes the condition component with the given ID, display name, separator flag, and optional menu container.
   */
  constructor(hotInstance: HotInstance, options: {
    id: string; name: string | (() => string); addSeparator: boolean; menuContainer?: HTMLElement;
    hiddenWhen?: (() => boolean);
  }) {
    super(hotInstance, {
      id: options.id,
      stateless: false,
      hiddenWhen: options.hiddenWhen,
    });

    this.name = options.name;
    this.addSeparator = options.addSeparator;

    this.elements.push(new SelectUI(hotInstance, { menuContainer: options.menuContainer }));
    this.elements.push(new InputUI(hotInstance, { placeholder: C.FILTERS_BUTTONS_PLACEHOLDER_VALUE }));
    this.elements.push(new InputUI(hotInstance, { placeholder: C.FILTERS_BUTTONS_PLACEHOLDER_SECOND_VALUE }));
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getSelectElement()
      .addLocalHook('select', (command: ConditionDescriptor) => this.#onConditionSelect(command))
      .addLocalHook('afterClose', () => this.runLocalHooks('afterClose'))
      .addLocalHook('tabKeydown', (event: Event) => this.runLocalHooks('selectTabKeydown', event));

    arrayEach(this.getInputElements(), (input) => {
      input.addLocalHook('keydown', (event: KeyboardEvent) => this.#onInputKeyDown(event));
    });
  }

  /**
   * Set state of the component.
   *
   * @param {object} value State to restore.
   */
  setState(value?: { command: ConditionDescriptor; args: unknown[] }) {
    this.reset();

    if (!value) {
      return;
    }

    const copyOfCommand = clone(value.command) as ConditionDescriptor;

    if (typeof copyOfCommand.name === 'string' && copyOfCommand.name.startsWith(C.FILTERS_CONDITIONS_NAMESPACE)) {
      copyOfCommand.name = this.hot?.getTranslatedPhrase(copyOfCommand.name) ?? copyOfCommand.name;
    }

    this.getSelectElement().setValue(copyOfCommand);
    const inputType = this.#getInputType(copyOfCommand);

    arrayEach(value.args, (arg, index) => {
      if (index > (copyOfCommand.inputsCount ?? 0) - 1) {
        return false;
      }

      const element = this.getInputElement(index);

      element.setType(inputType);
      element.setValue(arg);
      element[(copyOfCommand.inputsCount ?? 0) > index ? 'show' : 'hide']();

      if (!index) {
        this.hot?._registerTimeout(() => element.focus(), 10);
      }
    });
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {object} Returns object where `command` key keeps used condition filter and `args` key its arguments.
   */
  getState() {
    const command = (this.getSelectElement().getValue() ||
      getConditionDescriptor(CONDITION_NONE)) as ConditionDescriptor;
    const args: unknown[] = [];

    arrayEach(this.getInputElements(), (element, index) => {
      if ((command.inputsCount ?? 0) > index) {
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
  updateState(condition: { name: string; args: unknown[] } | null, column: number) {
    const command = condition ? getConditionDescriptor(condition.name) : getConditionDescriptor(CONDITION_NONE);

    this.state?.setValueAtIndex(column, {
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
    return this.elements.find((element): element is SelectUI => element instanceof SelectUI)!;
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
    return this.elements.filter((element): element is InputUI => element instanceof InputUI);
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
      hidden: () => this.isHiddenInMenu(),
      renderer: (
        hot: HotInstance, wrapper: HTMLTableCellElement, row: number, col: number, prop: string | number, value: string
      ) => {
        if (isHTMLElement(wrapper.parentNode)) {
          addClass(wrapper.parentNode, 'htFiltersMenuCondition');

          if (this.addSeparator) {
            addClass(wrapper.parentNode, 'border');
          }
        }

        const label = this.hot?.rootDocument.createElement('div') ?? wrapper.ownerDocument.createElement('div');

        addClass(label, 'htFiltersMenuLabel');

        label.textContent = value;

        wrapper.appendChild(label);

        // The SelectUI should not extend the menu width (it should adjust to the menu item width only).
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
    const selectedColumn = this.hot?.getPlugin('filters').getSelectedColumn() ?? null;
    // A copy, because `setItems()` translates the names in place and the descriptor is shared.
    let items = [{ ...getConditionDescriptor(CONDITION_NONE) }];

    this.#columnType = undefined;

    if (selectedColumn !== null && this.hot) {
      const { visualIndex } = selectedColumn;

      this.#columnType = this.#getColumnDataType(visualIndex);
      items = getOptionsList(
        this.#columnType ?? 'text',
        this.hot.getPlugin('filters')._getAvailableConditions(visualIndex),
      );
    }

    arrayEach(this.getInputElements(), element => element.hide());
    this.getSelectElement().setItems(items);
    super.reset();
    // Select element as default 'None'
    this.getSelectElement().setValue(items[0]);
  }

  /**
   * Gets the native type of the argument inputs for the given condition. A condition shared by
   * several column types can declare a different type per column type, which takes precedence over
   * its own `inputType`.
   *
   * @param {object} command The condition descriptor.
   * @returns {string}
   */
  #getInputType(command: ConditionDescriptor): string {
    if (command.inputTypeByColumnType) {
      const inputType = this.#columnType ? command.inputTypeByColumnType[this.#columnType] : undefined;

      if (inputType) {
        return inputType;
      }
    }

    return command.inputType ?? 'text';
  }

  /**
   * Gets the data type of the whole column.
   *
   * @param {number} visualIndex The visual column index.
   * @returns {string | undefined}
   */
  #getColumnDataType(visualIndex: number): string | undefined {
    return this.hot?.getDataType(0, visualIndex, Math.max(this.hot.countRows() - 1, 0), visualIndex);
  }

  /**
   * On condition select listener.
   *
   * @param {object} command Menu item object (command).
   */
  #onConditionSelect(command: ConditionDescriptor) {
    const inputType = this.#getInputType(command);

    arrayEach(this.getInputElements(), (element, index) => {
      element.setType(inputType);
      element[(command.inputsCount ?? 0) > index ? 'show' : 'hide']();

      if (index === 0) {
        this.hot?._registerTimeout(() => element.focus(), 10);
      }
    });

    this.runLocalHooks('change', command);
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
  }
}
