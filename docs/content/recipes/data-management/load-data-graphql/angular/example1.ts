/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

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
  selector: 'example1-load-data-graphql',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        @if (hasError) {
          <button type="button" (click)="loadUsers()">Retry</button>
        }
      </div>
      <output [class.is-error]="hasError">{{ status }}</output>
    </div>
    <hot-table [data]="rows" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent implements OnInit {
  status = 'Loading users...';
  hasError = false;
  rows: UserRow[] = [];

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
    rowHeaders: true,
    height: 360,
    width: '100%',
    stretchH: 'all',
    autoWrapRow: true,
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.status = 'Loading users...';
    this.hasError = false;

    try {
      const users = await this.fetchUsers();

      this.rows = this.mapUsersToGridRows(users);
      this.status = 'Loaded users from GraphQL API.';
    } catch (_error) {
      this.rows = [];
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
