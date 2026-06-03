<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();


const tableData = [
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
  { model: 'Aero Bottle', price: 1334.03, sellDate: '2025-01-24', sellTime: '03:29', inStock: false },
  { model: 'Road Tire Tube', price: 1841.17, sellDate: '2025-05-22', sellTime: '01:45', inStock: false },
  { model: 'Aero Bottle', price: 1622.05, sellDate: '2025-01-13', sellTime: '08:30', inStock: true },
  { model: 'Comfort Saddle', price: 1456.24, sellDate: '2025-07-20', sellTime: '03:39', inStock: false },
  { model: 'Windbreaker Jacket', price: 1736.96, sellDate: '2025-09-25', sellTime: '00:43', inStock: true },
  { model: 'Fitness Watch', price: 1075.31, sellDate: '2025-11-07', sellTime: '17:47', inStock: true },
  { model: 'Cycling Cap', price: 726.01, sellDate: '2025-10-28', sellTime: '12:44', inStock: true },
  { model: 'Road Tire Tube', price: 601.99, sellDate: '2025-09-22', sellTime: '00:26', inStock: true },
  { model: 'Speed Gloves', price: 1758.26, sellDate: '2025-10-04', sellTime: '04:59', inStock: true },
  { model: 'Speed Gloves', price: 564.35, sellDate: '2025-07-10', sellTime: '18:21', inStock: true },
  { model: 'Hydration Pack', price: 954.84, sellDate: '2025-11-02', sellTime: '00:59', inStock: false },
  { model: 'Cycling Cap', price: 1511.5, sellDate: '2025-02-11', sellTime: '02:38', inStock: false },
  { model: 'HL Road Tire', price: 269.6, sellDate: '2025-06-18', sellTime: '04:58', inStock: false },
  { model: 'Road Tire Tube', price: 435.07, sellDate: '2025-07-22', sellTime: '23:12', inStock: false },
  { model: 'Fitness Watch', price: 1187.8, sellDate: '2025-08-13', sellTime: '10:19', inStock: true },
  { model: 'Racing Socks', price: 770.19, sellDate: '2025-02-02', sellTime: '20:37', inStock: true },
  { model: 'Carbon Handlebar', price: 60.41, sellDate: '2025-12-27', sellTime: '20:30', inStock: true },
  { model: 'Racing Socks', price: 944.21, sellDate: '2025-05-23', sellTime: '18:43', inStock: false },
  { model: 'Racing Socks', price: 621.96, sellDate: '2025-12-12', sellTime: '04:59', inStock: false },
  { model: 'HL Road Tire', price: 774.91, sellDate: '2025-06-02', sellTime: '03:48', inStock: true },
  { model: 'LED Bike Light', price: 1205.29, sellDate: '2025-04-15', sellTime: '22:08', inStock: false },
  { model: 'Racing Socks', price: 388.19, sellDate: '2025-05-24', sellTime: '08:36', inStock: true },
  { model: 'Windbreaker Jacket', price: 267.88, sellDate: '2025-05-25', sellTime: '15:00', inStock: true },
  { model: 'LED Bike Light', price: 283.72, sellDate: '2025-09-26', sellTime: '02:16', inStock: true },
  { model: 'Comfort Saddle', price: 1782.91, sellDate: '2025-03-07', sellTime: '09:43', inStock: false },
  { model: 'Trail Helmet', price: 1943.46, sellDate: '2025-06-05', sellTime: '01:49', inStock: true },
  { model: 'Speed Gloves', price: 1737.8, sellDate: '2025-09-18', sellTime: '14:21', inStock: true },
  { model: 'Road Tire Tube', price: 354.89, sellDate: '2025-08-11', sellTime: '02:03', inStock: true },
  { model: 'Hydration Pack', price: 1490.45, sellDate: '2025-12-04', sellTime: '02:23', inStock: true },
  { model: 'LED Bike Light', price: 844.48, sellDate: '2025-09-22', sellTime: '02:29', inStock: true },
  { model: 'Road Tire Tube', price: 1965.77, sellDate: '2025-02-10', sellTime: '23:52', inStock: false },
  { model: 'Action Camera', price: 522.33, sellDate: '2025-11-11', sellTime: '16:50', inStock: false },
  { model: 'Comfort Saddle', price: 109.4, sellDate: '2025-05-13', sellTime: '11:41', inStock: true },
  { model: 'Hydration Pack', price: 1067.76, sellDate: '2025-08-07', sellTime: '05:04', inStock: false },
  { model: 'Speed Gloves', price: 1738.77, sellDate: '2025-01-28', sellTime: '08:38', inStock: false },
  { model: 'Aero Bottle', price: 1600.35, sellDate: '2025-01-29', sellTime: '00:36', inStock: false },
  { model: 'Speed Gloves', price: 524.91, sellDate: '2025-12-15', sellTime: '12:56', inStock: true },
  { model: 'Windbreaker Jacket', price: 1780.51, sellDate: '2025-09-23', sellTime: '05:02', inStock: false },
  { model: 'Comfort Saddle', price: 1955.0, sellDate: '2025-09-29', sellTime: '13:03', inStock: false },
  { model: 'Speed Gloves', price: 957.4, sellDate: '2025-08-06', sellTime: '03:19', inStock: true },
  { model: 'Fitness Watch', price: 193.72, sellDate: '2025-04-01', sellTime: '19:49', inStock: false },
  { model: 'Speed Gloves', price: 677.94, sellDate: '2025-10-11', sellTime: '22:25', inStock: false },
  { model: 'LED Bike Light', price: 1155.9, sellDate: '2025-03-02', sellTime: '11:36', inStock: false },
  { model: 'LED Bike Light', price: 586.82, sellDate: '2025-11-22', sellTime: '20:29', inStock: false },
  { model: 'Action Camera', price: 406.41, sellDate: '2025-10-25', sellTime: '11:10', inStock: false },
  { model: 'Road Tire Tube', price: 595.55, sellDate: '2025-05-24', sellTime: '01:30', inStock: false },
  { model: 'Racing Socks', price: 1078.63, sellDate: '2025-04-28', sellTime: '02:57', inStock: true },
  { model: 'Cycling Cap', price: 1781.04, sellDate: '2025-10-07', sellTime: '06:58', inStock: false },
  { model: 'Trail Helmet', price: 181.8, sellDate: '2025-10-02', sellTime: '20:04', inStock: false },
  { model: 'HL Mountain Frame', price: 489.39, sellDate: '2025-07-20', sellTime: '10:51', inStock: true },
  { model: 'HL Road Tire', price: 1964.04, sellDate: '2025-07-10', sellTime: '15:01', inStock: true },
  { model: 'Action Camera', price: 1321.19, sellDate: '2025-02-02', sellTime: '13:39', inStock: true },
  { model: 'Trail Helmet', price: 1311.09, sellDate: '2025-12-27', sellTime: '14:45', inStock: false },
  { model: 'Windbreaker Jacket', price: 1573.57, sellDate: '2025-09-20', sellTime: '20:31', inStock: false },
  { model: 'Speed Gloves', price: 338.01, sellDate: '2025-10-22', sellTime: '18:56', inStock: false },
  { model: 'Carbon Handlebar', price: 309.18, sellDate: '2025-11-10', sellTime: '15:20', inStock: true },
  { model: 'LED Bike Light', price: 1289.0, sellDate: '2025-08-22', sellTime: '15:34', inStock: true },
  { model: 'Action Camera', price: 1655.66, sellDate: '2025-06-12', sellTime: '15:38', inStock: false },
  { model: 'Hydration Pack', price: 1126.33, sellDate: '2025-09-15', sellTime: '06:29', inStock: false },
  { model: 'Racing Socks', price: 157.45, sellDate: '2025-01-26', sellTime: '19:25', inStock: true },
  { model: 'Aero Bottle', price: 1707.67, sellDate: '2025-02-02', sellTime: '17:34', inStock: true },
  { model: 'Road Tire Tube', price: 601.95, sellDate: '2025-04-14', sellTime: '08:02', inStock: true },
  { model: 'HL Road Tire', price: 118.42, sellDate: '2025-02-08', sellTime: '06:08', inStock: false },
  { model: 'Racing Socks', price: 1721.99, sellDate: '2025-10-13', sellTime: '09:01', inStock: true },
  { model: 'Action Camera', price: 1620.39, sellDate: '2025-07-18', sellTime: '05:53', inStock: false },
  { model: 'Trail Helmet', price: 1051.16, sellDate: '2025-01-21', sellTime: '09:44', inStock: true },
  { model: 'Fitness Watch', price: 1534.64, sellDate: '2025-02-27', sellTime: '09:19', inStock: true },
  { model: 'Comfort Saddle', price: 984.12, sellDate: '2025-03-16', sellTime: '07:24', inStock: false },
  { model: 'Comfort Saddle', price: 1316.13, sellDate: '2025-02-11', sellTime: '11:01', inStock: true },
  { model: 'Carbon Handlebar', price: 774.69, sellDate: '2025-10-17', sellTime: '11:38', inStock: false },
  { model: 'Road Tire Tube', price: 1887.19, sellDate: '2025-10-19', sellTime: '06:02', inStock: true },
  { model: 'Cycling Cap', price: 519.44, sellDate: '2025-10-21', sellTime: '03:54', inStock: true },
  { model: 'Trail Helmet', price: 1149.2, sellDate: '2025-04-24', sellTime: '04:40', inStock: false },
  { model: 'Carbon Handlebar', price: 915.24, sellDate: '2025-07-10', sellTime: '05:22', inStock: true },
  { model: 'Comfort Saddle', price: 1625.63, sellDate: '2025-03-31', sellTime: '23:55', inStock: true },
  { model: 'Racing Socks', price: 143.76, sellDate: '2025-12-02', sellTime: '07:25', inStock: true },
  { model: 'Cycling Cap', price: 981.24, sellDate: '2025-08-09', sellTime: '19:52', inStock: false },
  { model: 'Comfort Saddle', price: 779.4, sellDate: '2025-06-12', sellTime: '17:08', inStock: true },
  { model: 'Carbon Handlebar', price: 1512.24, sellDate: '2025-07-27', sellTime: '07:02', inStock: true },
  { model: 'Cycling Cap', price: 444.79, sellDate: '2025-09-11', sellTime: '10:05', inStock: false },
];

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);
const isListening = ref(false);
const focusScope = ref<string | null>(null);
const shortcutsContext = ref<string | null>(null);

