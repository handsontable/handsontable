import {
  extendByMetaType,
  columnFactory,
  assert,
  isNullish,
  normalizeEditorSetting,
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
        _automaticallyAssignedMetaProps: new Set(
          [
            'editor',
            'validator',
            'valueGetter',
            'valueSetter',
            'parsePastedValue',
          ]
        ),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
      });

      extendByMetaType(metaObject, {
        type: 'numeric'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'validator', 'valueGetter', 'valueSetter', 'dataType', 'valueFormatter', 'parsePastedValue',
        ]),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        dataType: 'number',
        editor: getCellType('numeric').editor,
        validator: getCellType('numeric').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('numeric').valueSetter,
        valueFormatter: getCellType('numeric').valueFormatter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
      });

      extendByMetaType(metaObject, {
        type: 'text'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'validator', 'valueGetter', 'valueSetter', 'dataType', 'valueFormatter', 'parsePastedValue',
        ]),
        copyPaste: true,
        test: 'foo',
        renderer: 'type-renderer',
        dataType: 'number',
        editor: getCellType('text').editor,
        validator: getCellType('numeric').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('numeric').valueSetter,
        valueFormatter: getCellType('numeric').valueFormatter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
      });
    });

    it('should not extend properties originally set by the type but later modified by the user (`type` as string)', () => {
      const metaObject = {};

      extendByMetaType(metaObject, {
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'renderer', 'validator', 'valueGetter', 'valueSetter', 'parsePastedValue',
        ]),
        renderer: getCellType('autocomplete').renderer,
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
      });

      metaObject.renderer = 'my-renderer';
      extendByMetaType(metaObject, {
        renderer: 'my-renderer',
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'validator', 'valueGetter', 'valueSetter', 'parsePastedValue',
        ]),
        renderer: 'my-renderer',
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
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

  describe('normalizeEditorSetting', () => {
    it('should drop an "editor" property of `true`, so it reads as "not passed"', () => {
      const settings = { editor: true, type: 'numeric' };
      const normalizedSettings = normalizeEditorSetting(settings);

      expect(normalizedSettings).not.toBe(settings);
      expect('editor' in normalizedSettings).toBe(false);
      expect(normalizedSettings.type).toBe('numeric');
    });

    it('should not mutate the passed settings object', () => {
      const settings = { editor: true };

      normalizeEditorSetting(settings);

      expect(settings.editor).toBe(true);
    });

    it('should return the very same object when the "editor" property needs no normalization', () => {
      const namedEditor = { editor: 'numeric' };
      const disabledEditor = { editor: false };
      const nullEditor = { editor: null };
      const noEditor = { type: 'numeric' };

      expect(normalizeEditorSetting(namedEditor)).toBe(namedEditor);
      expect(normalizeEditorSetting(disabledEditor)).toBe(disabledEditor);
      expect(normalizeEditorSetting(nullEditor)).toBe(nullEditor);
      expect(normalizeEditorSetting(noEditor)).toBe(noEditor);
    });

    it('should keep an "editor" property that is a truthy non-boolean value', () => {
      class CustomEditor {}

      const settings = { editor: CustomEditor };

      expect(normalizeEditorSetting(settings).editor).toBe(CustomEditor);
    });
  });
});
