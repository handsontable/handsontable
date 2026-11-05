import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Once the plugin has been on, a header hook registered in the constructor clears the sort markup
 * while it is off. That hook belongs to the plugin instance, so `destroy()` removes it: a destroyed
 * instance must not keep rewriting the headers of the grid that is still alive.
 */
describe('ColumnSorting header cleanup while off', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ColumnSorting);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('clears the headers while the plugin is off', () => {
    hot = new Handsontable(container, {
      data: [['b'], ['a']],
      colHeaders: true,
      columnSorting: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.updateSettings({ columnSorting: false });

    const plugin = hot.getPlugin('columnSorting');
    const updateHeaderClasses = jest.spyOn(plugin, 'updateHeaderClasses');

    hot.render();

    expect(updateHeaderClasses).toHaveBeenCalled();
  });

  it('stops clearing the headers once the plugin is destroyed', () => {
    hot = new Handsontable(container, {
      data: [['b'], ['a']],
      colHeaders: true,
      columnSorting: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.updateSettings({ columnSorting: false });

    const plugin = hot.getPlugin('columnSorting');
    const updateHeaderClasses = jest.spyOn(plugin, 'updateHeaderClasses');

    plugin.destroy();

    expect(() => hot.render()).not.toThrow();
    expect(updateHeaderClasses).not.toHaveBeenCalled();
  });
});
