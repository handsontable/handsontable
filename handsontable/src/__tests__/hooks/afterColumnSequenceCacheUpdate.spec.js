describe('Hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('afterColumnSequenceCacheUpdate', () => {
    it('should be fired once after initializing HOT', async() => {
      const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterColumnSequenceCacheUpdate,
      });

      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: jasmine.any(Boolean),
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after moving multiple columns', async() => {
      const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterColumnSequenceCacheUpdate,
      });

      afterColumnSequenceCacheUpdate.calls.reset();

      columnIndexMapper().moveIndexes([1, 2], 0);

      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after inserting multiple columns', async() => {
      const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterColumnSequenceCacheUpdate,
      });

      afterColumnSequenceCacheUpdate.calls.reset();

      await alter('insert_col_start', 0, 3);

      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after removing multiple columns', async() => {
      const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterColumnSequenceCacheUpdate,
      });

      afterColumnSequenceCacheUpdate.calls.reset();

      await alter('remove_col', 0, 3);

      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after updating indexes using IndexMapper API', async() => {
      const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterColumnSequenceCacheUpdate,
      });

      afterColumnSequenceCacheUpdate.calls.reset();

      columnIndexMapper().setIndexesSequence([3, 2, 1]);

      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
