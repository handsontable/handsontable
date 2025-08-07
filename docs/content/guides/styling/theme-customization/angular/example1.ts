/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-demo',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1DemoComponent {
  readonly data: Array<Array<string | number>> = [
    ['John Doe', 'johndoe@example.com', 'New York', 32, 'Engineer'],
    ['Jane Smith', 'janesmith@example.com', 'Los Angeles', 29, 'Designer'],
    ['Sam Wilson', 'samwilson@example.com', 'Chicago', 41, 'Manager'],
    ['Emily Johnson', 'emilyj@example.com', 'San Francisco', 35, 'Developer'],
    ['Michael Brown', 'mbrown@example.com', 'Boston', 38, 'Analyst'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Name', 'Email', 'City', 'Age', 'Position'],
    columns: [
      { data: 0, type: 'text' },
      { data: 1, type: 'text' },
      { data: 2, type: 'text' },
      { data: 3, type: 'numeric' },
      { data: 4, type: 'text' }
    ],
    rowHeaders: true,
    width: '100%',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
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
import { Example1DemoComponent } from './app.component';
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
  declarations: [ Example1DemoComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1DemoComponent ]
})

export class AppModule { }
/* end-file */
