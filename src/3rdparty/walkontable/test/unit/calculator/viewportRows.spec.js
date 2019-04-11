import ViewportRowsCalculator from 'walkontable/calculator/viewportRows';

describe('ViewportRowsCalculator', () => {
  function allRows20() {
    return 20;
  }

  it('should render first 5 rows in unscrolled container', () => {
    const calc = new ViewportRowsCalculator(100, 0, 1000, allRows20);
    const visibleCalc = new ViewportRowsCalculator(100, 0, 1000, allRows20, null, true);

    expect(calc.startRow).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endRow).toBe(4);
    expect(calc.count).toBe(5);

    expect(visibleCalc.startRow).toBe(0);
    expect(visibleCalc.endRow).toBe(4);
    expect(visibleCalc.count).toBe(5);
  });

  // it('should render 6 rows, starting from 3 in container scrolled to half of fourth row', () => {
  //   const calc = new ViewportRowsCalculator(100, 70, 1000, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(100, 70, 1000, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(3);
  //   expect(calc.startPosition).toBe(60);
  //   expect(calc.endRow).toBe(8);
  //   expect(calc.count).toBe(6);
  //
  //   expect(visibleCalc.startRow).toBe(4);
  //   expect(visibleCalc.endRow).toBe(7);
  //   expect(visibleCalc.count).toBe(4);
  // });

  it('should render 10 rows, starting from 1 in container scrolled to half of fourth row (with render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startRow -= 2;
      calc.endRow += 2;
    };
    const calc = new ViewportRowsCalculator(100, 70, 1000, allRows20, overrideFn);
    const visibleCalc = new ViewportRowsCalculator(100, 70, 1000, allRows20, null, true);

    expect(calc.startRow).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endRow).toBe(10);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startRow).toBe(3);
    expect(visibleCalc.endRow).toBe(8);
    expect(visibleCalc.count).toBe(6);
  });
  //
  // it('should return number of rendered rows', () => {
  //   const calc = new ViewportRowsCalculator(100, 50, 1000, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(100, 50, 1000, allRows20, null, true);
  //
  //   expect(calc.count).toBe(6);
  //
  //   expect(visibleCalc.count).toBe(4);
  // });
  //
  // it('should render all rows if their size is smaller than viewport', () => {
  //   const calc = new ViewportRowsCalculator(200, 0, 8, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(200, 0, 8, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(0);
  //   expect(calc.endRow).toBe(7);
  //   expect(calc.count).toBe(8);
  //
  //   expect(visibleCalc.startRow).toBe(0);
  //   expect(visibleCalc.endRow).toBe(7);
  //   expect(visibleCalc.count).toBe(8);
  // });
  //
  // it('should render all rows if their size is exactly the viewport', () => {
  //   const calc = new ViewportRowsCalculator(200, 0, 10, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(200, 0, 10, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(0);
  //   expect(calc.endRow).toBe(9);
  //   expect(calc.count).toBe(10);
  //
  //   expect(visibleCalc.startRow).toBe(0);
  //   expect(visibleCalc.endRow).toBe(9);
  //   expect(visibleCalc.count).toBe(10);
  // });
  //
  // it('should render all rows if their size is slightly larger than viewport', () => {
  //   const calc = new ViewportRowsCalculator(199, 0, 10, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(199, 0, 10, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(0);
  //   expect(calc.endRow).toBe(9);
  //   expect(calc.count).toBe(10);
  //
  //   expect(visibleCalc.startRow).toBe(0);
  //   expect(visibleCalc.endRow).toBe(8);
  //   expect(visibleCalc.count).toBe(9);
  // });
  //
  // it('should set null values if total rows is 0', () => {
  //   const calc = new ViewportRowsCalculator(200, 0, 0, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(200, 0, 0, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(null);
  //   expect(calc.startPosition).toBe(null);
  //   expect(calc.endRow).toBe(null);
  //   expect(calc.count).toBe(0);
  //
  //   expect(visibleCalc.startRow).toBe(null);
  //   expect(visibleCalc.endRow).toBe(null);
  //   expect(visibleCalc.count).toBe(0);
  // });
  //
  // it('should set null values if total rows is 0 (with overrideFn provided)', () => {
  //   const overrideFn = function(myCalc) {
  //     myCalc.startRow = 0;
  //     myCalc.endRow = 0;
  //   };
  //   const calc = new ViewportRowsCalculator(200, 0, 0, allRows20, overrideFn);
  //   const visibleCalc = new ViewportRowsCalculator(200, 0, 0, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(null);
  //   expect(calc.startPosition).toBe(null);
  //   expect(calc.endRow).toBe(null);
  //   expect(calc.count).toBe(0);
  //
  //   expect(visibleCalc.startRow).toBe(null);
  //   expect(visibleCalc.endRow).toBe(null);
  //   expect(visibleCalc.count).toBe(0);
  // });
  //
  // it('should scroll backwards if total rows is reached', () => {
  //   const calc = new ViewportRowsCalculator(190, 350, 20, allRows20);
  //   const visibleCalc = new ViewportRowsCalculator(190, 350, 20, allRows20, null, true);
  //
  //   expect(calc.startRow).toBe(10);
  //   expect(calc.startPosition).toBe(200);
  //   expect(calc.endRow).toBe(19);
  //   expect(calc.count).toBe(10);
  //
  //   expect(visibleCalc.startRow).toBe(11);
  //   expect(visibleCalc.endRow).toBe(19);
  //   expect(visibleCalc.count).toBe(9);
  // });
  //
  // it(`should calculate the number of rows based on a default height,
  //     when the height returned from the function is not a number`, () => {
  //   const calc = new ViewportRowsCalculator(100, 0, 1000, () => (void 0 + 1));
  //   const visibleCalc = new ViewportRowsCalculator(100, 0, 1000, () => (void 0 + 1), null, true);
  //
  //   expect(calc.startRow).toBe(0);
  //   expect(calc.startPosition).toBe(0);
  //   expect(calc.endRow).toBe(4);
  //   expect(calc.count).toBe(5);
  //
  //   expect(visibleCalc.startRow).toBe(0);
  //   expect(visibleCalc.endRow).toBe(3);
  //   expect(visibleCalc.count).toBe(4);
  // });
});
