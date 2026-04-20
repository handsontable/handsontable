/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

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
  selector: 'example1-load-data-graphql',
  standalone: false,
  template: `
    <div>
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
        <p
          style="margin: 0; font-family: Arial, sans-serif; font-size: 14px;"
          [style.color]="hasError ? '#c62828' : '#202124'"
        >
          {{ status }}
        </p>
        @if (hasError) {
          <button type="button" (click)="loadUsers()">Retry</button>
        }
      </div>
      <hot-table [data]="rows" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class Example1LoadDataGraphqlComponent implements OnInit {
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

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import {
  HOT_GLOBAL_CONFIG,
  HotGlobalConfig,
  HotTableModule,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1LoadDataGraphqlComponent } from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule],
  declarations: [Example1LoadDataGraphqlComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1LoadDataGraphqlComponent],
})
export class AppModule {}
/* end-file */
