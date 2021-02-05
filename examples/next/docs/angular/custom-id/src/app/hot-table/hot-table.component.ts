import { Component, OnInit } from '@angular/core';
import type Handsontable from 'handsontable';

@Component({
  selector: 'app-hot-table',
  templateUrl: './hot-table.component.html',
  styleUrls: ['./hot-table.component.scss']
})
export class HotTableComponent implements OnInit {

  hotSettings: Handsontable.GridSettings = {
    startRows: 5,
    startCols: 5,
    colHeaders: true,
    stretchH: 'all',
    licenseKey: 'non-commercial-and-evaluation'
  };

  id = 'my-custom-id';

  ngOnInit(): void {
  }
}
