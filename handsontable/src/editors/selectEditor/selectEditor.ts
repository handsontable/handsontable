import { BaseEditor, EDITOR_STATE } from '../baseEditor';
import type { CellProperties } from '../../settings';
import {
  addClass,
  empty,
  fastInnerHTML,
  hasClass,
  removeClass,
} from '../../helpers/dom/element';
import { objectEach } from '../../helpers/object';
import { A11Y_HIDDEN } from '../../helpers/a11y';

const EDITOR_VISIBLE_CLASS_NAME = 'ht_editor_visible';
const SHORTCUTS_GROUP = 'selectEditor';

export const EDITOR_TYPE = 'select';

/**
 * @private
 * @class SelectEditor
 */
export class SelectEditor extends BaseEditor {
  /**
   * Returns the unique editor type identifier for the select editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * @type {HTMLDivElement}
   */
  declare selectWrapper: HTMLDivElement;
  /**
   * @type {HTMLSelectElement}
   */
  declare select: HTMLSelectElement;

  /**
   * Initializes editor instance, DOM Element and mount hooks.
   */
  init(): void {
    this.selectWrapper = this.hot.rootDocument.createElement('div');
    this.select = this.hot.rootDocument.createElement('select');
    this.select.setAttribute('data-hot-input', 'true');
    this.selectWrapper.style.display = 'none';

    const ARROW = this.hot.rootDocument.createElement('DIV');
    const isAriaEnabled = this.hot.getSettings().ariaTags;

    ARROW.className = 'htAutocompleteArrow';

    if (isAriaEnabled) {
      ARROW.setAttribute(...A11Y_HIDDEN());
    }

    ARROW.appendChild(this.hot.rootDocument.createTextNode(String.fromCharCode(9660)));

    addClass(this.selectWrapper, 'htSelectEditor');
    this.selectWrapper.appendChild(this.select);

    this.selectWrapper.insertBefore(ARROW, this.selectWrapper.firstChild);

    this.hot.rootElement.appendChild(this.selectWrapper);
    this.registerHooks();

    this.hot.addHookOnce('afterDestroy', () => this.destroy());
  }

  /**
   * Returns select's value.
   *
   * @returns {*}
   */
  getValue(): unknown {
    return this.select.value;
  }

  /**
   * Sets value in the select element.
   *
   * @param {*} value A new select's value.
   */
  setValue(value?: unknown): void {
    this.select.value = (value === null || value === undefined) ? '' : String(value);
  }

  /**
   * Opens the editor and adjust its size.
   */
  open(): void {
    this._opened = true;
    this.refreshDimensions();
    this.selectWrapper.style.display = '';

    const shortcutManager = this.hot.getShortcutManager();

    shortcutManager.setActiveContextName('editor');

    this.registerShortcuts();
  }

  /**
   * Closes the editor.
   */
  close(): void {
    this._opened = false;
    this.selectWrapper.style.display = 'none';

    if (hasClass(this.selectWrapper, EDITOR_VISIBLE_CLASS_NAME)) {
      removeClass(this.selectWrapper, EDITOR_VISIBLE_CLASS_NAME);
    }

    this.unregisterShortcuts();
    this.removeHooksByKey('beforeDialogShow');
  }

  /**
   * Sets focus state on the select element.
   */
  focus(): void {
    this.select.focus();
  }

  /**
   * Binds hooks to refresh editor's size after scrolling of the viewport or resizing of columns/rows.
   *
   * @private
   */
  registerHooks(): void {
    this.addHook('afterScrollHorizontally', () => this.refreshDimensions());
    this.addHook('afterScrollVertically', () => this.refreshDimensions());
    this.addHook('afterColumnResize', () => this.refreshDimensions());
    this.addHook('afterRowResize', () => this.refreshDimensions());
  }

