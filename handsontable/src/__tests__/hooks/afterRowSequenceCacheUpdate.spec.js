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

  describe('afterRowSequenceCacheUpdate', () => {
    it('should be fired once after initializing HOT', async() => {
      const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterRowSequenceCacheUpdate,
      });

      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: jasmine.any(Boolean),
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after moving multiple rows', async() => {
      const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterRowSequenceCacheUpdate,
      });

      afterRowSequenceCacheUpdate.calls.reset();

      rowIndexMapper().moveIndexes([1, 2], 0);

      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after inserting multiple rows', async() => {
      const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterRowSequenceCacheUpdate,
      });

      afterRowSequenceCacheUpdate.calls.reset();

      await alter('insert_row_above', 0, 3);

      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after removing multiple rows', async() => {
      const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterRowSequenceCacheUpdate,
      });

      afterRowSequenceCacheUpdate.calls.reset();

      await alter('remove_row', 0, 3);

      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after updating indexes using IndexMapper API', async() => {
      const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');

      handsontable({
        colHeaders: true,
        afterRowSequenceCacheUpdate,
      });

      afterRowSequenceCacheUpdate.calls.reset();

      rowIndexMapper().setIndexesSequence([3, 2, 1]);

      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
        indexesSequenceChanged: true,
        trimmedIndexesChanged: jasmine.any(Boolean),
        hiddenIndexesChanged: jasmine.any(Boolean),
      }));
      expect(afterRowSequenceCacheUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
