/* file: app.component.ts */
import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

type ApiUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: { city?: string };
  company?: { name?: string };
};

type UserRow = {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;
  company: string;
};

const USERS_QUERY = `
  query {
    users {
      data {
        id
        name
        username
        email
        address {
          city
        }
        company {
          name
        }
      }
    }
  }
`;

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example2-load-data-graphql',
  template: `
    <div>
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
        <p
          style="margin: 0; font-family: Arial, sans-serif; font-size: 14px;"
          [style.color]="hasError ? '#c62828' : '#202124'"
        >
          {{ status }}
        </p>
        @if (showRefresh && !hasError) {
          <button type="button" (click)="refreshUsers()" style="margin-bottom: 0">Refresh</button>
        }
        @if (hasError) {
          <button type="button" (click)="initialLoad()" style="margin-bottom: 0">Retry</button>
        }
      </div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  status = 'Loading users...';
  hasError = false;
  showRefresh = false;

  readonly gridSettings: GridSettings = {
    colHeaders: ['ID', 'Name', 'Username', 'Email', 'City', 'Company'],
    columns: [
      { data: 'id', type: 'numeric', width: 70 },
      { data: 'name', type: 'text', width: 190 },
      { data: 'username', type: 'text', width: 150 },
      { data: 'email', type: 'text', width: 220 },
      { data: 'city', type: 'text', width: 140 },
      { data: 'company', type: 'text', width: 180 },
    ],
    // Enables clickable sort indicators on column headers.
    columnSorting: true,
    rowHeaders: true,
    height: 360,
    width: '100%',
    stretchH: 'all',
    autoWrapRow: true,
  };

  ngAfterViewInit(): void {
    this.initialLoad();
  }

  // Step 5: Initial load uses loadData() directly on the hot instance, which resets all grid states.
  // This is correct for a first load -- there is no existing state to preserve.
  async initialLoad(): Promise<void> {
    this.status = 'Loading users...';
    this.hasError = false;
    this.showRefresh = false;

    try {
      const users = await this.fetchUsers();

      this.hotTable.hotInstance?.loadData(this.mapUsersToGridRows(users));
      this.status =
        'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
      this.showRefresh = true;
    } catch (_error) {
      this.hotTable.hotInstance?.loadData([]);
      this.hasError = true;
      this.status = 'Failed to load users. Try again.';
    }
  }

  // Step 6: Subsequent refreshes use updateData(), which replaces the data
  // without resetting column sort order, selection, or column order.
  async refreshUsers(): Promise<void> {
    this.status = 'Refreshing...';
    this.hasError = false;
    this.showRefresh = false;

    try {
      const users = await this.fetchUsers();

      this.hotTable.hotInstance?.updateData(this.mapUsersToGridRows(users));
      this.status = 'Data refreshed -- column sort order was preserved.';
      this.showRefresh = true;
    } catch (_error) {
      // On error, do not clear the grid -- the existing data is still valid.
      this.hasError = true;
      this.status = 'Failed to load users. Try again.';
    }
  }

  private async fetchUsers(): Promise<ApiUser[]> {
    const response = await fetch('https://graphqlzero.almansi.me/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: USERS_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: { users?: { data?: ApiUser[] } };
      errors?: Array<{ message?: string }>;
    };

    // GraphQL APIs can return HTTP 200 and still include execution errors.
    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed.');
    }

    return payload.data?.users?.data ?? [];
  }

  private mapUsersToGridRows(users: ApiUser[]): UserRow[] {
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      city: user.address?.city ?? '',
      company: user.company?.name ?? '',
    }));
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
