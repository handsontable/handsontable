/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable/common';

function buildUrl(base: string, params: Record<string, unknown>): string {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-server-side-spring',
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
      fetchRows: (params: unknown, { signal }: { signal: AbortSignal }) =>
        this.fetchRows(params as Record<string, unknown>, signal),
      onRowsCreate: (payload: unknown) => this.onRowsCreate(payload),
      onRowsUpdate: (rows: unknown) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown) => this.onRowsRemove(rowIds),
    } as any,
    columns: [
      { data: 'id', title: 'ID', readOnly: true, width: 60 },
      { data: 'name', title: 'Name', width: 200 },
      { data: 'sku', title: 'SKU', width: 120 },
      { data: 'category', title: 'Category', width: 130 },
      {
        data: 'price',
        title: 'Price',
        type: 'numeric',
        numericFormat: { pattern: '0,0.00', culture: 'en-US' },
        width: 100,
      },
      { data: 'stock', title: 'Stock', type: 'numeric', width: 80 },
    ],
    colHeaders: true,
    rowHeaders: true,
    height: 450,
    width: '100%',
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    pagination: { pageSize: 10 },
    emptyDataState: true,
    notification: true,
  };

  async fetchRows(params: Record<string, unknown>, signal: AbortSignal): Promise<{ rows: unknown[]; totalRows: number }> {
    const sort = params['sort'] as { prop?: string; order?: string } | undefined;
    const filters = params['filters'] as unknown[] | undefined;

    const url = buildUrl('/api/products', {
      page: params['page'],
      pageSize: params['pageSize'],
      sortProp: sort?.prop,
      sortOrder: sort?.order,
      filters: filters ? JSON.stringify(filters) : undefined,
    });

    const res = await fetch(url, { signal });
    const json = await res.json();

    return { rows: json.rows, totalRows: json.totalRows };
  }

  async onRowsCreate(payload: unknown): Promise<void> {
    await fetch('/api/products/create-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async onRowsUpdate(rows: unknown): Promise<void> {
    await fetch('/api/products/update-rows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
  }

  async onRowsRemove(rowIds: unknown): Promise<void> {
    await fetch('/api/products/remove-rows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
