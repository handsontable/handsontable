<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);

const data = [
  { model: 'Trail Helmet', price: 1298.14, sellDate: '2025-08-31', sellTime: '14:12', inStock: true },
  { model: 'Windbreaker Jacket', price: 178.9, sellDate: '2025-05-10', sellTime: '22:26', inStock: false },
  { model: 'Cycling Cap', price: 288.1, sellDate: '2025-09-15', sellTime: '09:37', inStock: true },
  { model: 'HL Mountain Frame', price: 94.49, sellDate: '2025-01-17', sellTime: '14:19', inStock: false },
  { model: 'Racing Socks', price: 430.38, sellDate: '2025-05-10', sellTime: '13:42', inStock: true },
  { model: 'Racing Socks', price: 138.85, sellDate: '2025-09-20', sellTime: '14:48', inStock: true },
  { model: 'HL Mountain Frame', price: 1909.63, sellDate: '2025-09-05', sellTime: '09:35', inStock: false },
  { model: 'Carbon Handlebar', price: 1080.7, sellDate: '2025-10-24', sellTime: '22:58', inStock: false },
  { model: 'Aero Bottle', price: 1571.13, sellDate: '2025-05-24', sellTime: '00:24', inStock: true },
  { model: 'Windbreaker Jacket', price: 919.09, sellDate: '2025-07-16', sellTime: '19:11', inStock: true },
  { model: 'HL Road Tire', price: 886.22, sellDate: '2025-09-09', sellTime: '00:42', inStock: false },
  { model: 'Speed Gloves', price: 635.13, sellDate: '2025-11-17', sellTime: '12:45', inStock: true },
  { model: 'Trail Helmet', price: 1440.64, sellDate: '2025-01-03', sellTime: '20:16', inStock: false },
  { model: 'Aero Bottle', price: 944.63, sellDate: '2025-11-15', sellTime: '16:14', inStock: false },
  { model: 'Windbreaker Jacket', price: 1161.43, sellDate: '2025-06-24', sellTime: '13:19', inStock: false },
  { model: 'LED Bike Light', price: 1012.5, sellDate: '2025-05-01', sellTime: '17:30', inStock: false },
  { model: 'Windbreaker Jacket', price: 635.37, sellDate: '2025-05-14', sellTime: '09:05', inStock: true },
  { model: 'Road Tire Tube', price: 1421.27, sellDate: '2025-01-31', sellTime: '13:33', inStock: true },
  { model: 'Action Camera', price: 1019.05, sellDate: '2025-12-07', sellTime: '01:26', inStock: false },
  { model: 'Carbon Handlebar', price: 603.96, sellDate: '2025-09-13', sellTime: '04:10', inStock: false },
];

const hotSettings = ref<GridSettings>({
  data,
  width: '100%',
  height: 300,
  stretchH: 'all',
  contextMenu: true,
  rowHeaders: true,
  colHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  autoRowSize: true,
  dialog: {
    content:
      '<p>This dialog contains <strong>HTML</strong> content with formatting.</p><button type="button" class="hot-doc-dialog-html-button" id="example3-button">Hide dialog</button>',
    closable: true,
  },
  licenseKey: 'non-commercial-and-evaluation',
});

onMounted(() => {
  const hotInstance = hotRef.value?.hotInstance;

  if (!hotInstance) {
    return;
  }

  hotInstance.getPlugin('dialog').show();

  document.getElementById('example3-button')?.addEventListener('click', () => {
    hotInstance.getPlugin('dialog').hide();
  });
});
</script>

<template>
  <div id="example3">
    <HotTable ref="hotRef" :settings="hotSettings">
      <HotColumn title="Model" type="text" data="model" :width="150" header-class-name="htLeft" />
      <HotColumn
        title="Price"
        type="numeric"
        data="price"
        :width="80"
        locale="en-US"
        :numeric-format="{ style: 'currency', currency: 'USD', minimumFractionDigits: 2 }"
        class-name="htRight"
        header-class-name="htRight"
      />
      <HotColumn
        title="Date"
        type="intl-date"
        data="sellDate"
        :width="131"
        locale="en-US"
        :date-format="{ month: 'short', day: 'numeric', year: 'numeric' }"
        class-name="htRight"
        header-class-name="htRight"
      />
      <HotColumn
        title="Time"
        type="intl-time"
        data="sellTime"
        :width="90"
        :time-format="{ hour: '2-digit', minute: '2-digit', hour12: true }"
        class-name="htRight"
        header-class-name="htRight"
      />
      <HotColumn title="In stock" type="checkbox" data="inStock" class-name="htCenter" header-class-name="htCenter" />
    </HotTable>
  </div>
</template>
