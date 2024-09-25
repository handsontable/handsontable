import { Component, ViewEncapsulation } from "@angular/core";
import { getData } from "./utils/constants";

import { addClassesToRows } from "./utils/hooks-callbacks";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "data-grid",
  templateUrl: "./data-grid.component.html",
  styleUrls: ["./data-grid.scss"],
})
export class DataGridComponent {
  dataset = getData();
  addClassesToRows = addClassesToRows;
  colHeaders = [
    "Company name",
    "Name",
    "Sell date",
    "In stock",
    "Qty",
    "Order ID",
    "Country",
  ];
  hiddenColumns = {
    indicators: true,
  };
  licenseKey = "non-commercial-and-evaluation";
}
