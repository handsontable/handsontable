export const helpers = {
  selectors: {
    mainTable: '#hot',
    mainTableBody: '> .ht_master > .wtHolder > .wtHider .wtSpreader table tbody',
    mainTableHead: '> .ht_master > .wtHolder > .wtHider .wtSpreader table thead',
    dropdownMenu: '.htMenu.htDropdownMenu.handsontable',
    expandDropdownMenuButton: 'button.changeType',
  },

  cssPath: {
    cookieInfo: './tests-css/removeCookieInfo.css',
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
  }
};
