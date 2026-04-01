describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyAutofillRange', () => {
    it('should pass tuple coordinates and respect the returned range', async() => {
      const modifyAutofillRange = jasmine.createSpy('modifyAutofillRange')
        .and.callFake((entireArea, startArea) => {
          expect(Array.isArray(entireArea[0])).toBe(false);
          expect(Array.isArray(startArea[0])).toBe(false);

          return [0, 0, 2, 0];
        });

      handsontable({
        data: [
          [1],
          [null],
          [null],
        ],
        modifyAutofillRange,
      });

      await selectCell(0, 0);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      $(getCell(1, 0)).simulate('mouseover').simulate('mouseup');

      expect(modifyAutofillRange).toHaveBeenCalledWith([0, 0, 1, 0], [0, 0, 0, 0]);
      expect(getDataAtCell(1, 0)).toBe(1);
      expect(getDataAtCell(2, 0)).toBe(1);
    });
  });
});
