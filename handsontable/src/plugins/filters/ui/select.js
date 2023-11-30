import { Menu } from '../../../plugins/contextMenu/menu';
import { clone, extend } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';
import { setAttribute } from '../../../helpers/dom/element';
import * as C from '../../../i18n/constants';
import { SEPARATOR } from '../../../plugins/contextMenu/predefinedItems';
import { BaseUI } from './_base';
import { A11Y_HIDDEN, A11Y_LISTBOX } from '../../../helpers/a11y';

/**
 * @private
 * @class SelectUI
 */
export class SelectUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      className: 'htUISelect',
      wrapIt: false,
      tabIndex: -1,
    });
  }

  /**
   * Instance of {@link Menu}.
   *
   * @type {Menu}
   */
  #menu = null;
  /**
   * List of available select options.
   *
   * @type {Array}
   */
  #items = [];
  /**
   * The reference to the BaseUI instance of the caption.
   *
   * @type {BaseUI}
   */
  #caption;
  /**
   * The reference to the table caption element.
   *
   * @type {HTMLTableCaptionElement}
   */
  #captionElement;
  /**
   * The reference to the BaseUI instance of the dropdown.
   *
   * @type {BaseUI}
   */
  #dropdown;

  constructor(hotInstance, options) {
    super(hotInstance, extend(SelectUI.DEFAULTS, options));
    this.registerHooks();
  }

  /**
   * Gets the instance of the Menu.
   *
   * @returns {Menu}
   */
  getMenu() {
    return this.#menu;
  }

  /**
   * Register all necessary hooks.
   */
  registerHooks() {
    this.addLocalHook('click', () => this.#onClick());
  }

  /**
   * Set options which can be selected in the list.
   *
   * @param {Array} items Array of objects with required keys `key` and `name`.
   */
  setItems(items) {
    this.#items = this.translateNames(items);

    if (this.#menu) {
      this.#menu.setMenuItems(this.#items);
    }
  }

  /**
   * Translate names of menu items.
   *
   * @param {Array} items Array of objects with required keys `key` and `name`.
   * @returns {Array} Items with translated `name` keys.
   */
  translateNames(items) {
    arrayEach(items, (item) => {
      item.name = this.translateIfPossible(item.name);
    });

    return items;
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
    this.#menu = new Menu(this.hot, {
      className: 'htSelectUI htFiltersConditionsMenu',
      keepInViewport: false,
      standalone: true,
      container: this.options.menuContainer,
    });
    this.#menu.setMenuItems(this.#items);

    const caption = new BaseUI(this.hot, {
      className: 'htUISelectCaption'
    });

    const dropdown = new BaseUI(this.hot, {
      className: 'htUISelectDropdown'
    });

    this.#caption = caption;
    this.#captionElement = caption.element;
    this.#dropdown = dropdown;

    if (this.hot.getSettings().ariaTags) {
      setAttribute(dropdown.element, [
        A11Y_HIDDEN()
      ]);

      setAttribute(this._element, [
        A11Y_LISTBOX()
      ]);
    }

    arrayEach([caption, dropdown], element => this._element.appendChild(element.element));

    this.#menu.addLocalHook('select', command => this.#onMenuSelect(command));
    this.#menu.addLocalHook('afterClose', () => this.#onMenuClosed());
    this.update();
  }

  /**
   * Update DOM structure.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }

    let conditionName;

    if (this.options.value) {
      conditionName = this.options.value.name;

    } else {
      conditionName = this.#menu.hot.getTranslatedPhrase(C.FILTERS_CONDITIONS_NONE);
    }

    this.#captionElement.textContent = conditionName;
    super.update();
  }

  /**
   * Open select dropdown menu with available options.
   */
  openOptions() {
    const rect = this.element.getBoundingClientRect();

    if (this.#menu) {
      this.#menu.open();
      this.#menu.setPosition({
        left: this.hot.isLtr() ? rect.left - 5 : rect.left - 31,
        top: rect.top - 1,
        width: rect.width,
        height: rect.height,
      });
      this.#menu.getNavigator().toFirstItem();
      this.#menu.getKeyboardShortcutsCtrl().addCustomShortcuts([{
        keys: [['Tab'], ['Shift', 'Tab']],
        callback: (event) => {
          this.closeOptions();
          this.runLocalHooks('tabKeydown', event);
        },
      }, {
        keys: [['Control/Meta', 'A']],
        callback: () => false,
      }]);
    }
  }

  /**
   * Close select dropdown menu.
   */
  closeOptions() {
    if (this.#menu) {
      this.#menu.close();
    }
  }

  /**
   * Focus element.
   */
  focus() {
    if (this.isBuilt()) {
      this.element.focus();
    }
  }

  /**
   * On menu selected listener.
   *
   * @param {object} command Selected item.
   */
  #onMenuSelect(command) {
    if (command.name !== SEPARATOR) {
      this.options.value = command;
      this.update();
      this.runLocalHooks('select', this.options.value);
    }
  }

  /**
   * On menu closed listener.
   */
  #onMenuClosed() {
    this.runLocalHooks('afterClose');
  }

  /**
   * On element click listener.
   *
   * @private
   */
  #onClick() {
    this.openOptions();
  }

  /**
   * Destroy instance.
   */
  destroy() {
    if (this.#menu) {
      this.#menu.destroy();
      this.#menu = null;
    }

    if (this.#caption) {
      this.#caption.destroy();
    }
    if (this.#dropdown) {
      this.#dropdown.destroy();
    }

    super.destroy();
  }
}
