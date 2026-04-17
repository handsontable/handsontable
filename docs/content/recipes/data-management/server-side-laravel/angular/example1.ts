/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

function buildUrl(base: string, params: { page: unknown; pageSize: unknown; sort?: unknown; filters?: unknown }): string {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  const sort = params.sort as { prop: string; order: string } | null | undefined;

  if (sort) {
    query.set('sort[prop]', sort.prop);
    query.set('sort[order]', sort.order);
  }

  const filters = params.filters as Array<{ prop: string; condition: { name: string; args?: unknown[] } }> | null | undefined;

  if (filters) {
    filters.forEach((filter, i) => {
      query.set(`filters[${i}][prop]`, filter.prop);
      query.set(`filters[${i}][condition]`, filter.condition.name);
      const args = filter.condition.args ?? [];

      if (args[0] != null) {
        query.set(`filters[${i}][value]`, String(args[0]));
      }

      if (args[1] != null) {
        query.set(`filters[${i}][value2]`, String(args[1]));
      }
    });
  }

  return `${base}?${query}`;
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

@Component({
  selector: 'example1-server-side-laravel',
  standalone: false,
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class Example1ServerSideLaravelComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly gridSettings: GridSettings = {
    dataProvider: {
      rowId: 'id',
      fetchRows: (params: unknown, { signal }: { signal: AbortSignal }) =>
        this.fetchRows(params as Record<string, unknown>, signal),
      onRowsCreate: (payload: unknown) => this.onRowsCreate(payload),
      onRowsUpdate: (rows: unknown) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown) => this.onRowsRemove(rowIds),
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
  };

  async fetchRows(params: Record<string, unknown>, signal: AbortSignal): Promise<{ rows: unknown[]; totalRows: number }> {
    const url = buildUrl('/api/products', {
      page: params['page'],
      pageSize: params['pageSize'],
      sort: params['sort'],
      filters: params['filters'],
    });
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    return { rows: json.data, totalRows: json.total };
  }

  async onRowsCreate(payload: unknown): Promise<void> {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(payload),
    });
  }

  async onRowsUpdate(rows: unknown): Promise<void> {
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rows),
    });
  }

  async onRowsRemove(rowIds: unknown): Promise<void> {
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(rowIds),
    });
  }
}
/* end-file */

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1ServerSideLaravelComponent } from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig }],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1ServerSideLaravelComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1ServerSideLaravelComponent],
})
export class AppModule {}
/* end-file */
