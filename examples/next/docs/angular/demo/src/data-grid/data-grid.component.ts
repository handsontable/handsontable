import { Component, ViewEncapsulation } from "@angular/core";
import { getData } from "./utils/constants";
import { starsRenderer } from "./renderers/stars";
import { progressBarRenderer } from "./renderers/progressBar";

import { alignHeaders, addClassesToRows } from "./utils/hooks-callbacks";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "data-grid",
  templateUrl: "./data-grid.component.html",
  styleUrls: ["./data-grid.scss"],
})
export class DataGridComponent {
  dataset = getData();
  alignHeaders = alignHeaders;
  addClassesToRows = addClassesToRows;
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
    "Country",
  ];
  hiddenColumns = {
    indicators: true,
  };
  licenseKey = "non-commercial-and-evaluation";
}
