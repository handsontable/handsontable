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
      it('should pass correct cell coords if mousedown is called on corner', async() => {
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

    describe('native middle-button autoscroll (#2722)', () => {
      const dispatchMouseDown = (target, button) => {
        const event = new MouseEvent('mousedown', {
          button,
          buttons: button === 1 ? 4 : 1,
          bubbles: true,
          cancelable: true,
        });

        target.dispatchEvent(event);

        return event.defaultPrevented;
      };

      it('should not prevent the default action of a middle-button mousedown so the browser can start autoscroll', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
        });

        const cell = getCell(1, 1);

        // button 1 = middle (scroll wheel) — the default action must survive
        expect(dispatchMouseDown(cell, 1)).toBe(false);
      });

      it('should still prevent the default action of a left-button mousedown (text selection guard)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
        });

        const cell = getCell(1, 1);

        // button 0 = left — default is prevented to suppress native text selection while dragging
        expect(dispatchMouseDown(cell, 0)).toBe(true);
      });
    });
  });
});
