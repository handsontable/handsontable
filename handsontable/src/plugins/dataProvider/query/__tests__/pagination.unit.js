import {
  applyPaginationToQueryFromPlugin,
  applyPaginationToQueryParameters,
  getPagedRowHeaderIndex,
  handleAfterPageChangeExternalPagination,
  handleAfterPageSizeChangeExternalPagination,
  normalizeExternalPaginationPageSize,
} from '../pagination';

describe('dataProvider/query/pagination', () => {
  describe('applyPaginationToQueryParameters', () => {
    it('should copy numeric pageSize and initialPage when pagination is enabled', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 25, initialPage: 3 }[key]),
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(25);
      expect(query.page).toBe(3);
    });

    it('should ignore non-numeric pageSize and initialPage below 1', () => {
      const query = { page: 2, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 'auto', initialPage: 0 }[key]),
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(10);
      expect(query.page).toBe(2);
    });

    it('should prefer getCurrentPage over initialPage', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 5, initialPage: 1 }[key]),
        getCurrentPage: () => 4,
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(5);
      expect(query.page).toBe(4);
    });

    it('should prefer getCurrentPageSize over getSetting("pageSize")', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 5, initialPage: 1 }[key]),
        getCurrentPageSize: () => 50,
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(50);
    });

    it('should fall back to getSetting("pageSize") when getCurrentPageSize returns "auto"', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 25, initialPage: 1 }[key]),
        getCurrentPageSize: () => 'auto',
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(25);
    });

    it('should fall back to getSetting("pageSize") when getCurrentPageSize returns non-numeric value', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 25, initialPage: 1 }[key]),
        getCurrentPageSize: () => undefined,
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(25);
    });

    it('should no-op when plugin is missing or disabled', () => {
      const query = { page: 1, pageSize: 10 };

      applyPaginationToQueryParameters(null, query);
      applyPaginationToQueryParameters({ enabled: false, getSetting: () => 99 }, query);

      expect(query).toEqual({ page: 1, pageSize: 10 });
    });
  });

  describe('normalizeExternalPaginationPageSize', () => {
    it('should return fallback for auto and invalid values', () => {
      expect(normalizeExternalPaginationPageSize('auto', 10)).toBe(10);
      expect(normalizeExternalPaginationPageSize(0, 10)).toBe(10);
      expect(normalizeExternalPaginationPageSize(-1, 7)).toBe(7);
      expect(normalizeExternalPaginationPageSize(NaN, 5)).toBe(5);
    });

    it('should return positive numbers unchanged', () => {
      expect(normalizeExternalPaginationPageSize(20, 10)).toBe(20);
    });
  });

  describe('getPagedRowHeaderIndex', () => {
    it('should offset row index by (page - 1) * pageSize', () => {
      expect(getPagedRowHeaderIndex({ page: 1, pageSize: 10 }, 0)).toBe(0);
      expect(getPagedRowHeaderIndex({ page: 2, pageSize: 10 }, 0)).toBe(10);
      expect(getPagedRowHeaderIndex({ page: 3, pageSize: 5 }, 2)).toBe(12);
    });

    it('should use fallback page size when query pageSize is invalid', () => {
      expect(getPagedRowHeaderIndex({ page: 2, pageSize: 0 }, 0, 10)).toBe(10);
    });
  });

  describe('applyPaginationToQueryFromPlugin', () => {
    it('should delegate to Pagination plugin via hot.getPlugin', () => {
      const queryParameters = { page: 1, pageSize: 10 };
      const paginationPlugin = {
        enabled: true,
        getSetting: key => ({ pageSize: 25, initialPage: 2 }[key]),
      };
      const hot = {
        getPlugin: key => (key === 'pagination' ? paginationPlugin : null),
      };

      applyPaginationToQueryFromPlugin(hot, queryParameters);

      expect(queryParameters.pageSize).toBe(25);
      expect(queryParameters.page).toBe(2);
    });
  });

  describe('handleAfterPageChangeExternalPagination', () => {
    it('should no-op when Pagination plugin is disabled', () => {
      const goToPage = jasmine.createSpy('goToPage').and.returnValue(Promise.resolve());
      const hot = {
        getPlugin: () => ({ enabled: false }),
      };

      handleAfterPageChangeExternalPagination(
        {
          hot,
          getQueryPage: () => 1,
          goToPage,
        },
        1,
        2
      );

      expect(goToPage).not.toHaveBeenCalled();
    });

    it('should no-op when new page already matches query parameters', () => {
      const goToPage = jasmine.createSpy('goToPage').and.returnValue(Promise.resolve());
      const hot = {
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageChangeExternalPagination(
        {
          hot,
          getQueryPage: () => 2,
          goToPage,
        },
        1,
        2
      );

      expect(goToPage).not.toHaveBeenCalled();
    });

    it('should call goToPage when pagination is enabled and page changed', () => {
      const goToPage = jasmine.createSpy('goToPage').and.returnValue(Promise.resolve());
      const hot = {
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageChangeExternalPagination(
        {
          hot,
          getQueryPage: () => 1,
          goToPage,
        },
        1,
        2
      );

      expect(goToPage).toHaveBeenCalledWith(2);
    });
  });

  describe('handleAfterPageSizeChangeExternalPagination', () => {
    it('should no-op when Pagination plugin is disabled', () => {
      const setPageSize = jasmine.createSpy('setPageSize').and.returnValue(Promise.resolve());
      const hot = {
        getPlugin: () => ({ enabled: false }),
      };

      handleAfterPageSizeChangeExternalPagination(
        {
          hot,
          getQueryPage: () => 1,
          getQueryPageSize: () => 10,
          setPageSize,
        },
        10,
        20
      );

      expect(setPageSize).not.toHaveBeenCalled();
    });

    it('should no-op when normalized size and page already match query', () => {
      const setPageSize = jasmine.createSpy('setPageSize').and.returnValue(Promise.resolve());
      const hot = {
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageSizeChangeExternalPagination(
        {
          hot,
          getQueryPage: () => 1,
          getQueryPageSize: () => 10,
          setPageSize,
        },
        10,
        10
      );

      expect(setPageSize).not.toHaveBeenCalled();
    });

    it('should call setPageSize when page size changes', () => {
      const setPageSize = jasmine.createSpy('setPageSize').and.returnValue(Promise.resolve());
      const hot = {
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageSizeChangeExternalPagination(
        {
          hot,
          getQueryPage: () => 1,
          getQueryPageSize: () => 10,
          setPageSize,
        },
        10,
        20
      );

      expect(setPageSize).toHaveBeenCalledWith(20);
    });
  });
});
