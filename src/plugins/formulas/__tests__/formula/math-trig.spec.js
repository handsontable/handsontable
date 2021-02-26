describe('Formulas -> math trig functions', () => {
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

  it('ABS', () => {
    const data = getDataForFormulas(0, 'name', ['=ABS(A1)', '=ABS(A2)']);

    data[0].id = -2.2;
    data[1].id = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(2.2);
    expect(hot.getDataAtCell(1, 1)).toBe(3);
  });

  it('ACOS', () => {
    const data = getDataForFormulas(0, 'name', ['=ACOS(A1)', '=ACOS(A2)']);

    data[0].id = 1;
    data[1].id = -1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(Math.PI, 14);
  });

  xit('ACOSH', () => {
    const data = getDataForFormulas(0, 'name', ['=ACOSH(A1)', '=ACOSH(A2)']);

    data[0].id = 1;
    data[1].id = -1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
  });

  xit('ACOT', () => {
    const data = getDataForFormulas(0, 'name', ['=ACOT(A1)', '=ACOT(A2)']);

    data[0].id = 1;
    data[1].id = -1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.7853981633974483, 12);
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-0.7853981633974483, 12);
  });

  xit('ACOTH', () => {
    const data = getDataForFormulas(0, 'name', ['=ACOTH(A1)', '=ACOTH(A2)']);

    data[0].id = 1;
    data[1].id = -1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(Infinity);
    expect(hot.getDataAtCell(1, 1)).toBe(-Infinity);
  });

  xit('ADD', () => {
    const data = getDataForFormulas(0, 'name', ['=ADD(A1, A2)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });

  xit('AGGREGATE', () => {
    const data = getDataForFormulas(0, 'name', ['=AGGREGATE(6, 4, A1:A3)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(6);
  });

  xit('ARABIC', () => {
    const data = getDataForFormulas(0, 'name', ['=ARABIC(A1)']);

    data[0].id = 'MXL';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1040);
  });

  it('ASIN', () => {
    const data = getDataForFormulas(0, 'name', ['=ASIN(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1.5707963267948966, 12);
  });

  xit('ASINH', () => {
    const data = getDataForFormulas(0, 'name', ['=ASINH(A1)']);

    data[0].id = 0.5;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.48121182505960347, 12);
  });

  it('ATAN', () => {
    const data = getDataForFormulas(0, 'name', ['=ATAN(A1)']);

    data[0].id = 0.5;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.4636476090008061, 12);
  });

  xit('ATANH', () => {
    const data = getDataForFormulas(0, 'name', ['=ATANH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(Infinity);
  });

  it('BASE', () => {
    const data = getDataForFormulas(0, 'name', ['=BASE(A1, 2)']);

    data[0].id = 8;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('1000');
  });

  it('CEILING', () => {
    const data = getDataForFormulas(0, 'name', ['=CEILING(A1, 0.1)']);

    data[0].id = -1.234;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(-1.2);
  });

  xit('COMBIN', () => {
    const data = getDataForFormulas(0, 'name', ['=COMBIN(3, 1)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });

  xit('COMBINA', () => {
    const data = getDataForFormulas(0, 'name', ['=COMBINA(3, 1)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });

  it('COS', () => {
    const data = getDataForFormulas(0, 'name', ['=COS(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.5403023058681398, 12);
  });

  xit('COSH', () => {
    const data = getDataForFormulas(0, 'name', ['=COSH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1.5430806348152437, 12);
  });

  it('COT', () => {
    const data = getDataForFormulas(0, 'name', ['=COT(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.6420926159343306, 12);
  });

  xit('COTH', () => {
    const data = getDataForFormulas(0, 'name', ['=COTH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1.3130352854993312, 12);
  });

  xit('CSC', () => {
    const data = getDataForFormulas(0, 'name', ['=CSC(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1.1883951057781212, 12);
  });

  xit('CSCH', () => {
    const data = getDataForFormulas(0, 'name', ['=CSCH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.8509181282393216, 12);
  });

  it('DECIMAL', () => {
    const data = getDataForFormulas(0, 'name', ['=DECIMAL(A1, 2)', '=DECIMAL(A2, 16)']);

    data[0].id = '1010101';
    data[1].id = '32b';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(85);
    expect(hot.getDataAtCell(1, 1)).toBe(811);
  });

  it('DEGREES', () => {
    const data = getDataForFormulas(0, 'name', ['=DEGREES(PI() / 2)', '=DEGREES(A1)']);

    data[0].id = 2;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(90);
    expect(hot.getDataAtCell(1, 1)).toBe(114.59155902616465);
  });

  xit('DIVIDE', () => {
    const data = getDataForFormulas(0, 'name', ['=DIVIDE(A1, A2)']);

    data[0].id = 2;
    data[1].id = 5;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0.4);
  });

  it('EVEN', () => {
    const data = getDataForFormulas(0, 'name', ['=EVEN(A1)', '=EVEN(A2)']);

    data[0].id = 2;
    data[1].id = 5;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(2);
    expect(hot.getDataAtCell(1, 1)).toBe(6);
  });

  xit('EQ', () => {
    const data = getDataForFormulas(0, 'name', ['=EQ(A1, A2)', '=EQ(A1, 2)']);

    data[0].id = 2;
    data[1].id = 5;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
  });

  it('EXP', () => {
    const data = getDataForFormulas(0, 'name', ['=EXP(A1)', '=EXP(1)']);

    data[0].id = 2;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(7.38905609893065);
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(2.718281828459045, 14);
  });

  xit('FACT', () => {
    const data = getDataForFormulas(0, 'name', ['=FACT(A1)']);

    data[0].id = 6;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(720);
  });

  xit('FACTDOUBLE', () => {
    const data = getDataForFormulas(0, 'name', ['=FACTDOUBLE(A1)']);

    data[0].id = 6;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(48);
  });

  xit('FLOOR', () => {
    const data = getDataForFormulas(0, 'name', ['=FLOOR(A1, -1.99)']);

    data[0].id = 6.998;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(6);
  });

  xit('GCD', () => {
    const data = getDataForFormulas(0, 'name', ['=GCD(A1, 36)']);

    data[0].id = 2;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(2);
  });

  xit('GTE', () => {
    const data = getDataForFormulas(0, 'name', ['=GTE(A1, 36)', '=GTE(A1, 2)']);

    data[0].id = 2;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
  });

  it('INT', () => {
    const data = getDataForFormulas(0, 'name', ['=INT(A1)']);

    data[0].id = 1.5;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
  });

  xit('LCM', () => {
    const data = getDataForFormulas(0, 'name', ['=LCM(A1, 2)']);

    data[0].id = 1.1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(2.2);
  });

  it('LN', () => {
    const data = getDataForFormulas(0, 'name', ['=LN(A1, 2)']);

    data[0].id = Math.E;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
  });

  it('LOG', () => {
    const data = getDataForFormulas(0, 'name', ['=LOG(A1, 10)']);

    data[0].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
  });

  it('LOG10', () => {
    const data = getDataForFormulas(0, 'name', ['=LOG10(A1)']);

    data[0].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
  });

  xit('LT', () => {
    const data = getDataForFormulas(0, 'name', ['=LT(A1, 2)', '=LT(A1, 11)']);

    data[0].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
  });

  xit('LTE', () => {
    const data = getDataForFormulas(0, 'name', ['=LTE(A1, 2)', '=LTE(A1, 10)']);

    data[0].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
  });

  xit('MINUS', () => {
    const data = getDataForFormulas(0, 'name', ['=MINUS(A1, 2)', '=MINUS(A1, 10)']);

    data[0].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(8);
    expect(hot.getDataAtCell(1, 1)).toBe(0);
  });

  it('MOD', () => {
    const data = getDataForFormulas(0, 'name', ['=MOD(A1, 2)', '=MOD(A1, 10)']);

    data[0].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
    expect(hot.getDataAtCell(1, 1)).toBe(0);
  });

  xit('MROUND', () => {
    const data = getDataForFormulas(0, 'name', ['=MROUND(A1, 2)', '=MROUND(A2, 1.1)']);

    data[0].id = 1;
    data[1].id = -4;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(2);
    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
  });

  xit('MULTINOMIAL', () => {
    const data = getDataForFormulas(0, 'name', ['=MULTINOMIAL(A1)', '=MULTINOMIAL(A1, A2, 4)']);

    data[0].id = 1;
    data[1].id = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
    expect(hot.getDataAtCell(1, 1)).toBe(280);
  });

  xit('MULTIPLY', () => {
    const data = getDataForFormulas(0, 'name', ['=MULTIPLY(A1, A2)', '=MULTIPLY(A1, -3)']);

    data[0].id = 1;
    data[1].id = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(3);
    expect(hot.getDataAtCell(1, 1)).toBe(-3);
  });

  xit('NE', () => {
    const data = getDataForFormulas(0, 'name', ['=NE(A1, A2)', '=NE(A1, 1)']);

    data[0].id = 1;
    data[1].id = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(true);
    expect(hot.getDataAtCell(1, 1)).toBe(false);
  });

  it('ODD', () => {
    const data = getDataForFormulas(0, 'name', ['=ODD(A1)', '=ODD(A2)']);

    data[0].id = -34;
    data[1].id = 11;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(-35);
    expect(hot.getDataAtCell(1, 1)).toBe(11);
  });

  it('PI', () => {
    const data = getDataForFormulas(0, 'name', ['=PI()']);

    data[0].id = -34;
    data[1].id = 11;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(Math.PI, 14);
  });

  it('POWER', () => {
    const data = getDataForFormulas(0, 'name', ['=POWER(A1, 2)', '=POWER(A2, A1)']);

    data[0].id = 2;
    data[1].id = 11;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(4);
    expect(hot.getDataAtCell(1, 1)).toBe(121);
  });

  xit('POW', () => {
    const data = getDataForFormulas(0, 'name', ['=POW(A1, 2)', '=POW(A2, A1)']);

    data[0].id = 2;
    data[1].id = 11;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(4);
    expect(hot.getDataAtCell(1, 1)).toBe(121);
  });

  xit('PRODUCT', () => {
    const data = getDataForFormulas(0, 'name', ['=PRODUCT(A1, 4)', '=PRODUCT(A1, A2, A3, A4)']);

    data[0].id = 2;
    data[1].id = 8;
    data[2].id = 10;
    data[3].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(8);
    expect(hot.getDataAtCell(1, 1)).toBe(1600);
  });

  xit('QUOTIENT', () => {
    const data = getDataForFormulas(0, 'name', ['=QUOTIENT(A1, 4)', '=QUOTIENT(A2, 2)']);

    data[0].id = 2;
    data[1].id = 8;
    data[2].id = 10;
    data[3].id = 10;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
    expect(hot.getDataAtCell(1, 1)).toBe(4);
  });

  it('RADIANS', () => {
    const data = getDataForFormulas(0, 'name', ['=RADIANS(A1)', '=RADIANS(A2)']);

    data[0].id = 180;
    data[1].id = 90;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(Math.PI, 14);
    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(Math.PI / 2, 14);
  });

  it('RAND', () => {
    const data = getDataForFormulas(0, 'name', ['=RAND()']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const value = hot.getDataAtCell(0, 1);

    expect(value).toBeGreaterThan(-0.999);
    expect(value).toBeLessThan(1.0001);
  });

  xit('RANDBETWEEN', () => {
    const data = getDataForFormulas(0, 'name', ['=RANDBETWEEN(-5, -3)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const value = hot.getDataAtCell(0, 1);

    expect(value).toBeGreaterThan(-5.1);
    expect(value).toBeLessThan(-2.9);
  });

  xit('ROMAN', () => {
    const data = getDataForFormulas(0, 'name', ['=ROMAN(A1)']);

    data[0].id = 992;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('CMXCII');
  });

  it('ROUND', () => {
    const data = getDataForFormulas(0, 'name', ['=ROUND(A1, 4)']);

    data[0].id = 1.2234578;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1.2235);
  });

  it('ROUNDDOWN', () => {
    const data = getDataForFormulas(0, 'name', ['=ROUNDDOWN(A1, 4)']);

    data[0].id = 1.2234578;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1.2234);
  });

  it('ROUNDUP', () => {
    const data = getDataForFormulas(0, 'name', ['=ROUNDUP(A1, 4)']);

    data[0].id = 1.2234578;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1.2235);
  });

  xit('SEC', () => {
    const data = getDataForFormulas(0, 'name', ['=SEC(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1.8508157176809255, 12);
  });

  xit('SECH', () => {
    const data = getDataForFormulas(0, 'name', ['=SECH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.6480542736638855, 8);
  });

  xit('SERIESSUM', () => {
    const data = getDataForFormulas(0, 'name', ['=SERIESSUM(A1, 0, 2, C1:C4)']);

    data[0].id = Math.PI / 4;
    data[0].address = 1;
    data[1].address = -1 / 2;
    data[2].address = 1 / 24;
    data[3].address = -1 / 720;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.7071032148228457, 12);
  });

  xit('SIGN', () => {
    const data = getDataForFormulas(0, 'name', ['=SIGN(A1)']);

    data[0].id = 30;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
  });

  it('SIN', () => {
    const data = getDataForFormulas(0, 'name', ['=SIN(A1)']);

    data[0].id = Math.PI / 2;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
  });

  xit('SINH', () => {
    const data = getDataForFormulas(0, 'name', ['=SINH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1.1752011936438014, 12);
  });

  it('SQRT', () => {
    const data = getDataForFormulas(0, 'name', ['=SQRT(A1)']);

    data[0].id = 64;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(8);
  });

  xit('SQRTPI', () => {
    const data = getDataForFormulas(0, 'name', ['=SQRTPI(A1)']);

    data[0].id = 64;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(14.179630807244127, 12);
  });

  xit('SUBTOTAL', () => {
    const data = getDataForFormulas(0, 'name', ['=SUBTOTAL(9, A1:A4)']);

    data[0].id = 120;
    data[1].id = 10;
    data[2].id = 150;
    data[3].id = 23;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(303);
  });

  it('SUM', () => {
    const data = getDataForFormulas(0, 'name', ['=SUM()', '=SUM(A1:A4)']);

    data[0].id = 120;
    data[1].id = 10;
    data[2].id = 150;
    data[3].id = 23;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
    expect(hot.getDataAtCell(1, 1)).toBe(303);
  });

  it('SUMIF', () => {
    const data = getDataForFormulas(0, 'name', ['=SUMIF(A1:A4, ">100")']);

    data[0].id = 120;
    data[1].id = 10;
    data[2].id = 150;
    data[3].id = 23;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(270);
  });

  it('SUMIFS', () => {
    const data = getDataForFormulas(0, 'name', ['=SUMIFS(A1:A4, ">10", "<150")']);

    data[0].id = 120;
    data[1].id = 10;
    data[2].id = 150;
    data[3].id = 23;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(143);
  });

  it('SUMPRODUCT', () => {
    const data = getDataForFormulas(0, 'balance', ['=SUMPRODUCT(A1:B3, C1:D3)']);

    data[0].id = 3;
    data[0].name = 4;
    data[1].id = 8;
    data[1].name = 6;
    data[2].id = 1;
    data[2].name = 9;

    data[0].address = 2;
    data[0].registered = 7;
    data[1].address = 6;
    data[1].registered = 7;
    data[2].address = 5;
    data[2].registered = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 5)).toBe(156);
  });

  it('SUMSQ', () => {
    const data = getDataForFormulas(0, 'name', ['=SUMSQ(A1, A2, 0.1)']);

    data[0].id = 64;
    data[1].id = 3.3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(4106.900000000001, 12);
  });

  xit('SUMX2MY2', () => {
    const data = getDataForFormulas(0, 'name', ['=SUMX2MY2(A1:A3, C1:C3)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[0].address = 4;
    data[1].address = 5;
    data[2].address = 6;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(-63);
  });

  xit('SUMX2PY2', () => {
    const data = getDataForFormulas(0, 'name', ['=SUMX2PY2(A1:A3, C1:C3)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[0].address = 4;
    data[1].address = 5;
    data[2].address = 6;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(91);
  });

  xit('SUMXMY2', () => {
    const data = getDataForFormulas(0, 'name', ['=SUMXMY2(A1:A3, C1:C3)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 3;
    data[0].address = 4;
    data[1].address = 5;
    data[2].address = 6;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(27);
  });

  it('TAN', () => {
    const data = getDataForFormulas(0, 'name', ['=TAN(RADIANS(A1))']);

    data[0].id = 45;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(1, 12);
  });

  xit('TANH', () => {
    const data = getDataForFormulas(0, 'name', ['=TANH(A1)']);

    data[0].id = 1;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBeCloseTo(0.761594155955765, 12);
  });

  it('TRUNC', () => {
    const data = getDataForFormulas(0, 'name', ['=TRUNC(A1)']);

    data[0].id = 0.99988877;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(0);
  });
});
