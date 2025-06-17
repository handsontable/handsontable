import { Component, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';
import { getScenarioDataTop, getScenarioDataBottom } from './utils/constants';
import { starsRenderer } from './renderers/stars';
import { progressBarRenderer } from './renderers/progressBar';

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: 'scenario-grid',
  templateUrl: './scenario-grid.component.html',
  styleUrls: ['./scenario-grid.scss'],
  imports: [HotTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  settingsTop = {
    columns: [
      { data: 'product_id', type: 'numeric' },
      { data: 'mobile_apps' },
      { data: 'pricing' },
      { data: 'rating', type: 'numeric' },
      { data: 'dataType' },
      { data: 'industry' },
      { data: 'business_scale' },
      { data: 'user_type' },
      { data: 'no_of_users' },
      { data: 'deployment' },
      { data: 'OS' }
    ],
    height: 350,
    nestedHeaders: this.nestedHeaders,
    colHeaders: true,
    rowHeaders: true,
    collapsibleColumns: true,
    dropdownMenu: true,
    hiddenColumns: this.hiddenColumns,
    contextMenu: true,
    mergeCells: true,
    multiColumnSorting: true,
    filters: true,
    manualRowMove: true,
    navigableHeaders: true,
    comments: true,
    manualColumnMove: true,
    customBorders: true,
    autoWrapCol: true,
    autoWrapRow: true,
    fixedRowsBottom: 2,
    licenseKey: 'non-commercial-and-evaluation'
  }
  settingsBottom = {
    columns: [
      { data: 'category' },
      { data: 'product_id', type: 'numeric' },
      { data: 'industry' },
      { data: 'business_scale' },
      { data: 'user_type' },
      { data: 'no_of_users' },
      { data: 'deployment' },
      { data: 'OS' },
      { data: 'mobile_apps' },
      { data: 'pricing' },
      { data: '1', type: 'numeric' }
    ],
    height: 250,
    colHeaders: this.colHeadersBottom,
    rowHeaders: true,
    dropdownMenu: true,
    hiddenColumns: this.hiddenColumns,
    contextMenu: true,
    mergeCells: true,
    multiColumnSorting: true,
    filters: true,
    manualRowMove: true,
    navigableHeaders: true,
    comments: true,
    manualColumnMove: true,
    customBorders: true,
    autoWrapCol: true,
    autoWrapRow: true,
    nestedRows: true,
    bindRowsWithHeaders: true,
    licenseKey: 'non-commercial-and-evaluation'
  }
}
