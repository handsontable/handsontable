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

  xit('ACCRINT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ACCRINT("2/2/2012", "3/30/2012", "12/4/2013", 0.1, 1000, 1, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(183.88888888888889, 12);
  });

  xit('CUMIPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-9916.77251395708, 12);
  });

  xit('CUMPRINC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-614.0863271085149, 10);
  });

  xit('DB', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DB(10000, 1000, 6, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(3190);
  });

  xit('DDB', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DDB(10000, 1000, 6, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(3333.333333333333, 12);
  });

  xit('DOLLARDE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DOLLARDE(1.1, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(1.25);
  });

  xit('DOLLARFR', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DOLLARFR(1.1, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(1.04);
  });

  xit('EFFECT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=EFFECT(1.1, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(1.6426566406249994, 12);
  });

  xit('FV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=FV(1.1, 10, -200, -500)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(1137082.79396825, 8);
  });

  xit('FVSCHEDULE', () => {
    const data = getDataForFormulas(1, 'name', ['=FVSCHEDULE(100, F1:F4)']);

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

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(186.32460000000003, 12);
  });

  xit('IPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IPMT(0.2, 6, 24, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-196.20794961065468, 12);
  });

  xit('IRR', () => {
    const data = getDataForFormulas(1, 'name', ['=IRR(F1:F4)']);

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

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-0.20873983161148013, 12);
  });

  xit('ISPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ISPMT(1.1, 2, 16, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(-962.5);
  });

  xit('MIRR', () => {
    const data = getDataForFormulas(1, 'name', ['=MIRR(F1:F4, 0.1, 0.12)']);

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

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-0.14642925752488778, 12);
  });

  xit('NOMINAL', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NOMINAL(1.1, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0.8982753492378879);
  });

  xit('NPER', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NPER(1.1, -2, -100, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(3.081639082679854, 12);
  });

  xit('NPV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=NPV(1.1, -2, -100, 1000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(84.3515819026023, 12);
  });

  xit('PDURATION', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PDURATION(0.1, 200, 400)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(7.272540897341714, 12);
  });

  xit('PMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PMT(0.1, 200, 400, 500)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-40.00000047392049, 12);
  });

  xit('PPMT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PPMT(0.1, 200, 400, 5000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.000012207031261368684, 12);
  });

  xit('PV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=PV(1.1, 200, 400, 5000)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-363.6363636363636, 12);
  });

  xit('RATE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=RATE(24, -1000, -10000, 10000, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-0.09090909090909091, 12);
  });

  xit('RRI', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=RRI(8, 100, 300)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.1472026904398771, 12);
  });

  xit('SLN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=SLN(200, 750, 10)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(-55);
  });

  xit('SYD', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=SYD(200, 750, 10, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(-100);
  });

  xit('TBILLEQ', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TBILLEQ("03/31/2008", "06/01/2008", 0.09)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.09266311246509266, 12);
  });

  xit('TBILLPRICE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TBILLPRICE("03/31/2008", "06/01/2008", 0.09)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(98.475);
  });

  xit('TBILLYIELD', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=TBILLYIELD("03/31/2008", "06/01/2008", 0.09)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(6551.475409836065, 12);
  });

  // TODO: Not supported yet
  xit('XIRR', () => {
    const data = getDataForFormulas(1, 'name', ['=XIRR(F1:F5, D1:D5, 0.1)']);

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

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.373374019797564, 12);
  });

  xit('XNPV', () => {
    const data = getDataForFormulas(1, 'name', ['=XNPV(0.09, F1:F5, D1:D5)']);

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

    // In the Linux env, the results are different so the precision is squashed to the integer value.
    expect(hot.getDataAtCell(1, 1).toString().split('.')[0]).toBe('2086');
  });
});
