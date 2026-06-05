<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderBeforeFetchParameters,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

type DemoRow = {
  id: number;
  product: string;
  sku: string;
  category: string;
  unitPrice: number;
  inStock: number;
};

type FilterCondition = { name?: string; args?: unknown[] };

type DataProviderFilterColumn = NonNullable<DataProviderQueryParameters['filters']>[number];

const LATENCY_MS = 450;
const SEED_CATALOG: readonly DemoRow[] = [
  {
    id: 1,
    product: 'Wireless ergonomic keyboard',
    sku: 'PER-KBD-901',
    category: 'Peripherals',
    unitPrice: 79.99,
    inStock: 210,
  },
  {
    id: 2,
    product: 'USB-C 7-port hub',
    sku: 'PER-HUB-707',
    category: 'Peripherals',
    unitPrice: 45.5,
    inStock: 88,
  },
  {
    id: 3,
    product: '27" QHD monitor',
    sku: 'DSP-MON-270',
    category: 'Displays',
    unitPrice: 329,
    inStock: 42,
  },
  {
    id: 4,
    product: 'Laptop stand aluminum',
    sku: 'ACC-STD-112',
    category: 'Accessories',
    unitPrice: 39.99,
    inStock: 156,
  },
  {
    id: 5,
    product: 'Noise-cancelling headset',
    sku: 'AUD-HDS-440',
    category: 'Audio',
    unitPrice: 199,
    inStock: 67,
  },
  {
    id: 6,
    product: 'Mechanical keyboard MX Brown',
    sku: 'PER-KBD-303',
    category: 'Peripherals',
    unitPrice: 129,
    inStock: 94,
  },
  {
    id: 7,
    product: 'Webcam 1080p autofocus',
    sku: 'VID-CAM-108',
    category: 'Video',
    unitPrice: 89,
    inStock: 203,
  },
  {
    id: 8,
    product: 'Docking station Thunderbolt 4',
    sku: 'PER-DCK-401',
    category: 'Peripherals',
    unitPrice: 279,
    inStock: 31,
  },
  {
    id: 9,
    product: 'Portable SSD 1TB',
    sku: 'STO-SSD-1T',
    category: 'Storage',
    unitPrice: 119.99,
    inStock: 178,
  },
  {
    id: 10,
    product: 'Office chair mesh back',
    sku: 'FUR-CHR-882',
    category: 'Furniture',
    unitPrice: 349,
    inStock: 22,
  },
  {
    id: 11,
    product: 'LED desk lamp dimmable',
    sku: 'LGT-LMP-210',
    category: 'Lighting',
    unitPrice: 54.25,
    inStock: 115,
  },
  {
    id: 12,
    product: 'Bluetooth mouse silent',
    sku: 'PER-MSE-055',
    category: 'Peripherals',
    unitPrice: 32.99,
    inStock: 340,
  },
  {
    id: 13,
    product: 'HDMI 2.1 cable 2m',
    sku: 'CBL-HDM-200',
    category: 'Cables',
    unitPrice: 18.99,
    inStock: 512,
  },
  {
    id: 14,
    product: 'USB-C PD charger 65W',
    sku: 'PWR-PD65-W',
    category: 'Power',
    unitPrice: 49,
    inStock: 189,
  },
  {
    id: 15,
    product: 'Mesh Wi-Fi router',
    sku: 'NET-RT-M1',
    category: 'Networking',
    unitPrice: 159,
    inStock: 58,
  },
  {
    id: 16,
    product: 'External HDD 4TB',
    sku: 'STO-HDD-4T',
    category: 'Storage',
    unitPrice: 99.5,
    inStock: 76,
  },
  {
    id: 17,
    product: 'Graphics tablet medium',
    sku: 'CRT-TAB-M2',
    category: 'Creative',
    unitPrice: 249,
    inStock: 41,
  },
  {
    id: 18,
    product: 'Microphone USB condenser',
    sku: 'AUD-MIC-U1',
    category: 'Audio',
    unitPrice: 74.99,
    inStock: 99,
  },
  {
    id: 19,
    product: 'Privacy screen 14"',
    sku: 'ACC-PRV-140',
    category: 'Accessories',
    unitPrice: 42,
    inStock: 133,
  },
  {
    id: 20,
    product: 'Surge protector 8-outlet',
    sku: 'PWR-SRG-808',
    category: 'Power',
    unitPrice: 28.75,
    inStock: 267,
  },
  {
    id: 21,
    product: 'FHD portable monitor 15.6"',
    sku: 'DSP-MON-156',
    category: 'Displays',
    unitPrice: 189,
    inStock: 48,
  },
  {
    id: 22,
    product: 'Ethernet cable Cat6 5m',
    sku: 'CBL-ETH-500',
    category: 'Cables',
    unitPrice: 12.5,
    inStock: 620,
  },
  {
    id: 23,
    product: 'Laptop sleeve 15"',
    sku: 'ACC-SLV-150',
    category: 'Accessories',
    unitPrice: 35,
    inStock: 201,
  },
  {
    id: 24,
    product: 'Smart power strip',
    sku: 'PWR-STR-S1',
    category: 'Power',
    unitPrice: 59.99,
    inStock: 71,
  },
  {
    id: 25,
    product: 'Ring light 12" with stand',
    sku: 'LGT-RNG-120',
    category: 'Lighting',
    unitPrice: 65,
    inStock: 84,
  },
  {
    id: 26,
    product: 'NVMe enclosure USB4',
    sku: 'STO-ENC-NV',
    category: 'Storage',
    unitPrice: 79,
    inStock: 55,
  },
  {
    id: 27,
    product: 'Vertical mouse',
    sku: 'PER-MSE-VER',
    category: 'Peripherals',
    unitPrice: 56.5,
    inStock: 112,
  },
  {
    id: 28,
    product: 'Conference speakerphone',
    sku: 'AUD-SPK-CF',
    category: 'Audio',
    unitPrice: 189.99,
    inStock: 36,
  },
];

