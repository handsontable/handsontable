import ExpressionModifier from 'handsontable-pro/plugins/formulas/expressionModifier';

describe('Formulas expression modifier', function() {
  var modifier;

  beforeEach(function() {
    modifier = new ExpressionModifier();
  });

  afterEach(function () {
    modifier = null;
  });

  it('should correctly process formula expression and convert to string without changes', function() {
    expect(modifier.setExpression('=B1').toString()).toBe('=B1');
    expect(modifier.setExpression('$DD$99').toString()).toBe('=$DD$99');
    expect(modifier.setExpression('=B1/A$4').toString()).toBe('=B1/A$4');
    expect(modifier.setExpression('B1/A$4').toString()).toBe('=B1/A$4');
    expect(modifier.setExpression('=SUM(B10:G10, A1, B5, D10:$E$16)').toString()).toBe('=SUM(B10:G10, A1, B5, D10:$E$16)');
    expect(modifier.setExpression('SUM(B10:G10, A1, B5, D10:$E$16)').toString()).toBe('=SUM(B10:G10, A1, B5, D10:$E$16)');
    expect(modifier.setExpression('="SUM: "&SUM(B10:G10)').toString()).toBe('="SUM: "&SUM(B10:G10)');
    expect(modifier.setExpression('=IF(B28<64, "F", IF(B28<73, "D", IF(B28<85, "C", IF(B28<95, "B", "A"))))').toString())
      .toBe('=IF(B28<64, "F", IF(B28<73, "D", IF(B28<85, "C", IF(B28<95, "B", "A"))))');
  });

  it('should correctly translate formula expression (using default build-in modifier)', function() {
    var delta = {row: 5};

    expect(modifier.setExpression('=B1').translate(delta).toString()).toBe('=B6');
    expect(modifier.setExpression('$DD$99').translate(delta).toString()).toBe('=$DD$99');
    expect(modifier.setExpression('=B1/A$4').translate(delta).toString()).toBe('=B6/A$4');
    expect(modifier.setExpression('B1/A$4').translate(delta).toString()).toBe('=B6/A$4');
    expect(modifier.setExpression('=SUM(B10:G10, A1, B5, B3, D10:$E$16)').translate(delta).toString()).toBe('=SUM(B15:G15, A6, B10, B8, D15:$E$16)');
    expect(modifier.setExpression('="SUM: "&SUM(B10:G10)').translate(delta).toString()).toBe('="SUM: "&SUM(B15:G15)');
    expect(modifier.setExpression('=IF(B28<64, "F", IF(B28<73, "D", IF(B28<85, "C", IF(B28<95, "B", "A"))))').translate(delta).toString())
      .toBe('=IF(B33<64, "F", IF(B33<73, "D", IF(B33<85, "C", IF(B33<95, "B", "A"))))');

    delta = {row: -5};

    expect(modifier.setExpression('=B1').translate(delta).toString()).toBe('=#REF!');
    expect(modifier.setExpression('$DD$99').translate(delta).toString()).toBe('=$DD$99');
    expect(modifier.setExpression('=B1/A$4').translate(delta).toString()).toBe('=#REF!/A$4');
    expect(modifier.setExpression('B1/A$4').translate(delta).toString()).toBe('=#REF!/A$4');
    expect(modifier.setExpression('=SUM(B10:G10, A1, B6, B3, D10:$E$16)').translate(delta).toString()).toBe('=SUM(B5:G5, #REF!, B1, #REF!, D5:$E$16)');
    expect(modifier.setExpression('="SUM: "&SUM(B10:G10)').translate(delta).toString()).toBe('="SUM: "&SUM(B5:G5)');
    expect(modifier.setExpression('=IF(B28<64, "F", IF(B28<73, "D", IF(B28<85, "C", IF(B28<95, "B", "A"))))').translate(delta).toString())
      .toBe('=IF(B23<64, "F", IF(B23<73, "D", IF(B23<85, "C", IF(B23<95, "B", "A"))))');
  });
});
