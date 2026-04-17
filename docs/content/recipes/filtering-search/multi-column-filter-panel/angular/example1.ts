/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

type Product = {
  name: string;
  category: string;
  price: number;
  stock: number;
};

const sourceData: Product[] = [
  { name: 'Trail Bike', category: 'Bikes', price: 1499, stock: 12 },
  { name: 'Road Helmet', category: 'Safety', price: 89, stock: 42 },
  { name: 'Flat Pedals', category: 'Components', price: 59, stock: 80 },
  { name: 'Hydration Pack', category: 'Accessories', price: 129, stock: 23 },
  { name: 'Brake Pads', category: 'Components', price: 25, stock: 150 },
  { name: 'Cycling Glasses', category: 'Accessories', price: 79, stock: 33 },
  { name: 'Chain Lube', category: 'Maintenance', price: 16, stock: 99 },
  { name: 'Torque Wrench', category: 'Maintenance', price: 139, stock: 14 },
  { name: 'Kids Helmet', category: 'Safety', price: 54, stock: 20 },
  { name: 'Gravel Bike', category: 'Bikes', price: 2199, stock: 7 },
];

@Component({
  selector: 'example1-multi-column-filter-panel',
  standalone: false,
  template: `
    <div class="example-controls-container">
      <div class="filter-panel">
        <label class="filter-label filter-label--wide">
          Product name
          <input type="text" placeholder="Contains..." (input)="onNameFilter($event)" />
        </label>
        <label class="filter-label filter-label--wide">
          Category
          <select (change)="onCategoryFilter($event)">
            <option value="">All categories</option>
            <option value="Bikes">Bikes</option>
            <option value="Safety">Safety</option>
            <option value="Components">Components</option>
            <option value="Accessories">Accessories</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </label>
        <label class="filter-label">
          Min price
          <input type="number" min="0" placeholder="0" (input)="onMinPriceFilter($event)" />
        </label>
        <label class="filter-label">
          Max price
          <input type="number" min="0" placeholder="2500" (input)="onMaxPriceFilter($event)" />
        </label>
        <button type="button" (click)="clearFilters()">Clear all filters</button>
      </div>
    </div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class Example1MultiColumnFilterPanelComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = sourceData;

  readonly gridSettings: GridSettings = {
    columns: [
      { data: 'name', type: 'text', title: 'Product' },
      { data: 'category', type: 'text', title: 'Category' },
      { data: 'price', type: 'numeric', title: 'Price' },
      { data: 'stock', type: 'numeric', title: 'Stock' },
    ],
    colHeaders: ['Product', 'Category', 'Price', 'Stock'],
    rowHeaders: true,
    filters: true,
    dropdownMenu: false,
    width: '100%',
    height: 320,
    autoWrapRow: true,
    autoWrapCol: true,
  };

  private enteredName = '';
  private selectedCategory = '';
  private minPrice = '';
  private maxPrice = '';

  onNameFilter(event: Event): void {
    this.enteredName = (event.target as HTMLInputElement).value.trim();
    this.applyFilters();
  }

  onCategoryFilter(event: Event): void {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onMinPriceFilter(event: Event): void {
    this.minPrice = (event.target as HTMLInputElement).value.trim();
    this.applyFilters();
  }

  onMaxPriceFilter(event: Event): void {
    this.maxPrice = (event.target as HTMLInputElement).value.trim();
    this.applyFilters();
  }

  clearFilters(): void {
    this.enteredName = '';
    this.selectedCategory = '';
    this.minPrice = '';
    this.maxPrice = '';

    const hot = this.hotTable.hotInstance;

    if (!hot) {
      return;
    }

    const filtersPlugin = hot.getPlugin('filters');

    filtersPlugin.clearConditions();
    filtersPlugin.filter();
    hot.render();
  }

  private applyFilters(): void {
    const hot = this.hotTable.hotInstance;

    if (!hot) {
      return;
    }

    const filtersPlugin = hot.getPlugin('filters');

    filtersPlugin.clearConditions();

    if (this.enteredName) {
      filtersPlugin.addCondition(0, 'contains', [this.enteredName]);
    }

    if (this.selectedCategory) {
      filtersPlugin.addCondition(1, 'eq', [this.selectedCategory]);
    }

    if (this.minPrice && this.maxPrice) {
      const lowerBound = Number(this.minPrice);
      const upperBound = Number(this.maxPrice);

      if (Number.isFinite(lowerBound) && Number.isFinite(upperBound)) {
        filtersPlugin.addCondition(2, 'between', [lowerBound, upperBound]);
      }
    } else if (this.minPrice) {
      const lowerBound = Number(this.minPrice);

      if (Number.isFinite(lowerBound)) {
        filtersPlugin.addCondition(2, 'gte', [lowerBound]);
      }
    } else if (this.maxPrice) {
      const upperBound = Number(this.maxPrice);

      if (Number.isFinite(upperBound)) {
        filtersPlugin.addCondition(2, 'lte', [upperBound]);
      }
    }

    filtersPlugin.filter();
    hot.render();
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
import { Example1MultiColumnFilterPanelComponent } from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig }],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1MultiColumnFilterPanelComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1MultiColumnFilterPanelComponent],
})
export class AppModule {}
/* end-file */
