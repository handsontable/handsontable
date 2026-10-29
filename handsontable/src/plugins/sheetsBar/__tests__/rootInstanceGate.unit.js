import '../../../index';
import Core from '../../../core';

describe('SheetsBar on a grid that is not a root instance', () => {
  it('stays disabled and builds no bar', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const nested = new Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
      themeName: 'ht-theme-main',
      sheetsBar: { sheets: [{ name: 'One', data: [[1]] }, { name: 'Two', data: [[2]] }] },
    });

    nested.init();

    const plugin = nested.getPlugin('sheetsBar');

    expect(plugin.isEnabled()).toBe(false);
    expect(plugin.enabled).toBe(false);
    expect(container.querySelector('.ht-sheets-bar')).toBeNull();
    expect(nested.getDataAtCell(0, 0)).not.toBe(2);

    nested.destroy();
    container.remove();
  });
});
