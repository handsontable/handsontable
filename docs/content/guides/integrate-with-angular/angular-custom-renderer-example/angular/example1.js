/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';

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
    data:
      [
        ['A1', '{{$basePath}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
        ['A2', '{{$basePath}}/img/examples/javascript-the-good-parts.jpg']
      ],
    columns: [
      {},
      {
        renderer(instance, td, row, col, prop, value, cellProperties) {
          const img = document.createElement('img');

          img.src = value;

          img.addEventListener('mousedown', event => {
            event.preventDefault();
          });

          td.innerText = '';
          td.appendChild(img);

          return td;
        }
      }
    ],
    colHeaders: true,
    rowHeights: 55,
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