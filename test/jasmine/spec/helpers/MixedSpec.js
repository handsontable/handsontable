describe('Mixed helper', function() {
  describe('stringify', function() {
    it('should convert properly `null` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = null;

      expect(stringify(toConvert)).toBe('');
    });

    it('should convert properly `boolean` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = true;

      expect(stringify(toConvert)).toBe('true');
    });

    it('should convert properly `number` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = 1;

      expect(stringify(toConvert)).toBe('1');
    });

    it('should convert properly `string` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = '2';

      expect(stringify(toConvert)).toBe('2');
    });

    it('should convert properly `object` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = {id: null};

      expect(stringify(toConvert)).toBe('[object Object]');
    });

    it('should convert properly `array` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = ['One', 'Two', 3];

      expect(stringify(toConvert)).toBe('One,Two,3');
    });

    it('should convert properly `RegExp` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = /^\d$/;

      expect(stringify(toConvert)).toBe('/^\\d$/');
    });

    it('should convert properly `function` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert = function() {};

      expect(stringify(toConvert)).toBe('function () {}');
    });

    it('should convert properly `undefined` to `string`', function() {
      var stringify = Handsontable.helper.stringify;
      var toConvert;

      expect(stringify(toConvert)).toBe('');
    });
  });

  describe('isDefined', function() {
    it('should return true when a variable is defined', function() {
      var isDefined = Handsontable.helper.isDefined;
      var toCheck = [];

      expect(isDefined(toCheck)).toBeTruthy();
    });

    it('should return false when a variable is not defined', function() {
      var isDefined = Handsontable.helper.isDefined;
      var toCheck;

      expect(isDefined(toCheck)).toBeFalsy();
    });
  });

  describe('isUndefined', function() {
    it('should check if a variable is defined', function() {
      var isUndefined = Handsontable.helper.isUndefined;
      var toCheck;

      expect(isUndefined(toCheck)).toBeTruthy();
    });

    it('should return false when a variable is not defined', function() {
      var isUndefined = Handsontable.helper.isUndefined;
      var toCheck = [];

      expect(isUndefined(toCheck)).toBeFalsy();
    });
  });
});