const hotSettings = ref<GridSettings>({
  data: tableData,
  pagination: true,
  autoRowSize: true,
  tabNavigation: false,
  width: '100%',
  height: 250,
  stretchH: 'all',
  contextMenu: true,
  rowHeaders: true,
  colHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function updateDebugInfo(): void {
  const hotInstance = hotRef.value?.hotInstance;

  if (hotInstance) {
    isListening.value = hotInstance.isListening();
    focusScope.value = hotInstance.getFocusScopeManager().getActiveScopeId();
    shortcutsContext.value = hotInstance.getShortcutManager().getActiveContextName();
  }
}

let debugInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  debugInterval = setInterval(updateDebugInfo, 200);
});

onUnmounted(() => {
  if (debugInterval) {
    clearInterval(debugInterval);
  }
});
</script>

<template>
  <div id="example1" class="example-container">
    <input
      class="placeholder-input"
      type="text"
      name="focusable-text-input"
      placeholder="Focusable top text input"
    >

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
        :width="81"
        :time-format="{ hour: '2-digit', minute: '2-digit', hour12: true }"
        class-name="htRight"
        header-class-name="htRight"
      />
      <HotColumn title="In stock" type="checkbox" data="inStock" class-name="htCenter" header-class-name="htCenter" />
    </HotTable>

    <input
      class="placeholder-input"
      type="text"
      name="focusable-text-input"
      placeholder="Focusable bottom text input"
    >

    <strong>Debug information:</strong>
    <table class="debug-table">
      <colgroup>
        <col>
        <col style="width: 200px">
      </colgroup>
      <tbody>
        <tr>
          <td><code>isListening()</code></td>
          <td><code class="isListening">{{ String(isListening) }}</code></td>
        </tr>
        <tr>
          <td><code>getFocusScopeManager().getActiveScopeId()</code></td>
          <td><code class="focusScope">{{ String(focusScope) }}</code></td>
        </tr>
        <tr>
          <td><code>getShortcutManager().getActiveContextName()</code></td>
          <td><code class="shortcutsContext">{{ String(shortcutsContext) }}</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
