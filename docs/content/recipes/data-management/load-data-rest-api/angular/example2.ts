/* file: app.component.ts */
import { Component, NgZone, ViewChild, AfterViewInit, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

type UserRow = {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;
  company: string;
};

type ApiUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: { city?: string };
  company?: { name?: string };
};

const STATUS_LOADING = 'Loading users...';
const STATUS_READY =
  'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
const STATUS_REFRESHING = 'Refreshing...';
const STATUS_REFRESHED = 'Data refreshed -- column sort order was preserved.';
const STATUS_ERROR = 'Failed to load users. Try again.';

function mapUsersToGridRows(users: ApiUser[]): UserRow[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    city: user.address?.city ?? '',
    company: user.company?.name ?? '',
  }));
}

@Component({
  selector: 'example2-load-data-rest-api',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        @if (hasData && !hasError) {
          <button type="button" [disabled]="loading" (click)="refreshUsers()">Refresh</button>
        } @else if (hasError) {
          <button type="button" [disabled]="loading" (click)="initialLoad()">Retry</button>
        }
      </div>
      <output [class.is-error]="hasError">{{ statusMessage }}</output>
    </div>
    <hot-table [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private readonly ngZone = inject(NgZone);

  statusMessage = STATUS_LOADING;
  hasError = false;
  hasData = false;
  loading = false;

  readonly gridSettings: GridSettings = {
    colHeaders: ['ID', 'Name', 'Username', 'Email', 'City', 'Company'],
    columns: [
      { data: 'id', type: 'numeric', width: 70, readOnly: true },
      { data: 'name', type: 'text', width: 190, readOnly: true },
      { data: 'username', type: 'text', width: 150, readOnly: true },
      { data: 'email', type: 'text', width: 220, readOnly: true },
      { data: 'city', type: 'text', width: 140, readOnly: true },
      { data: 'company', type: 'text', width: 180, readOnly: true },
    ],
    columnSorting: true,
    rowHeaders: true,
    height: 360,
    width: '100%',
    stretchH: 'all',
    autoWrapRow: true,
  };

  private setStatus(message: string, hasError = false): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        this.statusMessage = message;
        this.hasError = hasError;
      });
    }, 0);
  }

  private async fetchUsers(): Promise<ApiUser[]> {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return response.json() as Promise<ApiUser[]>;
  }

  async initialLoad(): Promise<void> {
    this.loading = true;
    this.setStatus(STATUS_LOADING);

    try {
      const users = await this.fetchUsers();

      this.hotTable.hotInstance?.loadData(mapUsersToGridRows(users));
      this.hasData = true;
      this.setStatus(STATUS_READY);
    } catch (_error) {
      this.hotTable.hotInstance?.loadData([]);
      this.setStatus(STATUS_ERROR, true);
    } finally {
      this.loading = false;
    }
  }

  async refreshUsers(): Promise<void> {
    this.loading = true;
    this.setStatus(STATUS_REFRESHING);

    try {
      const users = await this.fetchUsers();

      this.hotTable.hotInstance?.updateData(mapUsersToGridRows(users));
      this.setStatus(STATUS_REFRESHED);
    } catch (_error) {
      this.setStatus(STATUS_ERROR, true);
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    void this.initialLoad();
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
