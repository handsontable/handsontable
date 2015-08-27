describe('settings', function () {
  describe('tableClassName', function () {
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

    it('should add class name every table element inside handsontable wrapper element (as string, without overlays)', function () {
      var hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: 'foo'
      });

      // all overlays is created anyway but without left-top corner
      expect(hot.rootElement.querySelectorAll('table.foo').length).toBe(3);
    });

    it('should add class name every table element inside handsontable wrapper element (as string, with overlays)', function () {
      var hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: 'foo'
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toBe(4);
    });

    it('should add class name every table element inside handsontable wrapper element (as string with spaces, without overlays)', function () {
      var hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: 'foo bar'
      });

      // all overlays is created anyway but without left-top corner
      expect(hot.rootElement.querySelectorAll('table.foo').length).toBe(3);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toBe(3);
    });

    it('should add class name every table element inside handsontable wrapper element (as string with spaces, with overlays)', function () {
      var hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: 'foo bar'
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toBe(4);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toBe(4);
    });

    it('should add class name every table element inside handsontable wrapper element (as array, without overlays)', function () {
      var hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: ['foo', 'bar', 'baz']
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toBe(3);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toBe(3);
      expect(hot.rootElement.querySelectorAll('table.baz').length).toBe(3);
    });

    it('should add class name every table element inside handsontable wrapper element (as array, with overlays)', function () {
      var hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: ['foo', 'bar', 'baz']
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toBe(4);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toBe(4);
      expect(hot.rootElement.querySelectorAll('table.baz').length).toBe(4);
    });
  });
});
