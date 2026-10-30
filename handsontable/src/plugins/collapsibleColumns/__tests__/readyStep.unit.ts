import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  CollapsibleColumns,
  NestedHeaders,
} from 'handsontable/plugins';

registerPlugin(CollapsibleColumns);
registerPlugin(NestedHeaders);

const NESTED_HEADERS = [
  [{ label: 'Group', colspan: 2 }, 'C'],
  ['A', 'B', 'C'],
];

describe('NestedHeaders and CollapsibleColumns ready steps', () => {
  let container: HTMLDivElement;
  let hot: Handsontable | null;
  let nestedHeadersStep: jest.SpyInstance;
  let collapsibleColumnsStep: jest.SpyInstance;
  let renderSpy: jest.Mock;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    nestedHeadersStep = jest.spyOn(NestedHeaders.prototype, 'onGridReady');
    collapsibleColumnsStep = jest.spyOn(CollapsibleColumns.prototype, 'onGridReady');
    renderSpy = jest.fn();
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  const createGrid = (settings: Handsontable.GridSettings = {}) => {
    hot = new Handsontable(container, {
      data: [[1, 2, 3], [4, 5, 6]],
      colHeaders: true,
      afterRender: renderSpy,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  };

  // The labels the header state holds, per level. jsdom lays nothing out, so the render draws only the first columns.
  const headerLabels = () => [0, 1].map(level => [0, 1, 2]
    .map(column => hot!.getPlugin('nestedHeaders').getHeaderSettings(level, column)?.label));
  // The labels the last render drew in the top header row, without the collapse indicator's `+`/`-` text.
  const drawnTopLabels = () => Array.from(container.querySelectorAll('.ht_master thead tr:first-child th'))
    .map(th => th.textContent?.replace(/[+-]$/, ''));

  it('should build the header state once at init, NestedHeaders first, before the first render', () => {
    createGrid({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    expect(nestedHeadersStep).toHaveBeenCalledTimes(1);
    expect(collapsibleColumnsStep).toHaveBeenCalledTimes(1);
    expect(nestedHeadersStep.mock.invocationCallOrder[0])
      .toBeLessThan(collapsibleColumnsStep.mock.invocationCallOrder[0]);
    expect(collapsibleColumnsStep.mock.invocationCallOrder[0]).toBeLessThan(renderSpy.mock.invocationCallOrder[0]);
    expect(headerLabels()).toEqual([['Group', '', 'C'], ['A', 'B', 'C']]);
    expect(drawnTopLabels()).toEqual(['Group', '']);
    expect(container.querySelectorAll('.ht_master .collapsibleIndicator').length).toBe(1);
  });

  it('should build the header state once when `updateSettings()` turns both plugins on', () => {
    createGrid();

    const setStateSpy = jest.spyOn(hot!.getPlugin('nestedHeaders').getStateManager(), 'setState');
    const mapStateSpy = jest.spyOn(hot!.getPlugin('nestedHeaders').getStateManager(), 'mapState');

    renderSpy.mockClear();
    hot!.updateSettings({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    expect(setStateSpy).toHaveBeenCalledTimes(1);
    expect(mapStateSpy).toHaveBeenCalledTimes(1);
    expect(nestedHeadersStep.mock.invocationCallOrder[0])
      .toBeLessThan(collapsibleColumnsStep.mock.invocationCallOrder[0]);
    expect(collapsibleColumnsStep.mock.invocationCallOrder[0]).toBeLessThan(renderSpy.mock.invocationCallOrder[0]);
    expect(headerLabels()).toEqual([['Group', '', 'C'], ['A', 'B', 'C']]);
    expect(drawnTopLabels()).toEqual(['Group', '']);
    expect(container.querySelectorAll('.ht_master .collapsibleIndicator').length).toBe(1);
  });

  it('should draw a new `nestedHeaders` configuration in the render of the same `updateSettings()`', () => {
    createGrid({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    hot!.updateSettings({
      nestedHeaders: [
        ['X', { label: 'Pair', colspan: 2 }],
        ['A', 'B', 'C'],
      ],
    });

    expect(headerLabels()).toEqual([['X', 'Pair', ''], ['A', 'B', 'C']]);
    // The render draws a group whole, so the placeholder cell `Pair` covers is drawn too.
    expect(drawnTopLabels()).toEqual(['X', 'Pair', '']);
    expect(container.querySelectorAll('.ht_master .collapsibleIndicator').length).toBe(1);
  });

  it('should rebuild the header state and its `collapsible` flags once on `loadData()`, before the load\'s render', () => {
    createGrid({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    const setStateSpy = jest.spyOn(hot!.getPlugin('nestedHeaders').getStateManager(), 'setState');
    const mapStateSpy = jest.spyOn(hot!.getPlugin('nestedHeaders').getStateManager(), 'mapState');

    renderSpy.mockClear();

    hot!.loadData([[7, 8, 9], [10, 11, 12], [13, 14, 15]]);

    // The rebuild drops the flags, and CollapsibleColumns writes them again from NestedHeaders' local hook.
    expect(setStateSpy).toHaveBeenCalledTimes(1);
    expect(mapStateSpy).toHaveBeenCalledTimes(1);
    expect(setStateSpy.mock.invocationCallOrder[0]).toBeLessThan(mapStateSpy.mock.invocationCallOrder[0]);
    expect(mapStateSpy.mock.invocationCallOrder[0]).toBeLessThan(renderSpy.mock.invocationCallOrder[0]);
    expect(headerLabels()).toEqual([['Group', '', 'C'], ['A', 'B', 'C']]);
    expect(drawnTopLabels()).toEqual(['Group', '']);
    expect(container.querySelectorAll('.ht_master .collapsibleIndicator').length).toBe(1);
  });

  it('should let an `afterLoadData` listener collapse the groups of the loaded headers', () => {
    createGrid({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    const collapsibleColumns = hot!.getPlugin('collapsibleColumns');

    hot!.addHook('afterLoadData', () => collapsibleColumns.collapseAll());
    hot!.loadData([[7, 8, 9], [10, 11, 12]]);

    // The tree and the hiding map agree: the group is collapsed, and its second column is the one hidden.
    expect(hot!.getPlugin('nestedHeaders').getHeaderSettings(0, 0)?.isCollapsed).toBe(true);
    expect(collapsibleColumns.getCollapsedColumns()).toEqual([1]);
  });

  it('should rebuild the header state once for a direct `updatePlugin()` call', () => {
    createGrid({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    const setStateSpy = jest.spyOn(hot!.getPlugin('nestedHeaders').getStateManager(), 'setState');

    hot!.getPlugin('nestedHeaders').updatePlugin();

    expect(setStateSpy).toHaveBeenCalledTimes(1);
  });
});
