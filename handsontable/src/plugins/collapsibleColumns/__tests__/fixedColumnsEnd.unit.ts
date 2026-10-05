import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  CollapsibleColumns,
  NestedHeaders,
} from 'handsontable/plugins';

registerPlugin(CollapsibleColumns);
registerPlugin(NestedHeaders);

/**
 * Builds a 12 column grid with one collapsible group over the columns 8 to 10.
 *
 * @param {number} fixedColumnsEnd How many columns are frozen at the inline end.
 * @returns {Handsontable} The instance.
 */
function buildGrid(fixedColumnsEnd: number) {
  return new Handsontable(document.createElement('div'), {
    data: [Array.from({ length: 12 }, (_, c) => `C${c}`)],
    colHeaders: true,
    nestedHeaders: [
      [{ label: 'A', colspan: 8 }, { label: 'G', colspan: 3 }, 'Z'],
      Array.from({ length: 12 }, (_, c) => `c${c}`),
    ],
    collapsibleColumns: true,
    fixedColumnsEnd,
    licenseKey: 'non-commercial-and-evaluation',
  });
}

/**
 * Asks the plugin to decorate the top-level header of the group, the way a draw does, and reports whether it
 * got a toggle.
 *
 * @param {Handsontable} hot The instance.
 * @returns {boolean}
 */
function groupHasToggle(hot: Handsontable) {
  const th = document.createElement('th');

  th.appendChild(document.createElement('div'));

  hot.runHooks('afterGetColHeader', 8, th, 0);

  return th.querySelector('.collapsibleIndicator') !== null;
}

describe('CollapsibleColumns with fixedColumnsEnd', () => {
  it('should give the group a toggle while it is clear of the end band', () => {
    const hot = buildGrid(1);

    expect(groupHasToggle(hot)).toBe(true);

    hot.destroy();
  });

  it('should give the group no toggle when its authored range reaches the end band', () => {
    const hot = buildGrid(2);

    expect(groupHasToggle(hot)).toBe(false);

    hot.destroy();
  });

  it('should judge the group by the same range whether it is collapsed or expanded', () => {
    const hot = buildGrid(2);
    const collapsible = hot.getPlugin('collapsibleColumns');

    // Expanded: the column 10 is in the band (columns 10 and 11).
    const expanded = groupHasToggle(hot);

    collapsible.collapseSection({ row: -2, col: 8 });
    hot.render();

    expect(hot.columnIndexMapper.isHidden(hot.toPhysicalColumn(9))).toBe(true);
    expect(hot.columnIndexMapper.isHidden(hot.toPhysicalColumn(10))).toBe(true);

    // Collapsed: the columns 9 and 10 are hidden, and the group's visible end (8) is clear of the band.
    const collapsed = groupHasToggle(hot);

    expect(expanded).toBe(false);
    expect(collapsed).toBe(expanded);

    hot.destroy();
  });
});
