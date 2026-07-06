/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

const UNIT_SIZES: Record<string, { width: string; height: string }> = {
  px: { width: '600px', height: '300px' },
  '%': { width: '75%', height: '75%' },
  em: { width: '37.5em', height: '18.75em' },
  rem: { width: '37.5rem', height: '18.75rem' },
  vh: { width: '50vh', height: '50vh' },
  vw: { width: '50vw', height: '50vw' },
};

const UNIT_CAPTIONS: Record<string, string> = {
  px: 'A fixed pixel size, independent of any parent element or font size.',
  '%': "A percentage of the parent container's size (the dashed box).",
  em: "A multiple of this element's own font size.",
  rem: "A multiple of the document's root font size.",
  vh: "A percentage of the browser viewport's height.",
  vw: "A percentage of the browser viewport's width.",
};

@Component({
  selector: 'example2-grid-size',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <label for="unitSelect">Grid size unit</label>
        <select id="unitSelect" (change)="changeUnit($event)">
          @for (key of unitKeys; track key) {
            <option [value]="key">{{ key }}</option>
          }
        </select>
      </div>
      <p class="unit-caption">{{ unitCaption }}</p>
    </div>
    <div id="exampleParent2">
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly unitKeys = Object.keys(UNIT_SIZES);
  unitCaption = UNIT_CAPTIONS.px;

  readonly data = [
    ['SKU-4821', 'Wireless Mouse', 'Electronics', 'Harbor Goods', 142],
    ['SKU-0093', 'Canvas Tote Bag', 'Apparel', 'Alpine Supply Co.', 67],
    ['SKU-2210', 'USB-C Hub', 'Electronics', 'Harbor Goods', 0],
    ['SKU-7734', 'Ceramic Mug Set', 'Home Goods', 'Nordic Traders', 58],
    ['SKU-1145', 'Wool Scarf', 'Apparel', 'Alpine Supply Co.', 213],
    ['SKU-3399', 'Bluetooth Speaker', 'Electronics', 'Harbor Goods', 84],
    ['SKU-5567', 'Cotton T-Shirt', 'Apparel', 'Alpine Supply Co.', 310],
    ['SKU-8842', 'Desk Lamp', 'Home Goods', 'Nordic Traders', 45],
    ['SKU-6621', 'Laptop Stand', 'Electronics', 'Harbor Goods', 29],
    ['SKU-4470', 'Throw Blanket', 'Home Goods', 'Nordic Traders', 76],
    ['SKU-9983', 'Leather Wallet', 'Apparel', 'Alpine Supply Co.', 132],
    ['SKU-2287', 'Wireless Charger', 'Electronics', 'Harbor Goods', 97],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['SKU', 'Product', 'Category', 'Supplier', 'Quantity'],
    rowHeaders: true,
    width: UNIT_SIZES.px.width,
    height: UNIT_SIZES.px.height,
  };

  changeUnit(event: Event): void {
    const unit = UNIT_SIZES[(event.target as HTMLSelectElement).value];

    this.unitCaption = UNIT_CAPTIONS[(event.target as HTMLSelectElement).value];
    this.hotTable?.hotInstance?.updateSettings({ width: unit.width, height: unit.height });
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
