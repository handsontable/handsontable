<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

registerAllModules();

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