function delay(ms: number, signal: AbortSignal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));

      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

function asLowerString(cell: unknown) {
  if (cell === null || cell === undefined) {
    return '';
  }

  return String(cell).toLowerCase();
}

function matchesCondition(cell: unknown, cond: FilterCondition) {
  const args = Array.isArray(cond.args) ? cond.args : [];
  const name = cond.name;

  if (!name || name === 'none') {
    return true;
  }

  switch (name) {
    case 'eq':
      return asLowerString(cell) === asLowerString(args[0]);
    case 'neq':
      return asLowerString(cell) !== asLowerString(args[0]);
    case 'contains':
      return asLowerString(cell).includes(asLowerString(args[0]));
    case 'not_contains':
      return !asLowerString(cell).includes(asLowerString(args[0]));
    case 'begins_with':
      return asLowerString(cell).startsWith(asLowerString(args[0]));
    case 'ends_with':
      return asLowerString(cell).endsWith(asLowerString(args[0]));
    case 'gt':
      return Number(cell) > Number(args[0]);
    case 'gte':
      return Number(cell) >= Number(args[0]);
    case 'lt':
      return Number(cell) < Number(args[0]);
    case 'lte':
      return Number(cell) <= Number(args[0]);
    case 'between':
      return Number(cell) >= Number(args[0]) && Number(cell) <= Number(args[1]);
    case 'not_between':
      return Number(cell) < Number(args[0]) || Number(cell) > Number(args[1]);
    case 'empty':
      return cell === null || cell === undefined || String(cell) === '';
    case 'not_empty':
      return cell !== null && cell !== undefined && String(cell) !== '';
    default:
      return true;
  }
}

function rowMatchesFilterColumn(row: DemoRow, colFilter: DataProviderFilterColumn) {
  const value = row[colFilter.prop];
  const conditions = colFilter.conditions ?? [];
  const op = colFilter.operation ?? 'conjunction';

  if (conditions.length === 0) {
    return true;
  }

  const parts = conditions.map((c) => () => matchesCondition(value, c));

  if (op === 'disjunction') {
    return parts.some((fn) => fn());
  }

  if (op === 'disjunctionWithExtraCondition' && parts.length >= 3) {
    return parts.slice(0, -1).some((fn) => fn()) && parts[parts.length - 1]();
  }

  return parts.every((fn) => fn());
}

function applyQueryFilters(rows: DemoRow[], filters: DataProviderQueryParameters['filters']) {
  if (!filters || filters.length === 0) {
    return rows;
  }

  return rows.filter((row) => filters.every((f) => rowMatchesFilterColumn(row, f)));
}

