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

// Serializes fetchRows query parameters into a URL query string that Laravel
// reads via request()->input().
//
// Handsontable sends:
//   sort:    { prop: 'name', order: 'asc' }  or  null
//   filters: [{ prop: 'price', conditions: [{ name: 'gt', args: [100] }] }]  or  null
//
// Laravel reads:
//   sort[prop], sort[order]
//   filters[0][prop], filters[0][condition], filters[0][value], filters[0][value2]
function buildUrl(base: string, { page, pageSize, sort, filters }: DataProviderQueryParameters): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (sort) {
    params.set('sort[prop]', sort.prop);
    params.set('sort[order]', sort.order);
  }

  if (filters?.length) {
    let idx = 0;
    filters.forEach(({ prop, conditions }) => {
      (conditions || []).forEach(({ name, args }) => {
        if (!name) return;
        params.set(`filters[${idx}][prop]`, prop);
        params.set(`filters[${idx}][condition]`, name);
        const a = args ?? [];
        if (a[0] != null) params.set(`filters[${idx}][value]`, String(a[0]));
        if (a[1] != null) params.set(`filters[${idx}][value2]`, String(a[1]));
        idx++;
      });
    });
  }

  return `${base}?${params}`;
}

// For Blade-rendered pages, inject via <meta name="csrf-token" content="{{ csrf_token() }}">.
// For this standalone SPA the API routes are stateless so the header is a no-op,
// but it's kept here so the code mirrors the recipe exactly.
function csrfToken(): string {
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

@Component({
  selector: 'example1-server-side-laravel',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<hot-table [settings]="settings"></hot-table>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent) hotRef!: HotTableComponent;

  private removeConfirmed = false;

  settings = {
    dataProvider: {
      // rowId must match the primary key returned by the Laravel model.
      rowId: 'id',

      // Called on every page change, sort, and filter.
      fetchRows: async (queryParameters: DataProviderQueryParameters, { signal }: { signal: AbortSignal }) => {
        const url = buildUrl('/api/products', queryParameters);
        const res = await fetch(url, { signal });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        return { rows: json.data, totalRows: json.total };
      },

      // Fires when the user inserts rows via the context menu.
      // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
      onRowsCreate: async (payload: RowsCreatePayload) => {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const row = data[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.hotRef.hotInstance!.getPlugin('notification') as any).showMessage({
          variant: 'success',
          title: 'Row added',
          message: `Created: ${row.sku} (id: ${row.id})`,
          duration: 3000,
        });
        return data;
      },

      // Fires after a cell edit, paste, or autofill batch.
      // rows: [{ id, changes: { price: 149.99 }, rowData: {...} }, ...]
      onRowsUpdate: async (rows: RowUpdatePayload[]) => {
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
          body: JSON.stringify(rows),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },

      // Fires after the user confirms deletion.
      // rowIds: [4, 7, 12]
      onRowsRemove: async (rowIds: unknown[]) => {
        const res = await fetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
          body: JSON.stringify(rowIds),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.hotRef.hotInstance!.getPlugin('notification') as any).showMessage({
          variant: 'success',
          title: 'Rows deleted',
          message: `Deleted ${rowIds.length} row${rowIds.length !== 1 ? 's' : ''}`,
          duration: 3000,
        });
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

    pagination: { pageSize: 10 },
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    contextMenu: true,
    emptyDataState: true,
    notification: true,

    width: '100%',
    height: 'auto',
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
      { data: 'price', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
      { data: 'stock', type: 'numeric' },
    ],
    licenseKey: 'non-commercial-and-evaluation',
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
