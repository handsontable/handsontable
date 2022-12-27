export const helpers = {
  defaultHOTWrapper: 'js',

  screenshotsDirectory: './tests/screenshots',
  screenshotsExtension: 'png',

  selectors: {
    mainTable: 'div.handsontable.htRowHeaders.htColumnHeaders',
    mainTableBody: '> .ht_master.handsontable table tbody',
    mainTableHead: '> .ht_clone_top.handsontable table thead',
    mainTableFirstColumn: '> .ht_clone_inline_start.ht_clone_left.handsontable table tbody',
    dropdownMenu: '.htMenu.htDropdownMenu.handsontable',
  },

  cssFiles: {
    cookieInfo: 'remove-cookie-info.css',
    changeCellsBackground: 'change-cells-background.css',
    changeCellTextColor: 'change-cell-text-color.css',
    dynamicDataFreeze: 'dynamic-data-freeze.css'
  },

  expectedPageTitle: /Handsontable for .* example/,

  cssPath(file) {
    return `./tests-css/${file}`;
  },

  init(workerInfo, process) {
    this.hotWrapper = process.env.HOT_WRAPPER || this.defaultHOTWrapper;
    this.testURL = 'http://localhost:8080/';
    this.workerInfo = workerInfo;
    this.isMac = workerInfo.project.name === 'webkit';
    this.modifier = this.isMac ? 'Meta' : 'Control';
    this.screenshotsCount = 0;
    this.screenshotDirName = this.workerInfo.titlePath[0].split('.spec.js')[0];
    this.browser = this.workerInfo.project.name;

    if (this.browser === 'webkit') {
      this.browser = 'safari';
    }

    if (this.browser === 'chromium') {
      this.browser = 'chrome';
    }
  },

  findCell(options = { row: 1, cell: 1, cellType: 'td' }) {
    return `> tr:nth-child(${options.row}) > ${options.cellType}:nth-child(${options.cell})`;
  },

  findDropdownMenuExpander(options = { col: 1 }) {
    return `${this.selectors.mainTableHead} > tr > th:nth-child(${options.col + 1}) button.changeType`;
  },

  testTitle(filename) {
    const title = filename.split('\\').slice(-1)[0].split('.spec.js')[0].split('-').join(' ');

    return `${title.substring(0, 1).toUpperCase()}${title.substring(1)}`;
  },

  screenshotPath() {
    this.screenshotsCount += 1;

    // eslint-disable-next-line max-len
    return `${this.screenshotsDirectory}/${this.hotWrapper}/${this.browser}/${this.screenshotDirName}/${this.screenshotsCount}.${this.screenshotsExtension}`;
  }
};
