import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { HiddenRows } from '..';
import { TrimRows } from '../../trimRows';

describe('HiddenRows#_replaceHiddenRows', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(HiddenRows);
    registerPlugin(TrimRows);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [`${row}`]),
      hiddenRows: true,
      trimRows: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  /**
   * Reads the physical indexes of the hidden rows straight off the hiding map.
   *
   * @returns {number[]}
   */
  function hiddenPhysical() {
    return hot.rowIndexMapper.hidingMapsCollection.get('HiddenRows').getHiddenIndexes();
  }

  it('replaces the whole hidden set by physical indexes', () => {
    const plugin = hot.getPlugin('hiddenRows');

    plugin.hideRows([0, 1]);
    plugin._replaceHiddenRows([4, 5]);

    expect(hiddenPhysical()).toEqual([4, 5]);
  });

  it('shows and hides a row that a trimming map removed from the visual space', () => {
    const plugin = hot.getPlugin('hiddenRows');

    plugin.hideRows([1, 3]);
    hot.getPlugin('trimRows').trimRows([3]);

    plugin._replaceHiddenRows([1, 5]);

    expect(hiddenPhysical()).toEqual([1, 5]);

    plugin._replaceHiddenRows([]);

    expect(hiddenPhysical()).toEqual([]);
  });

  it('ignores an index outside the data', () => {
    hot.getPlugin('hiddenRows')._replaceHiddenRows([2, 99, -1, 1.5]);

    expect(hiddenPhysical()).toEqual([2]);
  });

  it('runs the before and after hooks with valid-config flags, and only the ones that apply', () => {
    const plugin = hot.getPlugin('hiddenRows');
    const calls = [];

    ['beforeHideRows', 'afterHideRows', 'beforeUnhideRows', 'afterUnhideRows'].forEach((name) => {
      hot.addHook(name, (current, destination, valid) => {
        calls.push([name, current, destination, valid]);
      });
    });

    plugin._replaceHiddenRows([2]);

    expect(calls.map(call => call[0])).toEqual(['beforeHideRows', 'afterHideRows']);
    expect(calls[0]).toEqual(['beforeHideRows', [], [2], true]);

    calls.length = 0;
    plugin._replaceHiddenRows([]);

    expect(calls.map(call => call[0])).toEqual(['beforeUnhideRows', 'afterUnhideRows']);
  });

  it('changes nothing when a before hook vetoes, and fires no after hook', () => {
    const plugin = hot.getPlugin('hiddenRows');
    const afterHide = jest.fn();

    plugin.hideRows([1]);
    hot.addHook('beforeUnhideRows', () => false);
    hot.addHook('afterHideRows', afterHide);
    afterHide.mockClear();

    plugin._replaceHiddenRows([4]);

    expect(hiddenPhysical()).toEqual([1]);
    expect(afterHide).not.toHaveBeenCalled();
  });
});
