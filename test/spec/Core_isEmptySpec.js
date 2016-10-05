describe('Core.isEmpty*', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('isEmptyRow', function () {
    it('should be empty row', function () {
      handsontable();
      var hot = getInstance();
      expect(hot.isEmptyRow(0)).toEqual(true);
    });

    it('should not be empty row', function () {
      handsontable();
      setDataAtCell(0, 0, 'test');
      var hot = getInstance();
      expect(hot.isEmptyRow(0)).toEqual(false);
    });

    it('should bind this to instance', function () {
      handsontable();
      var hot = getInstance();
      var check = hot.isEmptyRow;
      expect(check(0)).toEqual(true); //this may be change in future when we switch to define isEmptyCol in prototype
    });
  });

  describe('isEmptyCol', function () {
    it('should be empty row', function () {
      handsontable();
      var hot = getInstance();
      expect(hot.isEmptyCol(0)).toEqual(true);
    });

    it('should not be empty row', function () {
      handsontable();
      setDataAtCell(0, 0, 'test');
      var hot = getInstance();
      expect(hot.isEmptyCol(0)).toEqual(false);
    });

    it('should bind this to instance', function () {
      handsontable();
      var hot = getInstance();
      var check = hot.isEmptyCol;
      expect(check(0)).toEqual(true); //this may be change in future when we switch to define isEmptyCol in prototype
    });
  });
});