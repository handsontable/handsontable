/* file: app.component.ts */
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { HotTableModule, HotTableComponent } from '@handsontable/angular-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  RowsCreatePayload,
  RowUpdatePayload,
  RowMutationPayload,
  RowMutationRemovePayload,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

// Serializes fetchRows query parameters into a URL query string that Symfony
// reads via $request->query->all().
//
// Handsontable sends:
//   sort:    { prop: 'name', order: 'asc' }  or  null
//   filters: [{ prop: 'price', conditions: [{ name: 'gt', args: [100] }] }]  or  null
//
// Symfony reads:
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

@Component({
  selector: 'example1-server-side-symfony',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="toolbar">
      <button (click)="filterElectronics()">Show Electronics</button>
      <button (click)="clearFilters()">Clear filters</button>
    </div>
    <div id="example1">
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent) hotRef!: HotTableComponent;

  private removeConfirmed = false;
  private totalRows = 0;

  readonly gridSettings = {
    dataProvider: {
      // rowId must match the primary key returned by the Symfony controller.
      rowId: 'id',

      // Called on every page change, sort, and filter.
      fetchRows: async (queryParameters: DataProviderQueryParameters, { signal }: { signal: AbortSignal }) => {
        const url = buildUrl('/api/products', queryParameters);
        const res = await fetch(url, { signal });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        this.totalRows = json.total;
        return { rows: json.data, totalRows: json.total };
      },

      // Fires when the user inserts rows via the context menu.
      // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
      onRowsCreate: async (payload: RowsCreatePayload) => {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const row = data[0];
        const hot = this.hotRef.hotInstance!;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (hot.getPlugin('notification') as any).showMessage({
          variant: 'success',
          title: 'Row added',
          message: `Created: ${row.sku} (id: ${row.id})`,
          duration: 3000,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageSize: number = (hot.getSettings() as any).pagination?.pageSize ?? 10;
        const rows = hot.getSourceData() as { id: number }[];
        const index = rows.findIndex((r) => r.id === payload.referenceRowId);
        const insertAt = index >= 0 ? index + (payload.position === 'above' ? 0 : 1) : rows.length;
        rows.splice(insertAt, 0, row);
        hot.loadData(rows.slice(0, pageSize));
        this.totalRows += 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (hot as any).runHooks('afterDataProviderFetch', {
          queryParameters: {},
          totalRows: this.totalRows,
        });
        throw new Error('stop refetch');
      },

      // Fires after a cell edit, paste, or autofill batch.
      // rows: [{ id, changes: { price: 149.99 }, rowData: {...} }, ...]
      onRowsUpdate: async (rows: RowUpdatePayload[]) => {
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rows),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },

      // Fires after the user confirms deletion.
      // rowIds: [4, 7, 12]
      onRowsRemove: async (rowIds: unknown[]) => {
        const res = await fetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rowIds),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
      { data: 'stock', type: 'numeric' },
    ],
    licenseKey: 'non-commercial-and-evaluation',
  };

  filterElectronics(): void {
    const filters = this.hotRef.hotInstance!.getPlugin('filters');
    filters.clearConditions();
    filters.addCondition(2, 'eq', ['Electronics']);
    filters.filter();
  }

  clearFilters(): void {
    const filters = this.hotRef.hotInstance!.getPlugin('filters');
    filters.clearConditions();
    filters.filter();
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })],
};
/* end-file */
