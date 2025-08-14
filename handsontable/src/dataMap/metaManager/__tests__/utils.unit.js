import {
  extendByMetaType,
  columnFactory,
  assert,
  isNullish,
} from '../utils';
import { registerAllCellTypes, getCellType } from '../../../cellTypes';

registerAllCellTypes();

describe('MetaManager utils', () => {
  describe('extendByMetaType', () => {
    it('should return "undefined" when an object doesn\'t have defined "type" property or is not supported', () => {
      expect(extendByMetaType({}, {})).toBeUndefined();
    });

    it('should extend only the properties that are not defined in the meta object (`type` as an object)', () => {
      const metaObject = {
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer'
      };

      extendByMetaType(metaObject, {
        type: {
          copyPaste: false,
          renderer: 'my-renderer',
          test2: 'bar',
        }
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['test2']),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        test2: 'bar',
      });

      extendByMetaType(metaObject, {
        type: {
          copyPaste: false,
          renderer: 'my-renderer',
          test2: 'bar2',
        }
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['test2']),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        test2: 'bar2',
      });
    });

    it('should not extend properties originally set by the type but later modified by the user (`type` as an object)', () => {
      const metaObject = {};

      extendByMetaType(metaObject, {
        type: {
          renderer: 'type-renderer',
        }
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['renderer']),
        renderer: 'type-renderer',
      });

      metaObject.renderer = 'my-renderer';
      extendByMetaType(metaObject, {
        renderer: 'my-renderer',
        type: {
          renderer: 'type-renderer',
        }
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([]),
        renderer: 'my-renderer',
      });
    });

    it('should extend only the properties that are not defined in the meta object (`type` as string)', () => {
      const metaObject = {
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer'
      };

      extendByMetaType(metaObject, {
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['editor', 'validator', 'valueGetter', 'valueSetter']),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
      });

      extendByMetaType(metaObject, {
        type: 'numeric'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['editor', 'validator', 'valueGetter', 'valueSetter', 'dataType']),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        dataType: 'number',
        editor: getCellType('numeric').editor,
        validator: getCellType('numeric').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('numeric').valueSetter,
      });

      extendByMetaType(metaObject, {
        type: 'text'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['editor', 'validator', 'dataType', 'valueGetter', 'valueSetter']),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        dataType: 'number',
        editor: getCellType('text').editor,
        validator: getCellType('numeric').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('numeric').valueSetter,
      });
    });

    it('should not extend properties originally set by the type but later modified by the user (`type` as string)', () => {
      const metaObject = {};

      extendByMetaType(metaObject, {
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['editor', 'renderer', 'validator', 'valueGetter', 'valueSetter']),
        renderer: getCellType('autocomplete').renderer,
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
      });

      metaObject.renderer = 'my-renderer';
      extendByMetaType(metaObject, {
        renderer: 'my-renderer',
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set(['editor', 'validator', 'valueGetter', 'valueSetter']),
        renderer: 'my-renderer',
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
      });
    });

    it('should extend only the properties that are not defined in the compared object', () => {
      const metaObject = {
        copyPaste: true,
        test: 'foo',
        renderer: 'my-renderer'
      };
      const userSettings = {
        renderer: 'my-renderer'
      };

      extendByMetaType(metaObject, {
        type: 'text'
      }, userSettings);

      expect(metaObject).toEqual({
        copyPaste: true,
        test: 'foo',
        renderer: 'my-renderer',
        editor: getCellType('text').editor,
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
