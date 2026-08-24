<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

class CustomEditor extends TextEditor {
  createElements(): void {
    super.createElements();

    this.TEXTAREA = document.createElement('input') as HTMLInputElement & HTMLTextAreaElement;
    this.TEXTAREA.setAttribute('placeholder', 'Type a book title...');
    this.TEXTAREA.setAttribute('data-hot-input', 'true');
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

const hotSettings = ref<GridSettings>({
  data: [
    ['Professional JavaScript for Web Developers', 'Nicholas Zakas', 2009],
    ['JavaScript: The Good Parts', 'Douglas Crockford', 2008],
    ['You Don\'t Know JS', 'Kyle Simpson', 2014],
    ['Eloquent JavaScript', 'Marijn Haverbeke', 2018],
    ['JavaScript Patterns', 'Stoyan Stefanov', 2010],
  ],
  columns: [
    { editor: CustomEditor },
    {},
    { type: 'numeric' },
  ],
  colHeaders: ['Title', 'Author', 'Year'],
  colWidths: [220, 180, 60],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>
