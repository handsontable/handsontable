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

  describe('afterColumnSequenceChange', () => {
    it('should be fired once after initializing HOT', async() => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('init');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after moving multiple columns', async() => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      columnIndexMapper().moveIndexes([1, 2], 0);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('move');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after inserting multiple columns', async() => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      await alter('insert_col_start', 0, 3);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('insert');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after removing multiple columns', async() => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      await alter('remove_col', 0, 3);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('remove');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after updating indexes using IndexMapper API', async() => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      columnIndexMapper().setIndexesSequence([3, 2, 1]);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('update');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });
  });
});
