/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

function getCsrfToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1] ?? ''
  );
}

function buildUrl(base: string, params: { page: unknown; pageSize: unknown; sort?: unknown; filters?: unknown }): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  const sort = params.sort as { prop?: string; order?: string } | undefined;

  if (sort?.prop) {
    query.set('sort[prop]', sort.prop);
    query.set('sort[order]', sort.order ?? 'asc');
  }

  const filters = params.filters as Array<{ prop: string; value: unknown; condition: string }> | undefined;

  if (filters?.length) {
    filters.forEach(({ prop, value, condition }, i) => {
      query.set(`filters[${i}][prop]`, prop);
      query.set(`filters[${i}][value]`, String(value));
      query.set(`filters[${i}][condition]`, condition);
    });
  }

  return `${base}?${query.toString()}`;
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-server-side-django',
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
      onRowsCreate: (rows: unknown) => this.onRowsCreate(rows),
      onRowsUpdate: (rows: unknown) => this.onRowsUpdate(rows),
      onRowsRemove: (rowIds: unknown) => this.onRowsRemove(rowIds),
    },
    pagination: { pageSize: 10 },
    columnSorting: true,
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
    emptyDataState: true,
    notification: true,
    colHeaders: ['First Name', 'Last Name', 'Department', 'Role', 'Salary'],
    columns: [
      { data: 'first_name', type: 'text' },
      { data: 'last_name', type: 'text' },
      { data: 'department', type: 'text' },
      { data: 'role', type: 'text' },
      { data: 'salary', type: 'numeric', numericFormat: { pattern: '$0,0' } },
    ],
    rowHeaders: true,
    height: 400,
    width: '100%',
    autoWrapRow: true,
  };

  async fetchRows(params: Record<string, unknown>, signal: AbortSignal): Promise<unknown> {
    const url = buildUrl('http://localhost:8000/api/employees/', {
      page: params['page'],
      pageSize: params['pageSize'],
      sort: params['sort'],
      filters: params['filters'],
    });
    const res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    return res.json();
  }

  async onRowsCreate(rows: unknown): Promise<unknown> {
    const res = await fetch('http://localhost:8000/api/employees/create-rows/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      throw new Error(`Create failed: ${res.status}`);
    }

    return res.json();
  }

  async onRowsUpdate(rows: unknown): Promise<void> {
    const res = await fetch('http://localhost:8000/api/employees/update-rows/', {
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

  async onRowsRemove(rowIds: unknown): Promise<void> {
    const res = await fetch('http://localhost:8000/api/employees/remove-rows/', {
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
