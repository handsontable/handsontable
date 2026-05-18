/* file: app.component.ts */
import { Component, NgZone, inject } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderBeforeFetchParameters,
} from 'handsontable/plugins/dataProvider';

type UserRow = {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;
  company: string;
};

@Component({
  selector: 'example3-load-data-rest-api',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <output [class.is-error]="statusIsError">{{ statusMessage }}</output>
    </div>
    <hot-table [settings]="hotSettings"></hot-table>
  `,
})
export class AppComponent {
  private readonly ngZone = inject(NgZone);

  statusIsError = false;
  statusMessage = 'Loading...';

  private cachedRows: UserRow[] | null = null;

  readonly hotSettings: GridSettings;

  /** Defers binding updates so sync data-provider hooks do not trigger NG0100 in dev mode. */
  private setFetchStatus(message: string, isError = false): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        this.statusMessage = message;
        this.statusIsError = isError;
      });
    }, 0);
  }

  constructor() {
    this.hotSettings = {
      dataProvider: {
        rowId: 'id',
        fetchRows: async (
          { page, pageSize, sort }: DataProviderQueryParameters,
          { signal }: DataProviderFetchOptions
        ) => {
          let rows = await this.loadAllRows(signal);

          if (sort) {
            rows = [...rows].sort((a, b) => {
              const av = a[sort.prop as keyof UserRow];
              const bv = b[sort.prop as keyof UserRow];
              const cmp = av < bv ? -1 : av > bv ? 1 : 0;

              return sort.order === 'asc' ? cmp : -cmp;
            });
          }

          const start = (page - 1) * pageSize;

          return {
            rows: rows.slice(start, start + pageSize),
            totalRows: rows.length,
          };
        },
        onRowsCreate: async () => {},
        onRowsUpdate: async () => {},
        onRowsRemove: async () => {},
      },
      colHeaders: ['ID', 'Name', 'Username', 'Email', 'City', 'Company'],
      columns: [
        { data: 'id', type: 'numeric', width: 70, readOnly: true },
        { data: 'name', type: 'text', width: 190, readOnly: true },
        { data: 'username', type: 'text', width: 150, readOnly: true },
        { data: 'email', type: 'text', width: 220, readOnly: true },
        { data: 'city', type: 'text', width: 140, readOnly: true },
        { data: 'company', type: 'text', width: 180, readOnly: true },
      ],
      pagination: { pageSize: 5 },
      columnSorting: true,
      emptyDataState: true,
      rowHeaders: true,
      height: 360,
      width: '100%',
      stretchH: 'all',
      autoWrapRow: true,
      beforeDataProviderFetch: (params: DataProviderBeforeFetchParameters) => {
        if (!params.skipLoading) {
          this.setFetchStatus('Loading...', false);
        }
      },
      afterDataProviderFetch: () => {
        this.setFetchStatus('Loaded from REST API via dataProvider.', false);
      },
      afterDataProviderFetchError: (error: Error) => {
        this.setFetchStatus(`Error: ${error.message}`, true);
      },
    };
  }

  private async loadAllRows(signal: AbortSignal): Promise<UserRow[]> {
    if (this.cachedRows !== null) {
      return this.cachedRows;
    }

    const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const users = (await response.json()) as Array<{
      id: number;
      name: string;
      username: string;
      email: string;
      address?: { city?: string };
      company?: { name?: string };
    }>;

    this.cachedRows = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      city: u.address?.city ?? '',
      company: u.company?.name ?? '',
    }));

    return this.cachedRows;
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
