/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';

interface Person {
  id: number;
  name: string;
  address: string;
}

@Component({
  selector: 'example3-binding-data',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example3BindingDataComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data: Person[] = [
    { id: 1, name: 'Ted Right', address: '' },
    { id: 2, name: 'Frank Honest', address: '' },
    { id: 3, name: 'Joan Well', address: '' },
    { id: 4, name: 'Gail Polite', address: '' },
    { id: 5, name: 'Michael Fair', address: '' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    height: 'auto',
    width: 'auto',
    minSpareRows: 1,
    autoWrapRow: true,
    autoWrapCol: true
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
import { Example3BindingDataComponent } from './app.component';
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
      } as HotConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example3BindingDataComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3BindingDataComponent ]
})

export class AppModule { }
/* end-file */
