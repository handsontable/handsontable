<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

registerAllModules();

const ALLOWED_TAGS = ['B', 'EM', 'INPUT', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'];
const ALLOWED_ATTRIBUTES = ['type', 'class', 'checked', 'colspan', 'rowspan'];
const DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE'];

// Handsontable has no built-in sanitizer since v18.0, and `sanitizer` is grid-level:
// it also filters pasted HTML, so the table tags have to survive -- otherwise pasting
// a range degrades to plain text. In production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html: string): string => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (DROPPED_TAGS.includes(element.tagName)) {
      // Unwrapping these would promote their source text into the output
      element.remove();
    } else if (ALLOWED_TAGS.includes(element.tagName)) {
      Array.from(element.attributes).forEach((attribute) => {
        if (!ALLOWED_ATTRIBUTES.includes(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
    } else {
      // Unwrap a disallowed element, keeping its text content
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  return template.innerHTML;
};

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const isChecked = ref(false);

const customRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  textRenderer(instance, td, row, col, prop, value, cellProperties);

  if (isChecked.value) {
    td.style.backgroundColor = 'yellow';
  } else {
    td.style.backgroundColor = 'rgba(255,255,255,0.1)';
  }
};

const hotSettings = ref<GridSettings>({
  height: 'auto',
  columns: [{}, { renderer: customRenderer }],
  colHeaders(col: number) {
    return col === 0
      ? '<b>Bold</b> and <em>Beautiful</em>'
      : `Some <input type="checkbox" class="checker" ${isChecked.value ? 'checked="checked"' : ''}> checkbox`;
  },
  sanitizer: sanitizeHeader,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function onContainerMousedown(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (target.nodeName === 'INPUT' && target.className === 'checker') {
    event.stopPropagation();
  }
}

function onContainerMouseup(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (target.nodeName === 'INPUT' && target.className === 'checker') {
    isChecked.value = !(target as HTMLInputElement).checked;
    hotRef.value?.hotInstance?.render();
  }
}
</script>

<template>
  <div id="example5">
    <div id="exampleContainer5" @mousedown="onContainerMousedown" @mouseup="onContainerMouseup">
      <HotTable ref="hotRef" :settings="hotSettings" />
    </div>
  </div>
</template>
