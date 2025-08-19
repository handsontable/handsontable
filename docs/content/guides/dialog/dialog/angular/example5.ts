/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from "@handsontable/angular-wrapper";

@Component({
  selector: 'app-example5',
  template: `
    <hot-table
      #hotTable
      [settings]="hotSettings!" 
      [data]="hotData"
    >
    </hot-table>
  `,
  standalone: false
})
export class AppComponent implements AfterViewInit {
  @ViewChild('hotTable') hotTable!: HotTableComponent;

  readonly hotData = [
    { model: 'Trail Helmet', price: 1298.14, sellDate: 'Aug 31, 2025', sellTime: '02:12 PM', inStock: true },
    { model: 'Windbreaker Jacket', price: 178.9, sellDate: 'May 10, 2025', sellTime: '10:26 PM', inStock: false },
    { model: 'Cycling Cap', price: 288.1, sellDate: 'Sep 15, 2025', sellTime: '09:37 AM', inStock: true },
    { model: 'HL Mountain Frame', price: 94.49, sellDate: 'Jan 17, 2025', sellTime: '02:19 PM', inStock: false },
    { model: 'Racing Socks', price: 430.38, sellDate: 'May 10, 2025', sellTime: '01:42 PM', inStock: true },
    { model: 'Racing Socks', price: 138.85, sellDate: 'Sep 20, 2025', sellTime: '02:48 PM', inStock: true },
    { model: 'HL Mountain Frame', price: 1909.63, sellDate: 'Sep 5, 2025', sellTime: '09:35 AM', inStock: false },
    { model: 'Carbon Handlebar', price: 1080.7, sellDate: 'Oct 24, 2025', sellTime: '10:58 PM', inStock: false },
    { model: 'Aero Bottle', price: 1571.13, sellDate: 'May 24, 2025', sellTime: '12:24 AM', inStock: true },
    { model: 'Windbreaker Jacket', price: 919.09, sellDate: 'Jul 16, 2025', sellTime: '07:11 PM', inStock: true },
    { model: 'HL Road Tire', price: 886.22, sellDate: 'Sep 9, 2025', sellTime: '12:42 AM', inStock: false },
    { model: 'Speed Gloves', price: 635.13, sellDate: 'Nov 17, 2025', sellTime: '12:45 PM', inStock: true },
    { model: 'Trail Helmet', price: 1440.64, sellDate: 'Jan 3, 2025', sellTime: '08:16 PM', inStock: false },
    { model: 'Aero Bottle', price: 944.63, sellDate: 'Nov 15, 2025', sellTime: '04:14 PM', inStock: false },
    { model: 'Windbreaker Jacket', price: 1161.43, sellDate: 'Jun 24, 2025', sellTime: '01:19 PM', inStock: false },
    { model: 'LED Bike Light', price: 1012.5, sellDate: 'May 1, 2025', sellTime: '05:30 PM', inStock: false },
    { model: 'Windbreaker Jacket', price: 635.37, sellDate: 'May 14, 2025', sellTime: '09:05 AM', inStock: true },
    { model: 'Road Tire Tube', price: 1421.27, sellDate: 'Jan 31, 2025', sellTime: '01:33 PM', inStock: true },
    { model: 'Action Camera', price: 1019.05, sellDate: 'Dec 7, 2025', sellTime: '01:26 AM', inStock: false },
    { model: 'Carbon Handlebar', price: 603.96, sellDate: 'Sep 13, 2025', sellTime: '04:10 AM', inStock: false },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Model',
        type: 'text',
        data: 'model',
        width: 150,
        headerClassName: 'htLeft',
      },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        width: 80,
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US',
        },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'Date',
        type: 'date',
        data: 'sellDate',
        width: 130,
        dateFormat: 'MMM D, YYYY',
        correctFormat: true,
        className: 'htRight',
        headerClassName: 'htRight',

      },
      {
        title: 'Time',
        type: 'time',
        data: 'sellTime',
        width: 90,
        timeFormat: 'hh:mm A',
        correctFormat: true,
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'In stock',
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
        headerClassName: 'htCenter',
      },
    ],
    width: '100%',
    height: 300,
    stretchH: 'all',
    contextMenu: true,
    rowHeaders: true,
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    autoRowSize: true,
    dialog: {
      content: 'This dialog uses a semi-transparent background.',
      background: 'semi-transparent',
      closable: true,
    },
  };

  ngAfterViewInit() {
    const hotInstance = this.hotTable.hotInstance;

    if (hotInstance) {
      // Show dialog after initialization
      const dialogPlugin = hotInstance.getPlugin('dialog');
      dialogPlugin.show();
    }
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
