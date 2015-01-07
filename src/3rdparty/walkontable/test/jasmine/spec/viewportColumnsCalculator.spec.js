describe('WalkontableViewportColumnsCalculator', function () {
  function allColumns20() {
    return 20;
  }

  it("should render first 5 columns in unscrolled container", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 0, 1000, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endColumn).toBe(4);

    var visibleCalc = new WalkontableViewportColumnsCalculator(100, 0, 1000, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(4);
  });

  it("should render 6 columns, starting from 3 in container scrolled to half of fourth column", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 70, 1000, allColumns20);
    expect(calc.startColumn).toBe(3);
    expect(calc.startPosition).toBe(60);
    expect(calc.endColumn).toBe(8);

    var visibleCalc = new WalkontableViewportColumnsCalculator(100, 70, 1000, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(4);
    expect(visibleCalc.endColumn).toBe(7);
  });

  it("should render 10 columns, starting from 1 in container scrolled to half of fourth column (with render overrides)", function () {
    var overrideFn = function (calc) {
      calc.startColumn -= 2;
      calc.endColumn += 2;
    };

    var calc = new WalkontableViewportColumnsCalculator(100, 70, 1000, allColumns20, overrideFn);
    expect(calc.startColumn).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endColumn).toBe(10);

    var visibleCalc = new WalkontableViewportColumnsCalculator(100, 70, 1000, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(4);
    expect(visibleCalc.endColumn).toBe(7);
  });

  it("should return number of rendered columns", function () {
    var calc = new WalkontableViewportColumnsCalculator(100, 50, 1000, allColumns20);
    expect(calc.count).toBe(6);

    var visibleCalc = new WalkontableViewportColumnsCalculator(100, 50, 1000, allColumns20, null, true);
    expect(visibleCalc.count).toBe(4);
  });

  it("should render all columns if their size is smaller than viewport", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 8, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(7);
    expect(calc.count).toBe(8);

    var visibleCalc = new WalkontableViewportColumnsCalculator(200, 0, 8, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(7);
    expect(visibleCalc.count).toBe(8);
  });

  it("should render all columns if their size is exactly the viewport", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 10, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(9);
    expect(calc.count).toBe(10);

    var visibleCalc = new WalkontableViewportColumnsCalculator(200, 0, 10, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(9);
    expect(visibleCalc.count).toBe(10);
  });

  it("should render all columns if their size is slightly larger than viewport", function () {
    var calc = new WalkontableViewportColumnsCalculator(199, 0, 10, allColumns20);
    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(9);
    expect(calc.count).toBe(10);

    var visibleCalc = new WalkontableViewportColumnsCalculator(199, 0, 10, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(8);
    expect(visibleCalc.count).toBe(9);
  });

  it("should set null values if total columns is 0", function () {
    var calc = new WalkontableViewportColumnsCalculator(200, 0, 0, allColumns20);
    expect(calc.startColumn).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endColumn).toBe(null);
    expect(calc.count).toBe(0);

    var visibleCalc = new WalkontableViewportColumnsCalculator(200, 0, 0, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(null);
    expect(visibleCalc.endColumn).toBe(null);
  });

  it("should set null values if total columns is 0 (with overrideFn provided)", function () {
    var overrideFn = function (myCalc) {
      myCalc.startColumn = 0;
      myCalc.endColumn = 0;
    };

    var calc = new WalkontableViewportColumnsCalculator(200, 0, 0, allColumns20, overrideFn);
    expect(calc.startColumn).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endColumn).toBe(null);
    expect(calc.count).toBe(0);

    var visibleCalc = new WalkontableViewportColumnsCalculator(200, 0, 0, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(null);
    expect(visibleCalc.endColumn).toBe(null);
  });

  it("should scroll backwards if total columns is reached", function () {
    var calc = new WalkontableViewportColumnsCalculator(190, 350, 20, allColumns20);
    expect(calc.startColumn).toBe(10);
    expect(calc.startPosition).toBe(200);
    expect(calc.endColumn).toBe(19);
    expect(calc.count).toBe(10);

    var visibleCalc = new WalkontableViewportColumnsCalculator(190, 350, 20, allColumns20, null, true);
    expect(visibleCalc.startColumn).toBe(11);
    expect(visibleCalc.endColumn).toBe(19);
  });
});
