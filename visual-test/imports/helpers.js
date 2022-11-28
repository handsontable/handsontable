export const helpers = {
  selectors: {
    mainTable: '#hot',
    mainTableBody: '> .ht_master.handsontable table tbody',
    mainTableHead: '> .ht_clone_top.handsontable table thead',
    mainTableFirstColumn: '> .ht_clone_inline_start.ht_clone_left.handsontable table tbody',
    dropdownMenu: '.htMenu.htDropdownMenu.handsontable',
  },

  cssPath: {
    cookieInfo: './tests-css/removeCookieInfo.css',
    changeCellTextColor: './tests-css/change-cell-text-color.css',
  },

  init(workerInfo) {
    this.workerInfo = workerInfo;
    this.isMac = this.workerInfo.project.name === 'webkit';
    this.modifier = this.isMac ? 'Meta' : 'Control';
    this.screenshotsCount = 0;
  },

  findCell(options = { row: 1, cell: 1, cellType: 'td' }) {
    return `> tr:nth-child(${options.row}) > ${options.cellType}:nth-child(${options.cell})`;
  },

  screenshotPath() {
    this.screenshotsCount += 1;
    const titlePath = this.workerInfo.titlePath[0].split('.spec.js')[0];

    return `./tests/screenshots/${titlePath}/${this.workerInfo.project.name}/${this.screenshotsCount}.png`;
  },

  findDropdownMenuExpander(options = { col: 1 }) {
    return `${this.selectors.mainTableHead} > tr > th:nth-child(${options.col + 1}) button.changeType`;
  }
};
