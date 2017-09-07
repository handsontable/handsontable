import {addClass, getWindowScrollTop, getWindowScrollLeft} from 'handsontable/helpers/dom/element';
import Menu from 'handsontable/plugins/contextMenu/menu';
import {clone, extend} from 'handsontable/helpers/object';
import {arrayEach} from 'handsontable/helpers/array';
import {SEPARATOR} from 'handsontable/plugins/contextMenu/predefinedItems';
import BaseUI from './_base';

const privatePool = new WeakMap();

/**
 * @class SelectUI
 * @util
 */
class SelectUI extends BaseUI {
  static get DEFAULTS() {
    return clone({
      className: 'htUISelect',
      wrapIt: false,
    });
  }

  constructor(hotInstance, options) {
    super(hotInstance, extend(SelectUI.DEFAULTS, options));

    privatePool.set(this, {});
    /**
     * Instance of {@link Menu}.
     *
     * @type {Menu}
     */
    this.menu = null;
    /**
     * List of available select options.
     *
     * @type {Array}
     */
    this.items = [];

    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   */
  registerHooks() {
    this.addLocalHook('click', (event) => this.onClick(event));
  }

  /**
   * Set options which can be selected in the list.
   *
   * @param {Array} items Array of objects with required keys `key` and `name`.
   */
  setItems(items) {
    this.items = items;

    if (this.menu) {
      this.menu.setMenuItems(this.items);
    }
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();
    this.menu = new Menu(this.hot, {
      className: 'htSelectUI htFiltersConditionsMenu',
      keepInViewport: false,
      standalone: true,
    });
    this.menu.setMenuItems(this.items);

    const caption = new BaseUI(this.hot, {
      className: 'htUISelectCaption'
    });
    const dropdown = new BaseUI(this.hot, {
      className: 'htUISelectDropdown'
    });
    const priv = privatePool.get(this);

    priv.caption = caption;
    priv.captionElement = caption.element;
    priv.dropdown = dropdown;

    arrayEach([caption, dropdown], (element) => this._element.appendChild(element.element));

    this.menu.addLocalHook('select', (command) => this.onMenuSelect(command));
    this.menu.addLocalHook('afterClose', () => this.onMenuClosed());
    this.update();
  }

  /**
   * Update DOM structure.
   */
  update() {
    if (!this.isBuilt()) {
      return;
    }
    privatePool.get(this).captionElement.textContent = this.options.value ? this.options.value.name : 'None';
    super.update();
  }

  /**
   * Open select dropdown menu with available options.
   */
  openOptions() {
    let rect = this.element.getBoundingClientRect();

    if (this.menu) {
      this.menu.open();
      this.menu.setPosition({
        left: rect.left - 5,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
    }
  }

  /**
   * Close select dropdown menu.
   */
  closeOptions() {
    if (this.menu) {
      this.menu.close();
    }
  }

  /**
   * On menu selected listener.
   *
   * @private
   * @param {Object} command Selected item
   */
  onMenuSelect(command) {
    if (command.name !== SEPARATOR) {
      this.options.value = command;
      this.closeOptions();
      this.update();
      this.runLocalHooks('select', this.options.value);
    }
  }

  /**
   * On menu closed listener.
   *
   * @private
   */
  onMenuClosed() {
    this.runLocalHooks('afterClose');
  }

  /**
   * On element click listener.
   *
   * @private
   * @param {Event} event DOM Event
   */
  onClick(event) {
    this.openOptions();
  }

  /**
   * Destroy instance.
   */
  destroy() {
    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }
    const {caption, dropdown} = privatePool.get(this);

    if (caption) {
      caption.destroy();
    }
    if (dropdown) {
      dropdown.destroy();
    }

    super.destroy();
  }
}

export default SelectUI;
