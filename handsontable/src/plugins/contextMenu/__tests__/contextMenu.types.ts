import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  contextMenu: true,
});

new Handsontable(document.createElement('div'), {
  contextMenu: ['insert_row_above', 'insert_row_below', 'remove_row'],
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
    uiContainer: document.createElement('div'),
  },
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
    name: 'Insert row',
    key: 'insert_row',
    hidden: false,
    disabled: false,
    disableSelection: false,
    isCommand: false,
    callback(key: string, selection: Selection[], clickEvent: MouseEvent) {},
    renderer(hot: Handsontable, wrapper: HTMLElement, row: number, col: number, prop: number | string, itemValue: string) {
      return document.createElement('div');
    },
    submenu: {
      items: [
        { name: 'Insert row below' }
      ]
    },
  },
});
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
