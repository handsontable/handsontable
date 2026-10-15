import {
  extendByMetaType,
  columnFactory,
  assert,
  isNullish,
  normalizeEditorSetting,
  applyRequestedTypeEditor,
  TYPE_EDITOR_REQUESTED_KEY,
} from '../utils';
import { hasOwnProperty } from '../../../helpers/object';
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
            'textEllipsis',
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
        textEllipsis: getCellType('autocomplete').textEllipsis,
      });

      extendByMetaType(metaObject, {
        type: 'numeric'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'validator', 'valueGetter', 'valueSetter', 'dataType', 'valueFormatter', 'parsePastedValue',
          'textEllipsis',
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
        textEllipsis: getCellType('autocomplete').textEllipsis,
      });

      extendByMetaType(metaObject, {
        type: 'text'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'validator', 'valueGetter', 'valueSetter', 'dataType', 'valueFormatter', 'parsePastedValue',
          'textEllipsis',
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
        textEllipsis: getCellType('autocomplete').textEllipsis,
      });
    });

    it('should not extend properties originally set by the type but later modified by the user (`type` as string)', () => {
      const metaObject = {};

      extendByMetaType(metaObject, {
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'renderer', 'validator', 'valueGetter', 'valueSetter', 'parsePastedValue', 'textEllipsis',
        ]),
        renderer: getCellType('autocomplete').renderer,
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
        textEllipsis: getCellType('autocomplete').textEllipsis,
      });

      metaObject.renderer = 'my-renderer';
      extendByMetaType(metaObject, {
        renderer: 'my-renderer',
        type: 'autocomplete'
      });

      expect(metaObject).toEqual({
        _automaticallyAssignedMetaProps: new Set([
          'editor', 'validator', 'valueGetter', 'valueSetter', 'parsePastedValue', 'textEllipsis',
        ]),
        renderer: 'my-renderer',
        editor: getCellType('autocomplete').editor,
        validator: getCellType('autocomplete').validator,
        valueGetter: getCellType('autocomplete').valueGetter,
        valueSetter: getCellType('autocomplete').valueSetter,
        parsePastedValue: getCellType('autocomplete').parsePastedValue,
        textEllipsis: getCellType('autocomplete').textEllipsis,
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

    it('should not supply the type\'s editor when editing is disabled on the meta object', () => {
      const metaObject: Record<string, unknown> = { editor: false };

      extendByMetaType(metaObject, { type: 'numeric' });

      expect(metaObject.editor).toBe(false);
    });

    it('should still supply every other property of the type when editing is disabled', () => {
      const metaObject: Record<string, unknown> = { editor: false };

      extendByMetaType(metaObject, { type: 'numeric' });

      // The point of the carve-out: a non-editable column keeps its type's formatting.
      expect(metaObject.renderer).toBe(getCellType('numeric').renderer);
      expect(metaObject.validator).toBe(getCellType('numeric').validator);
    });

    it('should not supply the type\'s editor when editing is disabled on a PROTOTYPE of the meta object', () => {
      // The shape a grid-level `editor: false` takes for a column: the column meta inherits it
      // rather than owning it, so `hasOwnProperty()` reports it as absent.
      const gridLevel = { editor: false };
      const metaObject: Record<string, unknown> = Object.create(gridLevel);

      extendByMetaType(metaObject, { type: 'numeric' });

      expect(metaObject.editor).toBe(false);
      expect(metaObject.renderer).toBe(getCellType('numeric').renderer);
    });

    it('should let a type overwrite an `editor` of false that an earlier type assigned', () => {
      // A custom type MAY declare `editor: false`. That is the type's default, not the user's
      // policy, so the next type is still free to replace it.
      const metaObject: Record<string, unknown> = {};

      extendByMetaType(metaObject, { type: { editor: false } });

      expect(metaObject.editor).toBe(false);
      expect(metaObject._automaticallyAssignedMetaProps).toEqual(new Set(['editor']));

      extendByMetaType(metaObject, { type: 'numeric' });

      expect(metaObject.editor).toBe(getCellType('numeric').editor);
    });

    it('should supply the type\'s editor despite disabled editing when the payload asked for it', () => {
      // `editor: true` is dropped by `normalizeEditorSetting()` before it gets here, so the caller
      // passes it on as `typeEditorRequested`. It opts the meta object back in.
      const metaObject: Record<string, unknown> = Object.create({ editor: false });

      extendByMetaType(metaObject, { type: 'numeric' }, metaObject, true);

      expect(metaObject.editor).toBe(getCellType('numeric').editor);
    });

    it('should let a type replace an `editor: false` that a type supplied on a PROTOTYPE', () => {
      // A grid-level custom type writes its `editor: false` onto the global meta, which keeps no
      // `_automaticallyAssignedMetaProps`. It is still the type's default, not the user's policy.
      const prototype: Record<string, unknown> = {};

      extendByMetaType(prototype, { type: { editor: false } }, {});

      const metaObject: Record<string, unknown> = Object.create(prototype);

      extendByMetaType(metaObject, { type: 'numeric' });

      expect(metaObject.editor).toBe(getCellType('numeric').editor);
    });

    it('should keep a column\'s own `editor: false` for every cell after one cell opted in', () => {
      // A cell meta keeps no `_automaticallyAssignedMetaProps` of its own: it reaches the column's set
      // through the prototype, so the opted-in cell records `'editor'` in the COLUMN's set. That must
      // not turn the column's own `false` into a type default for the cells expanded after it.
      const column: Record<string, unknown> = { editor: false };

      extendByMetaType(column, { type: 'numeric', editor: false });

      const optedIn: Record<string, unknown> = Object.create(column);
      const other: Record<string, unknown> = Object.create(column);

      extendByMetaType(optedIn, { type: 'numeric' }, optedIn, true);

      expect(optedIn.editor).toBe(getCellType('numeric').editor);
      expect(column._automaticallyAssignedMetaProps).toContain('editor');

      extendByMetaType(other, { type: 'numeric' });

      expect(other.editor).toBe(false);
    });
  });

  describe('applyRequestedTypeEditor', () => {
    it('should supply the editor of an inherited type to a cell that asked for it', () => {
      const column = { type: 'numeric', editor: false, renderer: 'my-renderer' };
      const cell: Record<string, unknown> = Object.create(column);

      cell[TYPE_EDITOR_REQUESTED_KEY] = true;

      expect(applyRequestedTypeEditor(cell)).toBe(true);
      expect(cell.editor).toBe(getCellType('numeric').editor);
      // Only the editor is applied: the column's own options next to its `type` stay in force.
      expect(hasOwnProperty(cell, 'renderer')).toBe(false);
      expect(cell.renderer).toBe('my-renderer');
    });

    it('should do nothing without the request, with an own `type`, or with an own `editor`', () => {
      const column = { type: 'numeric', editor: false };
      const notRequested: Record<string, unknown> = Object.create(column);
      const ownType: Record<string, unknown> = Object.create(column);
      const ownEditor: Record<string, unknown> = Object.create(column);

      ownType[TYPE_EDITOR_REQUESTED_KEY] = true;
      ownType.type = 'text';
      ownEditor[TYPE_EDITOR_REQUESTED_KEY] = true;
      ownEditor.editor = 'password';

      expect(applyRequestedTypeEditor(notRequested)).toBe(false);
      expect(notRequested.editor).toBe(false);
      expect(applyRequestedTypeEditor(ownType)).toBe(false);
      expect(hasOwnProperty(ownType, 'editor')).toBe(false);
      expect(applyRequestedTypeEditor(ownEditor)).toBe(false);
      expect(ownEditor.editor).toBe('password');
    });

    it('should keep an inherited editor that does not disable editing', () => {
      const namedEditor: Record<string, unknown> = Object.create({ type: 'text', editor: 'password' });
      const typeDefault: Record<string, unknown> = Object.create({ type: 'dropdown', editor: 'autocomplete' });

      namedEditor[TYPE_EDITOR_REQUESTED_KEY] = true;
      typeDefault[TYPE_EDITOR_REQUESTED_KEY] = true;

      expect(applyRequestedTypeEditor(namedEditor)).toBe(false);
      expect(hasOwnProperty(namedEditor, 'editor')).toBe(false);
      expect(namedEditor.editor).toBe('password');
      expect(applyRequestedTypeEditor(typeDefault)).toBe(false);
      expect(hasOwnProperty(typeDefault, 'editor')).toBe(false);
      expect(typeDefault.editor).toBe('autocomplete');
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
