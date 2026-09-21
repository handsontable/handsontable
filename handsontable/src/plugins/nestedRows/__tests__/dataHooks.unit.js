import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { NestedRows } from '../nestedRows';

describe('NestedRows data hooks', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(NestedRows);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  it('stays enabled when a host `beforeLoadData` hook replaces a flat array with a nested one', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    hot = new Handsontable(container, {
      data: [['flat', 'placeholder']],
      nestedRows: true,
      beforeLoadData(sourceData, initialLoad) {
        return initialLoad ? [{ a: 'Root', __children: [{ a: 'Leaf' }] }] : sourceData;
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const nestedRows = hot.getPlugin('nestedRows');

    expect(nestedRows.isEnabled()).toBe(true);
    expect(hot.getSettings().nestedRows).toBe(true);
    expect(hot.countRows()).toBe(2);
    expect(hot.getData().map(row => row[0])).toEqual(['Root', 'Leaf']);
    expect(nestedRows.dataManager.hasChildren(0)).toBe(true);
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('Nested Rows plugin requires'));
  });
});
