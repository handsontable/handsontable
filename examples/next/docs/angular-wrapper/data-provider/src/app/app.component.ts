import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  HotTableModule,
  GridSettings,
} from '@handsontable/angular-wrapper';
import { createTicketsDataProvider, createWarehouseDataProvider } from './data-provider-clients';
import { environment } from '../environments/environment';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
  readonly warehouseSettings: GridSettings = {
    dataProvider: createWarehouseDataProvider(environment.restApiBase),
    columns: [
      { data: 'sku', title: 'SKU' },
      { data: 'bin', title: 'Bin' },
      { data: 'quantityOnHand', type: 'numeric', title: 'On hand' },
      { data: 'reorderPoint', type: 'numeric', title: 'Reorder at' },
    ],
    rowHeaders: true,
    colHeaders: true,
    width: '100%',
    height: 420,
    licenseKey: 'non-commercial-and-evaluation',
    columnSorting: true,
    pagination: { pageSize: 15 },
    dropdownMenu: true,
    filters: true,
    contextMenu: true,
    emptyDataState: true,
    notification: true,
  };

  readonly ticketsSettings: GridSettings = {
    dataProvider: createTicketsDataProvider(environment.graphqlUrl),
    columns: [
      { data: 'subject', title: 'Subject' },
      { data: 'requesterEmail', title: 'Requester' },
      {
        data: 'priority',
        title: 'Priority',
        type: 'dropdown',
        source: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      },
      {
        data: 'status',
        title: 'Status',
        type: 'dropdown',
        source: ['OPEN', 'PENDING', 'RESOLVED'],
      },
    ],
    rowHeaders: true,
    colHeaders: true,
    width: '100%',
    height: 420,
    licenseKey: 'non-commercial-and-evaluation',
    columnSorting: true,
    pagination: { pageSize: 12 },
    dropdownMenu: true,
    filters: true,
    contextMenu: true,
    emptyDataState: true,
    notification: true,
  };
}
