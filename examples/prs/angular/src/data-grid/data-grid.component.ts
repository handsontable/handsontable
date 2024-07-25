import { Component, ViewEncapsulation } from "@angular/core";
import { getData } from "./utils/constants";

import {
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell,
} from "./utils/hooks-callbacks";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "data-grid",
  templateUrl: "./data-grid.component.html",
  styleUrls: ["./data-grid.scss"],
})
export class DataGridComponent {
  dataset = getData();
  drawCheckboxInRowHeaders = drawCheckboxInRowHeaders;
  addClassesToRows = addClassesToRows;
  changeCheckboxCell = changeCheckboxCell;
  colHeaders = [
    "Company name",
    "Country",
    "Name",
    "Sell date",
    "Order ID",
    "In stock",
    "Qty",
    "Progress",
    "Rating",
  ];
  hiddenColumns = {
    indicators: true,
  };
  licenseKey = "non-commercial-and-evaluation";
}
