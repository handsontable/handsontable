/**
 * Helpers for whether the Empty Data State plugin should show DataProvider loading UI.
 * The loading `message` `source` is the literal `'loading'` (see EmptyDataState plugin).
 */

/**
 * Compare query parameters: same `page`, `pageSize`, and `filters` (`sort` ignored).
 *
 * @param {{ page: number, pageSize: number, filters: *, sort: * }} a Query parameters (`sort` ignored for this comparison).
 * @param {{ page: number, pageSize: number, filters: *, sort: * }} b Query parameters.
 * @returns {boolean} Same `page`, `pageSize`, and `filters` (`sort` ignored).
 */
export function samePageAndFilters(a, b) {
  return a.page === b.page && a.pageSize === b.pageSize &&
    JSON.stringify(a.filters) === JSON.stringify(b.filters);
}

/**
 * @param {{ page: number, pageSize: number, filters: *, sort: * }} inFlight In-flight query parameters.
 * @param {{ page: number, pageSize: number, filters: *, sort: * }} lastLoaded Last successful load query parameters.
 * @returns {boolean} True when only `sort` differs (server-side sort refetch).
 */
export function isSortOnlyVersusLastLoaded(inFlight, lastLoaded) {
  if (!samePageAndFilters(inFlight, lastLoaded)) {
    return false;
  }

  return JSON.stringify(inFlight.sort) !== JSON.stringify(lastLoaded.sort);
}

/**
 * @param {{ page: number, pageSize: number, filters: *, sort: * }} inFlight In-flight query parameters.
 * @param {{ page: number, pageSize: number, filters: *, sort: * }} lastLoaded Last successful load query parameters.
 * @returns {boolean} True when `page`, `pageSize`, or `filters` differ.
 */
export function fetchTargetsNewDatasetVersusLastLoaded(inFlight, lastLoaded) {
  return !samePageAndFilters(inFlight, lastLoaded);
}

/**
 * @param {object} options Computation inputs.
 * @param {number} options.fetchInFlightCount Number of in-flight `fetchData` calls.
 * @param {{ page: number, pageSize: number, sort: *, filters: * }|null} options.inFlightQueryParameters Latest in-flight params.
 * @param {{ page: number, pageSize: number, sort: *, filters: * }} options.lastLoadedQueryParameters Params for the dataset currently in the grid.
 * @param {object|null|undefined} options.view Table view with `countRenderableColumns` and `countRenderableRows`, if available.
 * @returns {boolean} Whether the loading overlay should show for DataProvider fetches.
 */
export function computeEmptyStateLoadingActive(options) {
  const {
    fetchInFlightCount,
    inFlightQueryParameters: inFlight,
    lastLoadedQueryParameters: lastLoaded,
    view,
  } = options;

  if (fetchInFlightCount === 0 || !view) {
    return false;
  }

  if (inFlight && isSortOnlyVersusLastLoaded(inFlight, lastLoaded)) {
    return false;
  }

  const empty = view.countRenderableColumns() === 0 ||
    view.countRenderableRows() === 0;

  if (empty) {
    return true;
  }

  if (!inFlight) {
    return false;
  }

  return fetchTargetsNewDatasetVersusLastLoaded(inFlight, lastLoaded);
}
