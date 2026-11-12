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
        // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
        type: 'date'
      },
    ],
  };

  unrelated = { correctFormat: true, culture: 'x' };
}
