import { HotTable, HotColumn, BaseEditorComponent } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const CustomEditor = {
  name: 'CustomEditor',
  template: '#editor-template',
  extends: BaseEditorComponent,
  data() {
    return {
      // We'll need to define properties in our data object,
      // corresponding to all of the data being injected from
      // the BaseEditorComponent class, which are:
      // - hotInstance (instance of Handsontable)
      // - row (row index)
      // - col (column index)
      // - prop (column property name)
      // - TD (the HTML cell element)
      // - originalValue (cell value passed to the editor)
      // - cellProperties (the cellProperties object for the edited cell)
      hotInstance: null,
      TD: null,
      row: null,
      col: null,
      prop: null,
      originalValue: null,
      value: '',
      cellProperties: null,
      isVisible: false,
      style: {
        position: 'absolute',
        padding: '15px',
        background: '#fff',
        zIndex: 999,
        border: '1px solid #000'
      }
    };
  },
  methods: {
    stopMousedownPropagation(e) {
      e.stopPropagation();
    },
    prepare(row, col, prop, td, originalValue, cellProperties) {
      // We'll need to call the `prepare` method from
      // the `BaseEditorComponent` class, as it provides
      // the component with the information needed to use the editor
      // (hotInstance, row, col, prop, TD, originalValue, cellProperties)
      BaseEditorComponent.options.methods.prepare.call(this, row, col, prop, td, originalValue, cellProperties);

      if (!document.body.contains(this.$el)) {
        document.body.appendChild(this.$el);
      }

      const tdPosition = td.getBoundingClientRect();

      // As the `prepare` method is triggered after selecting
      // any cell, we're updating the styles for the editor element,
      // so it shows up in the correct position.
      this.style.left = `${tdPosition.left + window.pageXOffset}px`;
      this.style.top = `${tdPosition.top + window.pageYOffset}px`;
    },
    setLowerCase() {
      this.setValue(this.value.toLowerCase());
      this.finishEditing();
    },
    setUpperCase() {
      this.setValue(this.value.toUpperCase());
      this.finishEditing();
    },
    open() {
      this.isVisible = true;
    },
    close() {
      this.isVisible = false;
    },
    setValue(value) {
      this.value = value;
    },
    getValue() {
      return this.value;
    }
  }
};


const ExampleComponent = {
  data() {
    return {
      hotSettings: {
        data: [
          ['Obrien Fischer'], ['Alexandria Gordon'], ['John Stafford'], ['Regina Waters'], ['Kay Bentley'], ['Emerson Drake'], ['Deann Stapleton']
        ],
        licenseKey: 'non-commercial-and-evaluation',
        rowHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
      }
    };
  },
  components: {
    HotTable,
    HotColumn,
    CustomEditor
  }
};

export default ExampleComponent;