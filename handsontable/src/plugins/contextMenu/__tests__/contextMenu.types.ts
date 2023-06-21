import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const contextMenu = hot.getPlugin('contextMenu');

contextMenu.open({ left: 0, top: 0 });
contextMenu.open({ left: 0, top: 0 }, { left: 10 });
contextMenu.open({ left: 0, top: 0 }, { right: 10 });
contextMenu.open({ left: 0, top: 0 }, { above: 10 });
contextMenu.open({ left: 0, top: 0 }, { below: 10 });
contextMenu.open({ left: 0, top: 0 }, { left: 10, right: 10, above: 10, below: 10 });
contextMenu.open(new Event('click'));
contextMenu.close();
contextMenu.executeCommand('readOnly');
