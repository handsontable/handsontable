import MetaManager from '../';
import GlobalMeta from '../metaLayers/globalMeta';
import TableMeta from '../metaLayers/tableMeta';
import ColumnMeta from '../metaLayers/columnMeta';
import CellMeta from '../metaLayers/cellMeta';

describe('MetaManager', () => {
  it('should instantiate the mod class with proper list of arguments', () => {
    const constructorSpy = jest.fn();

    class CacheCellMetaMod {
      constructor(...args) {
        constructorSpy.apply(constructorSpy, args);
      }
    }

    const hotMock = {};
    const meta = new MetaManager(hotMock, {}, [CacheCellMetaMod]);

    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(constructorSpy).toHaveBeenCalledWith(meta);
  });

  describe('constructor()', () => {
    it('should initialize all meta layers', () => {
      const metaManager = new MetaManager();

      expect(metaManager.globalMeta instanceof GlobalMeta).toBe(true);
      expect(metaManager.tableMeta instanceof TableMeta).toBe(true);
      expect(metaManager.columnMeta instanceof ColumnMeta).toBe(true);
      expect(metaManager.cellMeta instanceof CellMeta).toBe(true);
    });
  });

  describe('getGlobalMeta()', () => {
    it('should pass a method call to GlobalMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.globalMeta, 'getMeta').and.returnValue('foo');

      expect(metaManager.getGlobalMeta()).toBe('foo');
      expect(metaManager.globalMeta.getMeta).toHaveBeenCalledWith();
    });
  });

  describe('updateGlobalMeta()', () => {
    it('should pass a method call to GlobalMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.globalMeta, 'updateMeta').and.returnValue('foo');

      expect(metaManager.updateGlobalMeta('bar')).toBeUndefined();
      expect(metaManager.globalMeta.updateMeta).toHaveBeenCalledWith('bar');
    });
  });

  describe('getTableMeta()', () => {
    it('should pass a method call to TableMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.tableMeta, 'getMeta').and.returnValue('foo');

      expect(metaManager.getTableMeta()).toBe('foo');
      expect(metaManager.tableMeta.getMeta).toHaveBeenCalledWith();
    });
  });

  describe('updateTableMeta()', () => {
    it('should pass a method call to TableMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.tableMeta, 'updateMeta').and.returnValue('foo');

      expect(metaManager.updateTableMeta('bar')).toBeUndefined();
      expect(metaManager.tableMeta.updateMeta).toHaveBeenCalledWith('bar');
    });
  });

  describe('getColumnMeta()', () => {
    it('should pass a method call to ColumnMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.columnMeta, 'getMeta').and.returnValue('foo');

      expect(metaManager.getColumnMeta(34)).toBe('foo');
      expect(metaManager.columnMeta.getMeta).toHaveBeenCalledWith(34);
    });
  });

  describe('updateColumnMeta()', () => {
    it('should pass a method call to ColumnMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.columnMeta, 'updateMeta').and.returnValue('foo');

      expect(metaManager.updateColumnMeta(34, 'bar')).toBeUndefined();
      expect(metaManager.columnMeta.updateMeta).toHaveBeenCalledWith(34, 'bar');
    });
  });

  describe('getCellMeta()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();
      const metaMock = {};
      const optionsMock = {};

      spyOn(metaManager.cellMeta, 'getMeta').and.returnValue(metaMock);

      expect(metaManager.getCellMeta(34, 22, optionsMock)).toBe(metaMock);
      expect(metaManager.cellMeta.getMeta).toHaveBeenCalledWith(34, 22);
    });

    it('should extend the cell meta object for physical and visual indexes', () => {
      const metaManager = new MetaManager();
      const metaMock = {
        foo: 'bar',
      };

      spyOn(metaManager.cellMeta, 'getMeta').and.returnValue(metaMock);

      metaManager.getCellMeta(34, 22, {
        visualRow: 3,
        visualColumn: 5,
      });

      expect(metaMock).toEqual({
        row: 34,
        col: 22,
        visualRow: 3,
        visualCol: 5,
        foo: 'bar',
      });
    });
  });

  describe('getCellMetaKeyValue()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();
      const metaMock = {};

      spyOn(metaManager.cellMeta, 'getMeta').and.returnValue(metaMock);

      expect(metaManager.getCellMetaKeyValue(34, 22, 'foo')).toBe(metaMock);
      expect(metaManager.cellMeta.getMeta).toHaveBeenCalledWith(34, 22, 'foo');
    });

    it('should throw an error when the "key" is not a string', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'getMeta');

      expect(() => {
        metaManager.getCellMetaKeyValue(34, 22);
      }).toThrow('The passed cell meta object key is not a string');
      expect(() => {
        metaManager.getCellMetaKeyValue(34, 22, 1);
      }).toThrow('The passed cell meta object key is not a string');
      expect(() => {
        metaManager.getCellMetaKeyValue(34, 22, {});
      }).toThrow('The passed cell meta object key is not a string');
      expect(metaManager.cellMeta.getMeta).not.toHaveBeenCalled();
    });
  });

  describe('setCellMeta()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'setMeta');

      metaManager.setCellMeta(34, 22, 'key', 'value');

      expect(metaManager.cellMeta.setMeta).toHaveBeenCalledWith(34, 22, 'key', 'value');
    });
  });

  describe('updateCellMeta()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'updateMeta').and.returnValue('foo');

      expect(metaManager.updateCellMeta(34, 22, 'bar')).toBeUndefined();
      expect(metaManager.cellMeta.updateMeta).toHaveBeenCalledWith(34, 22, 'bar');
    });
  });

  describe('removeCellMeta()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'removeMeta').and.returnValue('foo');

      expect(metaManager.removeCellMeta(34, 22, 'bar')).toBeUndefined();
      expect(metaManager.cellMeta.removeMeta).toHaveBeenCalledWith(34, 22, 'bar');
    });
  });

  describe('getCellsMeta()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'getMetas').and.returnValue(['foo']);

      expect(metaManager.getCellsMeta()).toEqual(['foo']);
      expect(metaManager.cellMeta.getMetas).toHaveBeenCalledWith();
    });
  });

  describe('getCellsMetaAtRow()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'getMetasAtRow').and.returnValue(['foo']);

      expect(metaManager.getCellsMetaAtRow(32)).toEqual(['foo']);
      expect(metaManager.cellMeta.getMetasAtRow).toHaveBeenCalledWith(32);
    });
  });

  describe('createRow()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'createRow');

      expect(metaManager.createRow(32)).toBeUndefined();
      expect(metaManager.cellMeta.createRow).toHaveBeenCalledWith(32, 1);

      expect(metaManager.createRow(22, 10)).toBeUndefined();
      expect(metaManager.cellMeta.createRow).toHaveBeenCalledWith(22, 10);
    });
  });

  describe('removeRow()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'removeRow');

      expect(metaManager.removeRow(32)).toBeUndefined();
      expect(metaManager.cellMeta.removeRow).toHaveBeenCalledWith(32, 1);

      expect(metaManager.removeRow(22, 10)).toBeUndefined();
      expect(metaManager.cellMeta.removeRow).toHaveBeenCalledWith(22, 10);
    });
  });

  describe('createColumn()', () => {
    it('should pass a method call to CellMeta and ColumnMeta layers', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'createColumn');
      spyOn(metaManager.columnMeta, 'createColumn');

      expect(metaManager.createColumn(32)).toBeUndefined();
      expect(metaManager.cellMeta.createColumn).toHaveBeenCalledWith(32, 1);
      expect(metaManager.columnMeta.createColumn).toHaveBeenCalledWith(32, 1);

      expect(metaManager.createColumn(22, 10)).toBeUndefined();
      expect(metaManager.cellMeta.createColumn).toHaveBeenCalledWith(22, 10);
      expect(metaManager.columnMeta.createColumn).toHaveBeenCalledWith(22, 10);
    });
  });

  describe('removeColumn()', () => {
    it('should pass a method call to CellMeta and ColumnMeta layers', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'removeColumn');
      spyOn(metaManager.columnMeta, 'removeColumn');

      expect(metaManager.removeColumn(32)).toBeUndefined();
      expect(metaManager.cellMeta.removeColumn).toHaveBeenCalledWith(32, 1);
      expect(metaManager.columnMeta.removeColumn).toHaveBeenCalledWith(32, 1);

      expect(metaManager.removeColumn(22, 10)).toBeUndefined();
      expect(metaManager.cellMeta.removeColumn).toHaveBeenCalledWith(22, 10);
      expect(metaManager.columnMeta.removeColumn).toHaveBeenCalledWith(22, 10);
    });
  });

  describe('clearCellsCache()', () => {
    it('should pass a method call to only CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'clearCache');
      spyOn(metaManager.columnMeta, 'clearCache');

      expect(metaManager.clearCellsCache()).toBeUndefined();
      expect(metaManager.cellMeta.clearCache).toHaveBeenCalledWith();
      expect(metaManager.columnMeta.clearCache).not.toHaveBeenCalledWith();
    });
  });

  describe('clearCache()', () => {
    it('should pass a method call to CellMeta, ColumnMeta and TableMeta layers', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'clearCache');
      spyOn(metaManager.columnMeta, 'clearCache');

      expect(metaManager.clearCache()).toBeUndefined();
      expect(metaManager.cellMeta.clearCache).toHaveBeenCalledWith();
      expect(metaManager.columnMeta.clearCache).toHaveBeenCalledWith();
    });
  });
});
