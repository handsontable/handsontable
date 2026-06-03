<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type InventoryRow = {
  model: string;
  price: number;
  sellDate: string;
  sellTime: string;
  inStock: boolean;
};

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);
const tableData = ref<InventoryRow[]>([]);
const isLoading = ref(false);

const hotSettings = ref<GridSettings>({
  data: tableData.value,
  width: '100%',
  height: 300,
  stretchH: 'all',
  contextMenu: true,
  rowHeaders: true,
  colHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  autoRowSize: true,
  loading: true,
  licenseKey: 'non-commercial-and-evaluation',
});

async function loadData(): Promise<void> {
  const hotInstance = hotRef.value?.hotInstance;

  if (!hotInstance) {
    return;
  }

  const loadingPlugin = hotInstance.getPlugin('loading');

  isLoading.value = true;
  loadingPlugin.show();

  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const loadedData: InventoryRow[] = [
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
    ];

    tableData.value = loadedData;
    hotInstance.loadData(loadedData);
    loadingPlugin.hide();
    isLoading.value = false;
  } catch {
    setTimeout(() => {
      loadingPlugin.hide();
      isLoading.value = false;
    }, 2000);
  }
}
</script>

<template>
  <div id="example3">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" id="loadData" :disabled="isLoading" @click="loadData">
          {{ tableData.length > 0 ? 'Reload Data' : 'Load Data' }}
        </button>
      </div>
    </div>
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
        :width="130"
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
