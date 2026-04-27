import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { CellValue } from 'handsontable/common';
import { CellProperties } from 'handsontable/settings';
import { PredefinedMenuItemKey } from 'handsontable/plugins/contextMenu';

export const data = [
  [false, 'Tagcat', 'United Kingdom', 'Classic Vest', '2025-10-11', '01-2331942', true, '172', 2, 2],
  [true, 'Zoomzone', 'Indonesia', 'Cycling Cap', '2025-05-03', '88-2768633', true, '188', 6, 2],
  [true, 'Meeveo', 'United States', 'Full-Finger Gloves', '2025-03-27', '51-6775945', true, '162', 1, 3],
  [false, 'Buzzdog', 'Philippines', 'HL Mountain Frame', '2025-08-29', '44-4028109', true, '133', 7, 1],
  [true, 'Katz', 'India', 'Half-Finger Gloves', '2025-10-02', '08-2758492', true, '87', 1, 3],
  [false, 'Jaxbean', 'China', 'HL Road Frame', '2025-09-28', '84-3557705', false, '26', 8, 1],
  [false, 'Wikido', 'Brazil', 'HL Touring Frame', '2025-06-24', '20-9397637', false, '110', 4, 1],
  [false, 'Browsedrive', 'United States', 'LL Mountain Frame', '2025-03-13', '36-0079556', true, '50', 4, 4],
  [false, 'Twinder', 'United Kingdom', 'LL Road Frame', '2025-04-06', '41-1489542', false, '160', 6, 1],
  [false, 'Jetwire', 'China', 'LL Touring Frame', '2025-02-01', '37-1531629', true, '30', 8, 5],
  [false, 'Chatterpoint', 'China', 'Long-Sleeve Logo Jersey', '2025-07-14', '25-5083429', true, '39', 7, 2],
  [false, 'Twinder', 'Egypt', "Men's Bib-Shorts", '2025-08-31', '04-4281278', false, '96', 6, 1],
  [false, 'Midel', 'United States', "Men's Sports Shorts", '2025-06-27', '55-1711908', true, '108', 10, 3],
  [false, 'Yodo', 'India', 'ML Mountain Frame', '2025-03-16', '58-8360815', false, '46', 1, 1],
  [false, 'Camido', 'Russia', 'ML Mountain Frame-W', '2025-09-13', '10-3786104', true, '97', 8, 3],
  [false, 'Eire', 'Thailand', 'ML Road Frame', '2025-04-10', '45-1186054', true, '161', 1, 4],
  [false, 'Vinte', 'United Kingdom', 'ML Road Frame-W', '2025-01-22', '62-6202742', true, '58', 4, 3],
  [false, 'Twitterlist', 'China', 'Mountain Bike Socks', '2025-11-09', '88-9646223', true, '92', 8, 3],
  [false, 'Eidel', 'Bangladesh', 'Mountain-100', '2025-09-19', '45-5588112', true, '5', 6, 5],
  [false, 'Trunyx', 'Nigeria', 'Mountain-200', '2025-03-09', '66-6271819', true, '158', 4, 1],
];

export const SELECTED_CLASS = 'selected';
export const ODD_ROW_CLASS = 'odd';

export function addClassesToRows(
  TD: HTMLTableCellElement,
  row: number,
  column: number,
  _prop: string | number,
  _value: CellValue,
  cellProperties: CellProperties
) {
  if (column !== 0) {
    return;
  }

  const parentElement = TD.parentElement;

  if (parentElement === null) {
    return;
  }

  if (cellProperties.instance.getDataAtRowProp(row, '0')) {
    parentElement.classList.add(SELECTED_CLASS);
  } else {
    parentElement.classList.remove(SELECTED_CLASS);
  }

  if (row % 2 === 0) {
    parentElement.classList.add(ODD_ROW_CLASS);
  } else {
    parentElement.classList.remove(ODD_ROW_CLASS);
  }
}

@Component({
  selector: 'app-root',
  imports: [HotTableModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly initialData = data;
  readonly gridSettings: GridSettings = {
    height: 450,
    colWidths: [180, 220, 140, 120, 120, 120, 140],
    colHeaders: [
      'Company Name',
      'Name',
      'Sell date',
      'In stock',
      'Quantity',
      'Order ID',
      'Country',
    ],
    contextMenu: [
      'cut', 'copy', '---------',
      'row_above', 'row_below', 'remove_row',
      '---------', 'alignment', 'make_read_only', 'clear_column',
    ] as PredefinedMenuItemKey[],
    dropdownMenu: true,
    hiddenColumns: { indicators: true },
    multiColumnSorting: true,
    filters: true,
    rowHeaders: true,
    headerClassName: 'htLeft',
    beforeRenderer: addClassesToRows,
    manualRowMove: true,
    autoWrapRow: true,
    autoWrapCol: true,
    autoRowSize: true,
    manualRowResize: true,
    manualColumnResize: true,
    navigableHeaders: true,
    imeFastEdit: true,
    columns: [
      { data: 1 },
      { data: 3 },
      { data: 4, type: 'intl-date' },
      { data: 6, type: 'checkbox', className: 'htCenter' },
      { data: 7, type: 'numeric' },
      { data: 5 },
      { data: 2 },
    ],
  };
}
