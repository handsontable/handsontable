import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import IndexSyncer from '../indexSyncer';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

/**
 * The axis syncers postpone the initial order only while no engine sheet is bound, and Formulas sets the
 * sync endpoint up with a bound sheet only, so it hands them a postpone callback that does nothing. These
 * tests pin that nothing calls it. A move made with no sheet bound asks for the callback with its move as an
 * argument, which `getPostponeAction()` ignores, so it postpones nothing either.
 */
describe('Formulas postponed index syncs', () => {
  let container;
  let hot;
  let postponed;
  let postponeSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    postponed = jest.fn();
    postponeSpy = jest.spyOn(IndexSyncer.prototype, 'getPostponeAction').mockReturnValue(postponed);
  });

  afterEach(() => {
    postponeSpy.mockRestore();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should postpone no index sync while the order is moved, through init, loads and updates', () => {
    hot = new Handsontable(container, {
      data: [[1, 2, '=A1+B1'], [4, 8, '=A2+B2']],
      colHeaders: true,
      columnSorting: true,
      manualColumnMove: [1, 0, 2],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });

    // The sums do not depend on the column order, and the formulas stay in their column.
    expect(hot.getDataAtCol(2)).toEqual([3, 12]);

    hot.loadData([[5, 7, '=A1+B1'], [8, 9, '=A2+B2']]);
    hot.updateSettings({ manualColumnMove: [1, 0, 2] });
    hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'desc' });

    expect(hot.getDataAtCol(2)).toEqual([17, 12]);
    expect(postponed).not.toHaveBeenCalled();
  });

  it('should postpone the initial order when the sync endpoint is set up with no sheet', () => {
    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      manualColumnMove: [1, 0],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });

    // The control for the test above: the one path that postpones does reach the callback.
    hot.getPlugin('formulas').indexSyncer.setupSyncEndpoint(null, null);

    expect(postponed).toHaveBeenCalledTimes(1);
  });
});
