/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
/* start:skip-in-compilation */
import { CustomEditor } from './CustomEditor';
/* end:skip-in-compilation */

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
    startRows: 5,
    columns: [
      {
        editor: CustomEditor
      }
    ],
    colHeaders: true,
    colWidths: 200,
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
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

/* file: CustomEditor.ts */
import { TextEditor } from 'handsontable/editors/textEditor';

export class CustomEditor extends TextEditor {
  override createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', 'true');
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}
/* end-file */
