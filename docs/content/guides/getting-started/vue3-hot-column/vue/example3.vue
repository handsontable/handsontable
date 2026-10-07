<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

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
const hotData = ref<string[][]>([
  ['SKU-4821', 'Stainless Steel Water Bottle'],
  ['SKU-0093', 'Wireless Mouse'],
  ['SKU-1170', 'Ergonomic Office Chair'],
  ['SKU-2208', 'USB-C Charging Cable'],
  ['SKU-3341', 'Aluminum Water Filter'],
]);
const settings = ref<GridSettings>({
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
