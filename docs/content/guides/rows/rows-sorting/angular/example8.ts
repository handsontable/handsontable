/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

type Product = {
  name: string;
  price: number;
  inStock: number;
  featured?: boolean;
};

// The two featured products always stay at the top, whichever column you sort by.
// No row here is frozen: rows frozen with `fixedRowsTop` or `fixedRowsBottom` are already
// left out of sorting, and need no code at all.
const products: Product[] = [
  { name: 'HL Mountain Frame', price: 1890.9, inStock: 11, featured: true },
  { name: 'HL Road Tire', price: 279.99, inStock: 3, featured: true },
  { name: 'Cycling Cap', price: 130.1, inStock: 0 },
  { name: 'Road Tire Tube', price: 59, inStock: 1 },
  { name: 'Racing Socks', price: 30, inStock: 5 },
  { name: 'Water Bottle', price: 12.5, inStock: 24 },
  { name: 'Bike Light', price: 45, inStock: 8 },
  { name: 'Chain Lube', price: 9.99, inStock: 17 },
];

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example8',
  template: `
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>
  `,
  styles: `
    :host ::ng-deep {
      /* The background is set through the theme's own CSS variables rather than with a plain
         background-color: the theme's row-striping rule is more specific than a single class,
         so a direct declaration would be ignored. */
      .handsontable td.featured-product {
        --ht-row-cell-odd-background-color: #fff8e1;
        --ht-row-cell-even-background-color: #fff8e1;

        font-weight: 600;
      }
    }
  `,
})
export class AppComponent {
  readonly gridSettings: GridSettings = {
    data: products,
    columns: [
      { data: 'name', type: 'text' },
      {
        data: 'price',
        type: 'numeric',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
      },
      { data: 'inStock', type: 'numeric' },
    ],
    colHeaders: ['Product', 'Price', 'In stock'],
    height: 'auto',
    stretchH: 'all',
    columnSorting: true,
    // `afterColumnSort()` is a Handsontable hook: it's fired after each sorting. Move the
    // featured rows back to the top of the view. The rule reads the data, not a row position,
    // so you pin a row by flagging it rather than by knowing where it sits.
    // Handsontable calls a hook with the grid as `this`, which is set even for a sort that runs
    // while the grid is being created.
    afterColumnSort(this: Handsontable) {
      const featuredRows = products
        .map((product, physicalRow) => (product.featured ? this.toVisualRow(physicalRow) : null))
        .filter((visualRow): visualRow is number => visualRow !== null);

      // Pass every index in one call: each move shifts the rows after it.
      this.rowIndexMapper.moveIndexes(featuredRows, 0);
    },
    // `cells()` receives a physical row index, so it reads the source array directly.
    cells(row: number) {
      return products[row]?.featured ? { className: 'featured-product' } : {};
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
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
/* end-file */
