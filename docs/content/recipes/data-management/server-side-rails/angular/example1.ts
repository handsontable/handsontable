/* file: app.component.ts */
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  RowsCreatePayload,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';
import type { SourceRowData } from 'handsontable/common';

const API_BASE = '/api/orders';

// Serializes fetchRows query parameters into a URL the Rails controller understands.
//
// Handsontable sends:
//   sort:    { prop: 'order_number', order: 'asc' }  or  null
//   filters: [{ prop, conditions: [{ name, args }] }]  or  null
//
// Rails reads:
//   page_size, sort_prop, sort_order, filters[N][prop/condition/value]
function buildUrl(base: string, params: DataProviderQueryParameters): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('page_size', String(params.pageSize));

  if (params.sort?.prop) {
    query.set('sort_prop', params.sort.prop);
    query.set('sort_order', params.sort.order ?? 'asc');
  }

  if (params.filters?.length) {
    let idx = 0;
    params.filters.forEach(({ prop, conditions }) => {
      conditions.forEach((cond) => {
        if (!cond?.name) return;
        query.set(`filters[${idx}][prop]`, prop);
        query.set(`filters[${idx}][condition]`, cond.name);
        if (cond.args?.[0] != null) {
          query.set(`filters[${idx}][value]`, String(cond.args[0]));
        }
        idx++;
      });
    });
  }

  return `${base}?${query}`;
}

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'example1-server-side-rails',
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private removeConfirmed = false;

  readonly gridSettings: GridSettings = {
    dataProvider: {
      rowId: 'id',
      fetchRows: (params: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
        this.fetchRows(params, options.signal),
      onRowsCreate: (payload: RowsCreatePayload) => this.onRowsCreate(payload),
      onRowsUpdate: (rows: RowUpdatePayload[]) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown[]) => this.onRowsRemove(rowIds),
    },
    beforeRowsMutation: (operation: string, payload: unknown) =>
      this.beforeRowsMutation(operation, payload),
    pagination:     { pageSize: 10 },
    columnSorting:  true,
    filters:        true,
    dropdownMenu:   ['filter_by_condition', 'filter_action_bar'],
    contextMenu:    true,
    emptyDataState: true,
    notification:   true,
    dialog:         true,
    rowHeaders:     true,
    colHeaders: ['Order #', 'Customer', 'Status', 'Total', 'Created'],
    columns: [
      { data: 'order_number', type: 'text' },
      { data: 'customer',     type: 'text' },
      { data: 'status',       type: 'text' },
      { data: 'total',        type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
      { data: 'created_at',   type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
    ],
    height:      'auto',
    licenseKey:  'non-commercial-and-evaluation',
  };

  async fetchRows(
    params: DataProviderQueryParameters,
    signal: AbortSignal
  ): Promise<{ rows: SourceRowData[]; totalRows: number }> {
    const url = buildUrl(API_BASE, params);
    const res = await fetch(url, { signal });

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    // Rails returns: { rows: [...], total_rows: n }
    const json = await res.json() as { rows: SourceRowData[]; total_rows: number };

    return { rows: json.rows, totalRows: json.total_rows };
  }

  async onRowsCreate(payload: RowsCreatePayload): Promise<SourceRowData[]> {
    const newRows = Array.from({ length: payload.rowsAmount }, () => ({
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      customer: 'New Customer',
      status: 'pending',
      total: 0,
    }));

    const res = await fetch(`${API_BASE}/create_rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: newRows }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Create failed: ${res.status}`);
    }

    const json = await res.json() as { rows: SourceRowData[] };
    const info = (json.rows as Array<{ order_number: string }>).map(r => `(order: ${r.order_number})`).join(', ');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.hotTable.hotInstance!.getPlugin('notification') as any).showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${info}`,
      duration: 3000,
    });
    return json.rows;
  }

  async onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
    const res = await fetch(`${API_BASE}/update_rows`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: rows.map((r) => ({ id: r.id, changes: r.changes })),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Update failed: ${res.status}`);
    }
  }

  async onRowsRemove(rowIds: unknown[]): Promise<void> {
    const res = await fetch(`${API_BASE}/remove_rows`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row_ids: rowIds }),
    });

    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  }

  beforeRowsMutation(operation: string, payload: unknown): boolean | void {
    if (operation !== 'remove' || this.removeConfirmed) return;

    const rowsRemove = (payload as { rowsRemove: unknown[] }).rowsRemove;
    const count = rowsRemove.length;
    const hot = this.hotTable?.hotInstance;
    if (!hot) return false;

    const notification = hot.getPlugin('notification');
    const id = notification.showMessage({
      variant: 'warning',
      title: 'Delete rows',
      message: `Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`,
      duration: 0,
      actions: [
        {
          label: 'Delete',
          type: 'primary',
          callback: () => {
            notification.hide(id);
            this.removeConfirmed = true;
            hot.getPlugin('dataProvider').removeRows(rowsRemove).finally(() => {
              this.removeConfirmed = false;
            });
          },
        },
        {
          label: 'Cancel',
          type: 'secondary',
          callback: () => notification.hide(id),
        },
      ],
    });
    return false;
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
