import { Component } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [HotTableModule],
  template: '<hot-table [settings]="gridSettings"></hot-table>',
})
export class OrdersComponent {
  gridSettings = {
    colHeaders: true,
    rowHeaders: true,
    columns: [
      {
        type: 'numeric',
        locale: 'de-DE',

        numericFormat: {
          pattern: '0,0.00'
        }
      },
      {
        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        type: 'date'
      },
    ],
  };

  unrelated = { correctFormat: true, culture: 'x' };
}
