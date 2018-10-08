describe('settings', () => {
  describe('tableClassName', () => {
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

    it('should add class name every table element inside handsontable wrapper element (as string, without overlays)', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: 'foo'
      });

      const possibleCounts = [3, 4]; // 3 for non-pro, 4 for pro (bottom overlay)

      // all overlays is created anyway but without left-top corner
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.foo').length)).toBeGreaterThan(-1);
    });

    it('should add class name every table element inside handsontable wrapper element (as string, with overlays)', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: 'foo'
      });

      const possibleCounts = [4, 5]; // 4 for non-pro, 5 for pro (bottom overlay)

      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.foo').length)).toBeGreaterThan(-1);
    });

    it('should add class name every table element inside handsontable wrapper element (as string with spaces, without overlays)', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: 'foo bar'
      });

      const possibleCounts = [3, 4]; // 3 for non-pro, 4 for pro (bottom overlay)

      // all overlays is created anyway but without left-top corner
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.foo').length)).toBeGreaterThan(-1);
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.bar').length)).toBeGreaterThan(-1);
    });

    it('should add class name every table element inside handsontable wrapper element (as string with spaces, with overlays)', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: 'foo bar'
      });

      const possibleCounts = [4, 5]; // 4 for non-pro, 5 for pro (bottom overlay)

      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.foo').length)).toBeGreaterThan(-1);
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.bar').length)).toBeGreaterThan(-1);
    });

    it('should add class name every table element inside handsontable wrapper element (as array, without overlays)', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: ['foo', 'bar', 'baz']
      });

      const possibleCounts = [3, 4]; // 3 for non-pro, 4 for pro (bottom overlay)

      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.foo').length)).toBeGreaterThan(-1);
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.bar').length)).toBeGreaterThan(-1);
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.baz').length)).toBeGreaterThan(-1);
    });

    it('should add class name every table element inside handsontable wrapper element (as array, with overlays)', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: ['foo', 'bar', 'baz']
      });

      const possibleCounts = [4, 5]; // 4 for non-pro, 5 for pro (bottom overlay)

      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.foo').length)).toBeGreaterThan(-1);
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.bar').length)).toBeGreaterThan(-1);
      expect(possibleCounts.indexOf(hot.rootElement.querySelectorAll('table.baz').length)).toBeGreaterThan(-1);
    });
  });
});
