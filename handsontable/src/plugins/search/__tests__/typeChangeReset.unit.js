import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('Search: results after a grid-level type change', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should clear the results with the cell meta cache, and apply them again on the next query', () => {
    hot = new Handsontable(container, {
      data: [['apple', 'pear'], ['plum', 'grape']],
      type: 'text',
      search: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    const plugin = hot.getPlugin('search');

    plugin.query('apple');

    expect(hot.getCellMeta(0, 0).isSearchResult).toBe(true);

    hot.updateSettings({ type: 'numeric' });

    // The plugin writes `isSearchResult` straight onto the stored meta, which a type change resets.
    expect(hot.getCellMeta(0, 0).isSearchResult).toBeUndefined();

    plugin.query('apple');

    expect(hot.getCellMeta(0, 0).isSearchResult).toBe(true);
  });
});
