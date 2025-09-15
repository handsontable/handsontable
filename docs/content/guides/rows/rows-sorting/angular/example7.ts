/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example7',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  styles: `
    :host ::ng-deep {
      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-1::after {
        content: '①';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-2::after {
        content: '②';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-3::after {
        content: '③';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-4::after {
        content: '④';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-5::after {
        content: '⑤';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-6::after {
        content: '⑥';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-7::after {
        content: '⑦';
      }

      .custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting::after {
        width: 10px;
        font-size: 10px;
      }

      .custom-sort-icon-example-3 .handsontable .columnSorting.sortAction:before {
        right: 5px;
      }
    }
  `,
  standalone: false
})
export class AppComponent {

  readonly hotData = [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      color: 'White',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Frame',
      color: 'Black',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      color: 'Red',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      color: 'Green',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      color: 'Blue',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Brand',
        type: 'text',
        data: 'brand',
      },
      {
        title: 'Model',
        type: 'text',
        data: 'model',
      },
      {
        title: 'Color',
        type: 'text',
        data: 'color',
      },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        numericFormat: {
          pattern: '$ 0,0.00',
          culture: 'en-US',
        },
      },
      {
        title: 'Date',
        type: 'date',
        data: 'sellDate',
        dateFormat: 'MMM D, YYYY',
        correctFormat: true,
        className: 'htRight',
      },
      {
        title: 'Time',
        type: 'time',
        data: 'sellTime',
        timeFormat: 'hh:mm A',
        correctFormat: true,
        className: 'htRight',
      },
      {
        title: 'In stock',
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
      },
    ],
    className: 'custom-sort-icon-example-3',
    multiColumnSorting: {
      initialConfig: [
        {
          column: 0,
          sortOrder: 'asc',
        },
        {
          column: 1,
          sortOrder: 'desc',
        },
        {
          column: 2,
          sortOrder: 'asc',
        },
        {
          column: 3,
          sortOrder: 'desc',
        },
        {
          column: 4,
          sortOrder: 'asc',
        },
        {
          column: 5,
          sortOrder: 'desc',
        },
        {
          column: 6,
          sortOrder: 'asc',
        },
      ],
    },
    height: 'auto',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
