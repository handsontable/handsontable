import { addClass } from 'handsontable/helpers/dom/element';
import { arrayEach } from 'handsontable/helpers/array';
import * as C from 'handsontable/i18n/constants';
import BaseComponent from './_base';
import InputUI from './../ui/input';

/**
 * @class ActionBarComponent
 * @plugin Filters
 */
class ActionBarComponent extends BaseComponent {
  static get BUTTON_OK() {
    return 'ok';
  }
  static get BUTTON_CANCEL() {
    return 'cancel';
  }

  constructor(hotInstance, options) {
    super(hotInstance);

    this.id = options.id;
    this.name = options.name;

    this.elements.push(
      new InputUI(this.hot, {
        type: 'button',
        value: C.FILTERS_BUTTONS_OK,
        className: 'htUIButton htUIButtonOK',
        identifier: ActionBarComponent.BUTTON_OK
      })
    );
    this.elements.push(
      new InputUI(this.hot, {
        type: 'button',
        value: C.FILTERS_BUTTONS_CANCEL,
        className: 'htUIButton htUIButtonCancel',
        identifier: ActionBarComponent.BUTTON_CANCEL
      })
    );
    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    arrayEach(this.elements, (element) => {
      element.addLocalHook('click', (event, button) => this.onButtonClick(event, button));
    });
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
        addClass(wrapper.parentNode, 'htFiltersMenuActionBar');

        if (!wrapper.parentNode.hasAttribute('ghost-table')) {
          arrayEach(this.elements, ui => wrapper.appendChild(ui.element));
        }

        return wrapper;
      }
    };
  }

  /**
   * Fire accept event.
   */
  accept() {
    this.runLocalHooks('accept');
  }

  /**
   * Fire cancel event.
   */
  cancel() {
    this.runLocalHooks('cancel');
  }

  /**
   * On button click listener.
   *
   * @private
   * @param {Event} event DOM event
   * @param {InputUI} button InputUI object.
   */
  onButtonClick(event, button) {
    if (button.options.identifier === ActionBarComponent.BUTTON_OK) {
      this.accept();
    } else {
      this.cancel();
    }
  }
}

export default ActionBarComponent;
