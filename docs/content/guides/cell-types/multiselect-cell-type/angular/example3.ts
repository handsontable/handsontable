/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

const requiredItems = ['Passport', 'Tickets', 'Wallet', 'Phone', 'Keys'];
const optionalExtras = ['Snacks', 'Book', 'Camera', 'Umbrella', 'First aid kit'];
const interests = ['Art', 'History', 'Nature', 'Food', 'Shopping'];

const sortAlphabetically = (entries: string[]) =>
  [...entries].sort((a, b) => String(a).localeCompare(String(b)));

const data = [
  [['Passport', 'Phone'], ['Snacks', 'Book'], ['Nature']],
  [['Tickets', 'Wallet'], ['Camera'], []],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
];

@Component({
  selector: 'example3-multiselect-cell-type',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example3MultiselectCellTypeComponent {

  readonly data = data;

  readonly gridSettings: GridSettings = {
    height: 200,
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'multiselect',
        source: requiredItems,
        title: 'Required items',
        allowEmpty: false,
      },
      {
        type: 'multiselect',
        source: optionalExtras,
        title: 'Optional extras',
        placeholder: 'Select up to 3',
        maxSelections: 3,
        visibleRows: 4,
        searchInput: false,
      },
      {
        type: 'multiselect',
        source: interests,
        title: 'Interests',
        placeholder: 'Select interests',
        sourceSortFunction: sortAlphabetically,
        filteringCaseSensitive: true,
      },
    ],
    preventOverflow: 'horizontal',
    colWidths: 200,
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
import { Example3MultiselectCellTypeComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example3MultiselectCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3MultiselectCellTypeComponent ]
})

export class AppModule { }
/* end-file */
