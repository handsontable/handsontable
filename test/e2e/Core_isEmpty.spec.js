describe('Core.isEmpty*', () => {
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

  describe('isEmptyRow', () => {
    it('should be empty row', () => {
      handsontable();
      const hot = getInstance();
      expect(hot.isEmptyRow(0)).toEqual(true);
    });

    it('should not be empty row', () => {
      handsontable();
      setDataAtCell(0, 0, 'test');
      const hot = getInstance();
      expect(hot.isEmptyRow(0)).toEqual(false);
    });

    it('should bind this to instance', () => {
      handsontable();
      const hot = getInstance();
      const check = hot.isEmptyRow;
      expect(check(0)).toEqual(true); // this may be change in future when we switch to define isEmptyCol in prototype
    });
  });

  describe('isEmptyCol', () => {
    it('should be empty row', () => {
      handsontable();
      const hot = getInstance();
      expect(hot.isEmptyCol(0)).toEqual(true);
    });

    it('should not be empty row', () => {
      handsontable();
      setDataAtCell(0, 0, 'test');
      const hot = getInstance();
      expect(hot.isEmptyCol(0)).toEqual(false);
    });

    it('should bind this to instance', () => {
      handsontable();
      const hot = getInstance();
      const check = hot.isEmptyCol;
      expect(check(0)).toEqual(true); // this may be change in future when we switch to define isEmptyCol in prototype
    });
  });
});
