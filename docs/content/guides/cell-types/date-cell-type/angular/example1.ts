/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-date-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1DateCellTypeComponent {

  readonly data = [
    ['Mercedes', 'A 160', '01/14/2021', 6999.95],
    ['Citroen', 'C4 Coupe', '12/01/2022', 8330],
    ['Audi', 'A4 Avant', '11/19/2023', 33900],
    ['Opel', 'Astra', '02/02/2021', 7000],
    ['BMW', '320i Coupe', '07/24/2022', 30500],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car', 'Model', 'Registration date', 'Price'],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'text',
      },
      {
        // 2nd cell is simple text, no special options here
      },
      {
        type: 'date',
        dateFormat: 'MM/DD/YYYY',
        correctFormat: true,
        defaultDate: '01/01/2020',
        // datePicker additional options
        // (see https://github.com/dbushell/Pikaday#configuration)
        datePickerConfig: {
          // First day of the week (0: Sunday, 1: Monday, etc)
          firstDay: 0,
          showWeekNumber: true,
          disableDayFn(date) {
            // Disable Sunday and Saturday
            return date.getDay() === 0 || date.getDay() === 6;
          },
        },
      },
      {
        type: 'numeric',
        numericFormat: {
          pattern: '$ 0,0.00',
        },
      },
    ]
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
import { Example1DateCellTypeComponent } from './app.component';
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
  declarations: [ Example1DateCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1DateCellTypeComponent ]
})

export class AppModule { }
/* end-file */
