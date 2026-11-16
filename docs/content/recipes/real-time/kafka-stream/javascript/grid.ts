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

// A row as the bridge sends it. settingsRevision is the Kafka offset of the SKU's latest
// reorder point record.
export type StockRecord = Omit<InventoryRow, 'available'> & { settingsRevision: number };

interface PendingEdit {
  value: number;
  // Tells this edit apart from a later edit of the same SKU.
  generation: number;
  // The Kafka offset of the edit's record, known once the bridge accepts it.
  revision?: number;
}

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
// The latest reorder point Kafka has confirmed for each SKU, and its offset.
const confirmed = new Map<string, { reorderPoint: number; revision: number }>();
// The user's latest edit for each SKU, until Kafka confirms it or a newer edit.
const pendingEdits = new Map<string, PendingEdit>();
let nextGeneration = 0;

// Builds a grid row from a Kafka record. A reorder point the user edited keeps showing until
// a record at least as new as the edit arrives, so a record that was already in flight can't
// briefly undo it. The check compares offsets, not values: when another user edits the same
// SKU first, the bridge sends only the latest value, and that value wins.
function toRow(record: StockRecord): InventoryRow {
  const { settingsRevision, ...fields } = record;
  const row = { ...fields, available: fields.onHand - fields.reserved };
  const pending = pendingEdits.get(row.sku);

  confirmed.set(row.sku, { reorderPoint: row.reorderPoint, revision: settingsRevision });

  if (pending) {
    if (pending.revision !== undefined && settingsRevision >= pending.revision) {
      pendingEdits.delete(row.sku);
    } else {
      row.reorderPoint = pending.value;
    }
  }

  return row;
}

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
    confirmed.clear();
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

      deletes.forEach((sku) => {
        confirmed.delete(sku);
        pendingEdits.delete(sku);
      });
      rows = rows.filter((row) => !removed.has(row.sku));
      reindex();
      hot.updateData(rows, 'kafka');
      reapplyView();
    }
  }

  // Shows the reorder point Kafka last confirmed, once no edit of this SKU is pending.
  function showConfirmed(sku: string) {
    const index = indexBySku.get(sku);
    const server = confirmed.get(sku);

    // setSourceDataAtCell doesn't fire afterChange, so the value isn't sent again.
    if (index !== undefined && server && rows[index].reorderPoint !== server.reorderPoint) {
      hot.setSourceDataAtCell(index, 'reorderPoint', server.reorderPoint, 'kafka');
    }
  }

  // Sends a user's edit to the bridge, which writes it to Kafka. Each edit gets a generation,
  // so the response to an older request can't confirm or undo a newer edit of the same SKU.
  hot.addHook('afterChange', (changes: CellChange[] | null, source: ChangeSource) => {
    if (!changes || IGNORED_SOURCES.has(source)) {
      return;
    }

    for (const [visualRow, prop, oldValue, newValue] of changes) {
      if (prop !== 'reorderPoint' || oldValue === newValue) {
        continue;
      }

      const sku = rows[hot.toPhysicalRow(visualRow)].sku;
      const generation = ++nextGeneration;
      const isCurrent = () => pendingEdits.get(sku)?.generation === generation;

      pendingEdits.set(sku, { value: newValue as number, generation });

      fetch(`/api/settings/${encodeURIComponent(sku)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorderPoint: newValue }),
      })
        .then(async (response) => {
          const body = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(body?.message ?? `HTTP ${response.status}`);
          }

          if (!isCurrent()) {
            return;
          }

          // The stream may already have delivered the record, or a newer one.
          if ((confirmed.get(sku)?.revision ?? -1) >= body.revision) {
            pendingEdits.delete(sku);
            showConfirmed(sku);
          } else {
            pendingEdits.get(sku)!.revision = body.revision;
          }
        })
        .catch((error: Error) => {
          // Only the latest edit decides what the cell shows. If it failed, show Kafka's value.
          if (isCurrent()) {
            pendingEdits.delete(sku);
            showConfirmed(sku);
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
