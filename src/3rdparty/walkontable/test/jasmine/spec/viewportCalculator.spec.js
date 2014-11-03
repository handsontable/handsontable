describe('WalkontableViewportCalculator', function () {
  function allRows20() {
    return 20;
  }

  it("should render first 5 rows in unscrolled container", function () {
    var calc = new WalkontableViewportCalculator(100, 0, 1000, allRows20);
    expect(calc.renderStartRow).toBe(0);
    expect(calc.renderStartPosition).toBe(0);
    expect(calc.renderEndRow).toBe(4);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(4);
  });

  it("should render 6 rows, starting from 3 in container scrolled to half of fourth row", function () {
    var calc = new WalkontableViewportCalculator(100, 70, 1000, allRows20);
    expect(calc.renderStartRow).toBe(3);
    expect(calc.renderStartPosition).toBe(60);
    expect(calc.renderEndRow).toBe(8);
    expect(calc.visibleStartRow).toBe(4);
    expect(calc.visibleEndRow).toBe(7);
  });

  it("should render 10 rows, starting from 1 in container scrolled to half of fourth row (with render overrides)", function () {
    var calc = new WalkontableViewportCalculator(100, 70, 1000, allRows20, function (calc) {
      calc.renderStartRow -= 2;
      calc.renderEndRow += 2;
    });
    expect(calc.renderStartRow).toBe(1);
    expect(calc.renderStartPosition).toBe(20);
    expect(calc.renderEndRow).toBe(10);
    expect(calc.visibleStartRow).toBe(4);
    expect(calc.visibleEndRow).toBe(7);
  });

  it("should return number of rendered rows", function () {
    var calc = new WalkontableViewportCalculator(100, 50, 1000, allRows20);
    expect(calc.countRendered).toBe(6);
    expect(calc.countVisible).toBe(4);
  });

  it("should render all rows if their size is smaller than viewport", function () {
    var calc = new WalkontableViewportCalculator(200, 0, 8, allRows20);
    expect(calc.renderStartRow).toBe(0);
    expect(calc.renderEndRow).toBe(7);
    expect(calc.countRendered).toBe(8);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(7);
    expect(calc.countVisible).toBe(8);
  });

  it("should render all rows if their size is exactly the viewport", function () {
    var calc = new WalkontableViewportCalculator(200, 0, 10, allRows20);
    expect(calc.renderStartRow).toBe(0);
    expect(calc.renderEndRow).toBe(9);
    expect(calc.countRendered).toBe(10);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(9);
    expect(calc.countVisible).toBe(10);
  });

  it("should render all rows if their size is slightly larger than viewport", function () {
    var calc = new WalkontableViewportCalculator(199, 0, 10, allRows20);
    expect(calc.renderStartRow).toBe(0);
    expect(calc.renderEndRow).toBe(9);
    expect(calc.countRendered).toBe(10);
    expect(calc.visibleStartRow).toBe(0);
    expect(calc.visibleEndRow).toBe(8);
    expect(calc.countVisible).toBe(9);
  });

  it("should set null values if total rows is 0", function () {
    var calc = new WalkontableViewportCalculator(200, 0, 0, allRows20);
    expect(calc.renderStartRow).toBe(null);
    expect(calc.renderStartPosition).toBe(null);
    expect(calc.renderEndRow).toBe(null);
    expect(calc.countRendered).toBe(0);
    expect(calc.visibleStartRow).toBe(null);
    expect(calc.visibleEndRow).toBe(null);
  });

  it("should scroll backwards if total rows is reached", function () {
    var calc = new WalkontableViewportCalculator(190, 350, 20, allRows20);
    expect(calc.renderStartRow).toBe(10);
    expect(calc.renderStartPosition).toBe(200);
    expect(calc.renderEndRow).toBe(19);
    expect(calc.countRendered).toBe(10);
    expect(calc.visibleStartRow).toBe(11);
    expect(calc.visibleEndRow).toBe(19);
  });
});
