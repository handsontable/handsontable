import {
  createServerState,
  cloneServerState,
  replaceArrayContents,
} from 'handsontable/plugins/dataProvider/sheetState';

describe('dataProvider sheetState', () => {
  it('replaceArrayContents swaps the contents and keeps the array identity', () => {
    const target = [{ id: 1 }, { id: 2 }];
    const rows = [{ id: 3 }];

    expect(replaceArrayContents(target, rows)).toBe(true);
    expect(target).toEqual([{ id: 3 }]);
    expect(target).not.toBe(rows);
  });

  it('replaceArrayContents refuses a non-array target', () => {
    expect(replaceArrayContents(null, [{ id: 1 }])).toBe(false);
  });

  it('replaceArrayContents handles more rows than the call stack allows as arguments', () => {
    const target = [];
    const rows = Array.from({ length: 200000 }, (_, i) => ({ id: i }));

    replaceArrayContents(target, rows);

    expect(target.length).toBe(200000);
  });

  it('cloneServerState copies the query deeply and keeps the payload', () => {
    const state = createServerState({ page: 2, pageSize: 5, sort: { prop: 'id', order: 'desc' }, filters: null });

    state.lastResult = { rows: [], totalRows: 25 };
    const copy = cloneServerState(state);

    copy.queryParameters.sort.order = 'asc';

    expect(state.queryParameters.sort.order).toBe('desc');
    expect(copy.lastResult.totalRows).toBe(25);
    expect(copy.hasFailure).toBe(false);
  });
});
