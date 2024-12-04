import { Component, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { HotTableModule } from '@handsontable/angular';
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
  headerClassNameValue = document.documentElement.getAttribute('dir') === 'rtl' ? 'htRight' : 'htLeft';
  licenseKey = "non-commercial-and-evaluation";
}
