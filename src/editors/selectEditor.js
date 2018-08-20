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

const SelectEditor = BaseEditor.prototype.extend();

/**
 * @private
 * @editor SelectEditor
 * @class SelectEditor
 */
SelectEditor.prototype.init = function() {
  this.select = document.createElement('SELECT');
  addClass(this.select, 'htSelectEditor');
  this.select.style.display = 'none';
  this.instance.rootElement.appendChild(this.select);
  this.registerHooks();
};

SelectEditor.prototype.registerHooks = function() {
  this.instance.addHook('afterScrollHorizontally', () => this.refreshDimensions());
  this.instance.addHook('afterScrollVertically', () => this.refreshDimensions());
  this.instance.addHook('afterColumnResize', () => this.refreshDimensions());
  this.instance.addHook('afterRowResize', () => this.refreshDimensions());
};

SelectEditor.prototype.prepare = function(...args) {
  BaseEditor.prototype.prepare.apply(this, args);

  const selectOptions = this.cellProperties.selectOptions;
  let options;

  if (typeof selectOptions === 'function') {
    options = this.prepareOptions(selectOptions(this.row, this.col, this.prop));
  } else {
    options = this.prepareOptions(selectOptions);
  }

  empty(this.select);

  objectEach(options, (value, key) => {
    const optionElement = document.createElement('OPTION');
    optionElement.value = key;
    fastInnerHTML(optionElement, value);
    this.select.appendChild(optionElement);
  });
};

SelectEditor.prototype.prepareOptions = function(optionsToPrepare) {
  let preparedOptions = {};

  if (Array.isArray(optionsToPrepare)) {
    for (let i = 0, len = optionsToPrepare.length; i < len; i++) {
      preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
    }
  } else if (typeof optionsToPrepare === 'object') {
    preparedOptions = optionsToPrepare;
  }

  return preparedOptions;

};

SelectEditor.prototype.getValue = function() {
  return this.select.value;
};

SelectEditor.prototype.setValue = function(value) {
  this.select.value = value;
};

const onBeforeKeyDown = function(event) {
  const instance = this;
  const editor = instance.getActiveEditor();
  const previousOptionIndex = editor.select.selectedIndex - 1;
  const nextOptionIndex = editor.select.selectedIndex + 1;

  switch (event.keyCode) {
    case KEY_CODES.ARROW_UP:
      if (previousOptionIndex >= 0) {
        editor.select[previousOptionIndex].selected = true;
      }

      stopImmediatePropagation(event);
      event.preventDefault();
      break;

    case KEY_CODES.ARROW_DOWN:
      if (nextOptionIndex <= editor.select.length - 1) {
        editor.select[nextOptionIndex].selected = true;
      }

      stopImmediatePropagation(event);
      event.preventDefault();
      break;

    default:
      break;
  }
};

SelectEditor.prototype.open = function() {
  this._opened = true;
  this.refreshDimensions();
  this.select.style.display = '';
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
};

SelectEditor.prototype.close = function() {
  this._opened = false;
  this.select.style.display = 'none';
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
};

SelectEditor.prototype.focus = function() {
  this.select.focus();
};

SelectEditor.prototype.refreshValue = function() {
  const sourceData = this.instance.getSourceDataAtCell(this.row, this.prop);
  this.originalValue = sourceData;

  this.setValue(sourceData);
  this.refreshDimensions();
};

SelectEditor.prototype.refreshDimensions = function() {
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
  const containerOffset = offset(this.instance.rootElement);
  const scrollableContainer = getScrollableElement(this.TD);
  const editorSection = this.checkEditorSection();
  let width = outerWidth(this.TD) + 1;
  let height = outerHeight(this.TD) + 1;
  let editTop = currentOffset.top - containerOffset.top - 1 - (scrollableContainer.scrollTop || 0);
  let editLeft = currentOffset.left - containerOffset.left - 1 - (scrollableContainer.scrollLeft || 0);
  let cssTransformOffset;

  switch (editorSection) {
    case 'top':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'left':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'top-left-corner':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'bottom-left-corner':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'bottom':
      cssTransformOffset = getCssTransform(this.instance.view.wt.wtOverlays.bottomOverlay.clone.wtTable.holder.parentNode);
      break;
    default:
      break;
  }
  if (this.instance.getSelectedLast()[0] === 0) {
    editTop += 1;
  }

  if (this.instance.getSelectedLast()[1] === 0) {
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
};

SelectEditor.prototype.getEditedCell = function() {
  const editorSection = this.checkEditorSection();
  let editedCell;

  switch (editorSection) {
    case 'top':
      editedCell = this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.select.style.zIndex = 101;
      break;
    case 'corner':
      editedCell = this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.select.style.zIndex = 103;
      break;
    case 'left':
      editedCell = this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.select.style.zIndex = 102;
      break;
    default:
      editedCell = this.instance.getCell(this.row, this.col);
      this.select.style.zIndex = '';
      break;
  }

  return editedCell !== -1 && editedCell !== -2 ? editedCell : void 0;
};

export default SelectEditor;
