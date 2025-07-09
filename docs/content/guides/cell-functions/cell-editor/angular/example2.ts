/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import { TextEditor } from 'handsontable/editors';

class CustomEditor extends TextEditor {
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

@Component({
  selector: 'example2-cell-editor',
  standalone: false,
  template: ` <div>
    <hot-table [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example2CellEditorComponent {

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    startRows: 5,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    colWidths: 200,
    columns: [
      {
        editor: CustomEditor,
      },
    ]
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
import { Example2CellEditorComponent } from './app.component';
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
  declarations: [ Example2CellEditorComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2CellEditorComponent ]
})

export class AppModule { }
/* end-file */
