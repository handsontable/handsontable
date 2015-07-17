describe('WalkontableViewportRowsCalculator', function () {
  function allRows20() {
    return 20;
  }

  it("should render first 5 rows in unscrolled container", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 0, 1000, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endRow).toBe(4);

    var visibleCalc = new WalkontableViewportRowsCalculator(100, 0, 1000, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(4);
  });

  it("should render 6 rows, starting from 3 in container scrolled to half of fourth row", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 70, 1000, allRows20);
    expect(calc.startRow).toBe(3);
    expect(calc.startPosition).toBe(60);
    expect(calc.endRow).toBe(8);

    var visibleCalc = new WalkontableViewportRowsCalculator(100, 70, 1000, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(4);
    expect(visibleCalc.endRow).toBe(7);
  });

  it("should render 10 rows, starting from 1 in container scrolled to half of fourth row (with render overrides)", function () {
    var overrideFn = function (calc) {
      calc.startRow -= 2;
      calc.endRow += 2;
    };

    var calc = new WalkontableViewportRowsCalculator(100, 70, 1000, allRows20, overrideFn);
    expect(calc.startRow).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endRow).toBe(10);

    var visibleCalc = new WalkontableViewportRowsCalculator(100, 70, 1000, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(4);
    expect(visibleCalc.endRow).toBe(7);
  });

  it("should return number of rendered rows", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 50, 1000, allRows20);
    expect(calc.count).toBe(6);

    var visibleCalc = new WalkontableViewportRowsCalculator(100, 50, 1000, allRows20, null, true);
    expect(visibleCalc.count).toBe(4);
  });

  it("should render all rows if their size is smaller than viewport", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 8, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(7);
    expect(calc.count).toBe(8);

    var visibleCalc = new WalkontableViewportRowsCalculator(200, 0, 8, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(7);
    expect(visibleCalc.count).toBe(8);
  });

  it("should render all rows if their size is exactly the viewport", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 10, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(9);
    expect(calc.count).toBe(10);

    var visibleCalc = new WalkontableViewportRowsCalculator(200, 0, 10, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(9);
    expect(visibleCalc.count).toBe(10);
  });

  it("should render all rows if their size is slightly larger than viewport", function () {
    var calc = new WalkontableViewportRowsCalculator(199, 0, 10, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(9);
    expect(calc.count).toBe(10);

    var visibleCalc = new WalkontableViewportRowsCalculator(199, 0, 10, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(8);
    expect(visibleCalc.count).toBe(9);
  });

  it("should set null values if total rows is 0", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 0, allRows20);
    expect(calc.startRow).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endRow).toBe(null);
    expect(calc.count).toBe(0);

    var visibleCalc = new WalkontableViewportRowsCalculator(200, 0, 0, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(null);
    expect(visibleCalc.endRow).toBe(null);
  });

  it("should set null values if total rows is 0 (with overrideFn provided)", function () {
    var overrideFn = function (myCalc) {
      myCalc.startRow = 0;
      myCalc.endRow = 0;
    };

    var calc = new WalkontableViewportRowsCalculator(200, 0, 0, allRows20, overrideFn);
    expect(calc.startRow).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endRow).toBe(null);
    expect(calc.count).toBe(0);

    var visibleCalc = new WalkontableViewportRowsCalculator(200, 0, 0, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(null);
    expect(visibleCalc.endRow).toBe(null);
  });

  it("should scroll backwards if total rows is reached", function () {
    var calc = new WalkontableViewportRowsCalculator(190, 350, 20, allRows20);
    expect(calc.startRow).toBe(10);
    expect(calc.startPosition).toBe(200);
    expect(calc.endRow).toBe(19);
    expect(calc.count).toBe(10);

    var visibleCalc = new WalkontableViewportRowsCalculator(190, 350, 20, allRows20, null, true);
    expect(visibleCalc.startRow).toBe(11);
    expect(visibleCalc.endRow).toBe(19);
  });
});
