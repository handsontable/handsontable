import { Component, OnInit } from '@angular/core';
import type Handsontable from 'handsontable';

@Component({
  selector: 'app-hot-table',
  templateUrl: './hot-table.component.html',
  styleUrls: ['./hot-table.component.scss']
})
export class HotTableComponent implements OnInit {

  hotSettings: Handsontable.GridSettings = {
    data: [
        ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
        ['2019', 10, 11, 12, 13],
        ['2020', 20, 11, 14, 13],
        ['2021', 30, 15, 12, 13]
    ],
    colHeaders: true,
    rowHeaders: true,
    licenseKey: 'non-commercial-and-evaluation'
  };

  ngOnInit(): void {
  }

}
