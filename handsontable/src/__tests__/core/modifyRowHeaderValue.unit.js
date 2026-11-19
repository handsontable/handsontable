import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * Builds a 3-row grid with row headers and the given settings.
 *
 * @param {object} settings Extra settings.
 * @returns {{ hot: Handsontable, destroy: Function }}
 */
function createGrid(settings) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: [['a'], ['b'], ['c']],
    rowHeaders: ['One', 'Two', 'Three'],
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });

  return {
    hot,
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('Core#getRowHeader and the `modifyRowHeaderValue` hook', () => {
  it('should pass the configured value and the visual row to the hook, and return what it returns', () => {
    const modifyRowHeaderValue = jest.fn((value, row) => (row === 1 ? `${value}!` : value));
    const { hot, destroy } = createGrid({ modifyRowHeaderValue });

    expect(hot.getRowHeader(1)).toBe('Two!');
    expect(modifyRowHeaderValue).toHaveBeenCalledWith('Two', 1);
    expect(hot.getRowHeader()).toEqual(['One', 'Two!', 'Three']);
    destroy();
  });

  it('should return the configured value when no listener is registered', () => {
    const { hot, destroy } = createGrid();

    expect(hot.getRowHeader(2)).toBe('Three');
    destroy();
  });
});
