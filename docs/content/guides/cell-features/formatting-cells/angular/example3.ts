/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import { registerRenderer, textRenderer } from 'handsontable/renderers';

registerRenderer('customStylesRenderer', (hotInstance, TD, ...rest) => {
  textRenderer(hotInstance, TD, ...rest);

  TD.style.fontWeight = 'bold';
  TD.style.color = 'green';
  TD.style.background = '#d7f1e1';
});

@Component({
  selector: 'example3-formatting-cells',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example3FormattingCellsComponent {

  readonly data = [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    stretchH: 'all',
    customBorders: [
      {
        range: {
          from: {
            row: 1,
            col: 1,
          },
          to: {
            row: 3,
            col: 4,
          },
        },
        top: {
          width: 2,
          color: '#5292F7',
          style: 'dotted',
        },
        bottom: {
          width: 2,
          color: 'red',
        },
        start: {
          width: 2,
          color: 'orange',
          style: 'dashed',
        },
        end: {
          width: 2,
          color: 'magenta',
        },
      },
      {
        row: 2,
        col: 2,
        start: {
          width: 2,
          color: 'red',
        },
        end: {
          width: 1,
          color: 'green',
        },
      },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
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
import { Example3FormattingCellsComponent } from './app.component';
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
  declarations: [ Example3FormattingCellsComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3FormattingCellsComponent ]
})

export class AppModule { }
/* end-file */
