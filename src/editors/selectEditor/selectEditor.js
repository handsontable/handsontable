import { BaseEditor, EDITOR_STATE } from '../baseEditor';
import {
  addClass,
  empty,
  fastInnerHTML,
  getComputedStyle,
  getCssTransform,
  hasClass,
  offset,
  outerHeight,
  outerWidth,
  removeClass,
  resetCssTransform,
} from '../../helpers/dom/element';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { objectEach } from '../../helpers/object';
import { KEY_CODES } from '../../helpers/unicode';

const EDITOR_VISIBLE_CLASS_NAME = 'ht_editor_visible';

export const EDITOR_TYPE = 'select';

/**
 * @private
 * @class SelectEditor
 */
export class SelectEditor extends BaseEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Initializes editor instance, DOM Element and mount hooks.
   */
  init() {
    this.select = this.hot.rootDocument.createElement('SELECT');
    addClass(this.select, 'htSelectEditor');
    this.select.style.display = 'none';

    this.hot.rootElement.appendChild(this.select);
    this.registerHooks();
  }

  /**
   * Returns select's value.
   *
   * @returns {*}
   */
  getValue() {
    return this.select.value;
  }

  /**
   * Sets value in the select element.
   *
   * @param {*} value A new select's value.
   */
  setValue(value) {
    this.select.value = value;
  }

  /**
   * Opens the editor and adjust its size.
   */
  open() {
    this._opened = true;
    this.refreshDimensions();
    this.select.style.display = '';
    this.addHook('beforeKeyDown', () => this.onBeforeKeyDown());
  }

  /**
   * Closes the editor.
   */
  close() {
    this._opened = false;
    this.select.style.display = 'none';

    if (hasClass(this.select, EDITOR_VISIBLE_CLASS_NAME)) {
      removeClass(this.select, EDITOR_VISIBLE_CLASS_NAME);
    }
    this.clearHooks();
  }

  /**
   * Sets focus state on the select element.
   */
  focus() {
    this.select.focus();
  }

  /**
   * Binds hooks to refresh editor's size after scrolling of the viewport or resizing of columns/rows.
   *
   * @private
   */
  registerHooks() {
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
   * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
   */
  prepare(row, col, prop, td, value, cellProperties) {
    super.prepare(row, col, prop, td, value, cellProperties);

    const selectOptions = this.cellProperties.selectOptions;
    let options;

    if (typeof selectOptions === 'function') {
      options = this.prepareOptions(selectOptions(this.row, this.col, this.prop));
    } else {
      options = this.prepareOptions(selectOptions);
    }

    empty(this.select);

    objectEach(options, (optionValue, key) => {
      const optionElement = this.hot.rootDocument.createElement('OPTION');

      optionElement.value = key;

      fastInnerHTML(optionElement, optionValue);
      this.select.appendChild(optionElement);
    });
  }

  /**
   * Creates consistent list of available options.
   *
   * @private
   * @param {Array|object} optionsToPrepare The list of the values to render in the select eleemnt.
   * @returns {object}
   */
  prepareOptions(optionsToPrepare) {
    let preparedOptions = {};

    if (Array.isArray(optionsToPrepare)) {
      for (let i = 0, len = optionsToPrepare.length; i < len; i++) {
        preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
      }

    } else if (typeof optionsToPrepare === 'object') {
      preparedOptions = optionsToPrepare;
    }

    return preparedOptions;
  }

  /**
   * Refreshes editor's value using source data.
   *
   * @private
   */
  refreshValue() {
    const sourceData = this.hot.getSourceDataAtCell(this.row, this.prop);

    this.originalValue = sourceData;

    this.setValue(sourceData);
    this.refreshDimensions();
  }

  /**
   * Refreshes editor's size and position.
   *
   * @private
   */
  refreshDimensions() {
    if (this.state !== EDITOR_STATE.EDITING) {
      return;
    }

    this.TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!this.TD) {
      this.close();

      return;
    }

    const { wtOverlays } = this.hot.view.wt;
    const currentOffset = offset(this.TD);
    const containerOffset = offset(this.hot.rootElement);
    const scrollableContainer = wtOverlays.scrollableElement;
    const editorSection = this.checkEditorSection();
    let width = outerWidth(this.TD) + 1;
    let height = outerHeight(this.TD) + 1;
    let editTop = currentOffset.top - containerOffset.top - 1 - (scrollableContainer.scrollTop || 0);
    let editLeft = currentOffset.left - containerOffset.left - 1 - (scrollableContainer.scrollLeft || 0);
    let cssTransformOffset;

    switch (editorSection) {
      case 'top':
        cssTransformOffset = getCssTransform(wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'left':
        cssTransformOffset = getCssTransform(wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'top-left-corner':
        cssTransformOffset = getCssTransform(wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'bottom-left-corner':
        cssTransformOffset = getCssTransform(wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'bottom':
        cssTransformOffset = getCssTransform(wtOverlays.bottomOverlay.clone.wtTable.holder.parentNode);
        break;
      default:
        break;
    }

    const renderableRow = this.hot.rowIndexMapper.getRenderableFromVisualIndex(this.row);
    const renderableColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(this.col);
    const nrOfRenderableRowIndexes = this.hot.rowIndexMapper.getRenderableIndexesLength();
    const firstRowIndexOfTheBottomOverlay = nrOfRenderableRowIndexes - this.hot.view.wt.getSetting('fixedRowsBottom');

    if (renderableRow <= 0 || renderableRow === firstRowIndexOfTheBottomOverlay) {
      editTop += 1;
    }

    if (renderableColumn <= 0) {
      editLeft += 1;
    }

    const selectStyle = this.select.style;

    if (cssTransformOffset && cssTransformOffset !== -1) {
      selectStyle[cssTransformOffset[0]] = cssTransformOffset[1];
    } else {
      resetCssTransform(this.select);
    }

    const cellComputedStyle = getComputedStyle(this.TD, this.hot.rootWindow);

    if (parseInt(cellComputedStyle.borderTopWidth, 10) > 0) {
      height -= 1;
    }
    if (parseInt(cellComputedStyle.borderLeftWidth, 10) > 0) {
      width -= 1;
    }

    selectStyle.height = `${height}px`;
    selectStyle.minWidth = `${width}px`;
    selectStyle.top = `${editTop}px`;
    selectStyle.left = `${editLeft}px`;
    selectStyle.margin = '0px';

    addClass(this.select, EDITOR_VISIBLE_CLASS_NAME);
  }

  /**
   * OnBeforeKeyDown callback.
   *
   * @private
   */
  onBeforeKeyDown() {
    const previousOptionIndex = this.select.selectedIndex - 1;
    const nextOptionIndex = this.select.selectedIndex + 1;

    switch (event.keyCode) {
      case KEY_CODES.ARROW_UP:
        if (previousOptionIndex >= 0) {
          this.select[previousOptionIndex].selected = true;
        }

        stopImmediatePropagation(event);
        event.preventDefault();
        break;

      case KEY_CODES.ARROW_DOWN:
        if (nextOptionIndex <= this.select.length - 1) {
          this.select[nextOptionIndex].selected = true;
        }

        stopImmediatePropagation(event);
        event.preventDefault();
        break;

      default:
        break;
    }
  }
}
