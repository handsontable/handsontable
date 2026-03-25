import {
  handleAfterPageChangeExternalPagination,
  handleAfterPageSizeChangeExternalPagination,
} from '../pagination';

const completeDataProvider = {
  rowId: 'id',
  fetchRows: () => {},
  onRowsCreate: () => {},
  onRowsUpdate: () => {},
  onRowsRemove: () => {},
};

describe('dataProvider/query/pagination', () => {
  describe('handleAfterPageChangeExternalPagination', () => {
    it('should no-op when dataProvider settings are not complete', () => {
      const goToPage = jasmine.createSpy('goToPage');
      const hot = {
        getSettings: () => ({ dataProvider: {} }),
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageChangeExternalPagination(
        {
          isEnabled: () => false,
          hot,
          getQueryPage: () => 1,
          goToPage,
        },
        1,
        2
      );

      expect(goToPage).not.toHaveBeenCalled();
    });

    it('should call goToPage when pagination is enabled and dataProvider is complete', () => {
      const goToPage = jasmine.createSpy('goToPage').and.returnValue(Promise.resolve());
      const hot = {
        getSettings: () => ({ dataProvider: completeDataProvider }),
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageChangeExternalPagination(
        {
          isEnabled: () => true,
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
    it('should no-op when dataProvider settings are not complete', () => {
      const setPageSize = jasmine.createSpy('setPageSize');
      const hot = {
        getSettings: () => ({ dataProvider: {} }),
        getPlugin: () => ({ enabled: true }),
      };

      handleAfterPageSizeChangeExternalPagination(
        {
          isEnabled: () => false,
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
  });
});
