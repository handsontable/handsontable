/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotCellEditorComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [],
  template: `<button (click)="toUpperCase()">Upper</button>
  <button (click)="toLowerCase()">Lower</button>`,
})
export class EditorComponent extends HotCellEditorComponent<string> {
  override onFocus(): void {}

  toUpperCase(): void {
    this.setValue((this.getValue() ?? '').toUpperCase());
    this.finishEdit.emit();
  }

  toLowerCase(): void {
    this.setValue((this.getValue() ?? '').toLowerCase());
    this.finishEdit.emit();
  }
}

@Component({
  selector: 'example1-cell-editor',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

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



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
