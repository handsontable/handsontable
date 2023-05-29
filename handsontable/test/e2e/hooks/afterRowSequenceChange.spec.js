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

  describe('afterRowSequenceChange', () => {
    it('should be fired once after initializing HOT', () => {
      const afterRowSequenceChange = jasmine.createSpy('afterRowSequenceChange');

      handsontable({
        colHeaders: true,
        afterRowSequenceChange,
      });

      expect(afterRowSequenceChange).toHaveBeenCalledWith('init');
      expect(afterRowSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after moving multiple columns', () => {
      const afterRowSequenceChange = jasmine.createSpy('afterRowSequenceChange');

      const hot = handsontable({
        colHeaders: true,
        afterRowSequenceChange,
      });

      afterRowSequenceChange.calls.reset();

      hot.rowIndexMapper.moveIndexes([1, 2], 0);

      expect(afterRowSequenceChange).toHaveBeenCalledWith('move');
      expect(afterRowSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after inserting multiple columns', () => {
      const afterRowSequenceChange = jasmine.createSpy('afterRowSequenceChange');

      handsontable({
        colHeaders: true,
        afterRowSequenceChange,
      });

      afterRowSequenceChange.calls.reset();

      alter('insert_row_above', 0, 3);

      expect(afterRowSequenceChange).toHaveBeenCalledWith('insert');
      expect(afterRowSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after removing multiple columns', () => {
      const afterRowSequenceChange = jasmine.createSpy('afterRowSequenceChange');

      handsontable({
        colHeaders: true,
        afterRowSequenceChange,
      });

      afterRowSequenceChange.calls.reset();

      alter('remove_row', 0, 3);

      expect(afterRowSequenceChange).toHaveBeenCalledWith('remove');
      expect(afterRowSequenceChange).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after updating indexes using IndexMapper API', () => {
      const afterRowSequenceChange = jasmine.createSpy('afterRowSequenceChange');

      const hot = handsontable({
        colHeaders: true,
        afterRowSequenceChange,
      });

      afterRowSequenceChange.calls.reset();

      hot.rowIndexMapper.setIndexesSequence([3, 2, 1]);

      expect(afterRowSequenceChange).toHaveBeenCalledWith('update');
      expect(afterRowSequenceChange).toHaveBeenCalledTimes(1);
    });
  });
});
