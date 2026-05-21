/* file: app.component.ts */
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  RowsCreatePayload,
  RowUpdatePayload,
  RowMutationPayload,
  RowMutationRemovePayload,
} from 'handsontable/plugins/dataProvider';
import type { SourceRowData } from 'handsontable/common';

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
  encapsulation: ViewEncapsulation.None,
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'example1-server-side-spring',
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private removeConfirmed = false;

  readonly gridSettings: GridSettings = {
    dataProvider: {
      rowId: 'id',
      fetchRows: (params: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
        this.fetchRows(params, options.signal),
      onRowsCreate: (payload: RowsCreatePayload) => this.onRowsCreate(payload),
      onRowsUpdate: (rows: RowUpdatePayload[]) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown[]) => this.onRowsRemove(rowIds),
    },

    // beforeRowsMutation is sync (checks for a strict `=== false` return), so
    // we can't await an async prompt inline. Instead: cancel the original
    // attempt, show a notification with Delete/Cancel actions, and on Delete
    // re-issue the remove via the DataProvider API. The flag lets the second
    // pass through without re-prompting.
    beforeRowsMutation: (operation: 'create' | 'update' | 'remove', payload: RowMutationPayload): false | void => {
      if (operation === 'remove' && !this.removeConfirmed) {
        const { rowsRemove } = payload as RowMutationRemovePayload;
        const hot = this.hotTable.hotInstance!;
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
    contextMenu: true,
    pagination: { pageSize: 10 },
    emptyDataState: true,
    notification: true,
  };

  async fetchRows(params: DataProviderQueryParameters, signal: AbortSignal): Promise<{ rows: SourceRowData[]; totalRows: number }> {
    const url = buildUrl('/api/products', {
      page: params.page,
      pageSize: params.pageSize,
      sortProp: params.sort?.prop,
      sortOrder: params.sort?.order,
      filters: params.filters ? JSON.stringify(params.filters) : undefined,
    });

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    return { rows: json.rows, totalRows: json.totalRows };
  }

  async onRowsCreate(payload: RowsCreatePayload): Promise<void> {
    const res = await fetch('/api/products/create-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as Array<{ id: number }>;
    const info = data.map((r: { id: number }) => `(id: ${r.id})`).join(', ');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.hotTable.hotInstance!.getPlugin('notification') as any).showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${info}`,
      duration: 3000,
    });
  }

  async onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
    const res = await fetch('/api/products/update-rows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async onRowsRemove(rowIds: unknown[]): Promise<void> {
    const res = await fetch('/api/products/remove-rows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
