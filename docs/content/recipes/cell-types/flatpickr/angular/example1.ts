/* file: app.component.ts */
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import {
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  GridSettings,
  HotTableModule
} from '@handsontable/angular-wrapper';
import { format, isDate, isValid, parseISO } from 'date-fns';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

const DATE_FORMAT_US = 'MM/dd/yyyy';
const DATE_FORMAT_EU = 'dd/MM/yyyy';

@Component({
  standalone: true,
  selector: 'example1-flatpickr-editor',
  template: `<input #pickerInput class="flatpickr-editor" type="text" />`,
  styles: [
    `
    :host {
      width: 100%;
      height: 100%;
    }
    .flatpickr-editor {
      width: 100%;
      height: 100%;
      border: none;
      box-sizing: border-box !important;
      padding: 4px 8px;
    }
  `,
  ],
})
export class FlatpickrEditorComponent extends HotCellEditorAdvancedComponent<string> {
  @ViewChild('pickerInput', { static: true }) pickerInput!: ElementRef<HTMLInputElement>;
  private fpInstance: ReturnType<typeof flatpickr> | null = null;

  override afterOpen(): void {
    this.fpInstance = flatpickr(this.pickerInput.nativeElement, {
      dateFormat: 'Y-m-d',
      disableMobile: true,
      defaultDate: this.value || undefined,
      onClose: () => {
        this.finishEdit.emit();
      },
    });
    (this.fpInstance as any).open?.();
  }

  override afterClose(): void {
    (this.fpInstance as any)?.destroy?.();
    this.fpInstance = null;
  }

  override onFocus(): void {
    this.pickerInput.nativeElement.focus();
  }
}

@Component({
  standalone: true,
  selector: 'example1-flatpickr-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ formattedDate }}</span>`,
})
export class FlatpickrRendererComponent extends HotCellRendererAdvancedComponent<
  string,
  { renderFormat: string }
> {
  get formattedDate(): string {
    if (!this.value) return '';

    try {
      const d = parseISO(this.value);

      return isDate(d) && isValid(d)
        ? format(d, this.getProps().renderFormat || 'MM/dd/yyyy')
        : this.value;
    } catch {
      return this.value;
    }
  }
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-flatpickr',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = [
    { product: 'Dashboard Pro', version: '3.2.0', releaseDate: '2025-03-15', status: 'Released' },
    { product: 'Form Builder', version: '2.1.0', releaseDate: '2025-04-22', status: 'Released' },
    { product: 'Chart Engine', version: '4.0.0', releaseDate: '2025-06-10', status: 'Beta' },
    { product: 'Auth Module', version: '1.5.2', releaseDate: '2025-07-01', status: 'Released' },
    { product: 'File Manager', version: '2.0.0', releaseDate: '2025-08-18', status: 'Planned' },
    { product: 'Email Service', version: '3.1.0', releaseDate: '2025-09-05', status: 'Released' },
    { product: 'Search Index', version: '1.2.0', releaseDate: '2025-10-12', status: 'Beta' },
    { product: 'Cache Layer', version: '2.3.1', releaseDate: '2025-11-28', status: 'Planned' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Product', 'Version', 'Release (EU)', 'Release (US)', 'Status'],
    autoRowSize: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
    headerClassName: 'htLeft',
    columns: [
      { data: 'product', type: 'text', width: 200 },
      { data: 'version', type: 'text', width: 80 },
      {
        data: 'releaseDate',
        width: 130,
        allowInvalid: false,
        editor: FlatpickrEditorComponent,
        renderer: FlatpickrRendererComponent,
        rendererProps: {
          renderFormat: DATE_FORMAT_EU,
        },
      } as any,
      {
        data: 'releaseDate',
        width: 130,
        allowInvalid: false,
        editor: FlatpickrEditorComponent,
        renderer: FlatpickrRendererComponent,
        rendererProps: {
          renderFormat: DATE_FORMAT_US,
        },
      } as any,
      { data: 'status', type: 'text', width: 130 },
    ],
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
