/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation, HostListener, ElementRef, inject} from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-selection',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
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
              @for (opt of options; track opt.value) {
                <li
                  role="option"
                  [attr.aria-selected]="selected === opt.value"
                  (click)="selectOption(opt.value)"
                >
                  {{ opt.label }}
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  isOpen = false;
  selected = 'multiple';

  readonly options = [
    { value: 'single', label: 'Single selection' },
    { value: 'range', label: 'Range selection' },
    { value: 'multiple', label: 'Multiple ranges selection' },
  ];

  readonly data = [
    ['Ana García',     'Engineering', 'Senior Engineer',   95000, 'Madrid',      'Spain',   'F', 12, '2026-03-14'],
    ['James Okafor',   'Marketing',   'Product Manager',   88000, 'Lagos',       'Nigeria', 'M',  8, '2026-07-01'],
    ['Li Wei',         'Engineering', 'Frontend Dev',      82000, 'Shanghai',    'China',   'M',  5, '2026-01-10'],
    ['Maria Santos',   'HR',          'HR Specialist',     71000, 'Lisbon',      'Portugal','F',  3, '2026-11-20'],
    ['David Kim',      'Engineering', 'Backend Dev',       85000, 'Seoul',       'Korea',   'M',  7, '2026-08-05'],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',       68000, 'London',      'UK',      'F',  2, '2026-02-14'],
    ['Ahmed Hassan',   'Finance',     'Controller',        92000, 'Cairo',       'Egypt',   'M', 10, '2026-06-30'],
    ['Sara Johansson', 'Engineering', 'QA Engineer',       78000, 'Stockholm',   'Sweden',  'F',  6, '2026-09-12'],
    ['Carlos Mendez',  'Sales',       'Account Manager',   74000, 'Mexico City', 'Mexico',  'M',  4, '2026-04-25'],
  ];

  readonly gridSettings: GridSettings = {
    width: 'auto',
    height: 'auto',
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    selectionMode: 'multiple', // 'single', 'range' or 'multiple',
    autoWrapRow: true,
    autoWrapCol: true
  };

  get selectedLabel(): string {
    return this.options.find((o) => o.value === this.selected)?.label || '';
  }

  private elementRef = inject(ElementRef);

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(value: string): void {
    this.selected = value;
    this.isOpen = false;
    type selection = 'multiple' | 'single' | 'range' | undefined;

    this.hotTable?.hotInstance?.updateSettings({ selectionMode: value as selection });
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
