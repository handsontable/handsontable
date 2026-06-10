/* file: app.component.ts */
import { Component, HostListener, ViewChild, ViewEncapsulation } from "@angular/core";
import { GridSettings, HotTableComponent, HotTableModule } from "@handsontable/angular-wrapper";

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: "app-example6",
  encapsulation: ViewEncapsulation.None,
  styles: `
    .controlsQuickFilter {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
    }

    .selectColumn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #555555;
      white-space: nowrap;
    }

    .selectColumn select {
      border: 1px solid #e0e0e0;
      background: none;
      color: #333333;
      font-size: 0.875rem;
      padding: 0.4rem 0.625rem;
      outline: none;
      border-radius: 0;
      cursor: pointer;
    }

    .selectColumn select:focus {
      border-color: #1A42E8;
    }

    #filterField {
      border: 1px solid var(--sl-color-gray-5, #e0e0e0);
      background: none;
      color: var(--sl-color-text, #333333);
      font-size: var(--sl-text-sm, 0.875rem);
      padding: 0.4rem 0.625rem;
      outline: none;
      width: 140px;
    }

    #filterField::placeholder {
      color: var(--sl-color-gray-3, #777777);
    }

    #filterField:focus {
      border-color: var(--sl-color-accent, #1A42E8);
    }

    #filterField:focus-visible {
      border-color: var(--sl-color-accent, #1A42E8);
      box-shadow: 0 0 0 1px var(--sl-color-accent, #1A42E8);
    }

    .filter-dropdown {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-dropdown-label {
      color: var(--sl-color-gray-2, #555555);
      font-size: var(--sl-text-sm, 0.875rem);
      white-space: nowrap;
    }

    .filter-dropdown-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: 1px solid var(--sl-color-gray-5, #e0e0e0);
      color: var(--sl-color-gray-2, #555555);
      cursor: pointer;
      font-size: var(--sl-text-sm, 0.875rem);
      font-weight: 500;
      padding: 0.4rem 0.625rem;
      transition: color 0.15s, background-color 0.15s;
      white-space: nowrap;
      border-radius: 0;
    }

    .filter-dropdown-trigger:hover {
      color: var(--sl-color-white, #333333);
      background: var(--sl-color-gray-7, var(--sl-color-gray-6, #eeeeee));
    }

    .filter-dropdown-chevron {
      flex-shrink: 0;
      margin-inline-start: 0.15rem;
      transition: transform 0.15s;
    }

    .filter-dropdown-trigger[aria-expanded='true'] .filter-dropdown-chevron {
      transform: rotate(180deg);
    }

    .filter-dropdown-menu {
      background: var(--sl-color-bg-nav, #ffffff);
      border: 1px solid var(--sl-color-gray-5, #e0e0e0);
      border-radius: 0;
      box-shadow: none;
      inset-inline-start: 0;
      list-style: none;
      margin: 0;
      min-width: 100%;
      overflow-y: auto;
      padding: 0;
      position: absolute;
      top: 100%;
      z-index: 9999;
    }

    .filter-dropdown-menu li {
      align-items: center;
      color: var(--sl-color-text, #333333);
      display: flex;
      font-size: var(--sl-text-sm, 0.875rem);
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid var(--sl-color-gray-5, #e0e0e0);
      transition: background 0.1s, color 0.1s;
      white-space: nowrap;
      list-style: none;
      margin: 0;
    }

    .filter-dropdown-menu li:last-child {
      border-bottom: none;
    }

    .filter-dropdown-menu li:hover,
    .filter-dropdown-menu li:focus-visible {
      background: var(--sl-color-gray-6, #eeeeee);
      color: var(--sl-color-white, #333333);
      outline: none;
    }

    .filter-dropdown-menu li[aria-selected='true'] {
      color: var(--sl-color-white, #333333);
      box-shadow: inset 0 0 0 1px var(--sl-color-accent, #1A42E8);
    }
  `,
  template: `
    <div class="example-controls-container">
      <div class="controlsQuickFilter">
        <div class="filter-dropdown" (click)="$event.stopPropagation()">
          <label class="filter-dropdown-label">Select a column:</label>
          <button
            class="filter-dropdown-trigger"
            type="button"
            aria-haspopup="listbox"
            [attr.aria-expanded]="isOpen ? 'true' : 'false'"
            (click)="toggleDropdown()"
          >
            <span class="filter-dropdown-text">{{ selectedLabel }}</span>
            <svg class="filter-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6l6 -6"/>
            </svg>
          </button>
          @if (isOpen) {
            <ul class="filter-dropdown-menu" role="listbox">
              @for (option of columnOptions; track option.value) {
                <li
                  role="option"
                  [attr.aria-selected]="option.value === selectedColumn.toString() ? 'true' : 'false'"
                  (click)="selectColumn(option)"
                >
                  {{ option.label }}
                </li>
              }
            </ul>
          }
        </div>
        <input id="filterField" type="text" placeholder="Filter" (keyup)="handleFilter($event)" />
      </div>
    </div>

    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  isOpen = false;
  selectedColumn = 0;

  readonly columnOptions: Array<{ value: string; label: string }> = [
    { value: "0", label: "Brand" },
    { value: "1", label: "Model" },
    { value: "2", label: "Price" },
    { value: "3", label: "Date" },
    { value: "4", label: "Time" },
    { value: "5", label: "In stock" },
  ];

  get selectedLabel(): string {
    return this.columnOptions.find((o) => o.value === this.selectedColumn.toString())?.label ?? "Brand";
  }

  @HostListener("document:click")
  closeDropdown() {
    this.isOpen = false;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectColumn(option: { value: string; label: string }) {
    this.selectedColumn = Number(option.value);
    this.isOpen = false;
  }

  handleFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const filters = this.hotTable.hotInstance!.getPlugin("filters");

    filters.removeConditions(this.selectedColumn);
    filters.addCondition(this.selectedColumn, "contains", [value]);
    filters.filter();
    this.hotTable.hotInstance!.render();
  }

  readonly hotData = [
    {
      brand: "Jetpulse",
      model: "Racing Socks",
      price: 30,
      sellDate: "2023-10-11",
      sellTime: "01:23",
      inStock: false,
    },
    {
      brand: "Gigabox",
      model: "HL Mountain Frame",
      price: 1890.9,
      sellDate: "2023-05-03",
      sellTime: "11:27",
      inStock: false,
    },
    {
      brand: "Camido",
      model: "Cycling Cap",
      price: 130.1,
      sellDate: "2023-03-27",
      sellTime: "03:17",
      inStock: true,
    },
    {
      brand: "Chatterpoint",
      model: "Road Tire Tube",
      price: 59,
      sellDate: "2023-08-28",
      sellTime: "08:01",
      inStock: true,
    },
    {
      brand: "Eidel",
      model: "HL Road Tire",
      price: 279.99,
      sellDate: "2023-10-02",
      sellTime: "13:23",
      inStock: true,
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: "Brand",
        type: "text",
        data: "brand",
      },
      {
        title: "Model",
        type: "text",
        data: "model",
      },
      {
        title: "Price",
        type: "numeric",
        data: "price",
        locale: "en-US",
        numericFormat: {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        },
      },
      {
        title: "Date",
        type: "intl-date",
        data: "sellDate",
        locale: "en-GB",
        dateFormat: { day: "2-digit", month: "2-digit", year: "numeric" },
        className: "htRight",
      },
      {
        title: "Time",
        type: "intl-time",
        data: "sellTime",
        locale: "en-GB",
        timeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
        className: "htRight",
      },
      {
        title: "In stock",
        type: "checkbox",
        data: "inStock",
        className: "htCenter",
      },
    ],
    colHeaders: true,
    height: "auto",
    filters: true,
    className: "exampleQuickFilter",
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
