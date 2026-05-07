/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation, HostListener, ElementRef, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

interface CarData {
  car: string;
  year: number;
  price_usd: number;
  price_eur: number;
  distance_km: number;
  fuel_liters: number;
  discount_percent: number;
  quantity: number;
}

@Component({
  selector: 'example1-numeric-cell-type',
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
      year: 2017,
      price_usd: 7000,
      price_eur: 7000,
      distance_km: 125000,
      fuel_liters: 45.5,
      discount_percent: 0.15,
      quantity: 1250
    },
    {
      car: 'Citroen C4 Coupe',
      year: 2018,
      price_usd: 8330,
      price_eur: 8330,
      distance_km: 98000,
      fuel_liters: 52.3,
      discount_percent: 0.08,
      quantity: 2100
    },
    {
      car: 'Audi A4 Avant',
      year: 2019,
      price_usd: 33900,
      price_eur: 33900,
      distance_km: 45000,
      fuel_liters: 60.0,
      discount_percent: 0.05,
      quantity: 850
    },
    {
      car: 'Opel Astra',
      year: 2020,
      price_usd: 5000,
      price_eur: 5000,
      distance_km: 156000,
      fuel_liters: 48.7,
      discount_percent: 0.12,
      quantity: 3200
    },
    {
      car: 'BMW 320i Coupe',
      year: 2021,
      price_usd: 30500,
      price_eur: 30500,
      distance_km: 32000,
      fuel_liters: 55.2,
      discount_percent: 0.03,
      quantity: 1500
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Car', 'Year', 'Price (USD)', 'Price (EUR)', 'Distance', 'Fuel', 'Discount', 'Quantity'],
    locale: this.locale,
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        data: 'car',
        type: 'text',
      },
      {
        data: 'year',
        type: 'numeric',
      },
      {
        data: 'price_usd',
        type: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
      {
        data: 'price_eur',
        type: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
        },
      },
      {
        data: 'distance_km',
        type: 'numeric',
        numericFormat: {
          style: 'unit',
          unit: 'kilometer',
          useGrouping: true,
        },
      },
      {
        data: 'fuel_liters',
        type: 'numeric',
        numericFormat: {
          style: 'unit',
          unit: 'liter',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        },
      },
      {
        data: 'discount_percent',
        type: 'numeric',
        numericFormat: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
      },
      {
        data: 'quantity',
        type: 'numeric',
        numericFormat: {
          style: 'decimal',
          useGrouping: true,
          minimumFractionDigits: 0,
        },
      },
    ]
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
