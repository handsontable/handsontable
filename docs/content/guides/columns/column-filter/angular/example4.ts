/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly hotData = [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: false,
      color: 'Black',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: false,
      color: 'White',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: true,
      color: 'Green',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: true,
      color: 'Blue',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: '2023-10-02',
      sellTime: '01:23',
      inStock: true,
      color: 'Black',
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Model',
        // set the type of the 'Model' column
        type: 'text',
        data: 'model',
      },
      {
        title: 'Price',
        // set the type of the 'Price' column
        type: 'numeric',
        data: 'price',
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
      {
        title: 'Sold on',
        // set the type of the 'Date' column
        type: 'intl-date',
        data: 'sellDate',
        locale: 'en-US',
        dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
        className: 'htRight',
      },
      {
        title: 'Time',
        // set the type of the 'Time' column
        type: 'intl-time',
        data: 'sellTime',
        locale: 'en-US',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
        className: 'htRight',
      },
      {
        title: 'In stock',
        // set the type of the 'In stock' column
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
      },
      {
        title: 'Size',
        // set the type of the 'Size' column
        type: 'dropdown',
        data: 'size',
        source: ['XS', 'S', 'M', 'L', 'XL'],
        className: 'htCenter',
      },
      {
        title: 'Color',
        // set the type of the 'Size' column
        type: 'autocomplete',
        data: 'color',
        source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
        className: 'htCenter',
      },
    ],
    // enable filtering
    filters: true,
    // enable the column menu
    dropdownMenu: true,
    height: 175,
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
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
