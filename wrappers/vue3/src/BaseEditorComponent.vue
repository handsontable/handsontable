<script lang="ts">
import Handsontable from 'handsontable/base';
import { Options, Vue } from 'vue-class-component';

const BaseEditorProto = Handsontable.editors.BaseEditor.prototype;

@Options({
  name: 'BaseEditorComponent',

})
class BaseEditorComponent extends Vue implements Handsontable.editors.BaseEditor {
  hot: Handsontable;
  instance: Handsontable;
  state: string;
  TD: HTMLTableCellElement;
  row: number;
  col: number;
  prop: number | string;
  originalValue: any;
  cellProperties: Handsontable.CellProperties;
  hotCustomEditorInstance: Handsontable.editors.BaseEditor;

  get hotCustomEditorClass(): typeof Handsontable.editors.BaseEditor {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    const CustomEditorClass = class CustomEditor extends Handsontable.editors.BaseEditor
      implements Handsontable.editors.BaseEditor {

      constructor(hotInstance: Handsontable) {
        super(hotInstance);
        _this.hotCustomEditorInstance = this;
      }

      /* eslint-disable @typescript-eslint/no-empty-function */
      focus() {}
      getValue() {}
      setValue() {}
      open() {}
      close() {}
      /* eslint-enable @typescript-eslint/no-empty-function */
    };

    // Fill with the rest of the Handsontable.editors.BaseEditorComponent methods
    Object.getOwnPropertyNames(BaseEditorProto).forEach((propName) => {
      if (propName === 'constructor') {
        return;
      }

      CustomEditorClass.prototype[propName] = function(...args) {
        return _this[propName].call(this, ...args);
      };
    });

    return CustomEditorClass;
  }

  // Handsontable.editors.BaseEditorComponent methods:
  private _fireCallbacks(...args) {
    (BaseEditorProto as any)._fireCallbacks.call(this.hotCustomEditorInstance, ...args);
  }

  beginEditing(...args) {
    return BaseEditorProto.beginEditing.call(this.hotCustomEditorInstance, ...args);
  }

  cancelChanges(...args) {
    return BaseEditorProto.cancelChanges.call(this.hotCustomEditorInstance, ...args);
  }

  checkEditorSection(...args) {
    return BaseEditorProto.checkEditorSection.call(this.hotCustomEditorInstance, ...args);
  }

  close(...args) {
    return BaseEditorProto.close.call(this.hotCustomEditorInstance, ...args);
  }

  discardEditor(...args) {
    return BaseEditorProto.discardEditor.call(this.hotCustomEditorInstance, ...args);
  }

  enableFullEditMode(...args) {
    return BaseEditorProto.enableFullEditMode.call(this.hotCustomEditorInstance, ...args);
  }

  extend(...args) {
    return BaseEditorProto.extend.call(this.hotCustomEditorInstance, ...args);
  }

  finishEditing(...args) {
    return BaseEditorProto.finishEditing.call(this.hotCustomEditorInstance, ...args);
  }

  focus(...args) {
    return BaseEditorProto.focus.call(this.hotCustomEditorInstance, ...args);
  }

  getValue(...args) {
    return BaseEditorProto.getValue.call(this.hotCustomEditorInstance, ...args);
  }

  init(...args) {
    return BaseEditorProto.init.call(this.hotCustomEditorInstance, ...args);
  }

  isInFullEditMode(...args) {
    return BaseEditorProto.isInFullEditMode.call(this.hotCustomEditorInstance, ...args);
  }

  isOpened(...args) {
    return BaseEditorProto.isOpened.call(this.hotCustomEditorInstance, ...args);
  }

  isWaiting(...args) {
    return BaseEditorProto.isWaiting.call(this.hotCustomEditorInstance, ...args);
  }

  open(...args) {
    return BaseEditorProto.open.call(this.hotCustomEditorInstance, ...args);
  }

  prepare(row, col, prop, TD, originalValue, cellProperties) {
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.TD = TD;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;

    return BaseEditorProto.prepare
      .call(this.hotCustomEditorInstance, row, col, prop, TD, originalValue, cellProperties);
  }

  saveValue(...args) {
    return BaseEditorProto.saveValue.call(this.hotCustomEditorInstance, ...args);
  }

  setValue(...args) {
    return BaseEditorProto.setValue.call(this.hotCustomEditorInstance, ...args);
  }

  addHook(...args) {
    return (BaseEditorProto as any).addHook.call(this.hotCustomEditorInstance, ...args);
  }

  removeHooksByKey(...args) {
    return (BaseEditorProto as any).removeHooksByKey.call(this.hotCustomEditorInstance, ...args);
  }

  clearHooks(...args) {
    return (BaseEditorProto as any).clearHooks.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCell(...args) {
    return (BaseEditorProto as any).getEditedCell.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCellsZIndex(...args) {
    return (BaseEditorProto as any).getEditedCellsZIndex.call(this.hotCustomEditorInstance, ...args);
  }

  getEditedCellsLayerClass(...args) {
    return (BaseEditorProto as any).getEditedCellsLayerClass.call(this.hotCustomEditorInstance, ...args);
  }
}

export default BaseEditorComponent;
export { BaseEditorComponent };
</script>
