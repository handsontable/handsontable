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
  });
});
