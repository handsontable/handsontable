/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from "@handsontable/angular-wrapper";

@Component({
  selector: 'app-example10',
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
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
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
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '01:23 AM',
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
    // enable filtering
    filters: true,
    // enable the column menu
    dropdownMenu: true,
    height: 'auto',
    // `beforeFilter()` is a Handsontable hook
    // it's fired after Handsontable gathers information about the filters, but before the filters are applied
    beforeFilter(conditionsStack) {
      // gather information about the filters
      console.log(`The amount of filters: ${conditionsStack.length}`);
      console.log(`The last changed column index: ${conditionsStack[0].column}`);
      console.log(
        `The amount of filters added to this column: ${conditionsStack[0].conditions.length}`
      );
      // the list of filter conditions
      console.log(conditionsStack[0].conditions);

      // return `false` to disable filtering on the client side
      return false;
    },
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
