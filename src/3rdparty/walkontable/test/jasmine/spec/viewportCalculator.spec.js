describe('WalkontableViewportCalculator', function () {
  function allRows20() {
    return 20;
  }

  it("should render first 5 rows in unscrolled container", function() {
    var calc = new WalkontableViewportCalculator(100, 0, 1000, allRows20);
    expect(calc.renderStartRow).toBe(0);
    expect(calc.renderStartPosition).toBe(0);
    expect(calc.renderEndRow).toBe(4);
  });

  it("should render 5 rows, starting from 2 in container scrolled to half of third row", function () {
    var calc = new WalkontableViewportCalculator(100, 50, 1000, allRows20);
    expect(calc.renderStartRow).toBe(2);
    expect(calc.renderStartPosition).toBe(40);
    expect(calc.renderEndRow).toBe(7);
  });

  it("should return number of rendered rows", function () {
    var calc = new WalkontableViewportCalculator(100, 50, 1000, allRows20);
    expect(calc.renderStartRow).toBe(2);
    expect(calc.renderEndRow).toBe(7);
    expect(calc.countRendered).toBe(6);
  });

  it("should render all rows if they fit in viewport", function () {
    var calc = new WalkontableViewportCalculator(200, 0, 10, allRows20);
    expect(calc.renderStartRow).toBe(0);
    expect(calc.renderEndRow).toBe(9);
    expect(calc.countRendered).toBe(10);
  });

  it("should set null values if total rows is 0", function () {
    var calc = new WalkontableViewportCalculator(200, 0, 0, allRows20);
    expect(calc.renderStartRow).toBe(null);
    expect(calc.renderStartPosition).toBe(null);
    expect(calc.renderEndRow).toBe(null);
    expect(calc.countRendered).toBe(0);
  });
});
