import { Component, ViewEncapsulation } from "@angular/core";
import { getScenarioDataTop, getScenarioDataBottom } from "./utils/constants";
import { starsRenderer } from "./renderers/stars";
import { progressBarRenderer } from "./renderers/progressBar";
import { HyperFormula } from 'hyperformula';

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
  datasetTop = getScenarioDataTop();
  datasetBottom = getScenarioDataBottom();
  alignHeaders = alignHeaders;
  drawCheckboxInRowHeaders = drawCheckboxInRowHeaders;
  addClassesToRows = addClassesToRows;
  changeCheckboxCell = changeCheckboxCell;
  progressBarRenderer = progressBarRenderer;
  starsRenderer = starsRenderer;
  formulas={
    engine: HyperFormula,
  }
  colHeadersTop = [
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

  colHeadersBottom = [
    'Category',
    'Product ID',
    'Industry',
    'Business Scale',
    'User Type',
    'No of Users',
    'Deployment',
    'OS',
    'Mobile Apps',
    'Pricing',
    'Rating',
  ];
  hiddenColumns = {
    indicators: true
  };
  licenseKey = "non-commercial-and-evaluation";
}
