/**
 * Creates a minimal dataProvider config for E2E tests.
 * All callbacks can be overridden. Default fetchRows returns empty data.
 *
 * @param {object} [overrides] Override any of rowId, fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove.
 * @returns {object} DataProvider config object.
 */
export function createDataProviderConfig(overrides = {}) {
  const defaultFetch = params => Promise.resolve({
    rows: [],
    totalRows: 0,
    ...(typeof params !== 'undefined' && { _params: params }),
  });

  return {
    rowId: 'id',
    fetchRows: overrides.fetchRows ?? defaultFetch,
    onRowsCreate: overrides.onRowsCreate ?? (() => Promise.resolve()),
    onRowsUpdate: overrides.onRowsUpdate ?? (() => Promise.resolve()),
    onRowsRemove: overrides.onRowsRemove ?? (() => Promise.resolve()),
    ...overrides,
  };
}
