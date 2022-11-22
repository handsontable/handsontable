export const helpers = {
  mainTableSelector: '#hot',
  mainTableSelectorBody: '> .ht_master > .wtHolder > .wtHider .wtSpreader table tbody',
  mainTableSelectorHead: '> .ht_master > .wtHolder > .wtHider .wtSpreader table thead',

  findCell(options = { row: 1, cell: 1, cellType: 'td' }) {
    return `> tr:nth-child(${options.row}) > ${options.cellType}:nth-child(${options.cell})`;
  },
};
