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

      // all overlays is created anyway
      expect(hot.rootElement.querySelectorAll('table.foo').length).toEqual(6);
    });

    it('should add class name every table element inside handsontable wrapper element (as string, with overlays)', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: 'foo'
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toEqual(6);
    });

    it('should add class name every table element inside handsontable wrapper element (as string with spaces, without overlays)', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: 'foo bar'
      });

      // all overlays is created anyway
      expect(hot.rootElement.querySelectorAll('table.foo').length).toEqual(6);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toEqual(6);
    });

    it('should add class name every table element inside handsontable wrapper element (as string with spaces, with overlays)', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: 'foo bar'
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toEqual(6);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toEqual(6);
    });

    it('should add class name every table element inside handsontable wrapper element (as array, without overlays)', () => {
      const hot = handsontable({
        colHeaders: false,
        rowHeaders: false,
        tableClassName: ['foo', 'bar', 'baz']
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toEqual(6);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toEqual(6);
      expect(hot.rootElement.querySelectorAll('table.baz').length).toEqual(6);
    });

    it('should add class name every table element inside handsontable wrapper element (as array, with overlays)', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        tableClassName: ['foo', 'bar', 'baz']
      });

      expect(hot.rootElement.querySelectorAll('table.foo').length).toEqual(6);
      expect(hot.rootElement.querySelectorAll('table.bar').length).toEqual(6);
      expect(hot.rootElement.querySelectorAll('table.baz').length).toEqual(6);
    });

    it('should update tableClassName in all tables accordingly', () => {
      handsontable({
        data: [[1, true]],
        tableClassName: ['table_red'],
      });

      const tables = spec().$container.find('table');
      const masterTable = tables[0];
      const cloneTopTable = tables[1];
      const cloneBottomTable = tables[2];
      const cloneLeftTable = tables[3];

      expect(masterTable.classList.contains('table_red')).toBe(true);
      expect(cloneTopTable.classList.contains('table_red')).toBe(true);
      expect(cloneBottomTable.classList.contains('table_red')).toBe(true);
      expect(cloneLeftTable.classList.contains('table_red')).toBe(true);

      updateSettings({ tableClassName: ['table_green'] });

      expect(masterTable.classList.contains('table_red')).toBe(false);
      expect(cloneTopTable.classList.contains('table_red')).toBe(false);
      expect(cloneBottomTable.classList.contains('table_red')).toBe(false);
      expect(cloneLeftTable.classList.contains('table_red')).toBe(false);

      expect(masterTable.classList.contains('table_green')).toBe(true);
      expect(cloneTopTable.classList.contains('table_green')).toBe(true);
      expect(cloneBottomTable.classList.contains('table_green')).toBe(true);
      expect(cloneLeftTable.classList.contains('table_green')).toBe(true);
    });
  });
});
