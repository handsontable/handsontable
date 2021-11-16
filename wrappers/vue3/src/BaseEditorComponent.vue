<script lang="ts">
import Handsontable from 'handsontable/base';
import { Options, Vue } from 'vue-class-component';

const BaseEditorProto = Handsontable.editors.BaseEditor.prototype;

@Options({ name: 'BaseEditorComponent' })
class BaseEditorComponent extends Vue implements Handsontable.editors.BaseEditor {
  hot = null;
  instance = null;
  state = null;
  TD = null;
  row = null;
  col = null;
  prop = null;
  originalValue = null;
  cellProperties = null;

  get hotCustomEditorClass() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    const CustomEditorClass = class CustomEditor extends Handsontable.editors.BaseEditor
      implements Handsontable.editors.BaseEditor {

      constructor(hotInstance) {
        super(hotInstance);
        _this.$data.hotCustomEditorInstance = this;
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
    (BaseEditorProto as any)._fireCallbacks.call(this.$data.hotCustomEditorInstance, ...args);
  }

  beginEditing(...args) {
    return BaseEditorProto.beginEditing.call(this.$data.hotCustomEditorInstance, ...args);
  }

  cancelChanges(...args) {
    return BaseEditorProto.cancelChanges.call(this.$data.hotCustomEditorInstance, ...args);
  }

  checkEditorSection(...args) {
    return BaseEditorProto.checkEditorSection.call(this.$data.hotCustomEditorInstance, ...args);
  }

  close(...args) {
    return BaseEditorProto.close.call(this.$data.hotCustomEditorInstance, ...args);
  }

  discardEditor(...args) {
    return BaseEditorProto.discardEditor.call(this.$data.hotCustomEditorInstance, ...args);
  }

  enableFullEditMode(...args) {
    return BaseEditorProto.enableFullEditMode.call(this.$data.hotCustomEditorInstance, ...args);
  }

  extend(...args) {
    return BaseEditorProto.extend.call(this.$data.hotCustomEditorInstance, ...args);
  }

  finishEditing(...args) {
    return BaseEditorProto.finishEditing.call(this.$data.hotCustomEditorInstance, ...args);
  }

  focus(...args) {
    return BaseEditorProto.focus.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getValue(...args) {
    return BaseEditorProto.getValue.call(this.$data.hotCustomEditorInstance, ...args);
  }

  init(...args) {
    return BaseEditorProto.init.call(this.$data.hotCustomEditorInstance, ...args);
  }

  isInFullEditMode(...args) {
    return BaseEditorProto.isInFullEditMode.call(this.$data.hotCustomEditorInstance, ...args);
  }

  isOpened(...args) {
    return BaseEditorProto.isOpened.call(this.$data.hotCustomEditorInstance, ...args);
  }

  isWaiting(...args) {
    return BaseEditorProto.isWaiting.call(this.$data.hotCustomEditorInstance, ...args);
  }

  open(...args) {
    return BaseEditorProto.open.call(this.$data.hotCustomEditorInstance, ...args);
  }

  prepare(row, col, prop, TD, originalValue, cellProperties) {
    this.$data.hotInstance = cellProperties.instance;
    this.$data.row = row;
    this.$data.col = col;
    this.$data.prop = prop;
    this.$data.TD = TD;
    this.$data.originalValue = originalValue;
    this.$data.cellProperties = cellProperties;

    return BaseEditorProto.prepare
      .call(this.$data.hotCustomEditorInstance, row, col, prop, TD, originalValue, cellProperties);
  }

  saveValue(...args) {
    return BaseEditorProto.saveValue.call(this.$data.hotCustomEditorInstance, ...args);
  }

  setValue(...args) {
    return BaseEditorProto.setValue.call(this.$data.hotCustomEditorInstance, ...args);
  }

  addHook(...args) {
    return (BaseEditorProto as any).addHook.call(this.$data.hotCustomEditorInstance, ...args);
  }

  removeHooksByKey(...args) {
    return (BaseEditorProto as any).removeHooksByKey.call(this.$data.hotCustomEditorInstance, ...args);
  }

  clearHooks(...args) {
    return (BaseEditorProto as any).clearHooks.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getEditedCell(...args) {
    return (BaseEditorProto as any).getEditedCell.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getEditedCellsZIndex(...args) {
    return (BaseEditorProto as any).getEditedCellsZIndex.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getEditedCellsLayerClass(...args) {
    return (BaseEditorProto as any).getEditedCellsLayerClass.call(this.$data.hotCustomEditorInstance, ...args);
  }
}

export default BaseEditorComponent;
export { BaseEditorComponent };
</script>
