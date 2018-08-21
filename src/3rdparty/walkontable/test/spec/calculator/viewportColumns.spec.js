describe('Walkontable.ViewportColumnsCalculator', () => {
  function allColumns20() {
    return 20;
  }

  it('should render first 5 columns in unscrolled container', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(100, 0, 1000, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(100, 0, 1000, allColumns20, null, true);

    expect(calc.startColumn).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endColumn).toBe(4);

    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(4);
  });

  it('should render 6 columns, starting from 3 in container scrolled to half of fourth column', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(100, 70, 1000, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(100, 70, 1000, allColumns20, null, true);

    expect(calc.startColumn).toBe(3);
    expect(calc.startPosition).toBe(60);
    expect(calc.endColumn).toBe(8);

    expect(visibleCalc.startColumn).toBe(4);
    expect(visibleCalc.endColumn).toBe(7);
  });

  it('should render 10 columns, starting from 1 in container scrolled to half of fourth column (with render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startColumn -= 2;
      calc.endColumn += 2;
    };
    const calc = new Walkontable.ViewportColumnsCalculator(100, 70, 1000, allColumns20, overrideFn);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(100, 70, 1000, allColumns20, null, true);

    expect(calc.startColumn).toBe(1);
    expect(calc.startPosition).toBe(20);
    expect(calc.endColumn).toBe(10);

    expect(visibleCalc.startColumn).toBe(4);
    expect(visibleCalc.endColumn).toBe(7);
  });

  it('should return number of rendered columns', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(100, 50, 1000, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(100, 50, 1000, allColumns20, null, true);

    expect(calc.count).toBe(6);

    expect(visibleCalc.count).toBe(4);
  });

  it('should render all columns if their size is smaller than viewport', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(200, 0, 8, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(200, 0, 8, allColumns20, null, true);

    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(7);
    expect(calc.count).toBe(8);

    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(7);
    expect(visibleCalc.count).toBe(8);
  });

  it('should render all columns if their size is exactly the viewport', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(200, 0, 10, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(200, 0, 10, allColumns20, null, true);

    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(9);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(9);
    expect(visibleCalc.count).toBe(10);
  });

  it('should render all columns if their size is slightly larger than viewport', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(199, 0, 10, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(199, 0, 10, allColumns20, null, true);

    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(9);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(8);
    expect(visibleCalc.count).toBe(9);
  });

  it('should set null values if total columns is 0', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(200, 0, 0, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(200, 0, 0, allColumns20, null, true);

    expect(calc.startColumn).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endColumn).toBe(null);
    expect(calc.count).toBe(0);

    expect(visibleCalc.startColumn).toBe(null);
    expect(visibleCalc.endColumn).toBe(null);
  });

  it('should set null values if total columns is 0 (with overrideFn provided)', () => {
    const overrideFn = function(myCalc) {
      myCalc.startColumn = 0;
      myCalc.endColumn = 0;
    };
    const calc = new Walkontable.ViewportColumnsCalculator(200, 0, 0, allColumns20, overrideFn);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(200, 0, 0, allColumns20, null, true);

    expect(calc.startColumn).toBe(null);
    expect(calc.startPosition).toBe(null);
    expect(calc.endColumn).toBe(null);
    expect(calc.count).toBe(0);

    expect(visibleCalc.startColumn).toBe(null);
    expect(visibleCalc.endColumn).toBe(null);
  });

  it('should scroll backwards if total columns is reached', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(190, 350, 20, allColumns20);
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(190, 350, 20, allColumns20, null, true);

    expect(calc.startColumn).toBe(10);
    expect(calc.startPosition).toBe(200);
    expect(calc.endColumn).toBe(19);
    expect(calc.count).toBe(10);

    expect(visibleCalc.startColumn).toBe(11);
    expect(visibleCalc.endColumn).toBe(19);
  });

  it('should update stretchAllRatio after refreshStretching call (stretch: all)', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(250, 0, 20, allColumns20, null, true, 'all');

    expect(calc.stretchAllRatio).toBe(0);
    expect(calc.stretchLastWidth).toBe(0);

    calc.refreshStretching(414);

    expect(calc.stretchAllRatio).toBe(1.035);
    expect(calc.stretchLastWidth).toBe(0);
  });

  it('should update stretchAllRatio after refreshStretching call (stretch: last)', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(250, 0, 5, allColumns20, null, true, 'last');

    expect(calc.stretchAllRatio).toBe(0);
    expect(calc.stretchLastWidth).toBe(0);

    calc.refreshStretching(414);

    expect(calc.stretchAllRatio).toBe(0);
    expect(calc.stretchLastWidth).toBe(334);
  });

  it('should return valid stretched column width (stretch: all)', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(250, 0, 5, allColumns20, null, true, 'all');

    expect(calc.getStretchedColumnWidth(0, 50)).toBe(null);
    expect(calc.needVerifyLastColumnWidth).toBe(true);

    calc.refreshStretching(417);

    expect(calc.getStretchedColumnWidth(0, allColumns20())).toBe(83);
    expect(calc.getStretchedColumnWidth(1, allColumns20())).toBe(83);
    expect(calc.getStretchedColumnWidth(2, allColumns20())).toBe(83);
    expect(calc.getStretchedColumnWidth(3, allColumns20())).toBe(83);
    expect(calc.needVerifyLastColumnWidth).toBe(true);
    expect(calc.getStretchedColumnWidth(4, allColumns20())).toBe(85);
    expect(calc.needVerifyLastColumnWidth).toBe(false);
  });

  it('should return valid stretched column width (stretch: last)', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(250, 0, 5, allColumns20, null, true, 'last');

    expect(calc.getStretchedColumnWidth(0, 50)).toBe(null);

    calc.refreshStretching(417);

    expect(calc.getStretchedColumnWidth(0, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(1, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(2, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(3, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(4, allColumns20())).toBe(337);
  });

  it('call refreshStretching should clear stretchAllColumnsWidth and needVerifyLastColumnWidth property', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(250, 0, 5, allColumns20, null, true, 'all');

    expect(calc.stretchAllColumnsWidth.length).toBe(0);
    expect(calc.needVerifyLastColumnWidth).toBe(true);

    calc.refreshStretching(417);
    calc.getStretchedColumnWidth(0, allColumns20());
    calc.getStretchedColumnWidth(1, allColumns20());
    calc.getStretchedColumnWidth(2, allColumns20());
    calc.getStretchedColumnWidth(3, allColumns20());
    calc.getStretchedColumnWidth(4, allColumns20());

    expect(calc.stretchAllColumnsWidth.length).toBe(5);
    expect(calc.needVerifyLastColumnWidth).toBe(false);

    calc.refreshStretching(201);

    expect(calc.stretchAllColumnsWidth.length).toBe(0);
    expect(calc.needVerifyLastColumnWidth).toBe(true);
  });

  it('should calculate the number of columns based on a default width, ' +
    'when the width returned from the function is not a number', () => {
    const calc = new Walkontable.ViewportColumnsCalculator(200, 0, 1000, () => (void 0 + 1));
    const visibleCalc = new Walkontable.ViewportColumnsCalculator(200, 0, 1000, () => (void 0 + 1), null, true);

    expect(calc.startColumn).toBe(0);
    expect(calc.startPosition).toBe(0);
    expect(calc.endColumn).toBe(3);

    expect(visibleCalc.startColumn).toBe(0);
    expect(visibleCalc.endColumn).toBe(3);
  });
});
