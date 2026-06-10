/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { HotTableModule, HotTableComponent } from '@handsontable/angular-wrapper';
import type {
  DataProviderQueryParameters,
  RowsCreatePayload,
  RowUpdatePayload,
} from 'handsontable/plugins/dataProvider';

// NestJS reads sort as sort[column]/sort[order] and filters as flattened
// array entries: filters[N][prop], filters[N][condition], filters[N][value][0].
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
      <hot-table [settings]="settings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent) readonly hotRef!: HotTableComponent;

  settings = {
    dataProvider: {
      rowId: 'id',

      // Called on every page change, sort, and filter.
      fetchRows: async (queryParameters: DataProviderQueryParameters, { signal }: { signal: AbortSignal }) => {
        const res = await fetch(buildUrl(queryParameters), { signal });

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        return res.json();
      },

      // Fires when the user inserts rows via the context menu.
      // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
      onRowsCreate: async ({ rowsAmount }: RowsCreatePayload) => {
        const rows = Array.from({ length: rowsAmount ?? 0 }, () => ({
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

        if (!res.ok) throw new Error(`Create failed: ${res.status}`);

        return res.json();
      },

      // Fires after a cell edit, paste, or autofill batch.
      onRowsUpdate: async (rows: RowUpdatePayload[]) => {
        const payload = rows.map(({ id, changes }) => ({ id, ...changes }));
        const res = await fetch('/tickets', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      },

      // Fires after the user confirms deletion.
      onRowsRemove: async (rowIds: unknown[]) => {
        const res = await fetch('/tickets', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rowIds),
        });

        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      },
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
      { data: 'createdAt', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }, width: 110 },
    ],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
  };
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
