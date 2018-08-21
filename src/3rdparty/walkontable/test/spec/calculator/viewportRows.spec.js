describe('Walkontable.ViewportRowsCalculator', () => {
  function allRows20() {
    return 20;
  }

  it('should render first 5 rows in unscrolled container', () => {
    const calc = new Walkontable.ViewportRowsCalculator(100, 0, 1000, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(100, 0, 1000, allRows20, null, true);

    expect(calc.startRow).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endRow).toBe(4);

    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(4);
  });

  it('should render 6 rows, starting from 3 in container scrolled to half of fourth row', () => {
    const calc = new Walkontable.ViewportRowsCalculator(100, 70, 1000, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(100, 70, 1000, allRows20, null, true);

    expect(calc.startRow).toBe(3);
    expect(calc.startPosition).toBe(60);
    expect(calc.endRow).toBe(8);

    expect(visibleCalc.startRow).toBe(4);
    expect(visibleCalc.endRow).toBe(7);
  });

  it('should render 10 rows, starting from 1 in container scrolled to half of fourth row (with render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startRow -= 2;
      calc.endRow += 2;
    };
    const calc = new Walkontable.ViewportRowsCalculator(100, 70, 1000, allRows20, overrideFn);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(100, 70, 1000, allRows20, null, true);

    expect(calc.startRow).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endRow).toBe(10);

    expect(visibleCalc.startRow).toBe(4);
    expect(visibleCalc.endRow).toBe(7);
  });

  it('should return number of rendered rows', () => {
    const calc = new Walkontable.ViewportRowsCalculator(100, 50, 1000, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(100, 50, 1000, allRows20, null, true);

    expect(calc.count).toBe(6);

    expect(visibleCalc.count).toBe(4);
  });

  it('should render all rows if their size is smaller than viewport', () => {
    const calc = new Walkontable.ViewportRowsCalculator(200, 0, 8, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(200, 0, 8, allRows20, null, true);

    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(7);
    expect(calc.count).toBe(8);

    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(7);
    expect(visibleCalc.count).toBe(8);
  });

  it('should render all rows if their size is exactly the viewport', () => {
    const calc = new Walkontable.ViewportRowsCalculator(200, 0, 10, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(200, 0, 10, allRows20, null, true);

    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(9);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(9);
    expect(visibleCalc.count).toBe(10);
  });

  it('should render all rows if their size is slightly larger than viewport', () => {
    const calc = new Walkontable.ViewportRowsCalculator(199, 0, 10, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(199, 0, 10, allRows20, null, true);

    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(9);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(8);
    expect(visibleCalc.count).toBe(9);
  });

  it('should set null values if total rows is 0', () => {
    const calc = new Walkontable.ViewportRowsCalculator(200, 0, 0, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(200, 0, 0, allRows20, null, true);

    expect(calc.startRow).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endRow).toBe(null);
    expect(calc.count).toBe(0);

    expect(visibleCalc.startRow).toBe(null);
    expect(visibleCalc.endRow).toBe(null);
  });

  it('should set null values if total rows is 0 (with overrideFn provided)', () => {
    const overrideFn = function(myCalc) {
      myCalc.startRow = 0;
      myCalc.endRow = 0;
    };
    const calc = new Walkontable.ViewportRowsCalculator(200, 0, 0, allRows20, overrideFn);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(200, 0, 0, allRows20, null, true);

    expect(calc.startRow).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endRow).toBe(null);
    expect(calc.count).toBe(0);

    expect(visibleCalc.startRow).toBe(null);
    expect(visibleCalc.endRow).toBe(null);
  });

  it('should scroll backwards if total rows is reached', () => {
    const calc = new Walkontable.ViewportRowsCalculator(190, 350, 20, allRows20);
    const visibleCalc = new Walkontable.ViewportRowsCalculator(190, 350, 20, allRows20, null, true);

    expect(calc.startRow).toBe(10);
    expect(calc.startPosition).toBe(200);
    expect(calc.endRow).toBe(19);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startRow).toBe(11);
    expect(visibleCalc.endRow).toBe(19);
  });

  it('should calculate the number of rows based on a default height, ' +
    'when the height returned from the function is not a number', () => {
    const calc = new Walkontable.ViewportRowsCalculator(100, 0, 1000, () => (void 0 + 1));
    const visibleCalc = new Walkontable.ViewportRowsCalculator(100, 0, 1000, () => (void 0 + 1), null, true);

    expect(calc.startRow).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endRow).toBe(4);

    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(3);
  });
});
