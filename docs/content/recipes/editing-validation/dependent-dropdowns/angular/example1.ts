/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

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
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-dependent-dropdowns',
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
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
    afterInit(this: Handsontable) {
      for (let row = 0; row < this.countRows(); row++) {
        const category = String(this.getDataAtCell(row, CATEGORY_COL) ?? '');
        this.setCellMeta(row, SUBCATEGORY_COL, 'source', optionsForCategory(category));
      }
      this.render();
    },
    afterChange(this: Handsontable, changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) {
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

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
