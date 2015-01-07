describe('WalkontableViewportRowsCalculator', function () {
  function allRows20() {
    return 20;
  }

  it("should render first 5 rows in unscrolled container", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 0, 1000, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endRow).toBe(4);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(4);
  });

  it("should render 6 rows, starting from 3 in container scrolled to half of fourth row", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 70, 1000, allRows20);
    expect(calc.startRow).toBe(3);
    expect(calc.startPosition).toBe(60);
    expect(calc.endRow).toBe(8);
    expect(calc.visibleStartRow).toBe(4);
    expect(calc.visibleEndRow).toBe(7);
  });

  it("should render 10 rows, starting from 1 in container scrolled to half of fourth row (with render overrides)", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 70, 1000, allRows20, function (calc) {
      calc.startRow -= 2;
      calc.endRow += 2;
    });
    expect(calc.startRow).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endRow).toBe(10);
    expect(calc.visibleStartRow).toBe(4);
    expect(calc.visibleEndRow).toBe(7);
  });

  it("should return number of rendered rows", function () {
    var calc = new WalkontableViewportRowsCalculator(100, 50, 1000, allRows20);
    expect(calc.count).toBe(6);
    expect(calc.visibleCount).toBe(4);
  });

  it("should render all rows if their size is smaller than viewport", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 8, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(7);
    expect(calc.count).toBe(8);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(7);
    expect(calc.visibleCount).toBe(8);
  });

  it("should render all rows if their size is exactly the viewport", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 10, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(9);
    expect(calc.count).toBe(10);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(9);
    expect(calc.visibleCount).toBe(10);
  });

  it("should render all rows if their size is slightly larger than viewport", function () {
    var calc = new WalkontableViewportRowsCalculator(199, 0, 10, allRows20);
    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(9);
    expect(calc.count).toBe(10);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(8);
    expect(calc.visibleCount).toBe(9);
  });

  it("should set null values if total rows is 0", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 0, allRows20);
    expect(calc.startRow).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endRow).toBe(null);
    expect(calc.count).toBe(0);
    expect(calc.visibleStartRow).toBe(null);
    expect(calc.visibleEndRow).toBe(null);
  });

  it("should set null values if total rows is 0 (with overrideFn provided)", function () {
    var calc = new WalkontableViewportRowsCalculator(200, 0, 0, allRows20, function (myCalc) {
      myCalc.startRow = 0;
      myCalc.endRow = 0;
    });
    expect(calc.startRow).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endRow).toBe(null);
    expect(calc.count).toBe(0);
    expect(calc.visibleStartRow).toBe(null);
    expect(calc.visibleEndRow).toBe(null);
  });

  it("should scroll backwards if total rows is reached", function () {
    var calc = new WalkontableViewportRowsCalculator(190, 350, 20, allRows20);
    expect(calc.startRow).toBe(10);
    expect(calc.startPosition).toBe(200);
    expect(calc.endRow).toBe(19);
    expect(calc.count).toBe(10);
    expect(calc.visibleStartRow).toBe(11);
    expect(calc.visibleEndRow).toBe(19);
  });
});
