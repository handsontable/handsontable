/* file: app.component.ts */
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotTableComponent
} from '@handsontable/angular-wrapper';
import { take } from 'rxjs';

@Component({
  selector: 'example3-autocomplete-cell-type',
  standalone: false,
  template: ` <div class="ht-theme-main">
    <hot-table [data]="data" [settings]="gridSettings" />
  </div>`,
})
export class Example3AutocompleteCellTypeComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'autocomplete',
        source: (_query, process) => {
          this.httpClient
            .get<{ data: any[] }>(
              'https://handsontable.com/docs/scripts/json/autocomplete.json'
            )
            .pipe(take(1))
            .subscribe((response: { data: any[] }) => {
              process(response.data);
            });
        },
        strict: true,
      },
      {}, // Year is a default text column
      {}, // Chassis color is a default text column
      {}, // Bumper color is a default text column
    ]
  };

  constructor(private readonly httpClient: HttpClient) {}
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
import { provideHttpClient } from '@angular/common/http';

/* start:skip-in-compilation */
import { Example3AutocompleteCellTypeComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
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
  declarations: [ Example3AutocompleteCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3AutocompleteCellTypeComponent ]
})

export class AppModule { }
/* end-file */
