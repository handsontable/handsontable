import GlobalMeta from '../globalMeta';
import ColumnMeta from '../columnMeta';
import CellMeta from '../cellMeta';
import { registerAllCellTypes, getCellType } from '../../../../cellTypes';

registerAllCellTypes();

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
    expect(meta.getMeta(26, 6)).toHaveProperty('renderer', undefined);
    expect(meta.getMeta(26, 6)).toHaveProperty('rowHeights', undefined);
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
    expect(columnMeta.getMeta(1)).toHaveProperty('renderer', undefined);
    expect(columnMeta.getMeta(1)).toHaveProperty('rowHeights', undefined);
    expect(columnMeta.getMeta(1)).toHaveProperty('_myCustomKey', undefined);
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
      expect(meta.getMeta(2, 5)._test).toBe(undefined);
      expect(meta.getMeta(1, 4)._test).toBe(undefined);
      expect(meta.getMeta(0, 0)._test).toBe(0);
      expect(meta.getMeta(0, 1)._test).toBe(undefined);
      expect(meta.getMeta(1, 0)._test).toBe(undefined);
      expect(meta.getMeta(10, 990)._test).toBe('test');
      expect(meta.getMeta(10, 991)._test).toBe(undefined);
      expect(meta.getMeta(11, 990)._test).toBe(undefined);
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
      expect(meta.getMeta(0, 4, 'hiddenColumns')).toBe(undefined);
      expect(meta.getMeta(1, 4, 'hiddenColumns')).toBe(undefined);
      expect(meta.getMeta(10, 990, 'nestedHeaders')).toEqual({ row: 1, col: 2 });
      expect(meta.getMeta(10, 991, 'nestedHeaders')).toBe(undefined);
      expect(meta.getMeta(11, 990, 'nestedHeaders')).toBe(undefined);
      expect(meta.getMeta(10, 20, '_myCustomKey')).toBe('bar');
      expect(meta.getMeta(10, 21, '_myCustomKey')).toBe(undefined);
      expect(meta.getMeta(11, 22, '_myCustomKey')).toBe(undefined);
      expect(meta.getMeta(11, 22, '0')).toBe(undefined);
      expect(meta.getMeta(11, 22, 0)).toBe(undefined);
      expect(meta.getMeta(11, 22, false)).toBe(undefined);
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
      expect(meta.getMeta(1, 4)._test).toBe(undefined);
      expect(meta.getMeta(2, 5)._test).toBe(undefined);
      expect(meta.getMeta(0, 0).activeHeaderClassName).toBe('my-class');
      expect(meta.getMeta(1, 0).activeHeaderClassName).toBe('ht__active_highlight');
      expect(meta.getMeta(0, 1).activeHeaderClassName).toBe('ht__active_highlight');
      expect(meta.getMeta(10, 990).custom).toEqual({ myCustom: 'foo' });
      expect(meta.getMeta(11, 990)._test).toBe(undefined);
      expect(meta.getMeta(10, 989)._test).toBe(undefined);
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

    it('should return metas sorted by physical column index', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(2, 3)._test = 'three';
      meta.getMeta(2, 4)._test = 'four';
      meta.getMeta(2, 0)._test = 'zero';
      meta.getMeta(2, 1)._test = 'one';

      expect(meta.getMetasAtRow(2).map(metaObject => metaObject._test)).toEqual(['zero', 'one', 'three', 'four']);
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

      expect(meta.getMeta(2, 4)._test).toBe(undefined);
      expect(meta.getMeta(0, 0).activeHeaderClassName).toBe('ht__active_highlight');
      expect(meta.getMeta(10, 990).custom).toBe(undefined);
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
      expect(meta.getMeta(0, 1)._test).toBe(undefined);
      expect(meta.getMeta(0, 2)._test).toBe(2);
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(2, 3)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(3, 4)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
      expect(meta.getMeta(4, 5)._test).toBe(5);
      expect(meta.getMeta(5, 5)._test).toBe(undefined);
      expect(meta.getMeta(5, 6)._test).toBe(undefined);
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
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(2, 5)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(3, 6)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
      expect(meta.getMeta(4, 7)._test).toBe(5);
      expect(meta.getMeta(5, 5)._test).toBe(undefined);
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
      expect(meta.getMeta(0, 1)._test).toBe(undefined);
      expect(meta.getMeta(2, 1)._test).toBe(3);
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(3, 2)._test).toBe(4);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(4, 3)._test).toBe(5);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
      expect(meta.getMeta(5, 5)._test).toBe(undefined);
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
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(2, 5)._test).toBe(undefined);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(3, 6)._test).toBe(undefined);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
      expect(meta.getMeta(4, 7)._test).toBe(undefined);
      expect(meta.getMeta(5, 5)._test).toBe(undefined);
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
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(3, 2)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(4, 3)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
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
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(5, 2)._test).toBe(3);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(6, 3)._test).toBe(4);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
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
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(2, 3)._test).toBe(4);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(3, 4)._test).toBe(5);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
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
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(3, 3)._test).toBe(undefined);
      expect(meta.getMeta(4, 4)._test).toBe(undefined);
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

    it('should merge "type" property as an object to meta settings', () => {
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

    it('should expand "type" property as string to meta settings', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const settings = {
        type: 'text',
      };

      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90)).toHaveProperty('type', 'text');
      expect(meta.getMeta(7, 90).editor).toBe(getCellType('text').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(getCellType('text').renderer);
    });

    it('should expand "type" property as object but without overwriting already defined properties', () => {
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

    it('should expand "type" property as string but without overwriting already defined properties ' +
       '(updates from simple cell type to more complex)', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const myRenderer = (hot, TD) => { TD.innerText = '*'; };
      const myRenderer2 = (hot, TD) => { TD.innerText = '*'; };
      const myValidator = (value, callback) => callback(true);
      const settings = {
        type: 'text',
        renderer: myRenderer,
        validator: myValidator,
      };

      meta.getMeta(7, 90).copyable = true;
      meta.getMeta(7, 90)._test = 'bar';

      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('text').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(myRenderer);
      expect(meta.getMeta(7, 90).validator).toBe(myValidator);
      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', true);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');

      settings.renderer = myRenderer2;
      settings.copyPaste = false;
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('text').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(myRenderer2);
      expect(meta.getMeta(7, 90).validator).toBe(myValidator);
      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', false);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');

      settings.type = 'numeric';
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('numeric').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(myRenderer2);
      expect(meta.getMeta(7, 90).validator).toBe(myValidator);
      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', false);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');
    });

    it('should expand "type" property as string but without overwriting already defined properties ' +
       '(updates from complex cell type to more simple)', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const myRenderer = (hot, TD) => { TD.innerText = '*'; };
      const myRenderer2 = (hot, TD) => { TD.innerText = '*'; };
      const myValidator = (value, callback) => callback(true);
      const settings = {
        type: 'numeric',
        renderer: myRenderer,
        validator: myValidator,
      };

      meta.getMeta(7, 90).copyable = true;
      meta.getMeta(7, 90)._test = 'bar';

      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('numeric').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(myRenderer);
      expect(meta.getMeta(7, 90).validator).toBe(myValidator);
      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', true);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');

      settings.renderer = myRenderer2;
      settings.copyPaste = false;
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('numeric').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(myRenderer2);
      expect(meta.getMeta(7, 90).validator).toBe(myValidator);
      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', false);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');

      settings.type = 'text';
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('text').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(myRenderer2);
      expect(meta.getMeta(7, 90).validator).toBe(myValidator);
      expect(meta.getMeta(7, 90)).toHaveProperty('copyPaste', false);
      expect(meta.getMeta(7, 90)).toHaveProperty('_test', 'bar');
    });

    it('should be possible to update "type" multiple times', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);
      const settings = {
        type: 'text',
      };

      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('text').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(getCellType('text').renderer);
      expect(meta.getMeta(7, 90).validator).toBeUndefined();

      settings.type = 'autocomplete';
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('autocomplete').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(getCellType('autocomplete').renderer);
      expect(meta.getMeta(7, 90).validator).toBe(getCellType('autocomplete').validator);

      settings.type = 'text';
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('text').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(getCellType('text').renderer);
      expect(meta.getMeta(7, 90).validator).toBe(getCellType('autocomplete').validator);

      settings.type = 'numeric';
      meta.updateMeta(7, 90, settings);

      expect(meta.getMeta(7, 90).editor).toBe(getCellType('numeric').editor);
      expect(meta.getMeta(7, 90).renderer).toBe(getCellType('numeric').renderer);
      expect(meta.getMeta(7, 90).validator).toBe(getCellType('numeric').validator);
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

      expect(meta.getMeta(0, 0)._test).toBe(undefined);
      expect(meta.getMeta(1, 3)._test).toBe(undefined);
      expect(meta.getMeta(2, 2)._test).toBe(undefined);
      expect(meta.getMeta(3, 1)._test).toBe(undefined);
      expect(meta.getMeta(4, 10)._test).toBe(undefined);
    });
  });

  describe('getUserDefinedMetas()', () => {
    it('should return properties set through `setMeta` keyed by physical coordinates', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(0, 0, 'readOnly', true);
      meta.setMeta(2, 3, 'className', 'htRight');

      expect(meta.getUserDefinedMetas()).toEqual([
        { physicalRow: 0, physicalColumn: 0, key: 'readOnly', value: true },
        { physicalRow: 2, physicalColumn: 3, key: 'className', value: 'htRight' },
      ]);
    });

    it('should not return properties set through `updateMeta` (for example, the `cells` option)', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.updateMeta(0, 0, { readOnly: true });

      expect(meta.getUserDefinedMetas()).toEqual([]);
    });

    it('should not return a property removed through `removeMeta`', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(0, 0, 'readOnly', true);
      meta.removeMeta(0, 0, 'readOnly');

      expect(meta.getUserDefinedMetas()).toEqual([]);
    });

    it('should return the shifted physical coordinates after inserting a row', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(2, 0, 'readOnly', true);
      meta.createRow(0, 1);

      expect(meta.getUserDefinedMetas()).toEqual([
        { physicalRow: 3, physicalColumn: 0, key: 'readOnly', value: true },
      ]);
    });
  });

  describe('user-defined meta recording', () => {
    it('should not track a property set through `setMeta` while recording is disabled', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.disableUserDefinedMetaRecording();
      meta.setMeta(0, 0, 'readOnly', true);

      expect(meta.getMeta(0, 0).readOnly).toBe(true);
      expect(meta.getUserDefinedMetas()).toEqual([]);
    });

    it('should de-mark a previously tracked property when it is overwritten while recording is disabled', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(0, 0, 'className', 'from-set-cell-meta');
      meta.disableUserDefinedMetaRecording();
      meta.setMeta(0, 0, 'className', 'from-cell-option');
      meta.enableUserDefinedMetaRecording();

      expect(meta.getMeta(0, 0).className).toBe('from-cell-option');
      expect(meta.getUserDefinedMetas()).toEqual([]);
    });

    it('should keep recording suspended until every disable call is balanced by an enable call', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.disableUserDefinedMetaRecording(); // outer scope (for example, the `cell` option loop)
      meta.disableUserDefinedMetaRecording(); // nested scope (for example, a re-entrant updateSettings)
      meta.enableUserDefinedMetaRecording(); // closing the nested scope must not re-enable recording yet
      meta.setMeta(0, 0, 'readOnly', true); // still within the outer scope - declarative, not tracked
      meta.enableUserDefinedMetaRecording(); // closing the outer scope re-enables recording
      meta.setMeta(1, 1, 'className', 'htRight'); // tracked

      expect(meta.getUserDefinedMetas()).toEqual([
        { physicalRow: 1, physicalColumn: 1, key: 'className', value: 'htRight' },
      ]);
    });
  });

  describe('evictRow()', () => {
    it('should evict render-derived cell meta for a row and re-create it lazily on next access', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      const firstMeta = meta.getMeta(5, 0);

      // Returns the physical columns whose meta was evicted (only column 0 was materialized).
      expect(meta.evictRow(5)).toEqual([0]);

      // A fresh object is created on the next access (the original was released).
      const secondMeta = meta.getMeta(5, 0);

      expect(secondMeta).not.toBe(firstMeta);
    });

    it('should keep cells that carry user-defined meta props and evict the rest of the row', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(5, 0); // render-derived (no user props)
      meta.setMeta(5, 1, 'className', 'htRight'); // user-defined - must survive

      const userMetaBefore = meta.getMeta(5, 1);

      meta.evictRow(5);

      // The user-defined cell keeps its identity and value; the prop-less cell is gone.
      expect(meta.getMeta(5, 1)).toBe(userMetaBefore);
      expect(meta.getMeta(5, 1)).toHaveProperty('className', 'htRight');
      expect(meta.getUserDefinedMetas()).toEqual([
        { physicalRow: 5, physicalColumn: 1, key: 'className', value: 'htRight' },
      ]);
    });

    it('should return an empty array for a row that was never materialized', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      expect(meta.evictRow(42)).toEqual([]);
    });

    it('should preserve user-defined meta after eviction and re-materialization of sibling cells', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.setMeta(5, 1, 'className', 'htRight');
      meta.getMeta(5, 0);
      meta.getMeta(5, 2);

      meta.evictRow(5);

      // Re-access prop-less siblings; the user-defined cell is still intact.
      meta.getMeta(5, 0);

      expect(meta.getMeta(5, 1)).toHaveProperty('className', 'htRight');
    });

    it('should keep cells set declaratively while user-defined recording is disabled (the `cell` option path)', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      // Mirrors how Core applies the `cell` option: recording is disabled, so the write is NOT a
      // user-defined prop, yet it is still non-reconstructable and must survive eviction.
      meta.disableUserDefinedMetaRecording();
      meta.setMeta(5, 1, 'className', 'declared-class');
      meta.enableUserDefinedMetaRecording();

      const declaredMetaBefore = meta.getMeta(5, 1);

      meta.evictRow(5);

      // It is not tracked as user-defined...
      expect(meta.getUserDefinedMetas()).toEqual([]);
      // ...but it is still kept and unchanged after eviction.
      expect(meta.getMeta(5, 1)).toBe(declaredMetaBefore);
      expect(meta.getMeta(5, 1)).toHaveProperty('className', 'declared-class');
    });

    it('should keep a cell flagged invalid (`valid === false`) and evict its valid siblings', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(5, 0); // render-derived
      const invalidMeta = meta.getMeta(5, 1);

      invalidMeta.valid = false; // mirrors the validation flow writing directly onto the meta

      // Only the valid sibling (column 0) is evicted; the row is not whole-dropped (column 1 is kept).
      expect(meta.evictRow(5)).toEqual([0]);

      // The invalid cell keeps its identity and flag; the valid sibling is re-created fresh.
      expect(meta.getMeta(5, 1)).toBe(invalidMeta);
      expect(meta.getMeta(5, 1).valid).toBe(false);
    });
  });

  describe('createColumn() after eviction', () => {
    it('should not re-create rows that were evicted (no re-materialization)', () => {
      const globalMeta = new GlobalMeta();
      const columnMeta = new ColumnMeta(globalMeta);
      const meta = new CellMeta(columnMeta);

      meta.getMeta(0, 0);
      meta.getMeta(1, 0);
      meta.getMeta(2, 0);

      meta.evictRow(1); // row 1 becomes unmaterialized

      const materializedBefore = Array.from(meta.metas).length;

      meta.createColumn(0, 1);

      // createColumn must not resurrect the evicted row.
      const materializedAfter = Array.from(meta.metas).length;

      expect(materializedAfter).toBe(materializedBefore);
      expect(Array.from(meta.metas).map(([key]) => key).sort((a, b) => a - b)).toEqual([0, 2]);
    });
  });
});
