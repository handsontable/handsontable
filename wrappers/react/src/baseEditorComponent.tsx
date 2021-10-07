import React from 'react';
import Handsontable from 'handsontable/base';
import { BaseEditor } from 'handsontable/editors/baseEditor';
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
    (BaseEditor.prototype as any)._fireCallbacks.call(this.hotCustomEditorInstance, ...args);
  }

  beginEditing(...args) {
    return BaseEditor.prototype.beginEditing.call(this.hotCustomEditorInstance, ...args);
  }

  cancelChanges(...args) {
    return BaseEditor.prototype.cancelChanges.call(this.hotCustomEditorInstance, ...args);
  }

  checkEditorSection(...args) {
    return BaseEditor.prototype.checkEditorSection.call(this.hotCustomEditorInstance, ...args);
  }

  close(...args) {
    return BaseEditor.prototype.close.call(this.hotCustomEditorInstance, ...args);
  }

  discardEditor(...args) {
    return BaseEditor.prototype.discardEditor.call(this.hotCustomEditorInstance, ...args);
  }

  enableFullEditMode(...args) {
    return BaseEditor.prototype.enableFullEditMode.call(this.hotCustomEditorInstance, ...args);
  }

  extend(...args) {
    return BaseEditor.prototype.extend.call(this.hotCustomEditorInstance, ...args);
  }

  finishEditing(...args) {
    return BaseEditor.prototype.finishEditing.call(this.hotCustomEditorInstance, ...args);
  }

  focus(...args) {
    return BaseEditor.prototype.focus.call(this.hotCustomEditorInstance, ...args);
  }

  getValue(...args) {
    return BaseEditor.prototype.getValue.call(this.hotCustomEditorInstance, ...args);
  }

  init(...args) {
    return BaseEditor.prototype.init.call(this.hotCustomEditorInstance, ...args);
  }

  isInFullEditMode(...args) {
    return BaseEditor.prototype.isInFullEditMode.call(this.hotCustomEditorInstance, ...args);
  }

  isOpened(...args) {
    return BaseEditor.prototype.isOpened.call(this.hotCustomEditorInstance, ...args);
  }

  isWaiting(...args) {
    return BaseEditor.prototype.isWaiting.call(this.hotCustomEditorInstance, ...args);
  }

  open(...args) {
    return BaseEditor.prototype.open.call(this.hotCustomEditorInstance, ...args);
  }

  prepare(row, col, prop, TD, originalValue, cellProperties) {
    this.hotInstance = cellProperties.instance;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.TD = TD;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;

    return BaseEditor.prototype.prepare.call(this.hotCustomEditorInstance, row, col, prop, TD, originalValue, cellProperties);
  }

  saveValue(...args) {
    return BaseEditor.prototype.saveValue.call(this.hotCustomEditorInstance, ...args);
  }

  setValue(...args) {
    return BaseEditor.prototype.setValue.call(this.hotCustomEditorInstance, ...args);
  }

  addHook(...args) {
    return (BaseEditor.prototype as any).addHook.call(this.hotCustomEditorInstance, ...args);
  }

  removeHooksByKey(...args) {
    return (BaseEditor.prototype as any).removeHooksByKey.call(this.hotCustomEditorInstance, ...args);
  }

  clearHooks(...args) {
    return (BaseEditor.prototype as any).clearHooks.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCell(...args) {
    return (BaseEditor.prototype as any).getEditedCell.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCellsZIndex(...args) {
    return (BaseEditor.prototype as any).getEditedCellsZIndex.call(this.hotCustomEditorInstance, ...args);
  }
}

export default BaseEditorComponent;
export { BaseEditorComponent };
