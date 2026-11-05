import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { CellChange, ChangeSource } from 'handsontable/settings';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

registerAllModules();

export interface InventoryRow {
  sku: string;
  name: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  updatedAt: string;
}

export type StockRecord = Omit<InventoryRow, 'available'>;

const LIVE_PROPS = ['onHand', 'reserved', 'available', 'reorderPoint', 'updatedAt'] as const;
const FLASH_MS = 800;
// Changes the grid makes itself. Only a user's edit goes back to Kafka.
const IGNORED_SOURCES = new Set<string>(['kafka', 'loadData', 'updateData']);

// The grid's data. Handsontable keeps a reference to this array, so a physical row index
// is a position in it.
let rows: InventoryRow[] = [];
const indexBySku = new Map<string, number>();
// When each SKU's cells last changed, for the highlight.
const changedAt = new Map<string, number>();
// Edits sent to Kafka that haven't come back through the stream yet.
const pendingEdits = new Map<string, number>();

const toRow = (record: StockRecord): InventoryRow => ({ ...record, available: record.onHand - record.reserved });

function reindex() {
  indexBySku.clear();
  rows.forEach((row, index) => indexBySku.set(row.sku, index));
}

export function createGrid(container: HTMLElement) {
  const hot = new Handsontable(container, {
    data: rows,
    colHeaders: ['SKU', 'Product', 'Warehouse', 'On hand', 'Reserved', 'Available', 'Reorder point', 'Updated'],
    columns: [
      { data: 'sku', readOnly: true, width: 100 },
      { data: 'name', readOnly: true, width: 150 },
      { data: 'warehouse', readOnly: true, width: 110 },
      { data: 'onHand', type: 'numeric', readOnly: true },
      { data: 'reserved', type: 'numeric', readOnly: true },
      { data: 'available', type: 'numeric', readOnly: true },
      {
        data: 'reorderPoint',
        type: 'numeric',
        validator: (value: unknown, callback: (valid: boolean) => void) => callback(Number.isInteger(value) && (value as number) >= 0),
        allowInvalid: false,
      },
      { data: 'updatedAt', readOnly: true, width: 200 },
    ],
    // `row` is a physical index here, so it points straight into `rows`.
    cells(row, _column, prop) {
      const item = rows[row];

      if (!item || !LIVE_PROPS.includes(prop as (typeof LIVE_PROPS)[number])) {
        return {};
      }

      const classes = [];

      if (performance.now() - (changedAt.get(item.sku) ?? -Infinity) < FLASH_MS) {
        classes.push('is-changed');
      }

      if (prop === 'available' && item.available < item.reorderPoint) {
        classes.push('is-low');
      }

      return { className: classes.join(' ') };
    },
    rowHeaders: true,
    columnSorting: true,
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_by_value', 'filter_action_bar'],
    notification: true,
    height: 600,
    stretchH: 'all',
    themeName: 'ht-theme-main',
    // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  });

  // Sorting and filtering run when the user applies them, not on every streamed value,
  // so rows don't move while someone reads them. After rows are added or removed,
  // re-apply both so new rows land in the right place.
  function reapplyView() {
    const filters = hot.getPlugin('filters');
    const sorting = hot.getPlugin('columnSorting');
    const sortConfig = sorting.getSortConfig();

    if (filters.exportConditions().length > 0) {
      filters.filter();
    }

    if (Array.isArray(sortConfig) && sortConfig.length > 0) {
      sorting.sort(sortConfig);
    }
  }

  function applySnapshot(records: StockRecord[]) {
    rows = records.map(toRow);
    reindex();
    hot.updateData(rows, 'kafka');
    reapplyView();
  }

  function applyChanges(upserts: StockRecord[], deletes: string[]) {
    const now = performance.now();
    const cellChanges: [number, string, unknown][] = [];
    let structural = deletes.length > 0;

    for (const record of upserts) {
      const next = toRow(record);
      const pending = pendingEdits.get(next.sku);

      // Keep showing the user's edit until Kafka sends it back.
      if (pending !== undefined) {
        if (next.reorderPoint === pending) {
          pendingEdits.delete(next.sku);
        } else {
          next.reorderPoint = pending;
        }
      }

      const index = indexBySku.get(next.sku);

      if (index === undefined) {
        rows.push(next);
        structural = true;
        continue;
      }

      for (const prop of LIVE_PROPS) {
        if (rows[index][prop] !== next[prop]) {
          cellChanges.push([index, prop, next[prop]]);
        }
      }

      changedAt.set(next.sku, now);
    }

    // Physical indexes: sorting and filtering can't send a value to the wrong row.
    if (cellChanges.length > 0) {
      hot.setSourceDataAtCell(cellChanges, undefined, undefined, 'kafka');
    }

    if (structural) {
      const removed = new Set(deletes);

      rows = rows.filter((row) => !removed.has(row.sku));
      reindex();
      hot.updateData(rows, 'kafka');
      reapplyView();
    }
  }

  // Sends a user's edit to the bridge, which writes it to Kafka. If that fails, put the
  // old value back and say why.
  hot.addHook('afterChange', (changes: CellChange[] | null, source: ChangeSource) => {
    if (!changes || IGNORED_SOURCES.has(source)) {
      return;
    }

    for (const [visualRow, prop, oldValue, newValue] of changes) {
      if (prop !== 'reorderPoint' || oldValue === newValue) {
        continue;
      }

      const sku = rows[hot.toPhysicalRow(visualRow)].sku;

      pendingEdits.set(sku, newValue as number);

      fetch(`/api/settings/${encodeURIComponent(sku)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorderPoint: newValue }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error((await response.json().catch(() => null))?.message ?? `HTTP ${response.status}`);
          }
        })
        .catch((error: Error) => {
          pendingEdits.delete(sku);

          const index = indexBySku.get(sku);

          // setSourceDataAtCell doesn't fire afterChange, so the revert isn't sent again.
          if (index !== undefined) {
            hot.setSourceDataAtCell(index, 'reorderPoint', oldValue, 'kafka');
          }

          hot.getPlugin('notification').showMessage({
            variant: 'error',
            title: `Couldn't save ${sku}`,
            message: error.message,
          });
        });
    }
  });

  return { hot, applySnapshot, applyChanges };
}
