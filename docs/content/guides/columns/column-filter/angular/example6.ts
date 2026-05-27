/* file: app.component.ts */
import { Component, HostListener, ViewChild } from "@angular/core";
import { GridSettings, HotTableComponent, HotTableModule } from "@handsontable/angular-wrapper";

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: "app-example6",
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
