/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example-grid-size',
  standalone: false,
  template: `<div class="controls">
      <button
        id="triggerBtn"
        class="button button--primary"
        (click)="btnClick()"
      >
        {{ isContainerExpanded ? 'Collapse container' : 'Expand container' }}
      </button>
    </div>
    <div class="table-container" [style.height.px]="currentHeight">
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class ExampleGridSizeComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  // generate an array of arrays with dummy data
  readonly data = new Array(100) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(50) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  isContainerExpanded = false;
  currentHeight = 157;

  readonly gridSettings: GridSettings ={
    rowHeaders: true,
    colHeaders: true,
    width: '100%',
    height: '100%',
    colWidths: 100,
    autoWrapRow: true,
    autoWrapCol: true
  };

  btnClick(): void {
    this.isContainerExpanded = !this.isContainerExpanded;
    this.currentHeight = this.isContainerExpanded ? 410 : 157;

    this.hotTable?.hotInstance?.refreshDimensions();
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
import { ExampleGridSizeComponent } from './app.component';
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
  declarations: [ ExampleGridSizeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ ExampleGridSizeComponent ]
})

export class AppModule { }
/* end-file */
