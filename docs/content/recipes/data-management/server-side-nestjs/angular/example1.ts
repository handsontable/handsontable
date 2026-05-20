/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type { DataProviderQueryParameters, DataProviderFetchOptions, RowsCreatePayload, RowUpdatePayload } from 'handsontable/plugins/dataProvider';
import type { SourceRowData } from 'handsontable/common';

/**
 * Converts Handsontable's DataProviderQueryParameters into a URL query string
 * that the NestJS backend can parse with @Query() and class-transformer.
 *
 * Each DataProviderFilterColumn can have multiple conditions (e.g. between),
 * so we flatten them: one entry per condition, incrementing the index.
 */
function buildUrl(params: DataProviderQueryParameters): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.prop);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters?.length) {
    let idx = 0;

    params.filters.forEach(({ prop, conditions }) => {
      conditions.forEach((cond) => {
        query.set(`filters[${idx}][prop]`, prop);

        if (cond?.name) {
          query.set(`filters[${idx}][condition]`, cond.name);
        }

        cond?.args.forEach((v, j) => {
          query.set(`filters[${idx}][value][${j}]`, String(v));
        });

        idx++;
      });
    });
  }

  return `/tickets?${query.toString()}`;
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-server-side-nestjs',
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
    pagination: { pageSize: 5 },
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    emptyDataState: true,
    notification: true,
    colHeaders: ['ID', 'Subject', 'Status', 'Priority', 'Assignee', 'Created'],
    columns: [
      { data: 'id', type: 'text', readOnly: true, width: 50 },
      { data: 'subject', type: 'text', width: 280 },
      {
        data: 'status',
        type: 'dropdown',
        source: ['open', 'in-progress', 'resolved', 'closed'],
        width: 110,
      },
      {
        data: 'priority',
        type: 'dropdown',
        source: ['low', 'medium', 'high', 'critical'],
        width: 90,
      },
      { data: 'assignee', type: 'text', width: 140 },
      { data: 'createdAt', type: 'date', dateFormat: 'YYYY-MM-DD', width: 110 },
    ],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
  };

  async fetchRows(params: DataProviderQueryParameters, signal: AbortSignal): Promise<{ rows: SourceRowData[]; totalRows: number }> {
    const res = await fetch(buildUrl(params), { signal });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    return res.json() as Promise<{ rows: SourceRowData[]; totalRows: number }>;
  }

  async onRowsCreate({ rowsAmount }: RowsCreatePayload): Promise<SourceRowData[]> {
    const rows = Array.from({ length: rowsAmount }, () => ({
      subject: '',
      status: 'open',
      priority: 'medium',
      assignee: '',
      createdAt: new Date().toISOString().slice(0, 10),
    }));

    const res = await fetch('/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    return res.json() as Promise<SourceRowData[]>;
  }

  async onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
    const payload = rows.map(({ id, changes }) => ({ id, ...changes }));
    const res = await fetch('/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }

  async onRowsRemove(rowIds: unknown[]): Promise<void> {
    const res = await fetch('/tickets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
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
