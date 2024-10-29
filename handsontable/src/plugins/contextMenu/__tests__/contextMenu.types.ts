import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  contextMenu: true,
});

new Handsontable(document.createElement('div'), {
  contextMenu: ['row_above', 'row_below', 'remove_row'],
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
    items: ['row_above', 'row_below', 'remove_row']
  }
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
    uiContainer: document.createElement('div'),
  },
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
    callback(key, selection, clickEvent) {},
  },
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
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
  contextMenu: {
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
