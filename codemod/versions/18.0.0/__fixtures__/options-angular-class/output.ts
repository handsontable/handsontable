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
      // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
      { type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'de-DE' } },
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      { type: 'date', correctFormat: true },
    ],
  };

  unrelated = { correctFormat: true, culture: 'x' };
}
