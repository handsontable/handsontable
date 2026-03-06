import { Component, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HotTableModule } from "@handsontable/angular-wrapper";
import { getData } from "./utils/constants";
import { starsRenderer } from "./renderers/stars";
import { progressBarRenderer } from "./renderers/progressBar";

import {
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./utils/hooks-callbacks";

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: "data-grid",
  templateUrl: "./data-grid.component.html",
  styleUrls: ["./data-grid.scss"],
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DataGridComponent {
  dataset = getData();
  drawCheckboxInRowHeaders = drawCheckboxInRowHeaders;
  addClassesToRows = addClassesToRows;
  changeCheckboxCell = changeCheckboxCell;
  progressBarRenderer = progressBarRenderer;
  starsRenderer = starsRenderer;
  colHeaders = [
    "Company name",
    "Name",
    "Sell date",
    "In stock",
    "Qty",
    "Progress",
    "Rating",
    "Order ID",
    "Country"
  ];
  hiddenColumns = {
    indicators: true
  };
  headerClassNameValue = document.documentElement.getAttribute("dir") === "rtl" ? "htRight" : "htLeft";
  licenseKey = "non-commercial-and-evaluation";
  themeName: string | undefined = undefined;
  htSettings = {
    columns: [
      { data: '1' },
      { data: '3' },
      { data: '4', type: 'date', allowInvalid: false },
      { data: '6', type: 'checkbox', className: 'htCenter', headerClassName: 'htCenter' },
      { data: '7', type: 'numeric', headerClassName: 'htRight' },
      { 
        data: '8',
        renderer: this.progressBarRenderer,
        readOnly: true,
        className: 'htMiddle'
      },
      {
        data: '9', 
        renderer: this.starsRenderer,
        readOnly: true,
        className: 'star htCenter',
        headerClassName: 'htCenter'
      },
      { data: '5' },
      { data: '2' }
    ],
    height: 450,
    colWidths: [140, 210, 135, 100, 90, 110, 120, 115, 140],
    colHeaders: this.colHeaders,
    rowHeaders: true,
    dropdownMenu: true,
    hiddenColumns: this.hiddenColumns,
    contextMenu: true,
    mergeCells: true,
    multiColumnSorting: true,
    filters: true,
    afterOnCellMouseDown: this.changeCheckboxCell,
    headerClassName: this.headerClassNameValue,
    afterGetRowHeader: this.drawCheckboxInRowHeaders,
    beforeRenderer: this.addClassesToRows,
    manualRowMove: true,
    navigableHeaders: true,
    comments: true,
    manualColumnMove: true,
    customBorders: true,
    themeName: this.themeName,
    licenseKey: this.licenseKey,
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params["theme"]) {
        this.themeName = `ht-theme-${params["theme"]}`;
      }
    });
  }
}
