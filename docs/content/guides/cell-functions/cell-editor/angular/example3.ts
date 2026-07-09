/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { TextEditor } from 'handsontable/editors';
import Handsontable from 'handsontable/base';

class PasswordEditor extends TextEditor {
  override createElements(): void {
    super.createElements();

    this.TEXTAREA = this.hot.rootDocument.createElement('input') as HTMLInputElement;
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', 'true');
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

function maskedRenderer(
  _instance: Handsontable.Core,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: Handsontable.CellValue
): HTMLTableCellElement {
  td.innerText = value ? '●●●●●●●●' : '—';
  td.style.letterSpacing = value ? '2px' : 'normal';

  return td;
}

@Component({
  selector: 'example3-cell-editor',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly gridSettings: GridSettings = {
    data: [
      ['Alice Chen', 'alice@example.com', 'Admin', 'Wh1stl3!2024'],
      ['Bob Garcia', 'bob@example.com', 'Editor', 'P@ssw0rd42'],
      ['Carol Smith', 'carol@example.com', 'Viewer', 'Tr0ub4dor&3'],
      ['Dave Kim', 'dave@example.com', 'Editor', 'c0rrectH0rs3'],
      ['Eve Johnson', 'eve@example.com', 'Admin', 'Sup3rS3cr3t!'],
    ],
    colHeaders: ['Name', 'Email', 'Role', 'Password'],
    columns: [
      { type: 'text' },
      { type: 'text' },
      { type: 'text' },
      { editor: PasswordEditor as typeof TextEditor, renderer: maskedRenderer },
    ],
    colWidths: [130, 190, 70, 130],
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
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
