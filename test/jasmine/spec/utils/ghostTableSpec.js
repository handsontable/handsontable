describe('GhostTable', function () {

  var hotSettings = {
    data: [['A', '1', 'A\nB\nC'], ['B', '2', 'A-----B-------C'], ['C', '3', 'A---\n--B-------C']]
  };
  var GhostTable = Handsontable.utils.GhostTable;
  var gt;

  beforeEach(function () {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();

      if (gt) {
        gt.clean();
      }
    }
  });

  describe('row', function() {
    it('should throw exception if we try to add column after added row', function () {
      var hot = handsontable(hotSettings);
      var exception = false;
      var samples = new Map();
      gt = new GhostTable(hot);

      gt.addRow(0, samples);

      try {
        gt.addColumn(0, samples);
      } catch (ex) {
        exception = true;
      }

      expect(exception).toBe(true);
    });

    it('should create container element only for first row', function () {
      var hot = handsontable(hotSettings);
      var samples = new Map();
      gt = new GhostTable(hot);

      spyOn(gt, 'createContainer').andCallThrough();

      gt.addRow(0, samples);
      gt.addRow(0, samples);
      gt.addRow(0, samples);
      gt.addRow(1, samples);
      gt.addRow(2, samples);

      expect(gt.createContainer.calls.length).toBe(1);
      expect(gt.createContainer.mostRecentCall.args[0]).toBe('handsontable');
    });

    it('should add row to rows collection after call `addRow` method', function () {
      var hot = handsontable(hotSettings);
      var samples = new Map();
      gt = new GhostTable(hot);

      expect(gt.rows.length).toBe(0);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo', row: 0}, {value: 'Foo Bar', row: 0}]});

      gt.addRow(0, samples);

      expect(gt.rows.length).toBe(1);
      expect(gt.rows[0].row).toBe(0);
      expect(gt.rows[0].table.className).toBe('htCore');
      expect(gt.rows[0].table.nodeName).toBe('TABLE');
      expect(gt.rows[0].table.querySelectorAll('colgroup > col').length).toBe(3);
      expect(gt.rows[0].table.querySelector('tbody > tr > td').innerHTML).toBe('Foo');

      samples.clear();
      samples.set(0, {strings: [{value: 'Bar', row: 1}, {value: 'Baz1234', row: 1}]});

      gt.addRow(1, samples);

      expect(gt.rows.length).toBe(2);
      expect(gt.rows[1].row).toBe(1);
      expect(gt.rows[1].table.className).toBe('htCore');
      expect(gt.rows[1].table.nodeName).toBe('TABLE');
      expect(gt.rows[1].table.querySelectorAll('colgroup > col').length).toBe(3);
      expect(gt.rows[1].table.querySelector('tbody > tr > td').innerHTML).toBe('Bar');
    });

    it('should get valid heights', function () {
      var hot = handsontable(hotSettings);
      var heightSpy = jasmine.createSpy();
      var samples = new Map();
      gt = new GhostTable(hot);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo', row: 0}, {value: 'Foo.....Bar', row: 0}]});

      gt.addRow(0, samples);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo\nBar\nsqw', row: 1}]});

      gt.addRow(1, samples);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo', row: 0}, {value: 'Foo Bar', row: 0}]});

      gt.addRow(2, samples);
      gt.getHeights(heightSpy);

      expect(heightSpy.calls.length).toBe(3);
      expect(heightSpy.calls[0].args[0]).toBe(0);
      expect(heightSpy.calls[0].args[1]).toBeAroundValue(23);
      expect(heightSpy.calls[1].args[0]).toBe(1);
      expect(heightSpy.calls[1].args[1]).toBeAroundValue(64);
      expect(heightSpy.calls[2].args[0]).toBe(2);
      expect(heightSpy.calls[2].args[1]).toBeAroundValue(43);
    });
  });

  describe('column', function() {
    it('should throw exception if we try to add row after added column', function () {
      var hot = handsontable(hotSettings);
      var exception = false;
      var samples = new Map();
      gt = new GhostTable(hot);

      gt.addColumn(0, samples);

      try {
        gt.addRow(0, samples);
      } catch (ex) {
        exception = true;
      }

      expect(exception).toBe(true);
    });

    it('should create container element only for first column', function () {
      var hot = handsontable(hotSettings);
      var samples = new Map();
      gt = new GhostTable(hot);

      spyOn(gt, 'createContainer').andCallThrough();

      gt.addColumn(0, samples);
      gt.addColumn(0, samples);
      gt.addColumn(0, samples);
      gt.addColumn(1, samples);
      gt.addColumn(2, samples);

      expect(gt.createContainer.calls.length).toBe(1);
      expect(gt.createContainer.mostRecentCall.args[0]).toBe('handsontable');
    });

    it('should add column to columns collection after call `addColumn` method', function () {
      var hot = handsontable(hotSettings);
      var samples = new Map();
      gt = new GhostTable(hot);

      expect(gt.columns.length).toBe(0);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo', col: 0}, {value: 'Foo Bar', col: 0}]});

      gt.addColumn(0, samples);

      expect(gt.columns.length).toBe(1);
      expect(gt.columns[0].col).toBe(0);
      expect(gt.columns[0].table.className).toBe('htCore');
      expect(gt.columns[0].table.style.width).toBe('auto');
      expect(gt.columns[0].table.style.tableLayout).toBe('auto');
      expect(gt.columns[0].table.nodeName).toBe('TABLE');
      expect(gt.columns[0].table.querySelectorAll('thead > tr > th').length).toBe(1);
      expect(gt.columns[0].table.querySelector('tbody > tr > td').innerHTML).toBe('Foo');

      samples.clear();
      samples.set(0, {strings: [{value: 'Bar', row: 1}, {value: 'Baz1234', row: 1}]});

      gt.addColumn(1, samples);

      expect(gt.columns.length).toBe(2);
      expect(gt.columns[1].col).toBe(1);
      expect(gt.columns[1].table.className).toBe('htCore');
      expect(gt.columns[1].table.nodeName).toBe('TABLE');
      expect(gt.columns[1].table.querySelectorAll('thead > tr > th').length).toBe(1);
      expect(gt.columns[1].table.querySelector('tbody > tr > td').innerHTML).toBe('Bar');
    });

    it('should get valid widths', function () {
      var hot = handsontable(hotSettings);
      var widthSpy = jasmine.createSpy();
      var samples = new Map();
      gt = new GhostTable(hot);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo', col: 0}, {value: 'Foo.....Bar', col: 0}]});

      gt.addColumn(0, samples);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo\nBar\nsqw', col: 1}]});

      gt.addColumn(1, samples);

      samples.clear();
      samples.set(0, {strings: [{value: 'Foo', col: 0}, {value: 'Foo Bar', col: 0}]});

      gt.addColumn(2, samples);
      gt.getWidths(widthSpy);

      expect(widthSpy.calls.length).toBe(3);
      expect(widthSpy.calls[0].args[0]).toBe(0);
      expect(widthSpy.calls[0].args[1]).toBeAroundValue(66);
      expect(widthSpy.calls[1].args[0]).toBe(1);
      expect(widthSpy.calls[1].args[1]).toBeAroundValue(32);
      expect(widthSpy.calls[2].args[0]).toBe(2);
      expect(widthSpy.calls[2].args[1]).toBeAroundValue(53);
    });
  });

  it('should reset internal state after call `clean` method', function () {
    var hot = handsontable(hotSettings);
    var samples = new Map();
    gt = new GhostTable(hot);

    gt.addColumn(0, samples);
    gt.rows.push({});
    gt.getWidths(function() {});

    expect(gt.columns.length).toBe(1);
    expect(gt.samples).toBeDefined();
    expect(gt.injected).toBe(true);
    expect(gt.container).toBeDefined();
    expect(document.querySelector('.htGhostTable')).toBeDefined();

    gt.clean();

    expect(gt.columns.length).toBe(0);
    expect(gt.samples).toBe(null);
    expect(gt.injected).toBe(false);
    expect(gt.container).toBe(null);
    expect(document.querySelector('.htGhostTable')).toBe(null);
  });

  it('should be detected as vertical if at least one row is added', function () {
    var hot = handsontable(hotSettings);
    var samples = new Map();
    var gt = new GhostTable(hot);

    gt.addRow(0, samples);

    expect(gt.isVertical()).toBe(true);
    expect(gt.isHorizontal()).toBe(false);
  });

  it('should be detected as horizontal if at least one column is added', function () {
    var hot = handsontable(hotSettings);
    var samples = new Map();
    var gt = new GhostTable(hot);

    gt.addColumn(0, samples);

    expect(gt.isVertical()).toBe(false);
    expect(gt.isHorizontal()).toBe(true);
  });
});
