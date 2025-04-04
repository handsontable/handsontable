/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example5',
  template: `
    <hot-table
      [settings]="hotSettings!">
    </hot-table>
  `,
  styles: `
    :host ::ng-deep {
      .bold-text {
        font-weight: bold;
      }
      .italic-text {
          font-style: italic;
      }
    }
  `
})
export class AppComponent implements OnInit {

  hotSettings!: GridSettings;

  ngOnInit() {
    this.hotSettings = {
      data: [
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
        ['A3', 'B3', 'C3', 'D3'],
      ],
      colHeaders: true,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      height: 'auto',
      headerClassName: 'htLeft',
      columns: [
        { headerClassName: 'italic-text' },
        { headerClassName: 'bold-text italic-text' },
        { headerClassName: 'htRight bold-text italic-text' },
        {},
      ]
    }
  }
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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
      } as HotConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule, ReactiveFormsModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