function createInventoryDemoServer() {
  const store = {
    nextId: SEED_CATALOG.reduce((max, r) => Math.max(max, r.id), 0),
    rows: SEED_CATALOG.map((r) => ({ ...r })),
  };

  let failNextFetch = false;

  return {
    clearFailNextFetch() {
      failNextFetch = false;
    },
    setFailNextFetch() {
      failNextFetch = true;
    },
    fetchRows(queryParameters: DataProviderQueryParameters, { signal }: DataProviderFetchOptions) {
      const { page, pageSize, sort, filters } = queryParameters;
      let rows = [...store.rows];

      if (sort) {
        rows.sort((a, b) => {
          const av = a[sort.prop];
          const bv = b[sort.prop];
          let cmp = 0;

          if (av < bv) {
            cmp = -1;
          } else if (av > bv) {
            cmp = 1;
          }

          return sort.order === 'asc' ? cmp : -cmp;
        });
      }

      rows = applyQueryFilters(rows, filters);

      const start = (page - 1) * pageSize;
      const pageRows = rows.slice(start, start + pageSize);

      return delay(LATENCY_MS, signal).then(() => {
        if (signal.aborted) {
          return Promise.reject(new DOMException('Aborted', 'AbortError'));
        }

        if (failNextFetch) {
          failNextFetch = false;

          return Promise.reject(new Error('Simulated server error (for example HTTP 503).'));
        }

        return {
          rows: pageRows,
          totalRows: rows.length,
        };
      });
    },
    async onRowsCreate({ rowsAmount, position, referenceRowId }: {
      rowsAmount: number;
      position: 'above' | 'below';
      referenceRowId?: number | string;
    }) {
      const newRows: DemoRow[] = [];

      for (let i = 0; i < rowsAmount; i += 1) {
        store.nextId += 1;
        newRows.push({
          id: store.nextId,
          product: 'New product',
          sku: `NEW-${store.nextId}`,
          category: 'Uncategorized',
          unitPrice: 0,
          inStock: 0,
        });
      }

      let insertAt = store.rows.length;

      if (referenceRowId !== undefined && referenceRowId !== null) {
        const refIdx = store.rows.findIndex((r) => r.id === referenceRowId);

        if (refIdx >= 0) {
          insertAt = position === 'above' ? refIdx : refIdx + 1;
        }
      }

      store.rows.splice(insertAt, 0, ...newRows);
    },
    async onRowsUpdate(rows: RowUpdatePayload[]) {
      rows.forEach(({ id, changes }) => {
        const row = store.rows.find((r) => r.id === id);

        if (row) {
          Object.assign(row, changes);
        }
      });
    },
    async onRowsRemove(rowIds: Array<number | string>) {
      const idSet = new Set(rowIds);

      store.rows = store.rows.filter((r) => !idSet.has(r.id));
    },
  };
}

const server = createInventoryDemoServer();
const hotRef = ref<InstanceType<typeof HotTable> | null>(null);
const status = ref('Initializing…');

// hotSettings is a plain const (not reactive) to prevent updateSettings being triggered
// when status changes — avoids re-fetching data on every status text update.
const hotSettings: GridSettings = {
  dataProvider: {
    rowId: 'id',
    fetchRows: (queryParameters, options) => server.fetchRows(queryParameters, options),
    onRowsCreate: server.onRowsCreate,
    onRowsUpdate: server.onRowsUpdate,
    onRowsRemove: server.onRowsRemove,
  },
  columns: [
    { data: 'product' },
    { data: 'sku', readOnly: true },
    { data: 'category' },
    { data: 'unitPrice', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
    { data: 'inStock', type: 'numeric' },
  ],
  colHeaders: ['Product', 'SKU', 'Category', 'Unit price', 'In stock'],
  rowHeaders: true,
  width: '100%',
  height: '300px',
  licenseKey: 'non-commercial-and-evaluation',
  columnSorting: true,
  pagination: true,
  dropdownMenu: true,
  filters: true,
  contextMenu: true,
  emptyDataState: true,
  notification: true,
  beforeDataProviderFetch(params: DataProviderBeforeFetchParameters) {
    status.value = params.skipLoading ? 'Updating after sort or edit…' : 'Loading data…';
  },
  afterDataProviderFetch() {
    status.value = `Ready (simulated ${LATENCY_MS}ms request).`;
  },
  afterDataProviderFetchError(error: Error) {
    status.value = `Could not load data: ${error.message}`;
  },
};

function reloadData() {
  server.clearFailNextFetch();
  const p = hotRef.value?.hotInstance?.getPlugin('dataProvider')?.fetchData();

  if (p) {
    void p.catch(() => {});
  }
}

function simulateFailedFetch() {
  server.setFailNextFetch();
  const p = hotRef.value?.hotInstance?.getPlugin('dataProvider')?.fetchData();

  if (p) {
    void p.catch(() => {});
  }
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" @click="reloadData">Reload data</button>
        <button type="button" @click="simulateFailedFetch">Simulate failed fetch</button>
      </div>
      <output id="example1-status">{{ status }}</output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>
