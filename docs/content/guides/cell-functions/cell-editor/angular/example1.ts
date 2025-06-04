/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotCellEditorComponent } from '@handsontable/angular-wrapper';

@Component({
  standalone: false,
  template: `<button (click)="toUpperCase()">Upper</button>
  <button (click)="toLowerCase()">Lower</button>`,
})
export class EditorComponent extends HotCellEditorComponent<string> {
  override onFocus(): void {}

  toUpperCase(): void {
    this.setValue(this.getValue().toUpperCase());
    this.finishEdit.emit();
  }

  toLowerCase(): void {
    this.setValue(this.getValue().toLowerCase());
    this.finishEdit.emit();
  }
}

@Component({
  selector: 'example1-cell-editor',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1CellEditorComponent {

  readonly data = [
    ['Obrien Fischer'],
    ['Alexandria Gordon'],
    ['John Stafford'],
    ['Regina Waters'],
    ['Kay Bentley'],
    ['Emerson Drake'],
    ['Dean Stapleton'],
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        width: 250,
        editor: EditorComponent,
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
import { Example1CellEditorComponent, EditorComponent } from './app.component';
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
  declarations: [ Example1CellEditorComponent, EditorComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1CellEditorComponent ]
})

export class AppModule { }
/* end-file */
