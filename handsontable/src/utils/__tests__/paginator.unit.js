import { createPaginator } from '../paginator';

describe('Paginator', () => {
  describe('with `initialPage` option', () => {
    it('should create paginator that starts pagination from specified index', () => {
      const p = createPaginator({
        initialPage: 4,
        size: () => 10,
      });

      expect(p.getCurrentPage()).toBe(4);

      p.toNextItem();

      expect(p.getCurrentPage()).toBe(5);

      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(4);
    });

    it('should create paginator that starts pagination from -1 (aka. inactive paginator mode)', () => {
      const p = createPaginator({
        initialPage: -1,
        size: () => 10,
      });

      expect(p.getCurrentPage()).toBe(-1);

      // activates the paginator
      p.toNextItem();

      expect(p.getCurrentPage()).toBe(0);

      // once activated there is no possible to go back to the page at -1 index
      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(9);
    });

    it('should not create paginator with incorrect values', () => {
      const p = createPaginator({
        initialPage: -2,
        size: () => 10,
      });

      expect(p.getCurrentPage()).toBe(-1);
    });

    it('should not create paginator with incorrect values', () => {
      const p = createPaginator({
        initialPage: 10,
        size: () => 10,
      });

      expect(p.getCurrentPage()).toBe(9);
    });
  });

  describe('with `size` option', () => {
    it('should create paginator with a proper size', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.toLastItem();

      expect(p.getCurrentPage()).toBe(9);
    });

    it('should create an empty collection when size is passed as negative value', () => {
      const p = createPaginator({
        size: () => -10,
      });

      p.toLastItem();

      expect(p.getCurrentPage()).toBe(-1);
    });
  });

  describe('with `onItemSelect` option', () => {
    it('should call the function every time the page is changed', () => {
      const onItemSelect = jasmine.createSpy();
      const p = createPaginator({
        size: () => 10,
        onItemSelect,
      });

      expect(onItemSelect).toHaveBeenCalledTimes(0);

      p.toNextItem();

      expect(onItemSelect).toHaveBeenCalledTimes(1);
      expect(onItemSelect).toHaveBeenCalledWith(0, false);

      p.toNextItem();

      expect(onItemSelect).toHaveBeenCalledTimes(2);
      expect(onItemSelect).toHaveBeenCalledWith(1, false);

      p.toLastItem();

      expect(onItemSelect).toHaveBeenCalledTimes(3);
      expect(onItemSelect).toHaveBeenCalledWith(9, false);
    });

    it('should skip the pages when the function returns `false`', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: (currentIndex) => {
          if (currentIndex === 1) {
            return false;
          }
        },
      });

      p.setCurrentPage(0);
      p.toNextItem();

      expect(p.getCurrentPage()).toBe(2);

      p.setCurrentPage(2);
      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should do nothing when function returns `false` and the page is changed directly', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: (currentIndex) => {
          if (currentIndex === 1) {
            return false;
          }
        },
      });

      p.setCurrentPage(1);

      expect(p.getCurrentPage()).toBe(-1);
    });
  });

  describe('with `onClear` option', () => {
    it('should call the function after calling the `clear` method', () => {
      const onClear = jasmine.createSpy();
      const p = createPaginator({
        size: () => 10,
        onClear,
      });

      p.clear();

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('calling `setCurrentPage` method', () => {
    it('should change the page', () => {
      const onItemSelect = jasmine.createSpy();
      const p = createPaginator({
        size: () => 10,
        onItemSelect,
      });

      p.setCurrentPage(3);

      expect(onItemSelect).toHaveBeenCalledTimes(1);
      expect(onItemSelect).toHaveBeenCalledWith(3, true);
      expect(p.getCurrentPage()).toBe(3);
    });

    it('should not change the page when the page is invalid', () => {
      const onItemSelect = jasmine.createSpy();
      const p = createPaginator({
        size: () => 10,
        onItemSelect,
      });

      p.setCurrentPage(20);

      expect(p.getCurrentPage()).toBe(-1);

      p.setCurrentPage(-10);

      expect(p.getCurrentPage()).toBe(-1);

      p.setCurrentPage(-1);

      expect(p.getCurrentPage()).toBe(-1);
      expect(onItemSelect).toHaveBeenCalledTimes(0);
    });
  });

  describe('calling `getCurrentPage` method', () => {
    it('should return current page index', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(3);

      expect(p.getCurrentPage()).toBe(3);
    });
  });

  describe('calling `toFirstItem` method', () => {
    it('should switch the page to the first item', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(5);
      p.toFirstItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should switch the page to the first non-disabled item', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: (currentIndex) => {
          return ![0, 1].includes(currentIndex);
        }
      });

      p.setCurrentPage(5);
      p.toFirstItem();

      expect(p.getCurrentPage()).toBe(2);
    });

    it('should not switch the page when all item are disabled', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: () => {
          return false;
        }
      });

      p.toFirstItem();

      expect(p.getCurrentPage()).toBe(-1);
    });

    it('should switch the page to the first item when there is only one item in the collection', () => {
      const p = createPaginator({
        size: () => 1,
      });

      p.toFirstItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should not change the page when the size of the collection is `0`', () => {
      const p = createPaginator({
        size: () => 0,
      });

      p.toFirstItem();

      expect(p.getCurrentPage()).toBe(-1);
    });
  });

  describe('calling `toLastItem` method', () => {
    it('should switch the page to the last item', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(5);
      p.toLastItem();

      expect(p.getCurrentPage()).toBe(9);
    });

    it('should switch the page to the last non-disabled item', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: (currentIndex) => {
          return ![9, 8, 6].includes(currentIndex);
        }
      });

      p.toLastItem();

      expect(p.getCurrentPage()).toBe(7);
    });

    it('should not switch the page when all item are disabled', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: () => {
          return false;
        }
      });

      p.toLastItem();

      expect(p.getCurrentPage()).toBe(-1);
    });

    it('should switch the page to the last item when there is only one item in the collection', () => {
      const p = createPaginator({
        size: () => 1,
      });

      p.toLastItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should not change the page when the size of the collection is `0`', () => {
      const p = createPaginator({
        size: () => 0,
      });

      p.toLastItem();

      expect(p.getCurrentPage()).toBe(-1);
    });
  });

  describe('calling `toNextItem` method', () => {
    it('should switch the page to the next item', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(5);
      p.toNextItem();

      expect(p.getCurrentPage()).toBe(6);
    });

    it('should switch the page to the first item when the last was selected', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(9);
      p.toNextItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should switch the page to the next non-disabled item', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: (currentIndex) => {
          return ![6, 7, 9].includes(currentIndex);
        }
      });

      p.setCurrentPage(5);
      p.toNextItem();

      expect(p.getCurrentPage()).toBe(8);
    });

    it('should not switch the page when all item are disabled', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: () => {
          return false;
        }
      });

      p.setCurrentPage(5);
      p.toNextItem();

      expect(p.getCurrentPage()).toBe(-1);
    });

    it('should switch the page to the next item when there is only one item in the collection', () => {
      const p = createPaginator({
        size: () => 1,
      });

      p.toNextItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should not change the page when the size of the collection is `0`', () => {
      const p = createPaginator({
        size: () => 0,
      });

      p.toNextItem();

      expect(p.getCurrentPage()).toBe(-1);
    });
  });

  describe('calling `toPreviousItem` method', () => {
    it('should switch the page to the previous item', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(5);
      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(4);
    });

    it('should switch the page to the last item when the first was selected', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(0);
      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(9);
    });

    it('should switch the page to the previous non-disabled item', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: (currentIndex) => {
          return ![0, 2, 3, 4].includes(currentIndex);
        }
      });

      p.setCurrentPage(5);
      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(1);
    });

    it('should not switch the page when all item are disabled', () => {
      const p = createPaginator({
        size: () => 10,
        onItemSelect: () => {
          return false;
        }
      });

      p.setCurrentPage(5);
      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(-1);
    });

    it('should switch the page to the previous item when there is only one item in the collection', () => {
      const p = createPaginator({
        size: () => 1,
      });

      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(0);
    });

    it('should not change the page when the size of the collection is `0`', () => {
      const p = createPaginator({
        size: () => 0,
      });

      p.toPreviousItem();

      expect(p.getCurrentPage()).toBe(-1);
    });
  });

  describe('calling `getSize` method', () => {
    it('should return size of the items to paginate', () => {
      const p = createPaginator({
        size: () => 10,
      });

      expect(p.getSize()).toBe(10);
    });
  });

  describe('calling `clear` method', () => {
    it('should reset the state to the initial values', () => {
      const p = createPaginator({
        size: () => 10,
      });

      p.setCurrentPage(5);
      p.clear();

      expect(p.getCurrentPage()).toBe(-1);
      expect(p.getSize()).toBe(10);
    });
  });
});
