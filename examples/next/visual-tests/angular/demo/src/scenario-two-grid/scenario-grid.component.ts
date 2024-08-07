import { Component, ViewEncapsulation } from '@angular/core';
import { getScenarioDataTop, getScenarioDataBottom } from './utils/constants';
import { starsRenderer } from './renderers/stars';
import { progressBarRenderer } from './renderers/progressBar';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'scenario-grid',
  templateUrl: './scenario-grid.component.html',
  styleUrls: ['./scenario-grid.scss'],
})
export class ScenarioGridComponent {
  datasetTop = getScenarioDataTop();
  datasetBottom = getScenarioDataBottom();
  progressBarRenderer = progressBarRenderer;
  starsRenderer = starsRenderer;
  nestedHeaders = [
    [
      { label: 'Product', colspan: 4 },
      { label: 'Category', colspan: 3 },
      { label: 'User', colspan: 2 },
      { label: 'System', colspan: 2 },
    ],
    [
      'Product ID',
      'Mobile Apps',
      'Pricing',
      'Rating',
      'Data Type',
      'Industry',
      'Business Scale',
      'User Type',
      'No of Users',
      'Deployment',
      'OS',
    ],
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
    indicators: true,
  };
  licenseKey = 'non-commercial-and-evaluation';
}
