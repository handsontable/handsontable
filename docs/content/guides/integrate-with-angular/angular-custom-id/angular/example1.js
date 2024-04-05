/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <hot-table
        [settings]="hotSettings"
        [hotId]="id">
      </hot-table>
    </div>
  `,
})
export class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    startRows: 5,
    startCols: 5,
    colHeaders: true,
    stretchH: 'all',
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation'
  };
  id = 'my-custom-id';
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
  imports: [ BrowserModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */