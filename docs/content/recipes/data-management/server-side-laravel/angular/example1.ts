/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type { DataProviderQueryParameters, DataProviderFetchOptions, RowsCreatePayload, RowUpdatePayload } from 'handsontable/plugins/dataProvider';
import type { SourceRowData } from 'handsontable/common';

function buildUrl(base: string, params: DataProviderQueryParameters): string {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.sort) {
    query.set('sort[prop]', params.sort.prop);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters?.length) {
    params.filters.forEach(({ prop, conditions }, i) => {
      const cond = conditions[0];

      query.set(`filters[${i}][prop]`, prop);

      if (cond?.name) {
        query.set(`filters[${i}][condition]`, cond.name);
      }

      if (cond?.args[0] != null) {
        query.set(`filters[${i}][value]`, String(cond.args[0]));
      }

      if (cond?.args[1] != null) {
        query.set(`filters[${i}][value2]`, String(cond.args[1]));
      }
    });
  }

  return `${base}?${query}`;
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-server-side-laravel',
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
    dropdownMenu: true,
    contextMenu: true,
    emptyDataState: true,
    notification: true,
    rowHeaders: true,
    colHeaders: ['Name', 'SKU', 'Category', 'Price', 'Stock'],
    columns: [
      { data: 'name', type: 'text' },
      { data: 'sku', type: 'text', readOnly: true },
      {
        data: 'category',
        type: 'dropdown',
        source: ['Electronics', 'Accessories', 'Storage', 'Networking', 'Peripherals'],
      },
      { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
      { data: 'stock', type: 'numeric' },
    ],
    height: 360,
    width: '100%',
  };

  async fetchRows(params: DataProviderQueryParameters, signal: AbortSignal): Promise<{ rows: SourceRowData[]; totalRows: number }> {
    const url = buildUrl('/api/products', params);
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    return { rows: json.data, totalRows: json.total };
  }

  async onRowsCreate(payload: RowsCreatePayload): Promise<void> {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(payload),
    });
  }

  async onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rows),
    });
  }

  async onRowsRemove(rowIds: unknown[]): Promise<void> {
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rowIds),
    });
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
