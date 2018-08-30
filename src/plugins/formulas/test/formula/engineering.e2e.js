describe('Formulas -> engineering functions', () => {
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

  it('BESSELI', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELI(1.4, 1)', '=BESSELI(1.4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.8860919793963105, 12);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('BESSELJ', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELJ(1.4, 1)', '=BESSELJ(1.4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.5419477138848564, 12);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('BESSELK', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELK(1.4, 1)', '=BESSELK(1.4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.32083590550458985, 12);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('BESSELY', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELY(1.4, 1)', '=BESSELY(1.4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-0.47914697411134044, 12);
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('BIN2DEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BIN2DEC()', '=BIN2DEC("1110")', '=BIN2DEC(011101)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe(14);
    expect(hot.getDataAtCell(3, 1)).toBe(29);
  });

  it('BIN2HEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BIN2HEX()', '=BIN2HEX("1110")', '=BIN2HEX(011101)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe('e');
    expect(hot.getDataAtCell(3, 1)).toBe('1d');
  });

  it('BIN2OCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BIN2OCT()', '=BIN2OCT("1110")', '=BIN2OCT(011101)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe('16');
    expect(hot.getDataAtCell(3, 1)).toBe('35');
  });

  it('BITAND', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITAND()', '=BITAND(2)', '=BITAND(2, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe(0);
  });

  it('BITLSHIFT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITLSHIFT()', '=BITLSHIFT(2)', '=BITLSHIFT(2, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe(32);
  });

  it('BITOR', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITOR()', '=BITOR(2)', '=BITOR(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe(6);
  });

  it('BITRSHIFT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITRSHIFT()', '=BITRSHIFT(2)', '=BITRSHIFT(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe(1);
  });

  it('BITXOR', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITXOR()', '=BITXOR(2)', '=BITXOR(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe(6);
  });

  it('COMPLEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=COMPLEX()', '=COMPLEX(2, 0)', '=COMPLEX(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('2');
    expect(hot.getDataAtCell(3, 1)).toBe('4+2i');
  });

  it('CONVERT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=CONVERT()', '=CONVERT(2)', '=CONVERT(2, "lbm", "kg")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(3, 1)).toBe(0.90718474);
  });

  it('DEC2BIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DEC2BIN()', '=DEC2BIN(2)', '=DEC2BIN(254)', '=DEC2BIN(-1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('10');
    expect(hot.getDataAtCell(3, 1)).toBe('11111110');
    expect(hot.getDataAtCell(4, 1)).toBe('1111111111');
  });

  it('DEC2HEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DEC2HEX()', '=DEC2HEX(2)', '=DEC2HEX(254)', '=DEC2HEX(-1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('2');
    expect(hot.getDataAtCell(3, 1)).toBe('fe');
    expect(hot.getDataAtCell(4, 1)).toBe('ffffffffff');
  });

  it('DEC2OCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DEC2OCT()', '=DEC2OCT(2)', '=DEC2OCT(254)', '=DEC2OCT(-1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('2');
    expect(hot.getDataAtCell(3, 1)).toBe('376');
    expect(hot.getDataAtCell(4, 1)).toBe('7777777777');
  });

  it('DELTA', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DELTA()', '=DELTA(58)', '=DELTA(58, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(0);
    expect(hot.getDataAtCell(3, 1)).toBe(0);
  });

  it('ERF', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ERF()', '=ERF(1)', '=ERF(2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.8427007929497149, 12);
    expect(hot.getDataAtCell(3, 1)).toBeCloseTo(0.9953222650189527, 12);
  });

  it('ERFC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ERFC()', '=ERFC(0)', '=ERFC(1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.9999999999999, 12);
    expect(hot.getDataAtCell(3, 1)).toBeCloseTo(0.1572992070502851, 12);
  });

  it('GESTEP', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=GESTEP()', '=GESTEP(1, 2)', '=GESTEP(-1, -2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(0);
    expect(hot.getDataAtCell(3, 1)).toBe(1);
  });

  it('HEX2BIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HEX2BIN()', '=HEX2BIN("fa")', '=HEX2BIN("fa", 12)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe('11111010');
    expect(hot.getDataAtCell(3, 1)).toBe('000011111010');
  });

  it('HEX2DEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HEX2DEC()', '=HEX2DEC("fa")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe(250);
  });

  it('HEX2OCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HEX2OCT()', '=HEX2OCT("fa")', '=HEX2OCT("fa", 12)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe('372');
    expect(hot.getDataAtCell(3, 1)).toBe('000000000372');
  });

  it('IMABS', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMABS()', '=IMABS("5+12i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(13);
  });

  it('IMAGINARY', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMAGINARY()', '=IMAGINARY("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(4);
  });

  it('IMARGUMENT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMARGUMENT()', '=IMARGUMENT(1)', '=IMARGUMENT(0)', '=IMARGUMENT("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(3, 1)).toBe('#DIV/0!');
    expect(hot.getDataAtCell(4, 1)).toBeCloseTo(0.9272952180016122, 12);
  });

  it('IMCONJUGATE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCONJUGATE()', '=IMCONJUGATE(1)', '=IMCONJUGATE("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(3, 1)).toBe('3-4i');
  });

  it('IMCOS', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCOS()', '=IMCOS("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parser.parse(`IMREAL("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-27.03494560307422, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-3.8511533348117766, 12);
  });

  it('IMCOSH', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCOSH()', '=IMCOSH("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('-')[1])).toBeCloseTo(6.580663040551157, 12);
    expect(parseFloat(hot.getDataAtCell(2, 1).split('-')[2])).toBeCloseTo(7.581552742746545, 12);
  });

  it('IMCOT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCOT()', '=IMCOT("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parser.parse(`IMREAL("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-0.00018758773798367118, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-1.0006443924715591, 12);
  });

  it('IMCSC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCSC()', '=IMCSC("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    // expect(hot.getDataAtCell(2, 1)).toBe('0.005174473184019398+0.03627588962862602i');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[0])).toBeCloseTo(0.005174473184019398, 12);
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[1])).toBeCloseTo(0.03627588962862602, 12);
  });

  it('IMDIV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMDIV()', '=IMDIV("3+4i")', '=IMDIV("3+4i", "2+2i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe('1.75+0.25i');
  });

  it('IMEXP', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMEXP()', '=IMEXP("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('-')[1])).toBeCloseTo(13.128783081462158, 12);
    expect(parseFloat(hot.getDataAtCell(2, 1).split('-')[2])).toBeCloseTo(15.200784463067954, 12);
  });

  it('IMLN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMLN()', '=IMLN("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[0])).toBeCloseTo(1.6094379124341003, 12);
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[1])).toBeCloseTo(0.9272952180016122, 12);
  });

  it('IMLOG10', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMLOG10()', '=IMLOG10("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('0.6989700043360187+0.4027191962733731i');
  });

  it('IMLOG2', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMLOG2()', '=IMLOG2("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('2.321928094887362+1.3378042124509761i');
  });

  it('IMPOWER', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMPOWER()', '=IMPOWER("3+4i", 3)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parser.parse(`IMREAL("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-117, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(44, 12);
  });

  it('IMPRODUCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMPRODUCT()', '=IMPRODUCT("3+4i", "1+2i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('-5+10i');
  });

  it('IMREAL', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMREAL()', '=IMREAL("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe(3);
  });

  it('IMSEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSEC()', '=IMSEC("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parser.parse(`IMREAL("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-0.03625349691586887, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(0.005164344607753179, 12);
  });

  it('IMSECH', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSECH()', '=IMSECH("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[0])).toBeCloseTo(-0.06529402785794704);
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[1])).toBeCloseTo(0.07522496030277322);
  });

  it('IMSIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSIN()', '=IMSIN("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parser.parse(`IMREAL("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(3.853738037919377, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-27.016813258003932, 12);
  });

  it('IMSINH', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSINH()', '=IMSINH("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('-')[1])).toBeCloseTo(6.5481200409110025, 12);
    expect(parseFloat(hot.getDataAtCell(2, 1).split('-')[2])).toBeCloseTo(7.61923172032141, 12);
  });

  it('IMSQRT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSQRT()', '=IMSQRT("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parseFloat(hot.getDataAtCell(2, 1).split('+')[0])).toBeCloseTo(2, 12);
  });

  it('IMSUB', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSUB()', '=IMSUB("3+4i")', '=IMSUB("3+4i", "2+3i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(3, 1)).toBe('1+i');
  });

  it('IMSUM', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSUM()', '=IMSUM("3+4i")', '=IMSUM("3+4i", "2+3i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(2, 1)).toBe('3+4i');
    expect(hot.getDataAtCell(3, 1)).toBe('5+7i');
  });

  it('IMTAN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMTAN()', '=IMTAN("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(hot.getDataAtCell(1, 1)).toBe('#VALUE!');
    expect(parser.parse(`IMREAL("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(-0.00018734620462949035, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(2, 1)}")`).result).toBeCloseTo(0.9993559873814731, 12);
  });

  it('OCT2BIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=OCT2BIN()', '=OCT2BIN(3, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe('0011');
  });

  it('OCT2DEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=OCT2DEC()', '=OCT2DEC(34)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe(28);
  });

  it('OCT2HEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=OCT2HEX()', '=OCT2HEX(34, 5)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('#NUM!');
    expect(hot.getDataAtCell(2, 1)).toBe('0001c');
  });
});
