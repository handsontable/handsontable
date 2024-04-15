import { Component, ViewEncapsulation } from "@angular/core";
import { getScenarioData } from "./utils/constants";
import { starsRenderer } from "./renderers/stars";
import { progressBarRenderer } from "./renderers/progressBar";

import {
  alignHeaders,
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./utils/hooks-callbacks";

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: "scenario-grid",
  templateUrl: "./scenario-grid.component.html",
  styleUrls: ["./scenario-grid.scss"]
})
export class ScenarioGridComponent {
  dataset = getScenarioData();
  alignHeaders = alignHeaders;
  drawCheckboxInRowHeaders = drawCheckboxInRowHeaders;
  addClassesToRows = addClassesToRows;
  changeCheckboxCell = changeCheckboxCell;
  progressBarRenderer = progressBarRenderer;
  starsRenderer = starsRenderer;
  colHeaders = [
    'Product ID',
    'Mobile Apps',
    'Pricing',
    'Rating',
    'Category',
    'Industry',
    'Business Scale',
    'User Type',
    'No of Users',
    'Deployment',
    'OS'
  ];
  hiddenColumns = {
    indicators: true
  };
  licenseKey = "non-commercial-and-evaluation";
}
