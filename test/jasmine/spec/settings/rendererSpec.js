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
        var originalTextRenderer = Handsontable.TextCell.renderer;
        spyOn(Handsontable.TextCell, 'renderer');
        Handsontable.renderers.registerRenderer('text', Handsontable.TextCell.renderer);

        handsontable();
        expect(Handsontable.TextCell.renderer).toHaveBeenCalled();

        Handsontable.renderers.registerRenderer('text', originalTextRenderer);

      });

      it('should use renderer from predefined string', function () {

        var originalTextRenderer = Handsontable.renderers.TextRenderer;
        spyOn(Handsontable.renderers, 'TextRenderer');
        Handsontable.renderers.registerRenderer('text', Handsontable.renderers.TextRenderer);

        var originalCheckboxRenderer = Handsontable.renderers.CheckboxRenderer;
        spyOn(Handsontable.renderers, 'CheckboxRenderer');
        Handsontable.renderers.registerRenderer('checkbox', Handsontable.renderers.CheckboxRenderer);


        handsontable({
          columns: [
            {
              renderer: 'checkbox'
            }
          ]
        });
        expect(Handsontable.renderers.TextRenderer).not.toHaveBeenCalled();
        expect(Handsontable.renderers.CheckboxRenderer).toHaveBeenCalled();

        Handsontable.renderers.registerRenderer('text', originalTextRenderer);
        Handsontable.renderers.registerRenderer('checkbox', originalCheckboxRenderer);
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
        var myRenderer = jasmine.createSpy('myRenderer');

        Handsontable.renderers.registerRenderer('myRenderer', myRenderer);

        handsontable({
          columns: [
            {
              renderer: 'myRenderer'
            }
          ]
        });

        expect(myRenderer).toHaveBeenCalled();
      });

      it('should support legacy namespace (pre-0.10.0) of cell renderers', function () {
        var count = 0;
        handsontable({
          renderer: function () {
            count++;
            Handsontable.TextCell.renderer.apply(this, arguments);
          }
        });
        expect(count).toBeGreaterThan(0);
      });
    });

    it("should call renderer with cellProperties.row, cellProperties.col matching row and col arguments", function () {

      var rendererSpy = jasmine.createSpy('rendererSpy').andCallThrough();
      var cellPropertiesCache = [];
      rendererSpy.plan = function (instance, TD, row, col, prop, value, cellProperties) {
        cellPropertiesCache.push({
          row: cellProperties.row,
          col: cellProperties.col
        });
      };

      handsontable({
        renderer: rendererSpy
      });

      for (var i = 0, len = rendererSpy.calls.length; i < len; i++){
        var args = rendererSpy.calls[i].args;
        var row = args[2];
        var col = args[3];
        var cellProperties = cellPropertiesCache[i];

        expect(row).toEqual(cellProperties.row);
        expect(col).toEqual(cellProperties.col);
      }

    });

    it("should call cells function before passing cellProperties to renderer", function () {

      var rendererSpy = jasmine.createSpy('rendererSpy').andCallThrough();
      var cellPropertiesCache = [];
      rendererSpy.plan = function (instance, TD, row, col, prop, value, cellProperties) {
        cellPropertiesCache.push({
          cellsRow: cellProperties.cellsRow,
          cellsCol: cellProperties.cellsCol
        });
      };

      handsontable({
        renderer: rendererSpy,
        cells: function (row, col) {
          return {
            cellsRow: row,
            cellsCol: col
          }
        }
      });

      for (var i = 0, len = rendererSpy.calls.length; i < len; i++){
        var args = rendererSpy.calls[i].args;
        var row = args[2];
        var col = args[3];
        var cellProperties = cellPropertiesCache[i];

        expect(row).toEqual(cellProperties.cellsRow);
        expect(col).toEqual(cellProperties.cellsCol);
      }

    });

  });
});