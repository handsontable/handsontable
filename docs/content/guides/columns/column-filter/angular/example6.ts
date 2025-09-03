/* file: app.component.ts */
import {Component, OnInit, ViewChild} from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-example6',
  template: `
    <div class="example-controls-container">
      <div class="controlsQuickFilter">
        <label for="columns" class="selectColumn">Select a column:
          <select [formControl]="columnControl" id="columns">
            <option *ngFor="let option of columnOptions" [value]="option.value">
              {{option.label}}
            </option>
          </select>
        </label>
      </div>
      <div class="controlsQuickFilter">
        <input id="filterField" [formControl]="fieldControl" type="text" placeholder="Filter"/>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  styles: `
    .controlsQuickFilter {
      margin: 0;
      padding: 0;
    }

    #filterField {
      margin-top: 20px;
    }
  `,
  standalone: false
})
export class AppComponent implements OnInit {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  fieldControl = new FormControl('');
  columnControl = new FormControl('0');

  columnOptions: Array<{value: string; label: string}> = [
    { value: '0', label: 'Brand' },
    { value: '1', label: 'Model' },
    { value: '2', label: 'Price' },
    { value: '3', label: 'Date' },
    { value: '4', label: 'Time' },
    { value: '5', label: 'In stock' },
  ];

  readonly hotData = [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Brand',
        type: 'text',
        data: 'brand',
      },
      {
        title: 'Model',
        type: 'text',
        data: 'model',
      },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        numericFormat: {
          pattern: '$ 0,0.00',
          culture: 'en-US',
        },
      },
      {
        title: 'Date',
        type: 'date',
        data: 'sellDate',
        className: 'htRight',
      },
      {
        title: 'Time',
        type: 'time',
        data: 'sellTime',
        correctFormat: true,
        className: 'htRight',
      },
      {
        title: 'In stock',
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
      },
    ],
    colHeaders: true,
    height: 'auto',
    filters: true,
    className: 'exampleQuickFilter',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  ngOnInit() {
    this.fieldControl.valueChanges.subscribe((fieldValue: string) => {
      const filters = this.hotTable.hotInstance!.getPlugin('filters');
      const columnValue = +this.columnControl.value!;

      filters.removeConditions(columnValue);
      filters.addCondition(columnValue, 'contains', [fieldValue]);
      filters.filter();
      this.hotTable.hotInstance!.render();
    })
  }
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule, ReactiveFormsModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
