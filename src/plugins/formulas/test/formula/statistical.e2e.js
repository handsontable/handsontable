describe('Formulas -> statistical functions', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('AVEDEV', () => {
    var data = getDataForFormulas(0, 'name', ['=AVEDEV()', '=AVEDEV(A1, 2)']);

    data[0].id = 1.1;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.45, 12);
  });

  it('AVERAGE', () => {
    var data = getDataForFormulas(0, 'name', ['=AVERAGE()', '=AVERAGE(A1, 2, 5, 10)']);

    data[0].id = 1.1;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(4.525, 12);
  });

  it('AVERAGEA', () => {
    var data = getDataForFormulas(0, 'name', ['=AVERAGEA()', '=AVERAGEA(A1, 2, 5, 10)']);

    data[0].id = 1.1;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(4.525, 12);
  });

  it('AVERAGEIF', () => {
    var data = getDataForFormulas(0, 'address', ['=AVERAGEIF()', '=AVERAGEIF(A1:B2, ">5", A3:B4)']);

    data[0].id = 2;
    data[0].name = 4;
    data[1].id = 8;
    data[1].name = 16;
    data[2].id = 1;
    data[2].name = 2;
    data[3].id = 3;
    data[3].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBe(3.5);
  });

  it('AVERAGEIFS', () => {
    var data = getDataForFormulas(0, 'address', ['=AVERAGEIFS()', '=AVERAGEIFS(A1:A4, B1:B4, ">2", B1:B4, ">2")']);

    data[0].id = 2;
    data[1].id = 4;
    data[2].id = 8;
    data[3].id = 16;
    data[0].name = 1;
    data[1].name = 2;
    data[2].name = 3;
    data[3].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(12);
  });

  it('BETADIST', () => {
    var data = getDataForFormulas(0, 'address', ['=BETADIST()', '=BETADIST(2, 8, 10, TRUE, 1, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.6854705810117458, 12);
  });

  it('BETAINV', () => {
    var data = getDataForFormulas(0, 'address', ['=BETAINV()', '=BETAINV(0.6854705810117458, 8, 10, 1, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(2, 12);
  });

  it('BINOMDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=BINOMDIST()', '=BINOMDIST(6, 10, 0.5, FALSE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.205078125, 12);
  });

  it('BINOM.DIST.RANGE', () => {
    var data = getDataForFormulas(0, 'address', ['=BINOM.DIST.RANGE()', '=BINOM.DIST.RANGE(60, 0.5, 34)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.060616586840172675, 12);
  });

  it('BINOM.INV', () => {
    var data = getDataForFormulas(0, 'address', ['=BINOM.INV()', '=BINOM.INV(6, 0.5, 0.7)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(4, 12);
  });

  it('CHISQ.DIST', () => {
    var data = getDataForFormulas(0, 'address', ['=CHISQ.DIST()', '=CHISQ.DIST(0.5, 1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.43939128946770356, 12);
  });

  it('CHISQ.DIST.RT', () => {
    var data = getDataForFormulas(0, 'address', ['=CHISQ.DIST.RT()', '=CHISQ.DIST.RT(3, 5)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.6999858358786271, 12);
  });

  it('CHISQ.INV', () => {
    var data = getDataForFormulas(0, 'address', ['=CHISQ.INV()', '=CHISQ.INV(0.5, 6)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(5.348120627447116, 12);
  });

  it('CHISQ.INV.RT', () => {
    var data = getDataForFormulas(0, 'address', ['=CHISQ.INV.RT()', '=CHISQ.INV.RT(0.4, 6)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(6.2107571945266935, 12);
  });

  it('COLUMN', () => {
    var data = getDataForFormulas(0, 'id', ['=COLUMN()', '=COLUMN(B2:E5, 0)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 0)).toEqual([['Leanne Ware'], ['Mathis Boone'], ['Cruz Benjamin'], ['Reese David']]);
  });

  it('COLUMNS', () => {
    var data = getDataForFormulas(0, 'id', ['=COLUMNS()', '=COLUMNS(B2:E5)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 0)).toBe(4);
  });

  it('CONFIDENCE', () => {
    var data = getDataForFormulas(0, 'id', ['=CONFIDENCE()', '=CONFIDENCE(0.5, 1, 5)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 0)).toBeCloseTo(0.301640986313058, 12);
  });

  it('CONFIDENCE.T', () => {
    var data = getDataForFormulas(0, 'id', ['=CONFIDENCE.T()', '=CONFIDENCE.T(0.5, 1, 5)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 0)).toBeCloseTo(0.33124980616238564, 12);
  });

  it('CORREL', () => {
    var data = getDataForFormulas(0, 'id', ['=CORREL()', '=CORREL(B1:B5, C1:C5)']);

    data[0].name = 3;
    data[1].name = 2;
    data[2].name = 4;
    data[3].name = 5;
    data[4].name = 6;
    data[0].address = 9;
    data[1].address = 7;
    data[2].address = 12;
    data[3].address = 15;
    data[4].address = 17;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 0)).toBeCloseTo(0.9970544855015815, 12);
  });

  it('COUNT', () => {
    var data = getDataForFormulas(0, 'id', ['=COUNT()', '=COUNT(B1, 0.5, "foo", 1, 8)']);

    data[0].name = true;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe(0);
    expect(hot.getDataAtCell(1, 0)).toBe(3);
  });

  it('COUNTA', () => {
    var data = getDataForFormulas(0, 'id', ['=COUNTA()', '=COUNTA(B1, 0.5, "foo", 1, 8)']);

    data[0].name = true;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe(0);
    expect(hot.getDataAtCell(1, 0)).toBe(5);
  });

  it('COUNTBLANK', () => {
    var data = getDataForFormulas(0, 'id', ['=COUNTBLANK()', '=COUNTBLANK(B1, 0.5, "", 1, 8)']);

    data[0].name = true;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe(0);
    expect(hot.getDataAtCell(1, 0)).toBe(1);
  });

  it('COUNTIF', () => {
    var data = getDataForFormulas(0, 'id', ['=COUNTIF()', '=COUNTIF(B1:C3, ">1")']);

    data[0].name = 1;
    data[1].name = null;
    data[2].name = 3;
    data[0].address = 'a';
    data[1].address = 4;
    data[2].address = 'c';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 0)).toBe(2);
  });

  it('COUNTIFS', () => {
    var data = getDataForFormulas(0, 'id', ['=COUNTIFS()', '=COUNTIFS(B1:C3, ">1")']);

    data[0].name = 1;
    data[1].name = null;
    data[2].name = 3;
    data[0].address = 'a';
    data[1].address = 4;
    data[2].address = 'c';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 0)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 0)).toBe(2);
  });

  it('COUNTIN', () => {
    var data = getDataForFormulas(0, 'name', ['=COUNTIN()', '=COUNTIN(A1:A5, 1)']);

    data[0].id = 1;
    data[1].id = 1;
    data[2].id = 2;
    data[3].id = 2;
    data[4].id = 2;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 1)).toBe(2);
  });

  it('COUNTUNIQUE', () => {
    var data = getDataForFormulas(0, 'name', ['=COUNTUNIQUE()', '=COUNTUNIQUE(A1:A5, 1)']);

    data[0].id = 1;
    data[1].id = 1;
    data[2].id = 2;
    data[3].id = 2;
    data[4].id = 2;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
    expect(hot.getDataAtCell(1, 1)).toBe(2);
  });

  it('COVARIANCE.P', () => {
    var data = getDataForFormulas(0, 'address', ['=COVARIANCE.P()', '=COVARIANCE.P(A1:A5, B1:B5)']);

    data[0].id = 3;
    data[1].id = 2;
    data[2].id = 4;
    data[3].id = 5;
    data[4].id = 6;
    data[0].name = 9;
    data[1].name = 7;
    data[2].name = 12;
    data[3].name = 15;
    data[4].name = 17;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(5.2);
  });

  it('COVARIANCE.S', () => {
    var data = getDataForFormulas(0, 'address', ['=COVARIANCE.S()', '=COVARIANCE.S(A1:A3, B1:B3)']);

    data[0].id = 2;
    data[1].id = 4;
    data[2].id = 8;
    data[0].name = 5;
    data[1].name = 11;
    data[2].name = 12;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(9.666666666666668, 12);
  });

  it('DEVSQ', () => {
    var data = getDataForFormulas(0, 'address', ['=DEVSQ()', '=DEVSQ(A1:A7)']);

    data[0].id = 4;
    data[1].id = 5;
    data[2].id = 8;
    data[3].id = 7;
    data[4].id = 11;
    data[5].id = 4;
    data[6].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(48);
  });

  it('EXPONDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=EXPONDIST()', '=EXPONDIST(0.2, 10, TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.8646647167633873, 12);
  });

  it('FDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=FDIST()', '=FDIST(15, 6, 4, TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.9897419523940192, 12);
  });

  it('FDISTRT', () => {
    var data = getDataForFormulas(0, 'address', ['=FDISTRT()', '=FDISTRT(15, 6, 4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.010258047605980813, 12);
  });

  it('FINV', () => {
    var data = getDataForFormulas(0, 'address', ['=FINV()', '=FINV(0.1, 6, 4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.31438998832176834, 12);
  });

  it('FINVRT', () => {
    var data = getDataForFormulas(0, 'address', ['=FINVRT()', '=FINVRT(0.1, 6, 4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(4.009749312673947, 12);
  });

  it('FISHER', () => {
    var data = getDataForFormulas(0, 'address', ['=FISHER()', '=FISHER(0.1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.10033534773107562, 12);
  });

  it('FISHERINV', () => {
    var data = getDataForFormulas(0, 'address', ['=FISHERINV()', '=FISHERINV(0.1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.09966799462495583, 12);
  });

  it('FORECAST', () => {
    var data = getDataForFormulas(0, 'address', ['=FORECAST()', '=FORECAST(30, A1:A5, B1:B5)']);

    data[0].id = 6;
    data[1].id = 7;
    data[2].id = 9;
    data[3].id = 15;
    data[4].id = 21;
    data[0].name = 20;
    data[1].name = 28;
    data[2].name = 31;
    data[3].name = 38;
    data[4].name = 40;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(10.607253086419755, 12);
  });

  it('FREQUENCY', () => {
    var data = getDataForFormulas(0, 'address', ['=FREQUENCY()', '=FREQUENCY(A1:A9, B1:B3)']);

    data[0].id = 79;
    data[1].id = 85;
    data[2].id = 78;
    data[3].id = 85;
    data[4].id = 50;
    data[5].id = 81;
    data[6].id = 95;
    data[7].id = 88;
    data[8].id = 97;
    data[0].name = 70;
    data[1].name = 79;
    data[2].name = 89;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 2, 4, 2]);
  });

  it('GAMMA', () => {
    var data = getDataForFormulas(0, 'address', ['=GAMMA()', '=GAMMA(0.1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toEqual(9.51350769866877);
  });

  it('GAMMADIST', () => {
    var data = getDataForFormulas(0, 'address', ['=GAMMADIST()', '=GAMMADIST(1, 3, 7, TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.00043670743091302124, 10);
  });

  it('GAMMAINV', () => {
    var data = getDataForFormulas(0, 'address', ['=GAMMAINV()', '=GAMMAINV(1, 3, 7)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toEqual(1233.435565298214);
  });

  it('GAMMALN', () => {
    var data = getDataForFormulas(0, 'address', ['=GAMMALN()', '=GAMMALN(4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(1.7917594692280547, 12);
  });

  it('GAMMALN.PRECISE', () => {
    var data = getDataForFormulas(0, 'address', ['=GAMMALN.PRECISE()', '=GAMMALN.PRECISE(4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(1.7917594692280547, 12);
  });

  it('GAUSS', () => {
    var data = getDataForFormulas(0, 'address', ['=GAUSS()', '=GAUSS(4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.4999683287581669, 12);
  });

  it('GEOMEAN', () => {
    var data = getDataForFormulas(0, 'address', ['=GEOMEAN()', '=GEOMEAN(A1:A7)']);

    data[0].id = 4;
    data[1].id = 5;
    data[2].id = 8;
    data[3].id = 7;
    data[4].id = 11;
    data[5].id = 4;
    data[6].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(5.476986969656962, 12);
  });

  it('GROWTH', () => {
    var data = getDataForFormulas(0, 'address', ['=GROWTH()', '=GROWTH(A1:A6, B1:B7, FOO)']);

    data[0].id = 33100;
    data[1].id = 47300;
    data[2].id = 69000;
    data[3].id = 102000;
    data[4].id = 150000;
    data[5].id = 220000;
    data[0].name = 11;
    data[1].name = 12;
    data[2].name = 13;
    data[3].name = 14;
    data[4].name = 15;
    data[5].name = 16;
    data[6].name = 11;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    hot.getPlugin('formulas').setVariable('FOO', [11, 12, 13, 14, 15, 16, 17, 18, 19]);
    hot.getPlugin('formulas').recalculateFull();
    hot.render();

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');

    var value = hot.getDataAtCell(1, 2);

    expect(value[0]).toBeCloseTo(32618.20377353843, 8);
    expect(value[1]).toBeCloseTo(47729.422614746654, 8);
    expect(value[2]).toBeCloseTo(69841.30085621699, 8);
    expect(value[3]).toBeCloseTo(102197.07337883323, 8);
    expect(value[4]).toBeCloseTo(149542.4867400496, 8);
    expect(value[5]).toBeCloseTo(218821.8762146044, 8);
    expect(value[6]).toBeCloseTo(320196.71836349065, 8);
    expect(value[7]).toBeCloseTo(468536.05418408196, 8);
    expect(value[8]).toBeCloseTo(685597.3889812973, 8);
  });

  it('HARMEAN', () => {
    var data = getDataForFormulas(0, 'address', ['=HARMEAN()', '=HARMEAN(A1:A7)']);

    data[0].id = 4;
    data[1].id = 5;
    data[2].id = 8;
    data[3].id = 7;
    data[4].id = 11;
    data[5].id = 4;
    data[6].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(5.028375962061728, 12);
  });

  it('HYPGEOMDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=HYPGEOMDIST()', '=HYPGEOMDIST(1, 4, 8, 20)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.3632610939112487, 12);
  });

  it('INTERCEPT', () => {
    var data = getDataForFormulas(0, 'address', ['=INTERCEPT()', '=INTERCEPT(A1:A5, B1:B5)']);

    data[0].id = 2;
    data[1].id = 3;
    data[2].id = 9;
    data[3].id = 1;
    data[4].id = 8;
    data[0].name = 6;
    data[1].name = 5;
    data[2].name = 11;
    data[3].name = 7;
    data[4].name = 5;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.04838709677419217, 12);
  });

  it('KURT', () => {
    var data = getDataForFormulas(0, 'address', ['=KURT()', '=KURT(A1:A10)']);

    data[0].id = 3;
    data[1].id = 4;
    data[2].id = 5;
    data[3].id = 2;
    data[4].id = 3;
    data[5].id = 4;
    data[6].id = 5;
    data[7].id = 6;
    data[8].id = 4;
    data[9].id = 7;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(-0.15179963720841627, 12);
  });

  it('LARGE', () => {
    var data = getDataForFormulas(0, 'address', ['=LARGE()', '=LARGE(A1:A5, 3)']);

    data[0].id = 3;
    data[1].id = 5;
    data[2].id = 3;
    data[3].id = 5;
    data[4].id = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(4);
  });

  it('LINEST', () => {
    var data = getDataForFormulas(0, 'address', ['=LINEST()', '=LINEST(A1:A4, B1:B4)']);

    data[0].id = 1;
    data[1].id = 9;
    data[2].id = 5;
    data[3].id = 7;
    data[0].name = 0;
    data[1].name = 4;
    data[2].name = 2;
    data[3].name = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([2, 1]);
  });

  it('LOGEST', () => {
    var data = getDataForFormulas(0, 'address', ['=LOGEST()', '=LOGEST(A1:A4, B1:B4)']);

    data[0].id = 1;
    data[1].id = 9;
    data[2].id = 5;
    data[3].id = 7;
    data[0].name = 0;
    data[1].name = 4;
    data[2].name = 2;
    data[3].name = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([1.751116, 1.194316]);
  });

  it('LOGNORMDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=LOGNORMDIST()', '=LOGNORMDIST(4, 3.5, 1.2, TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.0390835557068005, 12);
  });

  it('LOGNORMINV', () => {
    var data = getDataForFormulas(0, 'address', ['=LOGNORMINV()', '=LOGNORMINV(0.0390835557068005, 3.5, 1.2)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(4, 12);
  });

  it('MAX', () => {
    var data = getDataForFormulas(0, 'address', ['=MAX()', '=MAX(-1, 9, 9.2, 4, "foo", TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(9.2);
  });

  it('MAXA', () => {
    var data = getDataForFormulas(0, 'address', ['=MAXA()', '=MAXA(-1, 9, 9.2, 4, "foo", TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(9.2);
  });

  it('MEDIAN', () => {
    var data = getDataForFormulas(0, 'address', ['=MEDIAN()', '=MEDIAN(1, 9, 9.2, 4)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 2)).toBe(6.5);
  });

  it('MIN', () => {
    var data = getDataForFormulas(0, 'address', ['=MIN()', '=MIN(-1.1, 9, 9.2, 4, "foo", TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(-1.1);
  });

  it('MINA', () => {
    var data = getDataForFormulas(0, 'address', ['=MINA()', '=MINA(-1.1, 9, 9.2, 4, "foo", TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(-1.1);
  });

  it('MODEMULT', () => {
    var data = getDataForFormulas(0, 'address', ['=MODEMULT()', '=MODEMULT(A1:A12)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[3].id = 4;
    data[4].id = 3;
    data[5].id = 2;
    data[6].id = 1;
    data[7].id = 2;
    data[8].id = 3;
    data[9].id = 5;
    data[10].id = 6;
    data[11].id = 1;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toEqual([2, 3, 1]);
  });

  it('MODESNGL', () => {
    var data = getDataForFormulas(0, 'address', ['=MODESNGL()', '=MODESNGL(A1:A6)']);

    data[0].id = 5.6;
    data[1].id = 4;
    data[2].id = 4;
    data[3].id = 3;
    data[4].id = 2;
    data[5].id = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(4);
  });

  it('NEGBINOMDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=NEGBINOMDIST()', '=NEGBINOMDIST(10, 5, 0.25)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(0.05504866037517786);
  });

  it('NORMDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=NORMDIST()', '=NORMDIST(1, 0, 1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(0.24197072451914337);
  });

  it('NORMINV', () => {
    var data = getDataForFormulas(0, 'address', ['=NORMINV()', '=NORMINV(1, 0, 1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(141.4213562373095);
  });

  it('NORMSDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=NORMSDIST()', '=NORMSDIST(1, TRUE)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(0.8413447460685429);
  });

  it('NORMSINV', () => {
    var data = getDataForFormulas(0, 'address', ['=NORMSINV()', '=NORMSINV(1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(141.4213562373095);
  });

  it('PEARSON', () => {
    var data = getDataForFormulas(0, 'address', ['=PEARSON()', '=PEARSON(A1:A5, B1:B5)']);

    data[0].id = 9;
    data[1].id = 7;
    data[2].id = 5;
    data[3].id = 3;
    data[4].id = 1;
    data[0].name = 10;
    data[1].name = 6;
    data[2].name = 1;
    data[3].name = 5;
    data[4].name = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.6993786061802354, 12);
  });

  it('PERCENTILEEXC', () => {
    var data = getDataForFormulas(0, 'address', ['=PERCENTILEEXC()', '=PERCENTILEEXC(A1:A4, 0.5)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[3].id = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(2.5);
  });

  it('PERCENTILEINC', () => {
    var data = getDataForFormulas(0, 'address', ['=PERCENTILEINC()', '=PERCENTILEINC(A1:A4, 0.5)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[3].id = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(2.5);
  });

  it('PERCENTRANKEXC', () => {
    var data = getDataForFormulas(0, 'address', ['=PERCENTRANKEXC()', '=PERCENTRANKEXC(A1:A4, 4)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[3].id = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(0.8);
  });

  it('PERCENTRANKINC', () => {
    var data = getDataForFormulas(0, 'address', ['=PERCENTRANKINC()', '=PERCENTRANKINC(A1:A4, 4)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[3].id = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(1);
  });

  it('PERMUT', () => {
    var data = getDataForFormulas(0, 'address', ['=PERMUT()', '=PERMUT(10, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(720);
  });

  it('PERMUTATIONA', () => {
    var data = getDataForFormulas(0, 'address', ['=PERMUTATIONA()', '=PERMUTATIONA(10, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(1000);
  });

  it('PHI', () => {
    var data = getDataForFormulas(0, 'address', ['=PHI()', '=PHI(1)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.24197072451914337, 12);
  });

  it('POISSONDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=POISSONDIST()', '=POISSONDIST(1, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.14936120510359185, 12);
  });

  it('PROB', () => {
    var data = getDataForFormulas(0, 'address', ['=PROB()', '=PROB(A1:A4, B1:B4, 1, 3)']);

    data[0].id = 0;
    data[1].id = 1;
    data[2].id = 2;
    data[3].id = 3;
    data[0].name = 0.2;
    data[1].name = 0.3;
    data[2].name = 0.1;
    data[3].name = 0.4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(0.8);
  });

  it('QUARTILEEXC', () => {
    var data = getDataForFormulas(0, 'address', ['=QUARTILEEXC()', '=QUARTILEEXC(A1:A11, 2)']);

    data[0].id = 6;
    data[1].id = 7;
    data[2].id = 15;
    data[3].id = 36;
    data[4].id = 39;
    data[5].id = 40;
    data[6].id = 41;
    data[7].id = 42;
    data[8].id = 43;
    data[9].id = 47;
    data[10].id = 49;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(40);
  });

  it('QUARTILEINC', () => {
    var data = getDataForFormulas(0, 'address', ['=QUARTILEINC()', '=QUARTILEINC(A1:A8, 2)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 4;
    data[3].id = 7;
    data[4].id = 8;
    data[5].id = 9;
    data[6].id = 10;
    data[7].id = 12;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(7.5);
  });

  it('RANKAVG', () => {
    var data = getDataForFormulas(0, 'address', ['=RANKAVG()', '=RANKAVG(88, A1:A7, 1)']);

    data[0].id = 89;
    data[1].id = 88;
    data[2].id = 92;
    data[3].id = 101;
    data[4].id = 94;
    data[5].id = 97;
    data[6].id = 95;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(1);
  });

  it('RANKEQ', () => {
    var data = getDataForFormulas(0, 'address', ['=RANKEQ()', '=RANKEQ(7, A1:A5, 1)']);

    data[0].id = 7;
    data[1].id = 3.5;
    data[2].id = 3.5;
    data[3].id = 1;
    data[4].id = 2;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(5);
  });

  it('ROW', () => {
    var data = getDataForFormulas(0, 'address', ['=ROW()', '=ROW(A1:B3, 0)', '=ROW(A1:B3, 2)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 2;
    data[0].name = 2;
    data[1].name = 3;
    data[2].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 2]);
    expect(hot.getDataAtCell(2, 2)).toEqual([2, 4]);
  });

  it('ROWS', () => {
    var data = getDataForFormulas(0, 'address', ['=ROWS()', '=ROWS(A1:B3)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 2;
    data[0].name = 2;
    data[1].name = 3;
    data[2].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBe(3);
  });

  it('RSQ', () => {
    var data = getDataForFormulas(0, 'address', ['=RSQ()', '=RSQ(A1:A7, B1:B7)']);

    data[0].id = 2;
    data[1].id = 3;
    data[2].id = 9;
    data[3].id = 1;
    data[4].id = 8;
    data[5].id = 7;
    data[6].id = 5;
    data[0].name = 6;
    data[1].name = 5;
    data[2].name = 11;
    data[3].name = 7;
    data[4].name = 5;
    data[5].name = 4;
    data[6].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.05795019157088122, 12);
  });

  it('SKEW', () => {
    var data = getDataForFormulas(0, 'address', ['=SKEW()', '=SKEW(A1:A10)']);

    data[0].id = 3;
    data[1].id = 4;
    data[2].id = 5;
    data[3].id = 2;
    data[4].id = 3;
    data[5].id = 4;
    data[6].id = 5;
    data[7].id = 6;
    data[8].id = 4;
    data[9].id = 7;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.3595430714067974, 12);
  });

  it('SKEWP', () => {
    var data = getDataForFormulas(0, 'address', ['=SKEWP()', '=SKEWP(A1:A10)']);

    data[0].id = 3;
    data[1].id = 4;
    data[2].id = 5;
    data[3].id = 2;
    data[4].id = 3;
    data[5].id = 4;
    data[6].id = 5;
    data[7].id = 6;
    data[8].id = 4;
    data[9].id = 7;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.303193339354144, 12);
  });

  it('SLOPE', () => {
    var data = getDataForFormulas(0, 'address', ['=SLOPE()', '=SLOPE(A1:A7, B1:B7)']);

    data[0].id = 2;
    data[1].id = 3;
    data[2].id = 9;
    data[3].id = 1;
    data[4].id = 8;
    data[5].id = 7;
    data[6].id = 5;
    data[0].name = 6;
    data[1].name = 5;
    data[2].name = 11;
    data[3].name = 7;
    data[4].name = 5;
    data[5].name = 4;
    data[6].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.3055555555555556, 12);
  });

  it('SMALL', () => {
    var data = getDataForFormulas(0, 'address', ['=SMALL()', '=SMALL(A1:A9, 4)']);

    data[0].id = 3;
    data[1].id = 4;
    data[2].id = 5;
    data[3].id = 2;
    data[4].id = 3;
    data[5].id = 4;
    data[6].id = 6;
    data[7].id = 4;
    data[8].id = 7;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(4);
  });

  it('STANDARDIZE', () => {
    var data = getDataForFormulas(0, 'address', ['=STANDARDIZE()', '=STANDARDIZE(1, 3, 5)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBe(-0.4);
  });

  it('STDEVP', () => {
    var data = getDataForFormulas(0, 'address', ['=STDEVP()', '=STDEVP(A1:A10)']);

    data[0].id = 1345;
    data[1].id = 1301;
    data[2].id = 1368;
    data[3].id = 1322;
    data[4].id = 1310;
    data[5].id = 1370;
    data[6].id = 1318;
    data[7].id = 1350;
    data[8].id = 1303;
    data[9].id = 1299;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 2)).toBe(26.054558142482477);
  });

  it('STDEVS', () => {
    var data = getDataForFormulas(0, 'address', ['=STDEVS()', '=STDEVS(A1:A10)']);

    data[0].id = 1345;
    data[1].id = 1301;
    data[2].id = 1368;
    data[3].id = 1322;
    data[4].id = 1310;
    data[5].id = 1370;
    data[6].id = 1318;
    data[7].id = 1350;
    data[8].id = 1303;
    data[9].id = 1299;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(27.46391571984349);
  });

  it('STDEVA', () => {
    var data = getDataForFormulas(0, 'address', ['=STDEVA()', '=STDEVA(A1:A10)']);

    data[0].id = 1345;
    data[1].id = 1301;
    data[2].id = 1368;
    data[3].id = 1322;
    data[4].id = 1310;
    data[5].id = 1370;
    data[6].id = 1318;
    data[7].id = 1350;
    data[8].id = 1303;
    data[9].id = 1299;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBe(27.46391571984349);
  });

  it('STDEVPA', () => {
    var data = getDataForFormulas(0, 'address', ['=STDEVPA()', '=STDEVPA(A1:A10)']);

    data[0].id = 1345;
    data[1].id = 1301;
    data[2].id = 1368;
    data[3].id = 1322;
    data[4].id = 1310;
    data[5].id = 1370;
    data[6].id = 1318;
    data[7].id = 1350;
    data[8].id = 1303;
    data[9].id = 1299;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 2)).toBe(26.054558142482477);
  });

  it('STEYX', () => {
    var data = getDataForFormulas(0, 'address', ['=STEYX()', '=STEYX(A1:A7, B1:B7)']);

    data[0].id = 2;
    data[1].id = 3;
    data[2].id = 9;
    data[3].id = 1;
    data[4].id = 8;
    data[5].id = 7;
    data[6].id = 5;
    data[0].name = 6;
    data[1].name = 5;
    data[2].name = 11;
    data[3].name = 7;
    data[4].name = 5;
    data[5].name = 4;
    data[6].name = 4;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe(3.305718950210041);
  });

  it('TRANSPOSE', () => {
    var data = getDataForFormulas(0, 'address', ['=TRANSPOSE()', '=TRANSPOSE(A1:B3)']);

    data[0].id = 1;
    data[1].id = 3;
    data[2].id = 5;
    data[0].name = 2;
    data[1].name = 4;
    data[2].name = 6;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toEqual([[1, 3, 5], [2, 4, 6]]);
  });

  it('TDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=TDIST()', '=TDIST(1, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.2067483346226397, 12);
  });

  it('T.DIST.RT', () => {
    var data = getDataForFormulas(0, 'address', ['=T.DIST.RT()', '=T.DIST.RT(1, 6)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.17795884187479105, 12);
  });

  it('TINV', () => {
    var data = getDataForFormulas(0, 'address', ['=TINV()', '=TINV(0.1, 6)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(-1.4397557472652736, 12);
  });

  it('T.INV.2T', () => {
    var data = getDataForFormulas(0, 'address', ['=T.INV.2T()', '=T.INV.2T(0.1, 6)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(1.9431802743487372, 12);
  });

  it('TREND', () => {
    var data = getDataForFormulas(0, 'address', ['=TREND()', '=TREND(A1:A4, B1:B4, A5:A6)']);

    data[0].id = 1;
    data[1].id = 9;
    data[2].id = 5;
    data[3].id = 7;
    data[0].name = 0;
    data[1].name = 4;
    data[2].name = 2;
    data[3].name = 3;
    data[4].name = 5;
    data[5].name = 8;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([11, 13]);
  });

  it('TRIMMEAN', () => {
    var data = getDataForFormulas(0, 'address', ['=TRIMMEAN()', '=TRIMMEAN(A1:A11, 0.2)']);

    data[0].id = 4;
    data[1].id = 5;
    data[2].id = 6;
    data[3].id = 7;
    data[4].id = 2;
    data[5].id = 3;
    data[6].id = 4;
    data[7].id = 5;
    data[8].id = 1;
    data[9].id = 2;
    data[10].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(3.777777777777777, 12);
  });

  it('VARP', () => {
    var data = getDataForFormulas(0, 'address', ['=VARP()', '=VARP(1, 2, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.66666666666666, 12);
  });

  it('VARS', () => {
    var data = getDataForFormulas(0, 'address', ['=VARS()', '=VARS(1, 2, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(1, 12);
  });

  it('VARA', () => {
    var data = getDataForFormulas(0, 'address', ['=VARA()', '=VARA(1, 2, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe(0);
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(1, 12);
  });

  it('VARPA', () => {
    var data = getDataForFormulas(0, 'address', ['=VARPA()', '=VARPA(1, 2, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#NUM!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.6666666666666666, 12);
  });

  it('WEIBULLDIST', () => {
    var data = getDataForFormulas(0, 'address', ['=WEIBULLDIST()', '=WEIBULLDIST(1, 2, 3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 2)).toBeCloseTo(0.1988531815143044, 12);
  });
});
