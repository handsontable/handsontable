describe('settings', function () {
  describe('renderer', function () {
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

    describe('defined in constructor', function () {
      it('should use text renderer by default', function () {
        spyOn(Handsontable.TextCell, 'renderer');
        handsontable();
        expect(Handsontable.TextCell.renderer).toHaveBeenCalled();
      });

      it('should use renderer from predefined string', function () {
        spyOn(Handsontable.TextCell, 'renderer');
        spyOn(Handsontable.cellLookup.renderer, 'checkbox');
        handsontable({
          columns: [
            {
              renderer: 'checkbox'
            }
          ]
        });
        expect(Handsontable.TextCell.renderer).not.toHaveBeenCalled();
        expect(Handsontable.cellLookup.renderer.checkbox).toHaveBeenCalled();
      });

      it('should use renderer from custom function', function () {
        var called = false;

        function myRenderer() {
          called = true;
        }

        handsontable({
          columns: [
            {
              renderer: myRenderer
            }
          ]
        });

        expect(called).toBe(true);
      });

      it('should use renderer from custom string', function () {
        function myRenderer() {

        }

        Handsontable.cellLookup.renderer.myRenderer = myRenderer;
        spyOn(Handsontable.cellLookup.renderer, 'myRenderer');

        handsontable({
          columns: [
            {
              renderer: 'myRenderer'
            }
          ]
        });

        expect(Handsontable.cellLookup.renderer.myRenderer).toHaveBeenCalled();
      });
    });
  });
});