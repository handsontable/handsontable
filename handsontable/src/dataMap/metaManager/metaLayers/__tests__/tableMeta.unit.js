import GlobalMeta from '../globalMeta';
import TableMeta from '../tableMeta';
import { registerCellType, TextCellType } from '../../../../cellTypes';

registerCellType(TextCellType);

describe('TableMeta', () => {
  it('should construct class with prepared meta object', () => {
    const globalMeta = new GlobalMeta();
    const meta = new TableMeta(globalMeta);

    // Check if the meta object has one of many props from meta schema
    expect(meta.meta).toHaveProperty('activeHeaderClassName', 'ht__active_highlight');
    /* eslint-disable no-prototype-builtins */
    // Check if the meta object is a instance of the GlobalMeta
    expect(globalMeta.meta.isPrototypeOf(meta.meta)).toBe(true);
  });

  describe('getMeta()', () => {
    it('should returns meta object (instance)', () => {
      const globalMeta = new GlobalMeta();
      const meta = new TableMeta(globalMeta);

      expect(meta.getMeta()).toBe(meta.meta);
    });
  });

  describe('updateMeta()', () => {
    it('should update meta with custom settings', () => {
      const globalMeta = new GlobalMeta();
      const meta = new TableMeta(globalMeta);
      const settings = {
        activeHeaderClassName: 'foo',
        hiddenColumns: true,
        nestedHeaders: { row: 1, col: 2 },
        _myCustomKey: 'bar',
      };

      expect(meta.getMeta()).toHaveProperty('outsideClickDeselects', true);

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('activeHeaderClassName', 'foo');
      expect(meta.getMeta()).toHaveProperty('hiddenColumns', true);
      expect(meta.getMeta()).toHaveProperty('nestedHeaders', settings.nestedHeaders);
      expect(meta.getMeta()).toHaveProperty('_myCustomKey', 'bar');
      expect(meta.getMeta()).toHaveProperty('outsideClickDeselects', true);
    });

    it('should expand "type" property as an object to "editor", "renderer" and "validator" keys', () => {
      const globalMeta = new GlobalMeta();
      const meta = new TableMeta(globalMeta);
      const settings = {
        type: {
          _customKey: true,
          copyable: true,
          editor: 'foo',
          renderer: 'bar',
          validator: 'baz',
        }
      };

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('type', settings.type);
      expect(meta.getMeta()).toHaveProperty('_customKey', true);
      expect(meta.getMeta()).toHaveProperty('copyable', true);
      expect(meta.getMeta()).toHaveProperty('editor', 'foo');
      expect(meta.getMeta()).toHaveProperty('renderer', 'bar');
      expect(meta.getMeta()).toHaveProperty('validator', 'baz');
    });

    it('should expand "type" property as string to "editor", "renderer" and "validator" keys', () => {
      const globalMeta = new GlobalMeta();
      const meta = new TableMeta(globalMeta);
      const settings = {
        type: 'text',
      };

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('type', 'text');
      expect(meta.getMeta().editor).toBeFunction();
      expect(meta.getMeta().renderer).toBeFunction();
    });

    it('should expand "type" property even when the property was already set', () => {
      const globalMeta = new GlobalMeta();
      const meta = new TableMeta(globalMeta);
      const settings = {
        type: {
          copyPaste: true,
          _test: 'foo',
        },
      };

      meta.getMeta().copyPaste = false;
      meta.getMeta()._test = 'bar';

      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('copyPaste', true);
      expect(meta.getMeta()).toHaveProperty('_test', 'foo');

      // "copyPaste" from settings has priority over the props defined in "type" prop.
      settings.copyPaste = false;
      meta.updateMeta(settings);

      expect(meta.getMeta()).toHaveProperty('copyPaste', false);
      expect(meta.getMeta()).toHaveProperty('_test', 'foo');
    });
  });

  it('should reflect the changes in table meta when the global meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const meta = new TableMeta(globalMeta);

    globalMeta.getMeta().copyable = false;
    globalMeta.getMeta().renderer = () => {};
    globalMeta.getMeta().rowHeights = [3, 4, 5];
    globalMeta.getMeta()._myCustomKey = { foo: 'bar' };

    expect(meta.getMeta()).toHaveProperty('copyable', false);
    expect(meta.getMeta()).toHaveProperty('renderer', globalMeta.getMeta().renderer);
    expect(meta.getMeta()).toHaveProperty('rowHeights.0', 3);
    expect(meta.getMeta()).toHaveProperty('rowHeights.2', 5);
    expect(meta.getMeta()).toHaveProperty('_myCustomKey.foo', 'bar');
  });

  it('should not reflect the changes in global meta when the table meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const meta = new TableMeta(globalMeta);

    meta.getMeta().copyable = false;
    meta.getMeta().renderer = () => {};
    meta.getMeta().rowHeights = [3, 4, 5];
    meta.getMeta()._myCustomKey = { foo: 'bar' };

    expect(globalMeta.getMeta()).toHaveProperty('copyable', true);
    expect(globalMeta.getMeta()).toHaveProperty('renderer', void 0);
    expect(globalMeta.getMeta()).toHaveProperty('rowHeights', void 0);
    expect(globalMeta.getMeta()).toHaveProperty('_myCustomKey', void 0);
  });
});
