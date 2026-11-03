import Handsontable from 'handsontable/base';
import { NestedHeaders, ManualColumnMove, ManualColumnFreeze, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(NestedHeaders);
registerPlugin(ManualColumnMove);
registerPlugin(ManualColumnFreeze);

/**
 * `beforeColumnMove` makes NestedHeaders capture the moved columns, and the capture is released when the move
 * reaches the index mapper. A move that changes nothing never does, so `afterColumnMove` has to release it.
 */
describe('NestedHeaders – a column move that changes nothing', () => {
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

  /**
   * Creates a grid with a group `A` over three columns, followed by the single columns `D` and `E`.
   *
   * @returns {object} The Handsontable instance.
   */
  function createGrid() {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['a1', 'b1', 'c1', 'd1', 'e1']],
      manualColumnMove: true,
      manualColumnFreeze: true,
      nestedHeaders: [
        [{ label: 'A', colspan: 3 }, 'D', 'E'],
        ['a', 'b', 'c', 'd', 'e'],
      ],
    });

    return hot;
  }

  /**
   * Reads the column span of the top level header that starts at the given visual column.
   *
   * @param {number} column The visual column.
   * @returns {number}
   */
  function topLevelColspan(column) {
    return hot.getPlugin('nestedHeaders').getStateManager().getHeaderSettings(0, column).colspan;
  }

  it('should not let a later freeze re-parent the columns of the move', () => {
    const plugin = createGrid().getPlugin('manualColumnMove');

    // Column `D` is dropped into the middle of group `A`, which adopts it.
    expect(plugin.moveColumns([3], 1)).toBe(true);
    expect(topLevelColspan(0)).toBe(4);

    // Dropping a column onto its own position changes nothing.
    expect(plugin.moveColumns([1], 1)).toBe(false);
    expect(topLevelColspan(0)).toBe(4);

    // The freeze moves a column without `beforeColumnMove`, so it must not meet the capture of the no-op.
    hot.getPlugin('manualColumnFreeze').freezeColumn(1);

    expect(topLevelColspan(0)).toBe(4);
  });
});
