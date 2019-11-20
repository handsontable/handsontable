import { expandMetaType, columnFactory, isFiniteSignedNumber, assert, isNullish } from 'handsontable/dataMap/metaManager/utils';

describe('MetaManager utils', () => {
  describe('expandMetaType', () => {
    it('should return "undefined" when an object doesn\'t have defined "type" property', () => {
      expect(expandMetaType({})).toBeUndefined();
    });

    it('should return "undefined" when an object doesn\'t have defined "type" property as own property', () => {
      class Child {}
      Child.prototype = Object.create({ type: 'numeric' });

      expect(expandMetaType(new Child())).toBeUndefined();
    });

    it('should return only properties that are not defined on the child object', () => {
      class Child {
        constructor() {
          this.type = { copyPaste: true, test: 'foo' };
          this.copyPaste = false;
        }
      }
      Child.prototype = Object.create({ copyPaste: false });

      expect(expandMetaType(new Child())).toEqual({ test: 'foo' });
    });

    it('should return a copy of the object that is holding by "type" property', () => {
      const type = { copyPaste: true, test: 'foo' };

      expect(expandMetaType({ type })).not.toBe(type);
      expect(expandMetaType({ type })).toEqual(type);
    });

    it('should return the object with defined properties defined by "autocomplete" cell type', () => {
      expect(expandMetaType({ type: 'autocomplete' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
        validator: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "checkbox" cell type', () => {
      expect(expandMetaType({ type: 'checkbox' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "date" cell type', () => {
      expect(expandMetaType({ type: 'date' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
        validator: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "dropdown" cell type', () => {
      expect(expandMetaType({ type: 'dropdown' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
        validator: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "handsontable" cell type', () => {
      expect(expandMetaType({ type: 'handsontable' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "numeric" cell type', () => {
      expect(expandMetaType({ type: 'numeric' })).toEqual({
        dataType: 'number',
        editor: expect.any(Function),
        renderer: expect.any(Function),
        validator: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "password" cell type', () => {
      expect(expandMetaType({ type: 'password' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
        copyable: false,
      });
    });

    it('should return the object with defined properties defined by "text" cell type', () => {
      expect(expandMetaType({ type: 'text' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
      });
    });

    it('should return the object with defined properties defined by "time" cell type', () => {
      expect(expandMetaType({ type: 'time' })).toEqual({
        editor: expect.any(Function),
        renderer: expect.any(Function),
        validator: expect.any(Function),
      });
    });
  });

  describe('columnFactory', () => {
    it('should return new class', () => {
      class Parent {}

      const Column = columnFactory(Parent);
      const column = new Column();

      expect(column instanceof Parent).toBe(true);
    });

    it('should return new class with overwritten properties', () => {
      class Parent {}
      Parent.prototype.data = [];
      Parent.prototype.width = 100;
      Parent.prototype.copyPaste = true;

      const Column = columnFactory(Parent, ['data', 'width']);
      const column = new Column();

      expect(column.data).toBeUndefined();
      expect(column.width).toBeUndefined();
      expect(column.copyPaste).toBe(true);
    });
  });

  describe('isFiniteSignedNumber', () => {
    it('should return true only for valid signed finite numbers', () => {
      expect(isFiniteSignedNumber()).toBe(false);
      expect(isFiniteSignedNumber(null)).toBe(false);
      expect(isFiniteSignedNumber(false)).toBe(false);
      expect(isFiniteSignedNumber('')).toBe(false);
      expect(isFiniteSignedNumber('1')).toBe(false);
      expect(isFiniteSignedNumber({ a: 1 })).toBe(false);
      expect(isFiniteSignedNumber(Infinity)).toBe(false);
      expect(isFiniteSignedNumber(-1)).toBe(false);

      expect(isFiniteSignedNumber(0)).toBe(true);
      expect(isFiniteSignedNumber(1)).toBe(true);
      expect(isFiniteSignedNumber(100)).toBe(true);
      expect(isFiniteSignedNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });
  });

  describe('assert', () => {
    it('should not throw an error when condition returns true', () => {
      expect(() => {
        assert(() => true, 'Test');
      }).not.toThrow();
    });

    it('should throw an error with custom message when condition returns false', () => {
      expect(() => {
        assert(() => false, 'Test');
      }).toThrow('Assertion failed: Test');
    });
  });

  describe('isNullish', () => {
    it('should return true only for nullish values', () => {
      expect(isNullish()).toBe(true);
      expect(isNullish(null)).toBe(true);

      expect(isNullish(0)).toBe(false);
      expect(isNullish('')).toBe(false);
      expect(isNullish(NaN)).toBe(false);
      expect(isNullish({})).toBe(false);
      expect(isNullish([])).toBe(false);
    });
  });
});
