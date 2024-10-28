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
    it('should be fired once after initializing HOT', () => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('init');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after moving multiple columns', () => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      const hot = handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      hot.columnIndexMapper.moveIndexes([1, 2], 0);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('move');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after inserting multiple columns', () => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      alter('insert_col_start', 0, 3);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('insert');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after removing multiple columns', () => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      alter('remove_col', 0, 3);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('remove');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after updating indexes using IndexMapper API', () => {
      const afterColumnSequenceChange = jasmine.createSpy('afterColumnSequenceChange');

      const hot = handsontable({
        colHeaders: true,
        afterColumnSequenceChange,
      });

      afterColumnSequenceChange.calls.reset();

      hot.columnIndexMapper.setIndexesSequence([3, 2, 1]);

      expect(afterColumnSequenceChange).toHaveBeenCalledWith('update');
      expect(afterColumnSequenceChange).toHaveBeenCalledTimes(1);
    });
  });
});
