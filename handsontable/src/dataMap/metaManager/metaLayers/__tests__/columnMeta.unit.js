import GlobalMeta from '../globalMeta';
import ColumnMeta from '../columnMeta';
import { registerCellType, TextCellType } from '../../../../cellTypes';

registerCellType(TextCellType);

describe('ColumnMeta', () => {
  it('should reflect the changes in column meta when the global meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const meta = new ColumnMeta(globalMeta);

    globalMeta.getMeta().copyable = false;
    globalMeta.getMeta().renderer = () => {};
    globalMeta.getMeta().rowHeights = [3, 4, 5];
    globalMeta.getMeta()._myCustomKey = { foo: 'bar' };

    expect(meta.getMeta(2)).toHaveProperty('copyable', false);
    expect(meta.getMeta(2)).toHaveProperty('renderer', globalMeta.getMeta().renderer);
    expect(meta.getMeta(2)).toHaveProperty('rowHeights.0', 3);
    expect(meta.getMeta(2)).toHaveProperty('rowHeights.2', 5);
    expect(meta.getMeta(2)).toHaveProperty('_myCustomKey.foo', 'bar');

    expect(meta.getMeta(26)).toHaveProperty('copyable', false);
    expect(meta.getMeta(26)).toHaveProperty('renderer', globalMeta.getMeta().renderer);
    expect(meta.getMeta(26)).toHaveProperty('rowHeights.0', 3);
    expect(meta.getMeta(26)).toHaveProperty('rowHeights.2', 5);
    expect(meta.getMeta(26)).toHaveProperty('_myCustomKey.foo', 'bar');
  });

  it('should not reflect the changes in global meta when the column meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const meta = new ColumnMeta(globalMeta);

    meta.getMeta(1).copyable = false;
    meta.getMeta(1).renderer = () => {};
    meta.getMeta(1).rowHeights = [3, 4, 5];
    meta.getMeta(1)._myCustomKey = { foo: 'bar' };

    expect(globalMeta.getMeta()).toHaveProperty('copyable', true);
    expect(globalMeta.getMeta()).toHaveProperty('renderer', void 0);
    expect(globalMeta.getMeta()).toHaveProperty('rowHeights', void 0);
    expect(globalMeta.getMeta()).toHaveProperty('_myCustomKey', void 0);
  });

  describe('getMeta()', () => {
    it('should internally call "obtain" method of the lazyMap', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      const spy = spyOn(meta.metas, 'obtain');

      meta.getMeta(4);

      expect(spy).toHaveBeenCalledWith(4);
    });

    it('should get column meta object with properties inherited from global meta', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      /* eslint-disable no-prototype-builtins */
      expect(globalMeta.meta.isPrototypeOf(meta.getMeta(0))).toBe(true);
      /* eslint-disable no-prototype-builtins */
      expect(globalMeta.meta.isPrototypeOf(meta.getMeta(100))).toBe(true);
    });

    it('should persist column meta', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      meta.getMeta(2)._test = 3;

      expect(meta.getMeta(2)._test).toBe(3);
    });
  });

  describe('getMetaConstructor()', () => {
    it('should internally call "obtain" method of the lazyMap', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      const spy = spyOn(meta.metas, 'obtain').and.callThrough();

      meta.getMetaConstructor(4);

      expect(spy).toHaveBeenCalledWith(4);
    });

    it('should get column meta constructor', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      expect(meta.getMetaConstructor(0)).toBe(meta.getMeta(0).constructor);
    });
  });

  describe('createColumn()', () => {
    it('should call insert method of the lazyMap', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      const spy = spyOn(meta.metas, 'insert');

      meta.createColumn(4, 3);

      expect(spy).toHaveBeenCalledWith(4, 3);
    });

    it('should create column while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      meta.getMeta(0)._test = 1;
      meta.getMeta(1)._test = 2;
      meta.getMeta(2)._test = 3;
      meta.getMeta(3)._test = 4;
      meta.getMeta(4)._test = 5;

      meta.createColumn(1);

      expect(meta.getMeta(0)._test).toBe(1);
      expect(meta.getMeta(1)._test).toBe(void 0);
      expect(meta.getMeta(2)._test).toBe(2);
      expect(meta.getMeta(3)._test).toBe(3);
      expect(meta.getMeta(4)._test).toBe(4);
      expect(meta.getMeta(5)._test).toBe(5);
    });

    it('should create columns while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      meta.getMeta(0)._test = 1;
      meta.getMeta(1)._test = 2;
      meta.getMeta(2)._test = 3;
      meta.getMeta(3)._test = 4;
      meta.getMeta(4)._test = 5;

      meta.createColumn(2, 3);

      expect(meta.getMeta(0)._test).toBe(1);
      expect(meta.getMeta(1)._test).toBe(2);
      expect(meta.getMeta(2)._test).toBe(void 0);
      expect(meta.getMeta(3)._test).toBe(void 0);
      expect(meta.getMeta(4)._test).toBe(void 0);
      expect(meta.getMeta(5)._test).toBe(3);
      expect(meta.getMeta(6)._test).toBe(4);
      expect(meta.getMeta(7)._test).toBe(5);
    });
  });

  describe('removeColumn()', () => {
    it('should call remove method of the lazyMap', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      const spy = spyOn(meta.metas, 'remove');

      meta.removeColumn(4, 3);

      expect(spy).toHaveBeenCalledWith(4, 3);
    });

    it('should remove column while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      meta.getMeta(0)._test = 1;
      meta.getMeta(1)._test = 2;
      meta.getMeta(2)._test = 3;
      meta.getMeta(3)._test = 4;
      meta.getMeta(4)._test = 5;

      meta.removeColumn(1);

      expect(meta.getMeta(0)._test).toBe(1);
      expect(meta.getMeta(1)._test).toBe(3);
      expect(meta.getMeta(2)._test).toBe(4);
      expect(meta.getMeta(3)._test).toBe(5);
      expect(meta.getMeta(4)._test).toBe(void 0);
    });

    it('should remove columns while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      meta.getMeta(0)._test = 1;
      meta.getMeta(1)._test = 2;
      meta.getMeta(2)._test = 3;
      meta.getMeta(3)._test = 4;
      meta.getMeta(4)._test = 5;

      meta.removeColumn(2, 3);

      expect(meta.getMeta(0)._test).toBe(1);
      expect(meta.getMeta(1)._test).toBe(2);
      expect(meta.getMeta(2)._test).toBe(void 0);
      expect(meta.getMeta(3)._test).toBe(void 0);
      expect(meta.getMeta(4)._test).toBe(void 0);
    });
  });

  describe('updateMeta()', () => {
    it('should update meta with custom settings', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);
      const settings = {
        activeHeaderClassName: 'foo',
        hiddenColumns: true,
        nestedHeaders: { row: 1, col: 2 },
        _myCustomKey: 'bar',
      };

      expect(meta.getMeta(2)).toHaveProperty('outsideClickDeselects', true);

      meta.updateMeta(2, settings);

      expect(meta.getMeta(2)).toHaveProperty('activeHeaderClassName', 'foo');
      expect(meta.getMeta(2)).toHaveProperty('hiddenColumns', true);
      expect(meta.getMeta(2)).toHaveProperty('nestedHeaders', settings.nestedHeaders);
      expect(meta.getMeta(2)).toHaveProperty('_myCustomKey', 'bar');
      expect(meta.getMeta(2)).toHaveProperty('outsideClickDeselects', true);
    });

    it('should expand "type" property as an object to "editor", "renderer" and "validator" keys', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);
      const settings = {
        type: {
          _customKey: true,
          copyable: true,
          editor: 'foo',
          renderer: 'bar',
          validator: 'baz',
        }
      };

      meta.updateMeta(5, settings);

      expect(meta.getMeta(5)).toHaveProperty('type', settings.type);
      expect(meta.getMeta(5)).toHaveProperty('_customKey', true);
      expect(meta.getMeta(5)).toHaveProperty('copyable', true);
      expect(meta.getMeta(5)).toHaveProperty('editor', 'foo');
      expect(meta.getMeta(5)).toHaveProperty('renderer', 'bar');
      expect(meta.getMeta(5)).toHaveProperty('validator', 'baz');
    });

    it('should expand "type" property as string to "editor", "renderer" and "validator" keys', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);
      const settings = {
        type: 'text',
      };

      meta.updateMeta(7, settings);

      expect(meta.getMeta(7)).toHaveProperty('type', 'text');
      expect(meta.getMeta(7).editor).toBeFunction();
      expect(meta.getMeta(7).renderer).toBeFunction();
    });

    it('should expand "type" property but without overwriting already defined properties', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);
      const settings = {
        type: {
          copyPaste: true,
          _test: 'foo',
        },
      };

      meta.getMeta(7).copyPaste = false;
      meta.getMeta(7)._test = 'bar';

      meta.updateMeta(7, settings);

      expect(meta.getMeta(7)).toHaveProperty('copyPaste', false);
      expect(meta.getMeta(7)).toHaveProperty('_test', 'bar');

      settings.copyPaste = true;
      meta.updateMeta(7, settings);

      expect(meta.getMeta(7)).toHaveProperty('copyPaste', true);
      expect(meta.getMeta(7)).toHaveProperty('_test', 'bar');
    });
  });

  describe('clearCache()', () => {
    it('should call internally "clear" method of the lazyMap', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      const spy = spyOn(meta.metas, 'clear');

      meta.clearCache();

      expect(spy).toHaveBeenCalledWith();
    });

    it('should clear all columns meta', () => {
      const globalMeta = new GlobalMeta();
      const meta = new ColumnMeta(globalMeta);

      meta.getMeta(0)._test = 1;
      meta.getMeta(1)._test = 2;
      meta.getMeta(2)._test = 3;
      meta.getMeta(3)._test = 4;
      meta.getMeta(4)._test = 5;

      meta.clearCache();

      expect(meta.getMeta(0)._test).toBe(void 0);
      expect(meta.getMeta(1)._test).toBe(void 0);
      expect(meta.getMeta(2)._test).toBe(void 0);
      expect(meta.getMeta(3)._test).toBe(void 0);
      expect(meta.getMeta(4)._test).toBe(void 0);
      expect(meta.getMeta(5)._test).toBe(void 0);
    });
  });
});
