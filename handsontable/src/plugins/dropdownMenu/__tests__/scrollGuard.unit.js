import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  AutoColumnSize,
  DropdownMenu,
} from 'handsontable/plugins';

describe('DropdownMenu', () => {
  describe('horizontal scroll guard', () => {
    beforeAll(() => {
      registerPlugin(AutoColumnSize);
      registerPlugin(DropdownMenu);
    });

    it('should block horizontal viewport scroll while the menu is opened by button click', () => {
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: [['A1', 'B1'], ['A2', 'B2']],
        colHeaders: true,
        dropdownMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
      });
      const dropdownMenu = hot.getPlugin('dropdownMenu');
      const button = hot.rootElement.querySelector('.changeType');

      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(dropdownMenu.menu.isOpened()).toBe(true);
      expect(hot.runHooks('beforeViewportScrollHorizontally', 1, { value: 'auto' })).toBe(null);

      dropdownMenu.close();
      expect(hot.runHooks('beforeViewportScrollHorizontally', 1, { value: 'auto' })).toBe(1);

      hot.destroy();
      container.remove();
    });

    it('should synchronize top overlay scroll position with master before opening menu', () => {
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: Array.from({ length: 20 }, (_rowValue, row) =>
          Array.from({ length: 20 }, (_colValue, col) => `${row}:${col}`)),
        width: 300,
        height: 220,
        colWidths: 100,
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
      });
      const dropdownMenu = hot.getPlugin('dropdownMenu');
      const masterHolder = hot.view._wt.wtTable.holder;
      const topHolder = hot.view._wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const button = hot.rootElement.querySelector('.changeType');

      masterHolder.scrollLeft = 180;
      topHolder.scrollLeft = 120;

      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(dropdownMenu.menu.isOpened()).toBe(true);
      expect(topHolder.scrollLeft).toBe(masterHolder.scrollLeft);

      hot.destroy();
      container.remove();
    });
  });
});
