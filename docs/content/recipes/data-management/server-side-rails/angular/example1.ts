/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
  RowUpdatePayload,
  RowsCreatePayload,
} from 'handsontable/plugins/dataProvider';
import type { SourceRowData } from 'handsontable/common';

function buildUrl(base: string, params: DataProviderQueryParameters): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('page_size', String(params.pageSize));

  if (params.sort?.prop) {
    query.set('sort_prop', params.sort.prop);
    query.set('sort_order', params.sort.order ?? 'asc');
  }

  if (params.filters?.length) {
    params.filters.forEach((filter, i) => {
      const condition = filter.conditions[0];

      query.set(`filters[${i}][prop]`, filter.prop);

      if (condition?.name) {
        query.set(`filters[${i}][condition]`, condition.name);
      }

      if (condition?.args?.[0] != null) {
        query.set(`filters[${i}][value]`, String(condition.args[0]));
      }

      if (condition?.args?.[1] != null) {
        query.set(`filters[${i}][value2]`, String(condition.args[1]));
      }
    });
  }

  return `${base}?${query.toString()}`;
}

function buildOrderRowsFromCreatePayload({ rowsAmount }: RowsCreatePayload): SourceRowData[] {
  const stamp = Date.now();

  return Array.from({ length: rowsAmount }, (_, i) => ({
    order_number: `ORD-NEW-${stamp}-${i}`,
    customer: 'New customer',
    status: 'pending',
    total: 0,
  }));
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-server-side-rails',
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly gridSettings: GridSettings = {
    dataProvider: {
      rowId: 'id',
      fetchRows: (params: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
        this.fetchRows(params, options.signal),
      onRowsCreate: (payload: RowsCreatePayload) => this.onRowsCreate(payload),
      onRowsUpdate: (rows: RowUpdatePayload[]) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown[]) => this.onRowsRemove(rowIds),
    },
    pagination: { pageSize: 10 },
    columnSorting: true,
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
    emptyDataState: true,
    notification: true,
    colHeaders: ['Order #', 'Customer', 'Status', 'Total', 'Created'],
    columns: [
      { data: 'order_number', type: 'text' },
      { data: 'customer', type: 'text' },
      { data: 'status', type: 'text' },
      { data: 'total', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
      { data: 'created_at', type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
    ],
    rowHeaders: true,
    height: 400,
    width: '100%',
  };

  async fetchRows(params: DataProviderQueryParameters, signal: AbortSignal): Promise<{ rows: SourceRowData[]; totalRows: number }> {
    const url = buildUrl('/api/orders', params);
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json() as { rows: SourceRowData[]; total_rows: number };

    return { rows: json.rows, totalRows: json.total_rows };
  }

  async onRowsCreate(payload: RowsCreatePayload): Promise<void> {
    const rows = buildOrderRowsFromCreatePayload(payload);
    const res = await fetch('/api/orders/create_rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    await res.json();
  }

  async onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
    const res = await fetch('/api/orders/update_rows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: rows.map((r) => ({ id: r.id, changes: r.changes })),
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  }

  async onRowsRemove(rowIds: unknown[]): Promise<void> {
    const res = await fetch('/api/orders/remove_rows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row_ids: rowIds }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
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
