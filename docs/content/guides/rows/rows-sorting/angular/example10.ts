/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import { ColumnSorting } from 'handsontable/plugins';

@Component({
  selector: 'app-example10',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="sort()" class="button">Sort</button>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  readonly hotData = [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
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
    multiColumnSorting: true,
    height: 'auto',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  getMultiColumnSortingPlugin(): ColumnSorting {
    return this.hotTable.hotInstance!.getPlugin('multiColumnSorting')
  }

  sort() {
    this.getMultiColumnSortingPlugin().sort([
      {
        column: 0,
        sortOrder: 'asc',
      },
      {
        column: 1,
        sortOrder: 'desc',
      },
    ]);
  }
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
