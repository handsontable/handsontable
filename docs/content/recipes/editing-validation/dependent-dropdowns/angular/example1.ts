/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

const CATEGORY_COL = 0;
const SUBCATEGORY_COL = 1;

/** Parent value -> allowed child dropdown labels */
const dependencyMap: Record<string, string[]> = {
  Fruit: ['Apple', 'Banana', 'Orange'],
  Vegetable: ['Carrot', 'Pea', 'Broccoli'],
  Grain: ['Rice', 'Wheat', 'Oats'],
};

function optionsForCategory(category: string): string[] {
  return dependencyMap[category] ?? [];
}

@Component({
  selector: 'example1-dependent-dropdowns',
  standalone: false,
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class Example1DependentDropdownsComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data: string[][] = [
    ['Fruit', 'Apple'],
    ['Vegetable', 'Carrot'],
    ['Grain', ''],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Category', 'Subcategory'],
    columns: [
      { type: 'dropdown', source: Object.keys(dependencyMap) },
      { type: 'dropdown', source: optionsForCategory(String(this.data[0][CATEGORY_COL])) },
    ],
    rowHeaders: true,
    height: 200,
    width: '100%',
    afterInit() {
      for (let row = 0; row < this.countRows(); row++) {
        const category = String(this.getDataAtCell(row, CATEGORY_COL) ?? '');
        this.setCellMeta(row, SUBCATEGORY_COL, 'source', optionsForCategory(category));
      }
      this.render();
    },
    afterChange(changes, source) {
      if (source === 'loadData' || !changes) {
        return;
      }
      for (const change of changes) {
        const [row, prop, oldVal, newVal] = change;
        if (prop !== CATEGORY_COL || oldVal === newVal) {
          continue;
        }
        const next = optionsForCategory(String(newVal));
        this.setCellMeta(row, SUBCATEGORY_COL, 'source', next);
        this.setDataAtCell(row, SUBCATEGORY_COL, next[0] ?? '');
      }
      this.render();
    },
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
import { Example1DependentDropdownsComponent } from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig }],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1DependentDropdownsComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1DependentDropdownsComponent],
})
export class AppModule {}
/* end-file */
