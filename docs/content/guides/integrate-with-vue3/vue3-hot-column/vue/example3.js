import { defineComponent } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

class CustomEditor extends TextEditor {
  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', true);
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

const ExampleComponent = defineComponent({
  data() {
    return {
      customEditor: CustomEditor,
      hotData: [
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
        ['A5', 'B5'],
      ],
      settings: {
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation',
      },
    };
  },
  components: {
    HotTable,
    HotColumn,
  }
});

export default ExampleComponent;
