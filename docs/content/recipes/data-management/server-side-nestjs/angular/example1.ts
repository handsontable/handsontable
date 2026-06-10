/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

function buildUrl(base: string, params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  query.set('page', String(params['page']));
  query.set('pageSize', String(params['pageSize']));

  const sort = params['sort'] as { column: string; order: string } | undefined;

  if (sort) {
    query.set('sort[column]', sort.column);
    query.set('sort[order]', sort.order);
  }

  const filters = params['filters'] as Array<{ prop: string; condition: string; value: unknown[] }> | undefined;

  if (filters && filters.length > 0) {
    filters.forEach((filter, i) => {
      query.set(`filters[${i}][prop]`, filter.prop);
      query.set(`filters[${i}][condition]`, filter.condition);

      filter.value.forEach((v, j) => {
        query.set(`filters[${i}][value][${j}]`, String(v));
      });
    });
  }

  return `${base}?${query.toString()}`;
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
      fetchRows: (params: unknown, { signal }: { signal: AbortSignal }) =>
        this.fetchRows(params as Record<string, unknown>, signal),
      onRowsCreate: (payload: unknown) => this.onRowsCreate(payload),
      onRowsUpdate: (rows: unknown) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown) => this.onRowsRemove(rowIds),
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

  async fetchRows(params: Record<string, unknown>, signal: AbortSignal): Promise<any> {
    const url = buildUrl('http://localhost:3000/tickets', params);
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    return res.json();
  }

  async onRowsCreate(payload: unknown): Promise<any> {
    const res = await fetch('http://localhost:3000/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    return res.json();
  }

  async onRowsUpdate(rows: unknown): Promise<void> {
    const res = await fetch('http://localhost:3000/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }

  async onRowsRemove(rowIds: unknown): Promise<void> {
    const res = await fetch('http://localhost:3000/tickets', {
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
