export const helpers = {
  HOT: {
    findMainTableBy: '#hot'
  },

  findTd(tr, td) {
    return `> tr:nth-child(${tr}) > td:nth-child(${td})`;
  },

  findTh(tr, th) {
    return `> tr:nth-child(${tr}) > th:nth-child(${th})`;
  },

  findTableBody: '> .ht_master > .wtHolder > .wtHider .wtSpreader table tbody',
  findTableHead: '> .ht_master > .wtHolder > .wtHider .wtSpreader table thead',
};
