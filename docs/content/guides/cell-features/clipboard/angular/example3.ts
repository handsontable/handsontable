/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-clipboard',
  standalone: false,
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button
          id="copy"
          (mousedown)="copyBtnMousedown()"
          (click)="copyBtnClick()"
        >
          Select and copy cell B2
        </button>&nbsp;
        <button id="cut" (mousedown)="cutBtnMousedown()" (click)="cutBtnClick()">
          Select and cut cell B2
        </button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`
  ,
  encapsulation: ViewEncapsulation.None
})
export class Example3ClipboardComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ];

  readonly gridSettings:GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    outsideClickDeselects: false,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  copyBtnClick(): void {
    document.execCommand('copy');
  }

  cutBtnClick(): void {
    document.execCommand('cut');
  }

  copyBtnMousedown(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.selectCell(1, 1);
  }

  cutBtnMousedown(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.selectCell(1, 1);
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
import { Example3ClipboardComponent } from './app.component';
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
  declarations: [ Example3ClipboardComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3ClipboardComponent ]
})

export class AppModule { }
/* end-file */
