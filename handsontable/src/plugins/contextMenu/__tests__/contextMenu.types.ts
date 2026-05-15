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
    callback(key: string, selection: unknown, clickEvent: MouseEvent) {},
  },
});

new Handsontable(document.createElement('div'), {
  contextMenu: {
    callback(key: string, selection: unknown, clickEvent: MouseEvent) {},
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
          return !!(this as any).getSelectedLast();
        },
        disabled() {
          return !!(this as any).getSelectedLast();
        },
        disableSelection: true,
        isCommand: false,
        callback(key: string, selection: unknown, clickEvent: MouseEvent) {
          const isSelected = !!(this as any).getSelectedLast();

          key.toUpperCase();
          (selection as any)[0].start.row;
          clickEvent.preventDefault();
        },
        renderer(
          hot: ReturnType<typeof Handsontable>, wrapper: HTMLElement, row: number, col: number,
          prop: string | number, itemValue: unknown
        ) {
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
    callback(key: string, selection: unknown, clickEvent: MouseEvent) {},
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
