import GlobalMeta from '../globalMeta';
import ColumnMeta from '../columnMeta';
import CellMeta from '../cellMeta';
import { registerCellType, TextCellType } from '../../../../cellTypes';

registerCellType(TextCellType);

describe('ColumnMeta', () => {
  it('should reflect the changes in the cell meta when the global meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const columnMeta = new ColumnMeta(globalMeta);
    const meta = new CellMeta(columnMeta);

    globalMeta.getMeta().copyable = false;
    globalMeta.getMeta().renderer = () => {};
    globalMeta.getMeta().rowHeights = [3, 4, 5];
    globalMeta.getMeta()._myCustomKey = { foo: 'bar' };

    expect(meta.getMeta(2, 0)).toHaveProperty('copyable', false);
    expect(meta.getMeta(2, 0)).toHaveProperty('renderer', globalMeta.getMeta().renderer);
    expect(meta.getMeta(2, 0)).toHaveProperty('rowHeights.0', 3);
    expect(meta.getMeta(2, 0)).toHaveProperty('rowHeights.2', 5);
    expect(meta.getMeta(2, 0)).toHaveProperty('_myCustomKey.foo', 'bar');

    expect(meta.getMeta(26, 10)).toHaveProperty('copyable', false);
    expect(meta.getMeta(26, 10)).toHaveProperty('renderer', globalMeta.getMeta().renderer);
    expect(meta.getMeta(26, 10)).toHaveProperty('rowHeights.0', 3);
    expect(meta.getMeta(26, 10)).toHaveProperty('rowHeights.2', 5);
    expect(meta.getMeta(26, 10)).toHaveProperty('_myCustomKey.foo', 'bar');
  });

  it('should reflect the changes in the cell meta when the column meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const columnMeta = new ColumnMeta(globalMeta);
    const meta = new CellMeta(columnMeta);

    columnMeta.getMeta(5).copyable = false;
    columnMeta.getMeta(5).renderer = () => {};
    columnMeta.getMeta(5).rowHeights = [3, 4, 5];
    columnMeta.getMeta(5)._myCustomKey = { foo: 'bar' };

    expect(meta.getMeta(2, 5)).toHaveProperty('copyable', false);
    expect(meta.getMeta(2, 5)).toHaveProperty('renderer', columnMeta.getMeta(5).renderer);
    expect(meta.getMeta(2, 5)).toHaveProperty('rowHeights.0', 3);
    expect(meta.getMeta(2, 5)).toHaveProperty('rowHeights.2', 5);
    expect(meta.getMeta(2, 5)).toHaveProperty('_myCustomKey.foo', 'bar');

    expect(meta.getMeta(26, 6)).toHaveProperty('copyable', true);
    expect(meta.getMeta(26, 6)).toHaveProperty('renderer', void 0);
    expect(meta.getMeta(26, 6)).toHaveProperty('rowHeights', void 0);
    expect(meta.getMeta(26, 6)).not.toHaveProperty('_myCustomKey');
  });

  it('should not reflect the changes in the column meta when the cell meta properties were changed', () => {
    const globalMeta = new GlobalMeta();
    const columnMeta = new ColumnMeta(globalMeta);
    const meta = new CellMeta(columnMeta);

    meta.getMeta(1, 1).copyable = false;
    meta.getMeta(1, 1).renderer = () => {};
    meta.getMeta(1, 1).rowHeights = [3, 4, 5];
    meta.getMeta(1, 1)._myCustomKey = { foo: 'bar' };

    expect(columnMeta.getMeta(1)).toHaveProperty('copyable', true);
    expect(columnMeta.getMeta(1)).toHaveProperty('renderer', void 0);
    expect(columnMeta.getMeta(1)).toHaveProperty('rowHeights', void 0);
    expect(columnMeta.getMeta(1)).toHaveProperty('_myCustomKey', void 0);
  });

  describe('getMeta()', () => {
    it('should get cell meta instance with properties inherited from column meta', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      const ColumnMetaCtor = columnMeta.getMetaConstructor(0);

      expect(meta.getMeta(0, 0) instanceof ColumnMetaCtor).toBe(true);
    });

    it('should get and persist cell meta', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(2, 4)._test = 3;
      meta.getMeta(0, 0)._test = 0;
      meta.getMeta(10, 990)._test = 'test';

      expect(meta.getMeta(2, 4)._test).toBe(3);
      expect(meta.getMeta(2, 5)._test).toBe(void 0);
      expect(meta.getMeta(1, 4)._test).toBe(void 0);
      expect(meta.getMeta(0, 0)._test).toBe(0);
      expect(meta.getMeta(0, 1)._test).toBe(void 0);
      expect(meta.getMeta(1, 0)._test).toBe(void 0);
      expect(meta.getMeta(10, 990)._test).toBe('test');
      expect(meta.getMeta(10, 991)._test).toBe(void 0);
      expect(meta.getMeta(11, 990)._test).toBe(void 0);
    });

    it('should get cell meta property by key', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(2, 4).activeHeaderClassName = 'foo';
      meta.getMeta(0, 0).hiddenColumns = true;
      meta.getMeta(10, 990).nestedHeaders = { row: 1, col: 2 };
      meta.getMeta(10, 20)._myCustomKey = 'bar';

      expect(meta.getMeta(2, 4, 'activeHeaderClassName')).toBe('foo');
      expect(meta.getMeta(2, 0, 'activeHeaderClassName')).toBe('ht__active_highlight'); // Gets default value from global meta
      expect(meta.getMeta(1, 0, 'activeHeaderClassName')).toBe('ht__active_highlight'); // Gets default value from global meta
      expect(meta.getMeta(0, 0, 'hiddenColumns')).toBe(true);
      expect(meta.getMeta(0, 4, 'hiddenColumns')).toBe(void 0);
      expect(meta.getMeta(1, 4, 'hiddenColumns')).toBe(void 0);
      expect(meta.getMeta(10, 990, 'nestedHeaders')).toEqual({ row: 1, col: 2 });
      expect(meta.getMeta(10, 991, 'nestedHeaders')).toBe(void 0);
      expect(meta.getMeta(11, 990, 'nestedHeaders')).toBe(void 0);
      expect(meta.getMeta(10, 20, '_myCustomKey')).toBe('bar');
      expect(meta.getMeta(10, 21, '_myCustomKey')).toBe(void 0);
      expect(meta.getMeta(11, 22, '_myCustomKey')).toBe(void 0);
      expect(meta.getMeta(11, 22, '0')).toBe(void 0);
      expect(meta.getMeta(11, 22, 0)).toBe(void 0);
      expect(meta.getMeta(11, 22, false)).toBe(void 0);
    });
  });

  describe('setMeta()', () => {
    it('should create, persist and set property value to cell meta', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(2, 4, '_test', 3);
      meta.setMeta(0, 0, 'activeHeaderClassName', 'my-class');
      meta.setMeta(10, 990, 'custom', { myCustom: 'foo' });

      expect(meta.getMeta(2, 4)._test).toBe(3);
      expect(meta.getMeta(1, 4)._test).toBe(void 0);
      expect(meta.getMeta(2, 5)._test).toBe(void 0);
      expect(meta.getMeta(0, 0).activeHeaderClassName).toBe('my-class');
      expect(meta.getMeta(1, 0).activeHeaderClassName).toBe('ht__active_highlight');
      expect(meta.getMeta(0, 1).activeHeaderClassName).toBe('ht__active_highlight');
      expect(meta.getMeta(10, 990).custom).toEqual({ myCustom: 'foo' });
      expect(meta.getMeta(11, 990)._test).toBe(void 0);
      expect(meta.getMeta(10, 989)._test).toBe(void 0);
    });
  });

  describe('getMetas()', () => {
    it('should returns all cells meta as a flat array', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(2, 4)._test = 3;
      meta.getMeta(0, 0)._test = 0;
      meta.getMeta(10, 990)._test = 'test';

      expect(meta.getMetas()).toEqual([{ _test: 3 }, { _test: 0 }, { _test: 'test' }]);
    });

    it('should change cell meta by reference', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(2, 4)._test = 3;
      meta.getMeta(0, 0)._test = 0;
      meta.getMeta(10, 990)._test = 'test';

      meta.getMetas()[1]._test = 1;
      meta.getMetas()[1]._test1 = 2;

      expect(meta.getMeta(0, 0)).toHaveProperty('_test', 1);
      expect(meta.getMeta(0, 0)).toHaveProperty('_test1', 2);
    });
  });

  describe('getMetasAtRow()', () => {
    it('should returns cells meta as a flat array for specified row', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 0;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(2, 3);
      meta.getMeta(2, 4);
      meta.getMeta(10, 990)._test = 'test';

      expect(meta.getMetasAtRow(0)).toEqual([{ _test: 0 }]);
      expect(meta.getMetasAtRow(1)).toEqual([]);
      expect(meta.getMetasAtRow(2)).toEqual([{ _test: 3 }, {}, {}]);
      expect(meta.getMetasAtRow(3)).toEqual([]);
      expect(meta.getMetasAtRow(4)).toEqual([]);
      expect(meta.getMetasAtRow(10)).toEqual([{ _test: 'test' }]);
    });

    it('should change cell meta by reference', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(2, 4)._test = 3;
      meta.getMeta(2, 40)._test = 1;

      meta.getMetasAtRow(2)[1]._test = 10;
      meta.getMetasAtRow(2)[1]._test1 = 11;

      expect(meta.getMeta(2, 4)).toHaveProperty('_test', 3);
      expect(meta.getMeta(2, 40)).toHaveProperty('_test', 10);
      expect(meta.getMeta(2, 40)).toHaveProperty('_test1', 11);
    });
  });

  describe('removeMeta()', () => {
    it('should remove property from cell meta', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(2, 4, '_test', 3);
      meta.setMeta(0, 0, 'activeHeaderClassName', 'my-class');
      meta.setMeta(10, 990, 'custom', { myCustom: 'foo' });

      meta.removeMeta(2, 4, '_test');
      meta.removeMeta(0, 0, 'activeHeaderClassName');
      meta.removeMeta(10, 990, 'custom');

      expect(meta.getMeta(2, 4)._test).toBe(void 0);
      expect(meta.getMeta(0, 0).activeHeaderClassName).toBe('ht__active_highlight');
      expect(meta.getMeta(10, 990).custom).toBe(void 0);
    });
  });

  describe('createColumn()', () => {
    it('should create column while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.createColumn(1);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(void 0);
      expect(meta.getMeta(0, 2)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(2, 3)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(3, 4)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
      expect(meta.getMeta(4, 5)._test).toBe(5);
      expect(meta.getMeta(5, 5)._test).toBe(void 0);
      expect(meta.getMeta(5, 6)._test).toBe(void 0);
    });

    it('should create columns while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.createColumn(2, 3);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(2, 5)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(3, 6)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
      expect(meta.getMeta(4, 7)._test).toBe(5);
      expect(meta.getMeta(5, 5)._test).toBe(void 0);
    });
  });

  describe('removeColumn()', () => {
    it('should remove column while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.removeColumn(1);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(void 0);
      expect(meta.getMeta(2, 1)._test).toBe(3);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(3, 2)._test).toBe(4);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(4, 3)._test).toBe(5);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
      expect(meta.getMeta(5, 5)._test).toBe(void 0);
    });

    it('should remove columns while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.removeColumn(2, 3);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(2, 5)._test).toBe(void 0);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(3, 6)._test).toBe(void 0);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
      expect(meta.getMeta(4, 7)._test).toBe(void 0);
      expect(meta.getMeta(5, 5)._test).toBe(void 0);
    });
  });

  describe('createRow()', () => {
    it('should create row while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.createRow(1);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(3, 2)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(4, 3)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
      expect(meta.getMeta(5, 4)._test).toBe(5);
    });

    it('should create rows while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.createRow(2, 3);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(5, 2)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(6, 3)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
      expect(meta.getMeta(7, 4)._test).toBe(5);
    });
  });

  describe('removeRow()', () => {
    it('should remove row while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.removeRow(1);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(2);
      expect(meta.getMeta(1, 2)._test).toBe(3);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(2, 3)._test).toBe(4);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(3, 4)._test).toBe(5);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
    });

    it('should remove rows while maintaining data consistently', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(0, 1)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 3)._test = 4;
      meta.getMeta(4, 4)._test = 5;

      meta.removeRow(2, 3);

      expect(meta.getMeta(0, 0)._test).toBe(1);
      expect(meta.getMeta(0, 1)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(3, 3)._test).toBe(void 0);
      expect(meta.getMeta(4, 4)._test).toBe(void 0);
    });
  });

  describe('updateMeta()', () => {
    it('should update meta with custom settings', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const settings = {
        activeHeaderClassName: 'foo',
        hiddenColumns: true,
        nestedHeaders: { row: 1, col: 2 },
        _myCustomKey: 'bar',
      };

      expect(meta.getMeta(2, 3)).toHaveProperty('outsideClickDeselects', true);

      meta.updateMeta(2, 3, settings);

      expect(meta.getMeta(2, 3)).toHaveProperty('activeHeaderClassName', 'foo');
      expect(meta.getMeta(2, 3)).toHaveProperty('hiddenColumns', true);
      expect(meta.getMeta(2, 3)).toHaveProperty('nestedHeaders', settings.nestedHeaders);
      expect(meta.getMeta(2, 3)).toHaveProperty('_myCustomKey', 'bar');
      expect(meta.getMeta(2, 3)).toHaveProperty('outsideClickDeselects', true);
    });

    it('should expand "type" property as an object to "editor", "renderer" and "validator" keys', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const settings = {
        type: {
          _customKey: true,
          copyable: true,
          editor: 'foo',
          renderer: 'bar',
          validator: 'baz',
        }
      };

      meta.updateMeta(5, 2, settings);

      expect(meta.getMeta(5, 2)).toHaveProperty('type', settings.type);
      expect(meta.getMeta(5, 2)).toHaveProperty('_customKey', true);
      expect(meta.getMeta(5, 2)).toHaveProperty('copyable', true);
      expect(meta.getMeta(5, 2)).toHaveProperty('editor', 'foo');
      expect(meta.getMeta(5, 2)).toHaveProperty('renderer', 'bar');
      expect(meta.getMeta(5, 2)).toHaveProperty('validator', 'baz');
    });

    it('should expand "type" property as string to "editor", "renderer" and "validator" keys', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const settings = {
        type: 'text',
      };

      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90)).toHaveProperty('type', 'text');
      expect(meta.getMeta(7, 90).editor).toBeFunction();
      expect(meta.getMeta(7, 90).renderer).toBeFunction();
    });

    it('should expand "type" property but without overwriting already defined properties', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const settings = {
        type: {
          copyPaste: true,
          _test: 'foo',
        },
      };

      meta.getMeta(7, 90).copyPaste = false;
      meta.getMeta(7, 90)._test = 'bar';

      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', false);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');

      settings.copyPaste = true;
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', true);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');
    });
  });

  describe('clearCache()', () => {
    it('should call internally "clear" method of the lazyMap', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      const spy = spyOn(meta.metas, 'clear');

      meta.clearCache();

      expect(spy).toHaveBeenCalledWith();
    });

    it('should clear all cells meta', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0)._test = 1;
      meta.getMeta(1, 3)._test = 2;
      meta.getMeta(2, 2)._test = 3;
      meta.getMeta(3, 1)._test = 4;
      meta.getMeta(4, 10)._test = 5;

      meta.clearCache();

      expect(meta.getMeta(0, 0)._test).toBe(void 0);
      expect(meta.getMeta(1, 3)._test).toBe(void 0);
      expect(meta.getMeta(2, 2)._test).toBe(void 0);
      expect(meta.getMeta(3, 1)._test).toBe(void 0);
      expect(meta.getMeta(4, 10)._test).toBe(void 0);
    });
  });
});
