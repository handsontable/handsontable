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

  xit('BESSELI', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELI(1.4, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.8860919793963105, 12);
  });

  xit('BESSELJ', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELJ(1.4, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.5419477138848564, 12);
  });

  xit('BESSELK', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELK(1.4, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.32083590550458985, 12);
  });

  xit('BESSELY', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BESSELY(1.4, 1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(-0.47914697411134044, 12);
  });

  it('BIN2DEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BIN2DEC("1110")', '=BIN2DEC(011101)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(14);
    expect(hot.getDataAtCell(2, 1)).toBe(29);
  });

  it('BIN2HEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BIN2HEX("1110")', '=BIN2HEX(011101)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('E');
    expect(hot.getDataAtCell(2, 1)).toBe('1D');
  });

  it('BIN2OCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BIN2OCT("1110")', '=BIN2OCT(011101)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('16');
    expect(hot.getDataAtCell(2, 1)).toBe('35');
  });

  it('BITAND', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITAND(2, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
  });

  it('BITLSHIFT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITLSHIFT(2, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(32);
  });

  it('BITOR', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITOR(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(6);
  });

  it('BITRSHIFT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITRSHIFT(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(1);
  });

  it('BITXOR', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=BITXOR(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(6);
  });

  xit('COMPLEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=COMPLEX(2, 0)', '=COMPLEX(4, 2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('2');
    expect(hot.getDataAtCell(2, 1)).toBe('4+2i');
  });

  xit('CONVERT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=CONVERT(2, "lbm", "kg")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0.90718474);
  });

  it('DEC2BIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DEC2BIN(2)', '=DEC2BIN(254)', '=DEC2BIN(-1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('10');
    expect(hot.getDataAtCell(2, 1)).toBe('11111110');
    expect(hot.getDataAtCell(3, 1)).toBe('1111111111');
  });

  it('DEC2HEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DEC2HEX(2)', '=DEC2HEX(254)', '=DEC2HEX(-1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('2');
    expect(hot.getDataAtCell(2, 1)).toBe('FE');
    expect(hot.getDataAtCell(3, 1)).toBe('FFFFFFFFFF');
  });

  it('DEC2OCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DEC2OCT(2)', '=DEC2OCT(254)', '=DEC2OCT(-1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('2');
    expect(hot.getDataAtCell(2, 1)).toBe('376');
    expect(hot.getDataAtCell(3, 1)).toBe('7777777777');
  });

  it('DELTA', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=DELTA(58)', '=DELTA(58, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
    expect(hot.getDataAtCell(2, 1)).toBe(0);
  });

  it('ERF', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ERF(1)', '=ERF(2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.8427007929497149, 12);
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.9953222650189527, 12);
  });

  it('ERFC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=ERFC(0)', '=ERFC(1)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.9999999999999, 12);
    expect(hot.getDataAtCell(2, 1)).toBeCloseTo(0.1572992070502851, 12);
  });

  xit('GESTEP', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=GESTEP(1, 2)', '=GESTEP(-1, -2)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(0);
    expect(hot.getDataAtCell(2, 1)).toBe(1);
  });

  xit('HEX2BIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HEX2BIN("fa")', '=HEX2BIN("fa", 12)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('11111010');
    expect(hot.getDataAtCell(2, 1)).toBe('000011111010');
  });

  xit('HEX2DEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HEX2DEC("fa")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(250);
  });

  xit('HEX2OCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=HEX2OCT("fa")', '=HEX2OCT("fa", 12)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('372');
    expect(hot.getDataAtCell(2, 1)).toBe('000000000372');
  });

  xit('IMABS', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMABS("5+12i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(13);
  });

  xit('IMAGINARY', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMAGINARY("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(4);
  });

  xit('IMARGUMENT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMARGUMENT("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBeCloseTo(0.9272952180016122, 12);
  });

  xit('IMCONJUGATE', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCONJUGATE("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('3-4i');
  });

  xit('IMCOS', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCOS("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(parser.parse(`IMREAL("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-27.03494560307422, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-3.8511533348117766, 12);
  });

  xit('IMCOSH', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCOSH("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(parseFloat(hot.getDataAtCell(1, 1).split('-')[1])).toBeCloseTo(6.580663040551157, 12);
    expect(parseFloat(hot.getDataAtCell(1, 1).split('-')[2])).toBeCloseTo(7.581552742746545, 12);
  });

  xit('IMCOT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCOT()', '=IMCOT("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(parser.parse(`IMREAL("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-0.00018758773798367118, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-1.0006443924715591, 12);
  });

  xit('IMCSC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMCSC("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    // expect(hot.getDataAtCell(1, 1)).toBe('0.005174473184019398+0.03627588962862602i');
    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[0])).toBeCloseTo(0.005174473184019398, 12);
    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[1])).toBeCloseTo(0.03627588962862602, 12);
  });

  xit('IMDIV', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMDIV("3+4i", "2+2i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('1.75+0.25i');
  });

  xit('IMEXP', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMEXP("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(parseFloat(hot.getDataAtCell(1, 1).split('-')[1])).toBeCloseTo(13.128783081462158, 12);
    expect(parseFloat(hot.getDataAtCell(1, 1).split('-')[2])).toBeCloseTo(15.200784463067954, 12);
  });

  xit('IMLN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMLN("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[0])).toBeCloseTo(1.6094379124341003, 12);
    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[1])).toBeCloseTo(0.9272952180016122, 12);
  });

  xit('IMLOG10', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMLOG10("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('0.6989700043360187+0.4027191962733731i');
  });

  xit('IMLOG2', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMLOG2("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('2.321928094887362+1.3378042124509761i');
  });

  xit('IMPOWER', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMPOWER("3+4i", 3)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(parser.parse(`IMREAL("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-117, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(44, 12);
  });

  xit('IMPRODUCT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMPRODUCT("3+4i", "1+2i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('-5+10i');
  });

  xit('IMREAL', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMREAL("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(3);
  });

  xit('IMSEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSEC("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(parser.parse(`IMREAL("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-0.03625349691586887, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(0.005164344607753179, 12);
  });

  xit('IMSECH', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSECH("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[0])).toBeCloseTo(-0.06529402785794704);
    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[1])).toBeCloseTo(0.07522496030277322);
  });

  xit('IMSIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSIN("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(parser.parse(`IMREAL("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(3.853738037919377, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-27.016813258003932, 12);
  });

  xit('IMSINH', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSINH("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(parseFloat(hot.getDataAtCell(1, 1).split('-')[1])).toBeCloseTo(6.5481200409110025, 12);
    expect(parseFloat(hot.getDataAtCell(1, 1).split('-')[2])).toBeCloseTo(7.61923172032141, 12);
  });

  xit('IMSQRT', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSQRT("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(parseFloat(hot.getDataAtCell(1, 1).split('+')[0])).toBeCloseTo(2, 12);
  });

  xit('IMSUB', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSUB("3+4i", "2+3i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('1+i');
  });

  xit('IMSUM', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMSUM("3+4i")', '=IMSUM("3+4i", "2+3i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('3+4i');
    expect(hot.getDataAtCell(2, 1)).toBe('5+7i');
  });

  xit('IMTAN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=IMTAN("3+4i")']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    const parser = hot.getPlugin('formulas').sheet.parser;

    expect(parser.parse(`IMREAL("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(-0.00018734620462949035, 12);
    expect(parser.parse(`IMAGINARY("${hot.getDataAtCell(1, 1)}")`).result).toBeCloseTo(0.9993559873814731, 12);
  });

  xit('OCT2BIN', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=OCT2BIN(3, 4)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('0011');
  });

  xit('OCT2DEC', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=OCT2DEC(34)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe(28);
  });

  xit('OCT2HEX', () => {
    const hot = handsontable({
      data: getDataForFormulas(1, 'name', ['=OCT2HEX(34, 5)']),
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(1, 1)).toBe('0001c');
  });
});
