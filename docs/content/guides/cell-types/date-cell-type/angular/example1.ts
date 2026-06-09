/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation, HostListener, ElementRef, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

interface CarData {
  car: string;
  product_date: string;
  payment_date: string;
  registration_date: string;
}

@Component({
  selector: 'example1-date-cell-type',
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

  readonly data: CarData[] = [
    {
      car: 'Mercedes A 160',
      product_date: '2002-06-15',
      payment_date: '2002-05-20',
      registration_date: '2002-07-01',
    },
    {
      car: 'Citroën C4 Coupe',
      product_date: '2007-03-22',
      payment_date: '2007-02-28',
      registration_date: '2007-04-10',
    },
    {
      car: 'Audi A4 Avant',
      product_date: '2011-09-08',
      payment_date: '2011-08-15',
      registration_date: '2011-09-20',
    },
    {
      car: 'Opel Astra',
      product_date: '2012-01-30',
      payment_date: '2012-01-10',
      registration_date: '2012-02-14',
    },
    {
      car: 'BMW 320i Coupe',
      product_date: '2004-11-12',
      payment_date: '2004-10-20',
      registration_date: '2004-12-01',
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car', 'Product date', 'Payment date', 'Registration date'],
    locale: this.locale,
    columns: [
      {
        type: 'text',
        data: 'car',
      },
      {
        type: 'intl-date',
        data: 'product_date',
        dateFormat: { dateStyle: 'short' },
      },
      {
        type: 'intl-date',
        data: 'payment_date',
        dateFormat: {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        },
      },
      {
        type: 'intl-date',
        data: 'registration_date',
        dateFormat: {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
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
