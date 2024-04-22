/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
import { HotTableRegisterer } from '@handsontable/angular';

@Component({
  selector: 'app-root',
  template: `
    <div class="controls">
      <button (click)="swapHotData()" class="controls">Load new data</button>
    </div>
    <div>
      <hot-table [hotId]="id" [settings]="hotSettings"></hot-table>
    </div>
  `,
})

export class AppComponent {
  private hotRegisterer = new HotTableRegisterer();
  id = 'hotInstance';
  hotSettings: Handsontable.GridSettings = {
    data: [
      ['A1', 'B1', 'C1', 'D1'],
      ['A2', 'B2', 'C2', 'D2'],
      ['A3', 'B3', 'C3', 'D3'],
      ['A4', 'B4', 'C4', 'D4'],
    ],
    colHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation'
  };

  swapHotData() {
    this.hotRegisterer.getInstance(this.id).loadData([['new', 'data']]);
  }
}
/* end-file */

/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [ BrowserModule, HotTableModule.forRoot() ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */