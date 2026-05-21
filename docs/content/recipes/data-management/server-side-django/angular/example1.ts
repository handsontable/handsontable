/* file: app.component.ts */
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import type { DataProviderQueryParameters, DataProviderFetchOptions, RowsCreatePayload, RowUpdatePayload } from 'handsontable/plugins/dataProvider';
import type { SourceRowData } from 'handsontable/common';

// Vite proxies /api/* → http://localhost:8000, so we use a relative URL.
const API_BASE = '/api/employees/';

function getCsrfToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1] ?? ''
  );
}

/**
 * Converts Handsontable's DataProviderQueryParameters into a URL query string
 * that Django REST Framework understands.
 *
 * filters is a DataProviderFilterColumn[] array -- pass it as a JSON string
 * so Django can parse the full nested structure (prop, operation,
 * conditions: [{ name, args }]) with a single json.loads() call.
 */
function buildUrl(params: DataProviderQueryParameters): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[prop]', params.sort.prop);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters?.length) {
    query.set('filters', JSON.stringify(params.filters));
  }

  return `${API_BASE}?${query.toString()}`;
}

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'example1-server-side-django',
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
    beforeRowsMutation: (operation: string, payload: unknown) =>
      this.beforeRowsMutation(operation, payload),
    pagination: { pageSize: 10 },
    columnSorting: true,
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
    contextMenu: true,
    emptyDataState: true,
    notification: true,
    dialog: true,
    colHeaders: ['First Name', 'Last Name', 'Department', 'Role', 'Salary'],
    columns: [
      { data: 'first_name', type: 'text' },
      { data: 'last_name',  type: 'text' },
      { data: 'department', type: 'text' },
      { data: 'role',       type: 'text' },
      { data: 'salary',     type: 'numeric', numericFormat: { pattern: '$0,0' } },
    ],
    rowHeaders: true,
    height: 400,
    width: '100%',
    autoWrapRow: true,
    licenseKey: 'non-commercial-and-evaluation',
  };

  async fetchRows(params: DataProviderQueryParameters, signal: AbortSignal): Promise<{ rows: SourceRowData[]; totalRows: number }> {
    const res = await fetch(buildUrl(params), { signal });

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    return res.json() as Promise<{ rows: SourceRowData[]; totalRows: number }>;
  }

  // onRowsCreate receives { rowsAmount } -- the number of rows to add.
  // POST that count; the server creates empty rows and returns them with ids.
  async onRowsCreate({ rowsAmount }: RowsCreatePayload): Promise<void> {
    const res = await fetch(`${API_BASE}create-rows/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify({ rowsAmount }),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    const data = await res.json() as Array<{ id: number }>;
    const info = data.map(r => `(id: ${r.id})`).join(', ');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.hotTable.hotInstance!.getPlugin('notification') as any).showMessage({
      variant: 'success',
      title: 'Row added',
      message: `Created: ${info}`,
      duration: 3000,
    });
  }

  // onRowsUpdate receives [{ id, changes: { field: value } }, ...].
  // Pass the array as-is; Django reads row['id'] and row['changes'].
  async onRowsUpdate(rows: RowUpdatePayload[]): Promise<void> {
    const res = await fetch(`${API_BASE}update-rows/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Update failed: ${res.status}`);
    }
  }

  async onRowsRemove(rowIds: unknown[]): Promise<void> {
    const res = await fetch(`${API_BASE}remove-rows/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify(rowIds),
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }
  }

  beforeRowsMutation(operation: string, payload: unknown): boolean | void {
    if (operation !== 'remove' || this.removeConfirmed) return;

    const rowsRemove = (payload as { rowsRemove: unknown[] }).rowsRemove;
    const count = rowsRemove.length;
    const hot = this.hotTable?.hotInstance;
    if (!hot) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notification = hot.getPlugin('notification') as any;
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
            (hot.getPlugin('dataProvider') as any).removeRows(rowsRemove).finally(() => {
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
