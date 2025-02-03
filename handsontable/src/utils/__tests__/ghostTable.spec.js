describe('GhostTable', () => {

  const hotSettings = {
    data: [['A', '1', 'A\nB\nC'], ['B', '2', 'A-----B-------C'], ['C', '3', 'A---\n--B-------C']]
  };
  let gt;

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    if (gt) {
      gt.clean();
      gt = null;
    }
  });

  describe('row', () => {
    it('should throw exception if we try to add column after added row', () => {
      const hot = handsontable(hotSettings);
      const samples = new Map();
      let exception = false;

      gt = new Handsontable.__GhostTable(hot);

      gt.addRow(0, samples);

      try {
        gt.addColumn(0, samples);
      } catch (ex) {
        exception = true;
      }

      expect(exception).toBe(true);
    });

    it('should create container element only for first row', () => {
      const hot = handsontable(hotSettings);
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      spyOn(gt, 'createContainer').and.callThrough();

      gt.addRow(0, samples);
      gt.addRow(0, samples);
      gt.addRow(0, samples);
      gt.addRow(1, samples);
      gt.addRow(2, samples);

      expect(gt.createContainer.calls.count()).toBe(1);
      expect(gt.createContainer.calls.mostRecent().args).forThemes(({ classic, main }) => {
        classic.toEqual(['ht-wrapper handsontable']);
        main.toEqual(['ht-wrapper handsontable ht-theme-main']);
      });
    });

    it('should add row to rows collection after call `addRow` method', () => {
      const hot = handsontable(hotSettings);
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      expect(gt.rows.length).toBe(0);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }, { value: 'Foo Bar', row: 0, col: 0 }] });

      gt.addRow(0, samples);

      expect(gt.rows.length).toBe(1);
      expect(gt.rows[0].row).toBe(0);
      expect(gt.rows[0].table.className).toBe('htCore');
      expect(gt.rows[0].table.nodeName).toBe('TABLE');
      expect(gt.rows[0].table.querySelectorAll('colgroup > col').length).toBe(2);
      expect(gt.rows[0].table.querySelector('tbody > tr > td').innerHTML).toBe('Foo');

      samples.clear();
      samples.set(0, { strings: [{ value: 'Bar', row: 1, col: 0 }, { value: 'Baz1234', row: 1, col: 0 }] });

      gt.addRow(1, samples);

      expect(gt.rows.length).toBe(2);
      expect(gt.rows[1].row).toBe(1);
      expect(gt.rows[1].table.className).toBe('htCore');
      expect(gt.rows[1].table.nodeName).toBe('TABLE');
      expect(gt.rows[1].table.querySelectorAll('colgroup > col').length).toBe(2);
      expect(gt.rows[1].table.querySelector('tbody > tr > td').innerHTML).toBe('Bar');
    });

    it('should get valid heights', () => {
      const hot = handsontable(hotSettings);
      const heightSpy = jasmine.createSpy();
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }, { value: 'Foo.....Bar', row: 0, col: 0 }] });

      gt.addRow(0, samples);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo\nBar\nsqw', row: 1, col: 0 }] });

      gt.addRow(1, samples);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }, { value: 'Foo Bar', row: 0, col: 0 }] });

      gt.addRow(2, samples);
      gt.getHeights(heightSpy);

      expect(heightSpy.calls.count()).toBe(3);
      expect(heightSpy.calls.argsFor(0)[0]).toBe(0);
      expect(heightSpy.calls.argsFor(0)[1]).forThemes(({ classic, main }) => {
        classic.toBe(23);
        main.toBe(29);
      });
      expect(heightSpy.calls.argsFor(1)[0]).toBe(1);
      expect(heightSpy.calls.argsFor(1)[1]).forThemes(({ classic, main }) => {
        classic.toBe(64);
        main.toBe(69);
      });
      expect(heightSpy.calls.argsFor(2)[0]).toBe(2);
      expect(heightSpy.calls.argsFor(2)[1]).forThemes(({ classic, main }) => {
        classic.toBe(43);
        main.toBe(49);
      });
    });
  });

  describe('column', () => {
    it('should throw exception if we try to add row after added column', () => {
      const hot = handsontable(hotSettings);
      const samples = new Map();
      let exception = false;

      gt = new Handsontable.__GhostTable(hot);

      gt.addColumn(0, samples);

      try {
        gt.addRow(0, samples);
      } catch (ex) {
        exception = true;
      }

      expect(exception).toBe(true);
    });

    it('should create container element only for first column', () => {
      const hot = handsontable(hotSettings);
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      spyOn(gt, 'createContainer').and.callThrough();

      gt.addColumn(0, samples);
      gt.addColumn(0, samples);
      gt.addColumn(0, samples);
      gt.addColumn(1, samples);
      gt.addColumn(2, samples);

      expect(gt.createContainer.calls.count()).toBe(1);
      expect(gt.createContainer.calls.mostRecent().args).forThemes(({ classic, main }) => {
        classic.toEqual(['ht-wrapper handsontable']);
        main.toEqual(['ht-wrapper handsontable ht-theme-main']);
      });
    });

    it('should add column to columns collection after call `addColumn` method', () => {
      const hot = handsontable(hotSettings);
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      expect(gt.columns.length).toBe(0);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }, { value: 'Foo Bar', row: 0, col: 0 }] });

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
      samples.set(0, { strings: [{ value: 'Bar', row: 1, col: 0 }, { value: 'Baz1234', row: 1, col: 0 }] });

      gt.addColumn(1, samples);

      expect(gt.columns.length).toBe(2);
      expect(gt.columns[1].col).toBe(1);
      expect(gt.columns[1].table.className).toBe('htCore');
      expect(gt.columns[1].table.nodeName).toBe('TABLE');
      expect(gt.columns[1].table.querySelectorAll('thead > tr > th').length).toBe(1);
      expect(gt.columns[1].table.querySelector('tbody > tr > td').innerHTML).toBe('Bar');
    });

    it('should get valid widths', () => {
      const hot = handsontable(hotSettings);
      const widthSpy = jasmine.createSpy();
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }, { value: 'Foo.....Bar', row: 0, col: 0 }] });

      gt.addColumn(0, samples);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo\nBar\nsqw', row: 0, col: 1 }] });

      gt.addColumn(1, samples);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }, { value: 'Foo Bar', row: 0, col: 0 }] });

      gt.addColumn(2, samples);
      gt.getWidths(widthSpy);

      expect(widthSpy.calls.count()).toBe(3);
      expect(widthSpy.calls.argsFor(0)[0]).toBe(0);
      expect(widthSpy.calls.argsFor(0)[1]).forThemes(({ classic, main }) => {
        classic.toBe(66);
        main.toBe(84);
      });
      expect(widthSpy.calls.argsFor(1)[0]).toBe(1);
      expect(widthSpy.calls.argsFor(1)[1]).forThemes(({ classic, main }) => {
        classic.toBe(31);
        main.toBe(43);
      });
      expect(widthSpy.calls.argsFor(2)[0]).toBe(2);
      expect(widthSpy.calls.argsFor(2)[1]).forThemes(({ classic, main }) => {
        classic.toBe(53);
        main.toBe(68);
      });
    });

    it('should get rounded up widths when the browser calculates the columns as a decimal values', () => {
      const hot = handsontable(hotSettings);
      const widthSpy = jasmine.createSpy();
      const samples = new Map();

      gt = new Handsontable.__GhostTable(hot);

      samples.clear();
      samples.set(0, { strings: [{ value: 'Foo', row: 0, col: 0 }] });

      gt.addColumn(0, samples);
      gt.injectTable();

      gt.table.table.style.width = '75.44px';

      gt.getWidths(widthSpy);

      expect(widthSpy.calls.count()).toBe(1);
      expect(widthSpy.calls.argsFor(0)).toEqual([0, 76]);
    });
  });

  it('should reset internal state after call `clean` method', () => {
    const hot = handsontable(hotSettings);
    const samples = new Map();

    gt = new Handsontable.__GhostTable(hot);

    gt.addColumn(0, samples);
    gt.rows.push({});
    gt.getWidths(() => {});

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

  it('should be detected as vertical if at least one row is added', () => {
    const hot = handsontable(hotSettings);
    const samples = new Map();

    gt = new Handsontable.__GhostTable(hot);

    gt.addRow(0, samples);

    expect(gt.isVertical()).toBe(true);
    expect(gt.isHorizontal()).toBe(false);
  });

  it('should be detected as horizontal if at least one column is added', () => {
    const hot = handsontable(hotSettings);
    const samples = new Map();

    gt = new Handsontable.__GhostTable(hot);

    gt.addColumn(0, samples);

    expect(gt.isVertical()).toBe(false);
    expect(gt.isHorizontal()).toBe(true);
  });

  it('should not change the coords of the cell meta after row rendering', () => {
    const hot = handsontable(hotSettings);

    gt = new Handsontable.__GhostTable(hot);

    spyOn(hot, 'getCellMeta').and.returnValue({
      row: 3,
      col: 4,
      visualRow: 5,
      visualCol: 6,
      renderer: jasmine.createSpy('renderer'),
    });

    gt.samples = new Map([[0, { strings: [{ col: 0, value: 'test' }] }]]);
    gt.createRow(0);

    const cellMeta = getCellMeta(0, 0);

    expect(cellMeta.renderer).toHaveBeenCalledTimes(1);
    expect(cellMeta.row).toBe(3);
    expect(cellMeta.col).toBe(4);
    expect(cellMeta.visualRow).toBe(5);
    expect(cellMeta.visualCol).toBe(6);
  });

  it('should not change the coords of the cell meta after column rendering', () => {
    const hot = handsontable(hotSettings);

    gt = new Handsontable.__GhostTable(hot);

    spyOn(hot, 'getCellMeta').and.returnValue({
      row: 3,
      col: 4,
      visualRow: 5,
      visualCol: 6,
      renderer: jasmine.createSpy('renderer'),
    });

    gt.samples = new Map([[0, { strings: [{ row: 0, value: 'test' }] }]]);
    gt.createCol(0);

    const cellMeta = getCellMeta(0, 0);

    expect(cellMeta.renderer).toHaveBeenCalledTimes(1);
    expect(cellMeta.row).toBe(3);
    expect(cellMeta.col).toBe(4);
    expect(cellMeta.visualRow).toBe(5);
    expect(cellMeta.visualCol).toBe(6);
  });
});
