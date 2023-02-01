import { EXAMPLES_SERVER_PORT } from './config.mjs';

export const helpers = {
  defaultHOTFramework: 'js',

  screenshotsDirectory: './screenshots',
  screenshotsExtension: 'png',

  selectors: {
    mainTable: '#root > .handsontable',
    mainTableBody: '> .ht_master.handsontable table tbody',
    mainTableHead: '> .ht_clone_top.handsontable table thead',
    cloneInlineStartTable: '> .ht_clone_inline_start.handsontable table tbody',
    dropdownMenu: '.htMenu.htDropdownMenu.handsontable',
  },

  cssFiles: {
    cookieInfo: 'remove-cookie-info.css',
    changeCellsBackground: 'change-cells-background.css',
    changeCellTextColor: 'change-cell-text-color.css',
    dynamicDataFreeze: 'dynamic-data-freeze.css'
  },

  expectedPageTitle: /Handsontable for .* example/,

  hotFramework: '',
  testURL: `http://${process.env.CI ? 'localhost' : 'host.docker.internal'}:${EXAMPLES_SERVER_PORT}/`,
  isMac: true,
  modifier: 'Meta',
  screenshotsCount: 0,
  screenshotDirName: '',
  browser: '',

  cssPath(file: string) {
    return `./tests-css/${file}`;
  },

  init(workerInfo) {
    this.hotWrapper = process.env.HOT_FRAMEWORK || this.defaultHOTFramework;
    this.isMac = workerInfo.project.name === 'webkit';
    this.modifier = this.isMac ? 'Meta' : 'Control';
    this.screenshotDirName = workerInfo.titlePath[0].split('.spec.ts')[0];
    this.browser = workerInfo.project.name;
  },

  findCell(options = { row: 1, cell: 1, cellType: 'td' }) {
    return `> tr:nth-child(${options.row}) > ${options.cellType}:nth-child(${options.cell})`;
  },

  findDropdownMenuExpander(options = { col: 1 }) {
    return `${this.selectors.mainTableHead} > tr > th:nth-child(${options.col + 1}) button.changeType`;
  },

  testTitle(filename: string) {
    const title = filename.split('.spec.ts')[0].split('-').join(' ');

    return `${title.substring(0, 1).toUpperCase()}${title.substring(1)}`;
  },

  screenshotPath() {
    this.screenshotsCount += 1;

    // eslint-disable-next-line max-len
    return `${this.screenshotsDirectory}/${this.hotWrapper}/${this.browser}/${this.screenshotDirName}/${this.screenshotsCount}.${this.screenshotsExtension}`;
  }
};