  /**
   * Prepares editor's meta data and a list of available options.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(
    row: number, col: number, prop: string | number,
    td: HTMLTableCellElement, value: unknown, cellProperties: CellProperties): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    type SelectOpts = (string | number | object)[] | Record<string, string> | undefined;
    const selectOptions = this.cellProperties.selectOptions as SelectOpts;
    let options;

    if (typeof selectOptions === 'function') {
      type OptionsFn = (row: number, col: number, prop: string | number) => unknown;
      options = this.prepareOptions((selectOptions as OptionsFn)(this.row!, this.col!, this.prop!));
    } else {
      options = this.prepareOptions(selectOptions);
    }

    empty(this.select);

    const { sanitizer } = this.hot.getSettings();

    if (Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const optionElement = this.hot.rootDocument.createElement('OPTION') as HTMLOptionElement;

        optionElement.value = String(options[i]);
        fastInnerHTML(optionElement, String(options[i]), sanitizer, 'selectEditor', this.hot.rootElement);
        this.select.appendChild(optionElement);
      }
    } else {
      objectEach(options, (optionValue, key) => {
        const optionElement = this.hot.rootDocument.createElement('OPTION') as HTMLOptionElement;

        optionElement.value = key;
        fastInnerHTML(optionElement, String(optionValue), sanitizer, 'selectEditor', this.hot.rootElement);
        this.select.appendChild(optionElement);
      });
    }
  }

  /**
   * Creates consistent list of available options.
   *
   * @private
   * @param {Array|object} optionsToPrepare The list of the values to render in the select element.
   * @returns {Array|object}
   */
  prepareOptions(optionsToPrepare?: unknown): unknown[] | Record<string, unknown> {
    if (Array.isArray(optionsToPrepare)) {
      return optionsToPrepare as unknown[];
    }

    if (typeof optionsToPrepare === 'object') {
      return optionsToPrepare as Record<string, unknown>;
    }

    return {};
  }

  /**
   * Refreshes editor's value using source data.
   *
   * @private
   */
  refreshValue(): void {
    const sourceData = this.hot.getSourceDataAtCell(this.row!, this.prop as number);

    this.originalValue = sourceData;

    this.setValue(sourceData);
    this.refreshDimensions();
  }

  /**
   * Refreshes editor's size and position.
   *
   * @private
   */
  refreshDimensions(): void {
    if (this.state !== EDITOR_STATE.EDITING) {
      return;
    }

    this.TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!this.TD) {
      this.close();

      return;
    }

    const cellRect = this.getEditedCellRect();

    if (!cellRect) {
      return;
    }

    const { top, start, width, height } = cellRect;
    const selectStyle = this.selectWrapper.style;

    selectStyle.height = `${height}px`;
    selectStyle.width = `${width}px`;
    selectStyle.top = `${top}px`;
    selectStyle[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;
    selectStyle.margin = '0px';

    addClass(this.selectWrapper, EDITOR_VISIBLE_CLASS_NAME);
  }

  /**
   * Register shortcuts responsible for handling editor.
   *
   * @private
   */
  registerShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      group: SHORTCUTS_GROUP,
    };

    if (this.isInFullEditMode()) {
      // The arrow-related shortcuts should work only in full edit mode.
      editorContext!.addShortcuts([{
        keys: [['ArrowUp']],
        callback: () => {
          const previousOptionIndex = this.select.selectedIndex - 1;

          if (previousOptionIndex >= 0) {
            (this.select[previousOptionIndex] as HTMLOptionElement).selected = true;
          }
        },
      }, {
        keys: [['ArrowDown']],
        callback: () => {
          const nextOptionIndex = this.select.selectedIndex + 1;

          if (nextOptionIndex <= this.select.length - 1) {
            (this.select[nextOptionIndex] as HTMLOptionElement).selected = true;
          }
        }
      }], contextConfig);
    }
  }

  /**
   * Unregister shortcuts responsible for handling editor.
   *
   * @private
   */
  unregisterShortcuts(): void {
    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext!.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Clears all attached hooks.
   *
   * @private
   */
  destroy() {
    this.clearHooks();
  }
}
