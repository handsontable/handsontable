/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation, HostListener, ElementRef, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

interface ShiftData {
  shift: string;
  start: string;
  breakStart: string;
  end: string;
}

@Component({
  selector: 'example1-time-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <div class="theme-dropdown" #dropdownRef>
          <button
            class="theme-dropdown-trigger"
            type="button"
            aria-haspopup="listbox"
            [attr.aria-expanded]="isOpen"
            (click)="toggleDropdown()"
          >
            <span>{{ selectedLabel }}</span>
            <svg class="theme-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>
          </button>
          @if (isOpen) {
            <ul class="theme-dropdown-menu" role="listbox">
              @for (opt of localeOptions; track opt.value) {
                <li
                  role="option"
                  [attr.aria-selected]="locale === opt.value"
                  (click)="selectLocale(opt.value)"
                >{{ opt.label }}</li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  isOpen = false;
  locale = 'en-US';

  readonly localeOptions = [
    { value: 'ar-AR', label: 'Arabic (Global)' },
    { value: 'cs-CZ', label: 'Czech (Czechia)' },
    { value: 'de-CH', label: 'German (Switzerland)' },
    { value: 'de-DE', label: 'German (Germany)' },
    { value: 'en-US', label: 'English (United States)' },
    { value: 'es-MX', label: 'Spanish (Mexico)' },
    { value: 'fa-IR', label: 'Persian (Iran)' },
    { value: 'fr-FR', label: 'French (France)' },
    { value: 'hr-HR', label: 'Croatian (Croatia)' },
    { value: 'it-IT', label: 'Italian (Italy)' },
    { value: 'ja-JP', label: 'Japanese (Japan)' },
    { value: 'ko-KR', label: 'Korean (Korea)' },
    { value: 'lv-LV', label: 'Latvian (Latvia)' },
    { value: 'nb-NO', label: 'Norwegian Bokmal (Norway)' },
    { value: 'nl-NL', label: 'Dutch (Netherlands)' },
    { value: 'pl-PL', label: 'Polish (Poland)' },
    { value: 'pt-BR', label: 'Portuguese (Brazil)' },
    { value: 'ru-RU', label: 'Russian (Russia)' },
    { value: 'sr-SP', label: 'Serbian Latin (Serbia)' },
    { value: 'zh-CN', label: 'Chinese (Simplified, China)' },
    { value: 'zh-TW', label: 'Chinese (Traditional, Taiwan)' },
  ];

  readonly data: ShiftData[] = [
    { shift: 'Morning', start: '09:00', breakStart: '12:00', end: '17:00' },
    { shift: 'Afternoon', start: '13:30', breakStart: '16:00', end: '21:00' },
    { shift: 'Night', start: '22:00', breakStart: '01:00', end: '06:00' },
    { shift: 'Split', start: '08:00', breakStart: '12:30', end: '20:00' },
    { shift: 'Short day', start: '10:00', breakStart: '13:00', end: '15:00' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Shift', 'Start', 'Break start', 'End'],
    locale: this.locale,
    columns: [
      {
        type: 'text',
        data: 'shift',
      },
      {
        type: 'intl-time',
        data: 'start',
        timeFormat: {
          timeStyle: 'short',
        },
      },
      {
        type: 'intl-time',
        data: 'breakStart',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        },
      },
      {
        type: 'intl-time',
        data: 'end',
        timeFormat: {
          hour: 'numeric',
          hourCycle: 'h12',
          dayPeriod: 'short',
        },
      },
    ],
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  get selectedLabel(): string {
    return this.localeOptions.find((o) => o.value === this.locale)?.label || '';
  }

  private elementRef = inject(ElementRef);

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLocale(value: string): void {
    this.locale = value;
    this.isOpen = false;
    this.hotTable?.hotInstance?.updateSettings({ locale: this.locale });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.theme-dropdown')?.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen = false;
    }
  }
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
