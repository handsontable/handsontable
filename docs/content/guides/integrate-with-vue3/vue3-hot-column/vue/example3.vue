<script setup>
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';

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

const customEditor = CustomEditor;
const hotData = ref([
  ['A1', 'B1'],
  ['A2', 'B2'],
  ['A3', 'B3'],
  ['A4', 'B4'],
  ['A5', 'B5'],
]);
const settings = ref({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :data="hotData" :settings="settings">
      <HotColumn title="Column A" :editor="customEditor" />
      <HotColumn title="Column B" :read-only="true" />
    </HotTable>
  </div>
</template>
