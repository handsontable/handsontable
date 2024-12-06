import { Component, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { getData } from "./utils/constants";
import { HotTableModule } from '@handsontable/angular';

import { addClassesToRows } from "./utils/hooks-callbacks";

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
