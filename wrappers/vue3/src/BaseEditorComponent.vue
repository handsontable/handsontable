<script lang="ts">
import { BaseEditor } from 'handsontable/editors/BaseEditor';
import { Options, Vue } from 'vue-class-component';

@Options({ name: 'BaseEditorComponent' })
class BaseEditorComponent extends Vue implements BaseEditor {
  instance = null;
  row = null;
  col = null;
  prop = null;
  TD = null;
  originalValue = null;
  cellProperties = null;
  state = null;
  hot = null;

  mounted() {
    const _this = this;

    this.$data.hotCustomEditorClass = function () {
      const customEditorClass = class CustomEditor extends BaseEditor implements BaseEditor {
        constructor(hotInstance) {
          super(hotInstance);

          _this.$data.hotCustomEditorInstance = this;
        }

        focus() {}
        getValue() {}
        setValue() {}
        open() {}
        close() {}
      } as any;

      // Fill with the rest of the BaseEditorComponent methods
      Object.getOwnPropertyNames(BaseEditor.prototype).forEach(propName => {
        if (propName === 'constructor') {
          return;
        }

        customEditorClass.prototype[propName] = function (...args) {
          return _this[propName].call(this, ...args);
        }
      });

      return customEditorClass;
    }();
  }

  // BaseEditorComponent methods:
  private _fireCallbacks(...args) {
    (BaseEditor.prototype as any)._fireCallbacks.call(this.$data.hotCustomEditorInstance, ...args);
  }

  beginEditing(...args) {
    return BaseEditor.prototype.beginEditing.call(this.$data.hotCustomEditorInstance, ...args);
  }

  cancelChanges(...args) {
    return BaseEditor.prototype.cancelChanges.call(this.$data.hotCustomEditorInstance, ...args);
  }

  checkEditorSection(...args) {
    return BaseEditor.prototype.checkEditorSection.call(this.$data.hotCustomEditorInstance, ...args);
  }

  close(...args) {
    return BaseEditor.prototype.close.call(this.$data.hotCustomEditorInstance, ...args);
  }

  discardEditor(...args) {
    return BaseEditor.prototype.discardEditor.call(this.$data.hotCustomEditorInstance, ...args);
  }

  enableFullEditMode(...args) {
    return BaseEditor.prototype.enableFullEditMode.call(this.$data.hotCustomEditorInstance, ...args);
  }

  extend(...args) {
    return BaseEditor.prototype.extend.call(this.$data.hotCustomEditorInstance, ...args);
  }

  finishEditing(...args) {
    return BaseEditor.prototype.finishEditing.call(this.$data.hotCustomEditorInstance, ...args);
  }

  focus(...args) {
    return BaseEditor.prototype.focus.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getValue(...args) {
    return BaseEditor.prototype.getValue.call(this.$data.hotCustomEditorInstance, ...args);
  }

  init(...args) {
    return BaseEditor.prototype.init.call(this.$data.hotCustomEditorInstance, ...args);
  }

  isInFullEditMode(...args) {
    return BaseEditor.prototype.isInFullEditMode.call(this.$data.hotCustomEditorInstance, ...args);
  }

  isOpened(...args) {
    return BaseEditor.prototype.isOpened.call(this.$data.hotCustomEditorInstance, ...args);
  }

  isWaiting(...args) {
    return BaseEditor.prototype.isWaiting.call(this.$data.hotCustomEditorInstance, ...args);
  }

  open(...args) {
    return BaseEditor.prototype.open.call(this.$data.hotCustomEditorInstance, ...args);
  }

  prepare(row, col, prop, TD, originalValue, cellProperties) {
    this.$data.hotInstance = cellProperties.instance;
    this.$data.row = row;
    this.$data.col = col;
    this.$data.prop = prop;
    this.$data.TD = TD;
    this.$data.originalValue = originalValue;
    this.$data.cellProperties = cellProperties;

    return BaseEditor.prototype.prepare.call(this.$data.hotCustomEditorInstance, row, col, prop, TD, originalValue, cellProperties);
  }

  saveValue(...args) {
    return BaseEditor.prototype.saveValue.call(this.$data.hotCustomEditorInstance, ...args);
  }

  setValue(...args) {
    return BaseEditor.prototype.setValue.call(this.$data.hotCustomEditorInstance, ...args);
  }

  addHook(...args) {
    return (BaseEditor.prototype as any).addHook.call(this.$data.hotCustomEditorInstance, ...args);
  }

  removeHooksByKey(...args) {
    return (BaseEditor.prototype as any).removeHooksByKey.call(this.$data.hotCustomEditorInstance, ...args);
  }

  clearHooks(...args) {
    return (BaseEditor.prototype as any).clearHooks.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getEditedCell(...args) {
    return (BaseEditor.prototype as any).getEditedCell.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getEditedCellsZIndex(...args) {
    return (BaseEditor.prototype as any).getEditedCellsZIndex.call(this.$data.hotCustomEditorInstance, ...args);
  }

  getEditedCellsLayerClass(...args) {
    return (BaseEditor.prototype as any).getEditedCellsLayerClass.call(this.$data.hotCustomEditorInstance, ...args);
  }
}

export default BaseEditorComponent;
export { BaseEditorComponent };
</script>
