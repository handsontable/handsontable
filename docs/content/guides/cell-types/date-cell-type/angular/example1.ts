/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

interface CarData {
  car: string;
  product_date: string;
  payment_date: string;
  registration_date: string;
}

@Component({
  selector: 'example1-date-cell-type',
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
            <option value="nb-NO">Norwegian Bokmål (Norway)</option>
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
export class Example1DateCellTypeComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  locale = 'en-US';

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

  updateLocale(event: Event): void {
    this.locale = (event.target as HTMLSelectElement).value;
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
import { Example1DateCellTypeComponent } from './app.component';
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
  declarations: [ Example1DateCellTypeComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1DateCellTypeComponent ]
})

export class AppModule { }
/* end-file */
