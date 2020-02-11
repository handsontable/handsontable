describe('Formulas -> financial functions', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('ACCRINT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ACCRINT()', '=ACCRINT("2/2/2012", "3/30/2012", "12/4/2013", 0.1, 1000, 1, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(183.88888888888889, 12);
  });

  it('CUMIPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=CUMIPMT()', '=CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-9916.77251395708, 12);
  });

  it('CUMPRINC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=CUMPRINC()', '=CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-614.0863271085149, 10);
  });

  it('DB', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DB()', '=DB(10000, 1000, 6, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(3190);
  });

  it('DDB', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DDB()', '=DDB(10000, 1000, 6, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(3333.333333333333, 12);
  });

  it('DOLLARDE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DOLLARDE()', '=DOLLARDE(1.1, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(1.25);
  });

  it('DOLLARFR', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DOLLARFR()', '=DOLLARFR(1.1, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(1.04);
  });

  it('EFFECT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=EFFECT()', '=EFFECT(1.1, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(1.6426566406249994, 12);
  });

  it('FV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=FV()', '=FV(1.1, 10, -200, -500)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(1137082.79396825, 8);
  });

  it('FVSCHEDULE', () => {
    const data = getDataForFormulas(1, 'name', ['=FVSCHEDULE()', '=FVSCHEDULE(100, F1:F4)']);

    data[0].balance = 0.09;
    data[1].balance = 0.1;
    data[2].balance = 0.11;
    data[3].balance = 0.4;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(186.32460000000003, 12);
  });

  it('IPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IPMT()', '=IPMT(0.2, 6, 24, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-196.20794961065468, 12);
  });

  it('IRR', () => {
    const data = getDataForFormulas(1, 'name', ['=IRR()', '=IRR(F1:F4)']);

    data[0].balance = -70000;
    data[1].balance = 12000;
    data[2].balance = 4000;
    data[3].balance = 24000;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-0.20873983161148013, 12);
  });

  it('ISPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ISPMT()', '=ISPMT(1.1, 2, 16, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(-962.5);
  });

  it('MIRR', () => {
    const data = getDataForFormulas(1, 'name', ['=MIRR()', '=MIRR(F1:F4, 0.1, 0.12)']);

    data[0].balance = -70000;
    data[1].balance = 12000;
    data[2].balance = 4000;
    data[3].balance = 24000;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-0.14642925752488778, 12);
  });

  it('NOMINAL', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NOMINAL()', '=NOMINAL(1.1, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(0.8982753492378879);
  });

  it('NPER', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NPER()', '=NPER(1.1, -2, -100, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(3.081639082679854, 12);
  });

  it('NPV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NPV()', '=NPV(1.1, -2, -100, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(84.3515819026023, 12);
  });

  it('PDURATION', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PDURATION()', '=PDURATION(0.1, 200, 400)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(7.272540897341714, 12);
  });

  it('PMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PMT()', '=PMT(0.1, 200, 400, 500)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-40.00000047392049, 12);
  });

  it('PPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PPMT()', '=PPMT(0.1, 200, 400, 5000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.000012207031261368684, 12);
  });

  it('PV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PV()', '=PV(1.1, 200, 400, 5000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-363.6363636363636, 12);
  });

  it('RATE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=RATE()', '=RATE(24, -1000, -10000, 10000, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(-0.09090909090909091, 12);
  });

  it('RRI', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=RRI()', '=RRI(8, 100, 300)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.1472026904398771, 12);
  });

  it('SLN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=SLN()', '=SLN(200, 750, 10)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(-55);
  });

  it('SYD', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=SYD()', '=SYD(200, 750, 10, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(-100);
  });

  it('TBILLEQ', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TBILLEQ()', '=TBILLEQ("03/31/2008", "06/01/2008", 0.09)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.09266311246509266, 12);
  });

  it('TBILLPRICE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TBILLPRICE()', '=TBILLPRICE("03/31/2008", "06/01/2008", 0.09)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(98.475);
  });

  it('TBILLYIELD', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TBILLYIELD()', '=TBILLYIELD("03/31/2008", "06/01/2008", 0.09)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(6551.475409836065, 12);
  });

  // TODO: Not supported yet
  xit('XIRR', () => {
    const data = getDataForFormulas(1, 'name', ['=XIRR()', '=XIRR(F1:F5, D1:D5, 0.1)']);

    data[0].balance = -10000;
    data[1].balance = 2750;
    data[2].balance = 4250;
    data[3].balance = 3250;
    data[4].balance = 2750;
    data[0].registered = '01/jan/08';
    data[1].registered = '01/mar/08';
    data[2].registered = '30/oct/08';
    data[3].registered = '15/feb/09';
    data[4].registered = '01/apr/09';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.373374019797564, 12);
  });

  it('XNPV', () => {
    const data = getDataForFormulas(1, 'name', ['=XNPV()', '=XNPV(0.09, F1:F5, D1:D5)']);

    data[0].balance = -10000;
    data[1].balance = 2750;
    data[2].balance = 4250;
    data[3].balance = 3250;
    data[4].balance = 2750;
    data[0].registered = '01/01/2008';
    data[1].registered = '03/01/2008';
    data[2].registered = '10/30/2008';
    data[3].registered = '02/15/2009';
    data[4].registered = '04/01/2009';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#ERROR!');
    // In the Linux env, the results are different so the precision is squashed to the integer value.
    expect(hot.getDataAtCell(2, 1).toString().split('.')[0]).toBe('2086');
  });
});
