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
      { type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'de-DE' } },
      { type: 'date', correctFormat: true },
    ],
  };

  unrelated = { correctFormat: true, culture: 'x' };
}
