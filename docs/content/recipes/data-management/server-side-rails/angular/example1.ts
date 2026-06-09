/* file: app.component.ts */
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { HotTableModule, HotTableComponent } from '@handsontable/angular-wrapper';
import type {
  DataProviderQueryParameters,
  RowsCreatePayload,
  RowUpdatePayload,
  RowMutationPayload,
  RowMutationRemovePayload,
} from 'handsontable/plugins/dataProvider';

const API_BASE = '/api/orders';

// Rails reads: page_size, sort_prop, sort_order, filters[N][prop/condition/value]
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
      <hot-table [settings]="settings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent) readonly hotRef!: HotTableComponent;

  private removeConfirmed = false;

  settings = {
    dataProvider: {
      rowId: 'id',

      // Called on every page change, sort, and filter.
      fetchRows: async (queryParameters: DataProviderQueryParameters, { signal }: { signal: AbortSignal }) => {
        const url = buildUrl(API_BASE, queryParameters);
        const res = await fetch(url, { signal });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        // Rails returns: { rows: [...], total_rows: n }
        const json = await res.json();
        return { rows: json.rows, totalRows: json.total_rows };
      },

      // Fires when the user inserts rows via the context menu.
      // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
      onRowsCreate: async (payload: RowsCreatePayload) => {
        const newRows = Array.from({ length: payload.rowsAmount ?? 0 }, () => ({
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

        const json = await res.json();
        const info = json.rows.map((r: { order_number: string }) => `(order: ${r.order_number})`).join(', ');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.hotRef.hotInstance!.getPlugin('notification') as any).showMessage({
          variant: 'success',
          title: 'Row added',
          message: `Created: ${info}`,
          duration: 3000,
        });

        return json.rows;
      },

      // Fires after a cell edit, paste, or autofill batch.
      onRowsUpdate: async (rows: RowUpdatePayload[]) => {
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
      },

      // Fires after the user confirms deletion.
      onRowsRemove: async (rowIds: unknown[]) => {
        const res = await fetch(`${API_BASE}/remove_rows`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ row_ids: rowIds }),
        });

        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      },
    },

    // beforeRowsMutation is sync (checks for a strict `=== false` return), so
    // we can't await an async prompt inline. Instead: cancel the original
    // attempt, show a notification with Delete/Cancel actions, and on Delete
    // re-issue the remove via the DataProvider API. The flag lets the second
    // pass through without re-prompting.
    beforeRowsMutation: (operation: 'create' | 'update' | 'remove', payload: RowMutationPayload): false | void => {
      if (operation === 'remove' && !this.removeConfirmed) {
        const { rowsRemove } = payload as RowMutationRemovePayload;
        const hot = this.hotRef.hotInstance!;
        const count = rowsRemove.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notification = (hot.getPlugin('notification') as any);
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (hot.getPlugin('dataProvider') as any)
                  .removeRows(rowsRemove)
                  .finally(() => {
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
    },

    pagination:     { pageSize: 10 },
    columnSorting:  true,
    filters:        true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dropdownMenu:   ['filter_by_condition', 'filter_action_bar'] as any,
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
