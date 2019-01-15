import {
  addClass,
  empty,
  fastInnerHTML,
  getComputedStyle,
  getCssTransform,
  getScrollableElement,
  offset,
  outerHeight,
  outerWidth,
  resetCssTransform,
} from './../helpers/dom/element';
import { stopImmediatePropagation } from './../helpers/dom/event';
import { KEY_CODES } from './../helpers/unicode';
import BaseEditor, { EditorState } from './_baseEditor';
import { objectEach } from '../helpers/object';

/**
 * @private
 * @editor SelectEditor
 * @class SelectEditor
 */
class SelectEditor extends BaseEditor {
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
   * @param {Number} row
   * @param {Number} col
   * @param {Number|String} prop
   * @param {HTMLTableCellElement} td
   * @param {*} originalValue
   * @param {Object} cellProperties
   */
  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const selectOptions = this.cellProperties.selectOptions;
    let options;

    if (typeof selectOptions === 'function') {
      options = this.prepareOptions(selectOptions(this.row, this.col, this.prop));
    } else {
      options = this.prepareOptions(selectOptions);
    }

    empty(this.select);

    objectEach(options, (value, key) => {
      const optionElement = this.hot.rootDocument.createElement('OPTION');
      optionElement.value = key;

      fastInnerHTML(optionElement, value);
      this.select.appendChild(optionElement);
    });
  }

  /**
   * Creates consistent list of available options.
   *
   * @private
   * @param {Array|Object} optionsToPrepare
   * @returns {Object}
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
    if (this.state !== EditorState.EDITING) {
      return;
    }

    this.TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!this.TD) {
      this.close();

      return;
    }

    const currentOffset = offset(this.TD);
    const containerOffset = offset(this.hot.rootElement);
    const scrollableContainer = getScrollableElement(this.TD);
    const editorSection = this.checkEditorSection();
    let width = outerWidth(this.TD) + 1;
    let height = outerHeight(this.TD) + 1;
    let editTop = currentOffset.top - containerOffset.top - 1 - (scrollableContainer.scrollTop || 0);
    let editLeft = currentOffset.left - containerOffset.left - 1 - (scrollableContainer.scrollLeft || 0);
    let cssTransformOffset;

    switch (editorSection) {
      case 'top':
        cssTransformOffset = getCssTransform(this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'left':
        cssTransformOffset = getCssTransform(this.hot.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'top-left-corner':
        cssTransformOffset = getCssTransform(this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'bottom-left-corner':
        cssTransformOffset = getCssTransform(this.hot.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
        break;
      case 'bottom':
        cssTransformOffset = getCssTransform(this.hot.view.wt.wtOverlays.bottomOverlay.clone.wtTable.holder.parentNode);
        break;
      default:
        break;
    }

    if (this.hot.getSelectedLast()[0] === 0) {
      editTop += 1;
    }
    if (this.hot.getSelectedLast()[1] === 0) {
      editLeft += 1;
    }

    const selectStyle = this.select.style;

    if (cssTransformOffset && cssTransformOffset !== -1) {
      selectStyle[cssTransformOffset[0]] = cssTransformOffset[1];
    } else {
      resetCssTransform(this.select);
    }

    const cellComputedStyle = getComputedStyle(this.TD);

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
  }

  /**
   * Gets HTMLTableCellElement of the edited cell if exist.
   *
   * @private
   * @returns {HTMLTableCellElement|undefined}
   */
  getEditedCell() {
    const editorSection = this.checkEditorSection();
    let editedCell;

    switch (editorSection) {
      case 'top':
        editedCell = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.getCell({
          row: this.row,
          col: this.col
        });
        this.select.style.zIndex = 101;
        break;
      case 'corner':
        editedCell = this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell({
          row: this.row,
          col: this.col
        });
        this.select.style.zIndex = 103;
        break;
      case 'left':
        editedCell = this.hot.view.wt.wtOverlays.leftOverlay.clone.wtTable.getCell({
          row: this.row,
          col: this.col
        });
        this.select.style.zIndex = 102;
        break;
      default:
        editedCell = this.hot.getCell(this.row, this.col);
        this.select.style.zIndex = '';
        break;
    }

    return editedCell !== -1 && editedCell !== -2 ? editedCell : void 0;
  }

  /**
   * onBeforeKeyDown callback.
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

export default SelectEditor;
