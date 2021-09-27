import React from 'react';
import Handsontable from 'handsontable';
import { HotEditorProps } from './types';

class BaseEditorComponent<P = {}, S = {}, SS = any> extends React.Component<P | HotEditorProps, S> implements Handsontable._editors.Base {
  name = 'BaseEditorComponent';
  instance = null;
  row = null;
  col = null;
  prop = null;
  TD = null;
  originalValue = null;
  cellProperties = null;
  state = null;
  hotInstance = null;
  hotCustomEditorInstance = null;
  hot = null;

  constructor(props) {
    super(props);

    if (props.emitEditorInstance) {
      props.emitEditorInstance(this);
    }
  }

  // BaseEditor methods:
  private _fireCallbacks(...args) {
    (Handsontable.editors.BaseEditor.prototype as any)._fireCallbacks.call(this.hotCustomEditorInstance, ...args);
  }

  beginEditing(...args) {
    return Handsontable.editors.BaseEditor.prototype.beginEditing.call(this.hotCustomEditorInstance, ...args);
  }

  cancelChanges(...args) {
    return Handsontable.editors.BaseEditor.prototype.cancelChanges.call(this.hotCustomEditorInstance, ...args);
  }

  checkEditorSection(...args) {
    return Handsontable.editors.BaseEditor.prototype.checkEditorSection.call(this.hotCustomEditorInstance, ...args);
  }

  close(...args) {
    return Handsontable.editors.BaseEditor.prototype.close.call(this.hotCustomEditorInstance, ...args);
  }

  discardEditor(...args) {
    return Handsontable.editors.BaseEditor.prototype.discardEditor.call(this.hotCustomEditorInstance, ...args);
  }

  enableFullEditMode(...args) {
    return Handsontable.editors.BaseEditor.prototype.enableFullEditMode.call(this.hotCustomEditorInstance, ...args);
  }

  extend(...args) {
    return Handsontable.editors.BaseEditor.prototype.extend.call(this.hotCustomEditorInstance, ...args);
  }

  finishEditing(...args) {
    return Handsontable.editors.BaseEditor.prototype.finishEditing.call(this.hotCustomEditorInstance, ...args);
  }

  focus(...args) {
    return Handsontable.editors.BaseEditor.prototype.focus.call(this.hotCustomEditorInstance, ...args);
  }

  getValue(...args) {
    return Handsontable.editors.BaseEditor.prototype.getValue.call(this.hotCustomEditorInstance, ...args);
  }

  init(...args) {
    return Handsontable.editors.BaseEditor.prototype.init.call(this.hotCustomEditorInstance, ...args);
  }

  isInFullEditMode(...args) {
    return Handsontable.editors.BaseEditor.prototype.isInFullEditMode.call(this.hotCustomEditorInstance, ...args);
  }

  isOpened(...args) {
    return Handsontable.editors.BaseEditor.prototype.isOpened.call(this.hotCustomEditorInstance, ...args);
  }

  isWaiting(...args) {
    return Handsontable.editors.BaseEditor.prototype.isWaiting.call(this.hotCustomEditorInstance, ...args);
  }

  open(...args) {
    return Handsontable.editors.BaseEditor.prototype.open.call(this.hotCustomEditorInstance, ...args);
  }

  prepare(row, col, prop, TD, originalValue, cellProperties) {
    this.hotInstance = cellProperties.instance;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.TD = TD;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;

    return Handsontable.editors.BaseEditor.prototype.prepare.call(this.hotCustomEditorInstance, row, col, prop, TD, originalValue, cellProperties);
  }

  saveValue(...args) {
    return Handsontable.editors.BaseEditor.prototype.saveValue.call(this.hotCustomEditorInstance, ...args);
  }

  setValue(...args) {
    return Handsontable.editors.BaseEditor.prototype.setValue.call(this.hotCustomEditorInstance, ...args);
  }

  addHook(...args) {
    return (Handsontable.editors.BaseEditor.prototype as any).addHook.call(this.hotCustomEditorInstance, ...args);
  }

  removeHooksByKey(...args) {
    return (Handsontable.editors.BaseEditor.prototype as any).removeHooksByKey.call(this.hotCustomEditorInstance, ...args);
  }

  clearHooks(...args) {
    return (Handsontable.editors.BaseEditor.prototype as any).clearHooks.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCell(...args) {
    return (Handsontable.editors.BaseEditor.prototype as any).getEditedCell.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCellsZIndex(...args) {
    return (Handsontable.editors.BaseEditor.prototype as any).getEditedCellsZIndex.call(this.hotCustomEditorInstance, ...args);
  }
}

export default BaseEditorComponent;
export { BaseEditorComponent };
