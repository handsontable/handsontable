import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  dropdownMenu: true,
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: ['insert_row_above', 'insert_row_below', 'remove_row'],
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
    uiContainer: document.createElement('div'),
  },
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
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
