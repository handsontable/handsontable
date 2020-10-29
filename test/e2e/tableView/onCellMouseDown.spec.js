describe('tableView', () => {
  describe('onCellMouseDown', () => {
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

    describe('afterOnCellMouseDown', () => {
      it('should pass correct cell coords if mousedown is called on corner', () => {
        const afterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

        handsontable({
          colHeaders: true,
          rowHeaders: true,
          afterOnCellMouseDown,
        });

        const corner = getCell(-1, -1);

        $(corner).simulate('mousedown');

        expect(afterOnCellMouseDown).toHaveBeenCalled();
        expect(afterOnCellMouseDown.calls.argsFor(0)[0]).toBeInstanceOf(MouseEvent);
        expect(afterOnCellMouseDown.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ row: -1, col: -1 }));
        expect(afterOnCellMouseDown.calls.argsFor(0)[2]).toBe(corner);
      });
    });
  });
});
