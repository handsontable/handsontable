/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from "@handsontable/angular-wrapper";

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {

  readonly hotData = [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
      color: 'Black',
      email: '8576@all.xyz',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
      color: 'White',
      email: 'tayn@all.xyz',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
      color: 'Green',
      email: '6lights@far.com',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
      color: 'Blue',
      email: 'raj@fq1my2c.com',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
      color: 'Black',
      email: 'da@pdc.ga',
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Model<br>(text)',
        // set the type of the 'Model' column
        type: 'text',
        data: 'model',
      },
      {
        title: 'Price<br>(numeric)',
        // set the type of the 'Price' column
        type: 'numeric',
        data: 'price',
        numericFormat: {
          pattern: '$ 0,0.00',
          culture: 'en-US',
        },
      },
      {
        title: 'Sold on<br>(date)',
        // set the type of the 'Date' column
        type: 'date',
        data: 'sellDate',
        dateFormat: 'MMM D, YYYY',
        correctFormat: true,
        className: 'htRight',
      },
      {
        title: 'Time<br>(time)',
        // set the type of the 'Time' column
        type: 'time',
        data: 'sellTime',
        timeFormat: 'hh:mm A',
        correctFormat: true,
        className: 'htRight',
      },
      {
        title: 'In stock<br>(checkbox)',
        // set the type of the 'In stock' column
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
      },
      {
        title: 'Size<br>(dropdown)',
        // set the type of the 'Size' column
        type: 'dropdown',
        data: 'size',
        source: ['XS', 'S', 'M', 'L', 'XL'],
        className: 'htCenter',
      },
      {
        title: 'Color<br>(autocomplete)',
        // set the type of the 'Size' column
        type: 'autocomplete',
        data: 'color',
        source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
        className: 'htCenter',
      },
      {
        title: 'Email<br>(password)',
        // set the type of the 'Email' column
        type: 'password',
        data: 'email',
      },
    ],
    columnSorting: true,
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
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
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
        themeName: 'ht-theme-main-dark-auto',
        license: NON_COMMERCIAL_LICENSE,
      } as HotConfig
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
