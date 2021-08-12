<script lang="ts">
  import Handsontable from 'handsontable';

  class BaseEditorComponent implements Handsontable._editors.Base {
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

      // this.$data.hotCustomEditorClass = function () {
      //   const customEditorClass = class CustomEditor extends Handsontable.editors.BaseEditor implements Handsontable._editors.Base {
      //     constructor(hotInstance, row, col, prop, TD, cellProperties) {
      //       super(hotInstance, row, col, prop, TD, cellProperties);
      //
      //       _this.$data.hotCustomEditorInstance = this;
      //     }
      //
      //     focus() {
      //     }
      //
      //     getValue() {
      //     }
      //
      //     setValue() {
      //     }
      //
      //     open() {
      //     }
      //
      //     close() {
      //     }
      //   } as any;
      //
      //   // Fill with the rest of the BaseEditorComponent methods
      //   Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach(propName => {
      //     if (propName === 'constructor') {
      //       return;
      //     }
      //
      //     customEditorClass.prototype[propName] = function (...args) {
      //       return _this[propName].call(this, ...args);
      //     }
      //   });
      //
      //   return customEditorClass;
      // }();
    }

    // BaseEditorComponent methods:
    private _fireCallbacks(...args) {
      Handsontable.editors.BaseEditor._fireCallbacks(...args);
    }

    beginEditing(...args) {
      return Handsontable.editors.BaseEditor.beginEditing( ...args);
    }

    cancelChanges(...args) {
      return Handsontable.editors.BaseEditor.cancelChanges( ...args);
    }

    checkEditorSection(...args) {
      return Handsontable.editors.BaseEditor.checkEditorSection( ...args);
    }

    close(...args) {
      return Handsontable.editors.BaseEditor.close( ...args);
    }

    discardEditor(...args) {
      return Handsontable.editors.BaseEditor.discardEditor( ...args);
    }

    enableFullEditMode(...args) {
      return Handsontable.editors.BaseEditor.enableFullEditMode( ...args);
    }

    extend(...args) {
      return Handsontable.editors.BaseEditor.extend( ...args);
    }

    finishEditing(...args) {
      return Handsontable.editors.BaseEditor.finishEditing( ...args);
    }

    focus(...args) {
      return Handsontable.editors.BaseEditor.focus( ...args);
    }

    getValue(...args) {
      return Handsontable.editors.BaseEditor.getValue( ...args);
    }

    init(...args) {
      return Handsontable.editors.BaseEditor.init( ...args);
    }

    isInFullEditMode(...args) {
      return Handsontable.editors.BaseEditor.isInFullEditMode( ...args);
    }

    isOpened(...args) {
      return Handsontable.editors.BaseEditor.isOpened( ...args);
    }

    isWaiting(...args) {
      return Handsontable.editors.BaseEditor.isWaiting( ...args);
    }

    open(...args) {
      return Handsontable.editors.BaseEditor.open( ...args);
    }

    prepare(row, col, prop, TD, originalValue, cellProperties) {
      this.$data.hotInstance = cellProperties.instance;
      this.$data.row = row;
      this.$data.col = col;
      this.$data.prop = prop;
      this.$data.TD = TD;
      this.$data.originalValue = originalValue;
      this.$data.cellProperties = cellProperties;

      return Handsontable.editors.BaseEditor.prepare( row, col, prop, TD, originalValue, cellProperties);
    }

    saveValue(...args) {
      return Handsontable.editors.BaseEditor.saveValue( ...args);
    }

    setValue(...args) {
      return Handsontable.editors.BaseEditor.setValue( ...args);
    }

    addHook(...args) {
      return (Handsontable.editors.BaseEditor).addHook( ...args);
    }

    removeHooksByKey(...args) {
      return (Handsontable.editors.BaseEditor).removeHooksByKey( ...args);
    }

    clearHooks(...args) {
      return (Handsontable.editors.BaseEditor).clearHooks( ...args);
    }

    getEditedCell(...args) {
      return (Handsontable.editors.BaseEditor).getEditedCell( ...args);
    }

    getEditedCellsZIndex(...args) {
      return (Handsontable.editors.BaseEditor).getEditedCellsZIndex( ...args);
    }

    getEditedCellsLayerClass(...args) {
      return (Handsontable.editors.BaseEditor).getEditedCellsLayerClass( ...args);
    }
  }

  export default BaseEditorComponent;
  export { BaseEditorComponent };
</script>
