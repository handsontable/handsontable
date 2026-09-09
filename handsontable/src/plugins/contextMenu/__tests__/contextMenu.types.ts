import Handsontable from 'handsontable';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import type { MenuItemConfig } from 'handsontable/plugins/contextMenu';

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
        checked() {
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
        checked: true,
      }
    }
  }
});

const separator: MenuItemConfig = ContextMenu.SEPARATOR;

// Pinned by assigning to `MenuItemConfig` directly. The literals inside `contextMenu.items` above
// cannot pin anything: `contextMenu` is typed `boolean | object | string[]`, so they are checked
// against bare `object`, and `MenuItemConfig` carries `[key: string]: unknown`, which accepts any
// property name. Deleting the `checked` declaration left `test:types` green until these lines.
const checkedItem: MenuItemConfig = { name: 'toggle', checked: true };
const uncheckedItem: MenuItemConfig = { name: 'toggle', checked: false };
const checkedItemFn: MenuItemConfig = { name: 'toggle', checked: () => true };

// @ts-expect-error `checked` takes a boolean or a function returning one. The explicit declaration
// wins over the index signature, which is what makes this an error - and it is the type-level half
// of the renderer testing `checked` by type rather than by presence, so an unrelated property of
// that name does not turn somebody's item into a checkbox.
const wronglyCheckedItem: MenuItemConfig = { name: 'toggle', checked: 'pending' };

new Handsontable(document.createElement('div'), {
  contextMenu: {
    items: {
      sep1: ContextMenu.SEPARATOR,
      row_above: 'row_above',
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
