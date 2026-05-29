import type { HotInstance } from '../../../core/types';
import { Menu } from '../../../plugins/contextMenu/menu';
import { clone, extend } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';
import { setAttribute } from '../../../helpers/dom/element';
import * as C from '../../../i18n/constants';
import { SEPARATOR } from '../../../plugins/contextMenu/predefinedItems';
import { BaseUI } from './_base';
import type { BaseUIOptions } from './_base';
import { A11Y_HIDDEN, A11Y_LISTBOX } from '../../../helpers/a11y';

interface SelectMenuItem {
  key?: string;
  name?: string;
  inputsCount?: number;
  [key: string]: unknown;
}

/**
 * @private
 * @class SelectUI
 */
export class SelectUI extends BaseUI {
  static get DEFAULTS(): BaseUIOptions {
    return clone({
      className: 'htUISelect',
      wrapIt: false,
      tabIndex: -1,
    }) as BaseUIOptions;
  }

  /**
   * Instance of {@link Menu}.
   *
   * @type {Menu}
   */
  #menu: Menu | null = null;
  #items: SelectMenuItem[] = [];
  #caption: BaseUI | null = null;
  #captionElement: HTMLElement | null = null;
  #dropdown: BaseUI | null = null;

  constructor(hotInstance: HotInstance, options: Record<string, unknown>) {
    super(hotInstance, extend(SelectUI.DEFAULTS as Record<string, unknown>, options) as Record<string, unknown>);
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
  setItems(items: SelectMenuItem[]) {
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
  translateNames(items: SelectMenuItem[]) {
    arrayEach(items, (item) => {
      const menuItem = item as SelectMenuItem;

      menuItem.name = this.translateIfPossible(menuItem.name) as string | undefined;
    });

    return items;
  }

  /**
   * Build DOM structure.
   */
  build() {
    super.build();

    if (!this.hot || !this._element) {
      return;
    }

    const hot = this.hot;
    const rootElement = this._element;

    this.#menu = new Menu(hot, {
      className: 'htSelectUI htFiltersConditionsMenu',
      keepInViewport: false,
      standalone: true,
      container: this.options.menuContainer,
    });
    this.#menu.setMenuItems(this.#items);

    const caption = new BaseUI(hot, {
      className: 'htUISelectCaption'
    });

    const dropdown = new BaseUI(hot, {
      className: 'htUISelectDropdown'
    });

    this.#caption = caption;
    this.#captionElement = caption.element;
    this.#dropdown = dropdown;

    if (hot.getSettings().ariaTags) {
      const dropdownEl = dropdown.element;

      if (dropdownEl) {
        setAttribute(dropdownEl, [
          A11Y_HIDDEN()
        ]);
      }

      setAttribute(rootElement, [
        A11Y_LISTBOX()
      ]);
    }

    arrayEach([caption, dropdown] as BaseUI[], (element) => {
      const el = (element as BaseUI).element;

      if (el) {
        rootElement.appendChild(el);
      }
    });

    this.#menu.addLocalHook('select', (command: Record<string, unknown>) => this.#onMenuSelect(command));
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
      conditionName = (this.options.value as SelectMenuItem).name;

    } else {
      conditionName = this.#menu?.hot?.getTranslatedPhrase(C.FILTERS_CONDITIONS_NONE);
    }

    if (this.#captionElement) {
      this.#captionElement.textContent = conditionName ?? null;
    }
    super.update();
  }

  /**
   * Open select dropdown menu with available options.
   */
  openOptions() {
    const el = this.element;

    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();

    if (this.#menu) {
      this.#menu.open();
      this.#menu.setPosition({
        left: this.hot?.isLtr() ? rect.left - 5 : rect.left - 31,
        top: rect.top - 1,
        width: rect.width,
        height: rect.height,
      });
      this.#menu?.getNavigator()?.toFirstItem();
      this.#menu?.getKeyboardShortcutsCtrl()?.addCustomShortcuts([{
        keys: [['Tab'], ['Shift', 'Tab']],
        callback: (event: Event) => {
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
      this.element?.focus();
    }
  }

  /**
   * On menu selected listener.
   *
   * @param {object} command Selected item.
   */
  #onMenuSelect(command: Record<string, unknown>) {
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
