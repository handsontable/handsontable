import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const dropdownMenu = hot.getPlugin('dropdownMenu');

dropdownMenu.open({ left: 0, top: 0 });
dropdownMenu.open({ left: 0, top: 0 }, { left: 10 });
dropdownMenu.open({ left: 0, top: 0 }, { right: 10 });
dropdownMenu.open({ left: 0, top: 0 }, { above: 10 });
dropdownMenu.open({ left: 0, top: 0 }, { below: 10 });
dropdownMenu.open({ left: 0, top: 0 }, { left: 10, right: 10, above: 10, below: 10 });
dropdownMenu.open(new Event('click'));
dropdownMenu.close();
dropdownMenu.executeCommand('readOnly');
