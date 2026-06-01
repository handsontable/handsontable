<script setup>
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = new Array(100)
  .fill(null)
  .map((_, row) =>
    new Array(50)
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const isContainerExpanded = ref(false);
const hotRef = ref(null);

function triggerBtnClickCallback() {
  isContainerExpanded.value = !isContainerExpanded.value;
  const parent = document.getElementById('exampleParent');

  parent.style.height = isContainerExpanded.value ? '410px' : '157px';
  hotRef.value?.hotInstance?.refreshDimensions();
}

const hotSettings = ref({
  data,
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: '100%',
  colWidths: 100,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example">
    <div class="example-controls-container">
      <div class="controls">
        <button id="triggerBtn" class="button button--primary" @click="triggerBtnClickCallback">
          {{ isContainerExpanded ? 'Collapse container' : 'Expand container' }}
        </button>
      </div>
    </div>
    <div id="exampleParent" class="exampleParent">
      <HotTable ref="hotRef" :settings="hotSettings" />
    </div>
  </div>
</template>

<style>
#exampleParent {
  height: 157px;
}

#exampleParent > div {
  height: 100%;
}
</style>
