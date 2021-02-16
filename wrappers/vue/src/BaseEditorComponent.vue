<script lang="ts">
  import Vue from 'vue';
  import Handsontable from 'handsontable';
  import Component from 'vue-class-component';

  @Component({})
  class BaseEditorComponent extends Vue implements Handsontable._editors.Base {
    name = 'BaseEditorComponent';
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
        const customEditorClass = class CustomEditor extends Handsontable.editors.BaseEditor implements Handsontable._editors.Base {
          constructor(hotInstance, row, col, prop, TD, cellProperties) {
            super(hotInstance, row, col, prop, TD, cellProperties);

            _this.$data.hotCustomEditorInstance = this;
          }

          focus() {
          }

          getValue() {
          }

          setValue() {
          }

          open() {
          }

          close() {
          }
        } as any;

        // Fill with the rest of the BaseEditorComponent methods
        Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach(propName => {
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
      (Handsontable.editors.BaseEditor.prototype as any)._fireCallbacks.call(this.$data.hotCustomEditorInstance, ...args);
    }

    beginEditing(...args) {
      return Handsontable.editors.BaseEditor.prototype.beginEditing.call(this.$data.hotCustomEditorInstance, ...args);
    }

    cancelChanges(...args) {
      return Handsontable.editors.BaseEditor.prototype.cancelChanges.call(this.$data.hotCustomEditorInstance, ...args);
    }

    checkEditorSection(...args) {
      return Handsontable.editors.BaseEditor.prototype.checkEditorSection.call(this.$data.hotCustomEditorInstance, ...args);
    }

    close(...args) {
      return Handsontable.editors.BaseEditor.prototype.close.call(this.$data.hotCustomEditorInstance, ...args);
    }

    discardEditor(...args) {
      return Handsontable.editors.BaseEditor.prototype.discardEditor.call(this.$data.hotCustomEditorInstance, ...args);
    }

    enableFullEditMode(...args) {
      return Handsontable.editors.BaseEditor.prototype.enableFullEditMode.call(this.$data.hotCustomEditorInstance, ...args);
    }

    extend(...args) {
      return Handsontable.editors.BaseEditor.prototype.extend.call(this.$data.hotCustomEditorInstance, ...args);
    }

    finishEditing(...args) {
      return Handsontable.editors.BaseEditor.prototype.finishEditing.call(this.$data.hotCustomEditorInstance, ...args);
    }

    focus(...args) {
      return Handsontable.editors.BaseEditor.prototype.focus.call(this.$data.hotCustomEditorInstance, ...args);
    }

    getValue(...args) {
      return Handsontable.editors.BaseEditor.prototype.getValue.call(this.$data.hotCustomEditorInstance, ...args);
    }

    init(...args) {
      return Handsontable.editors.BaseEditor.prototype.init.call(this.$data.hotCustomEditorInstance, ...args);
    }

    isInFullEditMode(...args) {
      return Handsontable.editors.BaseEditor.prototype.isInFullEditMode.call(this.$data.hotCustomEditorInstance, ...args);
    }

    isOpened(...args) {
      return Handsontable.editors.BaseEditor.prototype.isOpened.call(this.$data.hotCustomEditorInstance, ...args);
    }

    isWaiting(...args) {
      return Handsontable.editors.BaseEditor.prototype.isWaiting.call(this.$data.hotCustomEditorInstance, ...args);
    }

    open(...args) {
      return Handsontable.editors.BaseEditor.prototype.open.call(this.$data.hotCustomEditorInstance, ...args);
    }

    prepare(row, col, prop, TD, originalValue, cellProperties) {
      this.$data.hotInstance = cellProperties.instance;
      this.$data.row = row;
      this.$data.col = col;
      this.$data.prop = prop;
      this.$data.TD = TD;
      this.$data.originalValue = originalValue;
      this.$data.cellProperties = cellProperties;

      return Handsontable.editors.BaseEditor.prototype.prepare.call(this.$data.hotCustomEditorInstance, row, col, prop, TD, originalValue, cellProperties);
    }

    saveValue(...args) {
      return Handsontable.editors.BaseEditor.prototype.saveValue.call(this.$data.hotCustomEditorInstance, ...args);
    }

    setValue(...args) {
      return Handsontable.editors.BaseEditor.prototype.setValue.call(this.$data.hotCustomEditorInstance, ...args);
    }

    addHook(...args) {
      return (Handsontable.editors.BaseEditor.prototype as any).addHook.call(this.$data.hotCustomEditorInstance, ...args);
    }

    removeHooksByKey(...args) {
      return (Handsontable.editors.BaseEditor.prototype as any).removeHooksByKey.call(this.$data.hotCustomEditorInstance, ...args);
    }

    clearHooks(...args) {
      return (Handsontable.editors.BaseEditor.prototype as any).clearHooks.call(this.$data.hotCustomEditorInstance, ...args);
    }

    getEditedCell(...args) {
      return (Handsontable.editors.BaseEditor.prototype as any).getEditedCell.call(this.$data.hotCustomEditorInstance, ...args);
    }

    getEditedCellsZIndex(...args) {
      return (Handsontable.editors.BaseEditor.prototype as any).getEditedCellsZIndex.call(this.$data.hotCustomEditorInstance, ...args);
    }

    getEditedCellsLayerClass(...args) {
      return (Handsontable.editors.BaseEditor.prototype as any).getEditedCellsLayerClass.call(this.$data.hotCustomEditorInstance, ...args);
    }
  }

  export default BaseEditorComponent;
  export { BaseEditorComponent };
</script>
