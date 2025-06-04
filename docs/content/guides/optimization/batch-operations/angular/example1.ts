/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-batch-operation',
  standalone: false,
  template: ` <div class="example-controls-container">
      <div class="controls">
        <button
          id="buttonWithout"
          class="button button--primary"
          (click)="buttonWithoutClick()"
        >
          Run without batch method
        </button>
        <button
          id="buttonWith"
          class="button button--primary"
          (click)="buttonWithClick()"
        >
          Run with batch method
        </button>
      </div>
      <output class="console" id="output">
        {{ output || 'Here you will see the log' }}
      </output>
    </div>
    <div>
      <hot-table [data]="dataInit" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class Example1BatchOperationComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  dataInit = [
    [1, 'Gary Nash', 'Speckled trousers', 'S', 1, 'yes'],
    [2, 'Gloria Brown', '100% Stainless sweater', 'M', 2, 'no'],
    [3, 'Ronald Carver', 'Sunny T-shirt', 'S', 1, 'no'],
    [4, 'Samuel Watkins', 'Floppy socks', 'S', 3, 'no'],
    [5, 'Stephanie Huddart', 'Bushy-bush cap', 'XXL', 1, 'no'],
    [6, 'Madeline McGillivray', 'Long skirt', 'L', 1, 'no'],
    [7, 'Jai Moor', 'Happy dress', 'XS', 1, 'no'],
    [8, 'Ben Lower', 'Speckled trousers', 'M', 1, 'no'],
    [9, 'Ali Tunbridge', 'Speckled trousers', 'M', 2, 'no'],
    [10, 'Archie Galvin', 'Regular shades', 'uni', 10, 'no'],
  ];
  data2 = [[11, 'Gavin Elle', 'Floppy socks', 'XS', 3, 'yes']];
  data3 = [
    [12, 'Gary Erre', 'Happy dress', 'M', 1, 'no'],
    [13, 'Anna Moon', 'Unicorn shades', 'uni', 200, 'no'],
    [14, 'Elise Eli', 'Regular shades', 'uni', 1, 'no'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    width: 'auto',
    colHeaders: [
      'ID',
      'Customer name',
      'Product name',
      'Size',
      'qty',
      'Return',
    ],
    autoWrapRow: true,
    autoWrapCol: true
  };

  output!: string;
  counter = 0;

  buttonWithoutClick(): void {
    const t1 = performance.now();

    this.alterTable();

    const t2 = performance.now();

    this.logOutput(`Time without batch ${(t2 - t1).toFixed(2)}ms`);
  }

  buttonWithClick(): void {
    const hot = this.hotTable?.hotInstance;
    const t1 = performance.now();

    hot?.batch(() => this.alterTable());

    const t2 = performance.now();

    this.logOutput(`Time with batch ${(t2 - t1).toFixed(2)}ms`);
  }

  private alterTable(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.alter('insert_row_above', 10, 10);
    hot?.alter('insert_col_start', 6, 1);
    hot?.populateFromArray(10, 0, this.data2);
    hot?.populateFromArray(11, 0, this.data3);
    hot?.setCellMeta(2, 2, 'className', 'green-bg');
    hot?.setCellMeta(4, 2, 'className', 'green-bg');
    hot?.setCellMeta(5, 2, 'className', 'green-bg');
    hot?.setCellMeta(6, 2, 'className', 'green-bg');
    hot?.setCellMeta(8, 2, 'className', 'green-bg');
    hot?.setCellMeta(9, 2, 'className', 'green-bg');
    hot?.setCellMeta(10, 2, 'className', 'green-bg');
    hot?.alter('remove_col', 6, 1);
    hot?.alter('remove_row', 10, 10);
    hot?.setCellMeta(0, 5, 'className', 'red-bg');
    hot?.setCellMeta(10, 5, 'className', 'red-bg');
    hot?.render(); // Render is needed here to populate the new "className"s
  }

  private logOutput(output: string): void {
    this.output = `[${this.counter}] ${output}\n${this.output ?? ''}`;
    this.counter = this.counter + 1;
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
import { Example1BatchOperationComponent } from './app.component';
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
  declarations: [ Example1BatchOperationComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1BatchOperationComponent ]
})

export class AppModule { }
/* end-file */
