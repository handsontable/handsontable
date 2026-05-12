/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example5',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <div class="theme-dropdown" #dropdown>
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
              @for (opt of backgroundOptions; track opt.value) {
                <li
                  role="option"
                  [attr.aria-selected]="selected === opt.value"
                  (click)="selectBackground(opt.value)"
                >{{ opt.label }}</li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
    <hot-table
      #hotTable
      [settings]="hotSettings!"
      [data]="hotData"
    >
    </hot-table>
  `,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hotTable') hotTable!: HotTableComponent;
  @ViewChild('dropdown') dropdownRef!: ElementRef;

  isOpen = false;
  selected = 'solid';
  backgroundOptions = [
    { value: 'solid', label: 'Solid' },
    { value: 'semi-transparent', label: 'Semi-transparent' },
  ];

  private clickListener = (e: MouseEvent) => {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(e.target)) {
      this.isOpen = false;
    }
  };

  private keydownListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.isOpen = false;
  };

  get selectedLabel(): string {
    return this.backgroundOptions.find((o) => o.value === this.selected)?.label || '';
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectBackground(value: string) {
    this.selected = value;
    this.isOpen = false;

    const hotInstance = this.hotTable.hotInstance;

    if (hotInstance) {
      const content = value === 'solid'
        ? 'This dialog uses a solid background (default).'
        : 'This dialog uses a semi-transparent background.';

      hotInstance.getPlugin('dialog').update({ content, background: value as 'solid' | 'semi-transparent' });
    }
  }

  readonly hotData = [
    { model: 'Trail Helmet', price: 1298.14, sellDate: '2025-08-31', sellTime: '14:12', inStock: true },
    { model: 'Windbreaker Jacket', price: 178.9, sellDate: '2025-05-10', sellTime: '22:26', inStock: false },
    { model: 'Cycling Cap', price: 288.1, sellDate: '2025-09-15', sellTime: '09:37', inStock: true },
    { model: 'HL Mountain Frame', price: 94.49, sellDate: '2025-01-17', sellTime: '14:19', inStock: false },
    { model: 'Racing Socks', price: 430.38, sellDate: '2025-05-10', sellTime: '13:42', inStock: true },
    { model: 'Racing Socks', price: 138.85, sellDate: '2025-09-20', sellTime: '14:48', inStock: true },
    { model: 'HL Mountain Frame', price: 1909.63, sellDate: '2025-09-05', sellTime: '09:35', inStock: false },
    { model: 'Carbon Handlebar', price: 1080.7, sellDate: '2025-10-24', sellTime: '22:58', inStock: false },
    { model: 'Aero Bottle', price: 1571.13, sellDate: '2025-05-24', sellTime: '00:24', inStock: true },
    { model: 'Windbreaker Jacket', price: 919.09, sellDate: '2025-07-16', sellTime: '19:11', inStock: true },
    { model: 'HL Road Tire', price: 886.22, sellDate: '2025-09-09', sellTime: '00:42', inStock: false },
    { model: 'Speed Gloves', price: 635.13, sellDate: '2025-11-17', sellTime: '12:45', inStock: true },
    { model: 'Trail Helmet', price: 1440.64, sellDate: '2025-01-03', sellTime: '20:16', inStock: false },
    { model: 'Aero Bottle', price: 944.63, sellDate: '2025-11-15', sellTime: '16:14', inStock: false },
    { model: 'Windbreaker Jacket', price: 1161.43, sellDate: '2025-06-24', sellTime: '13:19', inStock: false },
    { model: 'LED Bike Light', price: 1012.5, sellDate: '2025-05-01', sellTime: '17:30', inStock: false },
    { model: 'Windbreaker Jacket', price: 635.37, sellDate: '2025-05-14', sellTime: '09:05', inStock: true },
    { model: 'Road Tire Tube', price: 1421.27, sellDate: '2025-01-31', sellTime: '13:33', inStock: true },
    { model: 'Action Camera', price: 1019.05, sellDate: '2025-12-07', sellTime: '01:26', inStock: false },
    { model: 'Carbon Handlebar', price: 603.96, sellDate: '2025-09-13', sellTime: '04:10', inStock: false },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Model',
        type: 'text',
        data: 'model',
        width: 150,
        headerClassName: 'htLeft',
      },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        width: 80,
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'Date',
        type: 'intl-date',
        data: 'sellDate',
        width: 130,
        locale: 'en-US',
        dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
        className: 'htRight',
        headerClassName: 'htRight',

      },
      {
        title: 'Time',
        type: 'intl-time',
        data: 'sellTime',
        width: 90,
        locale: 'en-US',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'In stock',
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
        headerClassName: 'htCenter',
      },
    ],
    width: '100%',
    height: 300,
    stretchH: 'all',
    contextMenu: true,
    rowHeaders: true,
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    autoRowSize: true,
    dialog: {
      content: 'This dialog uses a solid background (default).',
      background: 'solid',
      closable: true,
    },
  };

  ngAfterViewInit() {
    const hotInstance = this.hotTable.hotInstance;

    if (hotInstance) {
      hotInstance.getPlugin('dialog').show();
    }

    document.addEventListener('click', this.clickListener);
    document.addEventListener('keydown', this.keydownListener);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.clickListener);
    document.removeEventListener('keydown', this.keydownListener);
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
