import { Component, OnInit } from '@angular/core';
import Handsontable from 'handsontable';

@Component({
  selector: 'app-hot-table',
  template: '<hot-table [settings]="hotSettings"></hot-table>'
})
export class HotTableComponent implements OnInit {

  hotSettings: Handsontable.GridSettings = {
    data: Handsontable.helper.createSpreadsheetData(5, 5),
    colHeaders: true,
    contextMenu: {
      items: {
        'row_above': {
          name: 'Insert row above this one (custom name)'
        },
        'row_below': {},
        'separator': Handsontable.plugins.ContextMenu.SEPARATOR,
        'clear_custom': {
          name: 'Clear all cells (custom)',
          callback: function() {
            this.clear();
          }
        }
      }
    },
    licenseKey: 'non-commercial-and-evaluation'
  }

  ngOnInit(): void {
  }

}
