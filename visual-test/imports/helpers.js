export const helpers = {
  defaultHOTVersion: '12.2.0',
  defaultHOTWrapper: 'js',

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

  cssPath(file) {
    return `./tests-css/${file}`;
  },

  init(workerInfo, wrapper) {
    this.workerInfo = workerInfo;
    this.isMac = this.workerInfo.project.name === 'webkit';
    this.modifier = this.isMac ? 'Meta' : 'Control';
    this.screenshotsCount = 0;
    this.wrapper = wrapper;
  },

  findCell(options = { row: 1, cell: 1, cellType: 'td' }) {
    return `> tr:nth-child(${options.row}) > ${options.cellType}:nth-child(${options.cell})`;
  },

  screenshotPath() {
    this.screenshotsCount += 1;
    const titlePath = this.workerInfo.titlePath[0].split('.spec.js')[0];
    const browser = this.workerInfo.project.name === 'webkit' ? 'safari' : this.workerInfo.project.name;

    return `./tests/screenshots/${this.wrapper}/${browser}/${titlePath}/${this.screenshotsCount}.png`;
  },

  findDropdownMenuExpander(options = { col: 1 }) {
    return `${this.selectors.mainTableHead} > tr > th:nth-child(${options.col + 1}) button.changeType`;
  }
};
