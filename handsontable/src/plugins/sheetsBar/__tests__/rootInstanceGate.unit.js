import '../../../index';
import Core from '../../../core';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('SheetsBar on a grid that is not a root instance', () => {
  it('stays disabled and builds no bar', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const nested = new Core(container, {
      licenseKey: TEST_LICENSE_KEY,
      themeName: 'ht-theme-main',
      sheetsBar: { sheets: [{ name: 'One', data: [[1]] }, { name: 'Two', data: [[2]] }] },
    });

    nested.init();

    const plugin = nested.getPlugin('sheetsBar');

    expect(plugin.isEnabled()).toBe(false);
    expect(plugin.enabled).toBe(false);
    expect(container.querySelector('.ht-sheets-bar')).toBeNull();
    expect(nested.getDataAtCell(0, 0)).toBeNull();

    nested.destroy();
    container.remove();
  });
});
