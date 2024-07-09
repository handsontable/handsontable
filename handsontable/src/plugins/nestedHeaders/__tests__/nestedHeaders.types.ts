import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  nestedHeaders: [
    ['A', { label: 'B', colspan: 8 }, 'C'],
    ['D', { label: 'E', colspan: 4, headerClassName: 'htLeft test' }, { label: 'F', colspan: 4 }, 'G'],
    ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
  ],
});

const nestedHeaders = hot.getPlugin('nestedHeaders');

nestedHeaders.enablePlugin();
nestedHeaders.disablePlugin();
nestedHeaders.updatePlugin();
