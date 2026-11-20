import { Component } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table [data]="rows" [colWidths]="null" licenseKey="my-own-key"></hot-table>
    <hot-table [data]="rows" licenseKey="my-own-key"></hot-table>
  `,
})
export class GridComponent {
  rows = [[1, 2]];
}
