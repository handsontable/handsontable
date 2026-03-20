import {
  computeEmptyStateLoadingActive,
  fetchTargetsNewDatasetVersusLastLoaded,
  isSortOnlyVersusLastLoaded,
  samePageAndFilters,
} from '../loading';

describe('dataProvider loading helpers', () => {
  const lastLoaded = {
    page: 1,
    pageSize: 10,
    sort: null,
    filters: null,
  };

  const viewEmpty = {
    countRenderableColumns: () => 2,
    countRenderableRows: () => 0,
  };

  const viewWithRows = {
    countRenderableColumns: () => 2,
    countRenderableRows: () => 3,
  };

  describe('samePageAndFilters', () => {
    it('should compare page, pageSize, and filters only', () => {
      expect(samePageAndFilters(lastLoaded, lastLoaded)).toBe(true);
      expect(samePageAndFilters(lastLoaded, { ...lastLoaded, page: 2 })).toBe(false);
      expect(samePageAndFilters(lastLoaded, { ...lastLoaded, sort: { foo: 1 } })).toBe(true);
    });
  });

  describe('isSortOnlyVersusLastLoaded', () => {
    it('should be true when page and filters match but sort differs', () => {
      expect(isSortOnlyVersusLastLoaded(
        { ...lastLoaded, sort: { prop: 'name', order: 'asc' } },
        lastLoaded
      )).toBe(true);
    });

    it('should be false when page differs', () => {
      expect(isSortOnlyVersusLastLoaded(
        { ...lastLoaded, page: 2, sort: { prop: 'name', order: 'asc' } },
        lastLoaded
      )).toBe(false);
    });

    it('should be false when sort matches', () => {
      const withSort = { ...lastLoaded, sort: { prop: 'name', order: 'asc' } };

      expect(isSortOnlyVersusLastLoaded(withSort, { ...withSort })).toBe(false);
    });
  });

  describe('fetchTargetsNewDatasetVersusLastLoaded', () => {
    it('should be true when page differs', () => {
      expect(fetchTargetsNewDatasetVersusLastLoaded(
        { ...lastLoaded, page: 2 },
        lastLoaded
      )).toBe(true);
    });

    it('should be true when pageSize differs', () => {
      expect(fetchTargetsNewDatasetVersusLastLoaded(
        { ...lastLoaded, pageSize: 25 },
        lastLoaded
      )).toBe(true);
    });

    it('should be true when filters differ', () => {
      expect(fetchTargetsNewDatasetVersusLastLoaded(
        { ...lastLoaded, filters: { a: 1 } },
        lastLoaded
      )).toBe(true);
    });

    it('should be false when only sort differs', () => {
      expect(fetchTargetsNewDatasetVersusLastLoaded(
        { ...lastLoaded, sort: { prop: 'name', order: 'asc' } },
        lastLoaded
      )).toBe(false);
    });
  });

  describe('computeEmptyStateLoadingActive', () => {
    it('should be false when nothing is in flight', () => {
      expect(computeEmptyStateLoadingActive({
        fetchInFlightCount: 0,
        inFlightQueryParameters: null,
        lastLoadedQueryParameters: lastLoaded,
        view: viewEmpty,
      })).toBe(false);
    });

    it('should be true when in flight and the grid has no renderable rows', () => {
      expect(computeEmptyStateLoadingActive({
        fetchInFlightCount: 1,
        inFlightQueryParameters: { ...lastLoaded },
        lastLoadedQueryParameters: lastLoaded,
        view: viewEmpty,
      })).toBe(true);
    });

    it('should be false for sort-only refetch when rows are visible', () => {
      expect(computeEmptyStateLoadingActive({
        fetchInFlightCount: 1,
        inFlightQueryParameters: { ...lastLoaded, sort: { prop: 'name', order: 'asc' } },
        lastLoadedQueryParameters: lastLoaded,
        view: viewWithRows,
      })).toBe(false);
    });

    it('should be true for a page change while rows from the previous page are visible', () => {
      expect(computeEmptyStateLoadingActive({
        fetchInFlightCount: 1,
        inFlightQueryParameters: { ...lastLoaded, page: 2 },
        lastLoadedQueryParameters: lastLoaded,
        view: viewWithRows,
      })).toBe(true);
    });

    it('should be false when in flight but inFlightQueryParameters is null', () => {
      expect(computeEmptyStateLoadingActive({
        fetchInFlightCount: 1,
        inFlightQueryParameters: null,
        lastLoadedQueryParameters: lastLoaded,
        view: viewWithRows,
      })).toBe(false);
    });
  });
});
