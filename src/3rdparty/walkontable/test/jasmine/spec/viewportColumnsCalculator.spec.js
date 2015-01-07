describe('WalkontableViewportColumnsCalculator', function () {
  function allColumns20() {
    return 20;
  }

  it("should render first 5 columns in unscrolled container", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 0, 1000, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endColumn).toBe(4);
    expect(calc.visibleStartColumn).toBe(0);
    expect(calc.visibleEndColumn).toBe(4);
  });

  it("should render 6 columns, starting from 3 in container scrolled to half of fourth column", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 70, 1000, allColumns20);
    expect(calc.startColumn).toBe(3);
    expect(calc.startPosition).toBe(60);
    expect(calc.endColumn).toBe(8);
    expect(calc.visibleStartColumn).toBe(4);
    expect(calc.visibleEndColumn).toBe(7);
  });

  it("should render 10 columns, starting from 1 in container scrolled to half of fourth column (with render overrides)", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 70, 1000, allColumns20, function (calc) {
      calc.startColumn -= 2;
      calc.endColumn += 2;
    });
    expect(calc.startColumn).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endColumn).toBe(10);
    expect(calc.visibleStartColumn).toBe(4);
    expect(calc.visibleEndColumn).toBe(7);
  });

  it("should return number of rendered columns", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 50, 1000, allColumns20);
    expect(calc.count).toBe(6);
    expect(calc.countVisibleColumns).toBe(4);
  });

  it("should render all columns if their size is smaller than viewport", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 8, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(7);
    expect(calc.count).toBe(8);
    expect(calc.visibleStartColumn).toBe(0);
    expect(calc.visibleEndColumn).toBe(7);
    expect(calc.countVisibleColumns).toBe(8);
  });

  it("should render all columns if their size is exactly the viewport", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 10, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(9);
    expect(calc.count).toBe(10);
    expect(calc.visibleStartColumn).toBe(0);
    expect(calc.visibleEndColumn).toBe(9);
    expect(calc.countVisibleColumns).toBe(10);
  });

  it("should render all columns if their size is slightly larger than viewport", function () {
    var calc = new WalkontableViewportColumnsCalculator(199, 0, 10, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(9);
    expect(calc.count).toBe(10);
    expect(calc.visibleStartColumn).toBe(0);
    expect(calc.visibleEndColumn).toBe(8);
    expect(calc.countVisibleColumns).toBe(9);
  });

  it("should set null values if total columns is 0", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 0, allColumns20);
    expect(calc.startColumn).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endColumn).toBe(null);
    expect(calc.count).toBe(0);
    expect(calc.visibleStartColumn).toBe(null);
    expect(calc.visibleEndColumn).toBe(null);
  });

  it("should set null values if total columns is 0 (with overrideFn provided)", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 0, allColumns20, function (myCalc) {
      myCalc.startColumn = 0;
      myCalc.endColumn = 0;
    });
    expect(calc.startColumn).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endColumn).toBe(null);
    expect(calc.count).toBe(0);
    expect(calc.visibleStartColumn).toBe(null);
    expect(calc.visibleEndColumn).toBe(null);
  });

  it("should scroll backwards if total columns is reached", function () {
    var calc = new WalkontableViewportColumnsCalculator(190, 350, 20, allColumns20);
    expect(calc.startColumn).toBe(10);
    expect(calc.startPosition).toBe(200);
    expect(calc.endColumn).toBe(19);
    expect(calc.count).toBe(10);
    expect(calc.visibleStartColumn).toBe(11);
    expect(calc.visibleEndColumn).toBe(19);
  });
});
