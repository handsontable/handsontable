import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  dropdownMenu: true,
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: ['row_above', 'row_below', 'remove_row'],
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
    items: ['row_above', 'row_below', 'remove_row']
  }
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
    uiContainer: document.createElement('div'),
  },
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
    callback(key, selection, clickEvent) {},
  },
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
    callback(key, selection, clickEvent) {},
    items: {
      sep1: '---------',
      row_above: 'row_above',
      row_below: 'row_below',
      item: {
        name() {
          return 'name';
        },
        key: 'name',
        hidden() {
          return !!this.getSelectedLast();
        },
        disabled() {
          return !!this.getSelectedLast();
        },
        disableSelection: true,
        isCommand: false,
        callback(key, selection, clickEvent) {
          const isSelected = !!this.getSelectedLast();

          key.toUpperCase();
          selection[0].start.row;
          clickEvent.preventDefault();
        },
        renderer(hot, wrapper, row, col, prop, itemValue) {
          this.key;
          hot.getSelected();

          return document.createElement('div');
        },
        submenu: {
          items: [
            { key: 'item:0', name: '' },
            { key: 'item:1', name: '' },
            { key: 'item:2', name: '' }
          ]
        },
      }
    }
  }
});

new Handsontable(document.createElement('div'), {
  dropdownMenu: {
    callback(key, selection, clickEvent) {},
    items: {
      sep1: '---------',
      row_above: 'row_above',
      row_below: 'row_below',
      item: {
        name: 'name',
        key: 'name',
        hidden: false,
        disabled: false,
      }
    }
  }
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
