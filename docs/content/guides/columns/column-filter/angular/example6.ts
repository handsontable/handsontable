/* file: app.component.ts */
import { Component, OnInit, ViewChild } from "@angular/core";
import { GridSettings, HotTableComponent, HotTableModule } from "@handsontable/angular-wrapper";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [HotTableModule, ReactiveFormsModule],
  selector: "app-example6",
  template: `
    <div class="example-controls-container">
      <div class="controlsQuickFilter">
        <label for="columns" class="selectColumn"
          >Select a column:
          <select [formControl]="columnControl" id="columns">
            @for (option of columnOptions; track option.value) {
            <option [value]="option.value">
              {{ option.label }}
            </option>
            }
          </select>
        </label>
      </div>
      <div class="controlsQuickFilter">
        <input id="filterField" [formControl]="fieldControl" type="text" placeholder="Filter" />
      </div>
    </div>

    <hot-table [settings]="hotSettings!" [data]="hotData"> </hot-table>
  `,
  styles: `
    .controlsQuickFilter {
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
      margin-top: 20px;
    }
  `,
})
export class AppComponent implements OnInit {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  fieldControl = new FormControl("");
  columnControl = new FormControl("0");

  columnOptions: Array<{ value: string; label: string }> = [
    { value: "0", label: "Brand" },
    { value: "1", label: "Model" },
    { value: "2", label: "Price" },
    { value: "3", label: "Date" },
    { value: "4", label: "Time" },
    { value: "5", label: "In stock" },
  ];

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
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
      {
        title: "Date",
        type: 'intl-date',
        data: "sellDate",
        locale: 'en-GB',
        dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
        className: "htRight",
      },
      {
        title: "Time",
        type: 'intl-time',
        data: "sellTime",
        locale: 'en-GB',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
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

  ngOnInit() {
    this.fieldControl.valueChanges.subscribe((fieldValue) => {
      const filters = this.hotTable.hotInstance!.getPlugin("filters");
      const columnValue = +this.columnControl.value!;

      filters.removeConditions(columnValue);
      filters.addCondition(columnValue, "contains", [fieldValue ?? '']);
      filters.filter();
      this.hotTable.hotInstance!.render();
    });
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
