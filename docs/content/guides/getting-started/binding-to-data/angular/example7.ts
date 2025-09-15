/* file: app.component.ts */
import { Component, Type } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

interface Person {
  id: number | undefined;
  name: string | undefined;
  address: string | undefined;
  attr: (attr: string, val?: Handsontable.CellValue) => keyof Person | Person;
}

interface ModelOptions {
  [x: string]: any;
  id?: number;
  name?: string;
  address?: string;
  hasOwnProperty?: (prop: string) => boolean;
}

type PrivPerson = {
  [K in keyof Person]: Person[K];
} & { [key: string]: any };

function model(opts: ModelOptions): Partial<Person> {
  const _pub: Partial<Person> = {
    id: undefined,
    name: undefined,
    address: undefined,
    attr: undefined,
  };

  const _priv: Partial<PrivPerson> = {};

  for (const i in opts) {
    if (opts.hasOwnProperty && opts.hasOwnProperty(i)) {
      _priv[i] = opts[i];
    }
  }

  _pub.attr = function (
    attr: keyof Person | string,
    val?: Handsontable.CellValue
  ) {
    if (typeof val === 'undefined') {
      window.console && console.log('GET the', attr, 'value of', _pub);

      return _priv[attr];
    }

    window.console && console.log('SET the', attr, 'value of', _pub);
    _priv[attr] = val;

    return _pub;
  };

  return _pub;
}

function property(attr: keyof Person | string) {
  return (row: Handsontable.RowObject, value?: Handsontable.CellValue) =>
    (row as Person).attr(attr, value);
}

@Component({
  selector: 'example7-binding-data',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example7BindingDataComponent {

  readonly data = [
    model({ id: 1, name: 'Ted Right', address: '' }),
    model({ id: 2, name: 'Frank Honest', address: '' }),
    model({ id: 3, name: 'Joan Well', address: '' }),
    model({ id: 4, name: 'Gail Polite', address: '' }),
    model({ id: 5, name: 'Michael Fair', address: '' }),
  ];

  readonly gridSettings: GridSettings = {
    dataSchema: model,
    height: 'auto',
    width: 'auto',
    colHeaders: ['ID', 'Name', 'Address'],
    columns: [
      { data: property('id') },
      { data: property('name') },
      { data: property('address') },
    ],
    minSpareRows: 1,
    autoWrapRow: true,
    autoWrapCol: true
  };
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
import { Example7BindingDataComponent } from './app.component';
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
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example7BindingDataComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example7BindingDataComponent ]
})

export class AppModule { }
/* end-file */
