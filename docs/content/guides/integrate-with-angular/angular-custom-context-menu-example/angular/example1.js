/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
import { ContextMenu } from 'handsontable/plugins/contextMenu';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <hot-table [settings]="hotSettings"></hot-table>
    </div>
  `,
})

export class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data: [
      ['A1', 'B1', 'C1', 'D1', 'E1'],
      ['A2', 'B2', 'C2', 'D2', 'E2'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
    ],
    colHeaders: true,
    contextMenu: {
      items: {
        'row_above': {
          name: 'Insert row above this one (custom name)'
        },
        'row_below': {},
        'separator': ContextMenu.SEPARATOR,
        'clear_custom': {
          name: 'Clear all cells (custom)',
          callback: function() {
            this.clear();
          }
        }
      }
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation'
  };
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