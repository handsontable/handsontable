export const helpers = {
  mainTableSelector: '#hot',
  mainTableSelectorBody: '> .ht_master > .wtHolder > .wtHider .wtSpreader table tbody',
  mainTableSelectorHead: '> .ht_master > .wtHolder > .wtHider .wtSpreader table thead',
  dropdownMenuSelector: '.htMenu.htDropdownMenu.handsontable',
  expandDropdownMenuButtonSelector: 'button.changeType',
  cssPath: {
    cookieInfo: './tests-css/removeCookieInfo.css',
  },

  isMac(workerInfo) {
    return workerInfo.project.name === 'webkit';
  },

  modifier(workerInfo) {
    return this.isMac(workerInfo) ? 'Meta' : 'Control';
  },

  findCell(options = { row: 1, cell: 1, cellType: 'td' }) {
    return `> tr:nth-child(${options.row}) > ${options.cellType}:nth-child(${options.cell})`;
  },
};
