/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

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
  standalone: false,
  styles: [`
    .example-controls-container .controls {
      padding-top: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .example-controls-container .controls label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .example-controls-container .controls select {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }

    .example-controls-container .controls select:hover {
      border-color: #999;
    }

    .example-controls-container .controls select:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    }
  `],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <label>
          Select locale:
          <select [value]="locale" (change)="updateLocale($event)">
            <option value="ar-AR">Arabic (Global)</option>
            <option value="cs-CZ">Czech (Czechia)</option>
            <option value="de-CH">German (Switzerland)</option>
            <option value="de-DE">German (Germany)</option>
            <option value="en-US">English (United States)</option>
            <option value="es-MX">Spanish (Mexico)</option>
            <option value="fa-IR">Persian (Iran)</option>
            <option value="fr-FR">French (France)</option>
            <option value="hr-HR">Croatian (Croatia)</option>
            <option value="it-IT">Italian (Italy)</option>
            <option value="ja-JP">Japanese (Japan)</option>
            <option value="ko-KR">Korean (Korea)</option>
            <option value="lv-LV">Latvian (Latvia)</option>
            <option value="nb-NO">Norwegian Bokmal (Norway)</option>
            <option value="nl-NL">Dutch (Netherlands)</option>
            <option value="pl-PL">Polish (Poland)</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="ru-RU">Russian (Russia)</option>
            <option value="sr-SP">Serbian Latin (Serbia)</option>
            <option value="zh-CN">Chinese (Simplified, China)</option>
            <option value="zh-TW">Chinese (Traditional, Taiwan)</option>
          </select>
        </label>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class Example1NumericCellTypeComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  locale = 'en-US';

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

  updateLocale(event: any): void {
    this.locale = event.target.value;
    this.hotTable?.hotInstance?.updateSettings({ locale: this.locale });
  }
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1NumericCellTypeComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example1NumericCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1NumericCellTypeComponent ]
})

export class AppModule { }
/* end-file */
