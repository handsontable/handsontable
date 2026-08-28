import MetaManager from '../';
import GlobalMeta from '../metaLayers/globalMeta';
import TableMeta from '../metaLayers/tableMeta';
import ColumnMeta from '../metaLayers/columnMeta';
import CellMeta from '../metaLayers/cellMeta';
import { registerAllCellTypes, getCellType } from '../../../cellTypes';

registerAllCellTypes();

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

    it('should not materialize cell meta when removing a key from an untouched cell', () => {
      // Bulk callers (e.g. the MoveCells plugin) remove keys across whole regions; obtaining a
      // meta object just to delete a key from it retained O(visited cells) memory the viewport
      // eviction cannot sweep.
      const metaManager = new MetaManager();

      metaManager.removeCellMeta(5, 5, 'className');

      expect(metaManager.getCellsMeta()).toEqual([]);
    });

    it('should still remove a stored key', () => {
      const metaManager = new MetaManager();

      metaManager.setCellMeta(5, 5, 'className', 'marked');
      metaManager.removeCellMeta(5, 5, 'className');

      expect(metaManager.getCellMeta(5, 5, { visualRow: 5, visualColumn: 5 }).className).toBeUndefined();
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

  describe('getUserDefinedCellMetas()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'getUserDefinedMetas').and.returnValue(['foo']);

      expect(metaManager.getUserDefinedCellMetas()).toEqual(['foo']);
      expect(metaManager.cellMeta.getUserDefinedMetas).toHaveBeenCalledWith();
    });
  });

  describe('enableUserDefinedMetaRecording()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'enableUserDefinedMetaRecording');

      metaManager.enableUserDefinedMetaRecording();

      expect(metaManager.cellMeta.enableUserDefinedMetaRecording).toHaveBeenCalledWith();
    });
  });

  describe('disableUserDefinedMetaRecording()', () => {
    it('should pass a method call to CellMeta layer', () => {
      const metaManager = new MetaManager();

      spyOn(metaManager.cellMeta, 'disableUserDefinedMetaRecording');

      metaManager.disableUserDefinedMetaRecording();

      expect(metaManager.cellMeta.disableUserDefinedMetaRecording).toHaveBeenCalledWith();
    });

    it('should apply a recording-disabled `setCellMeta` write without tracking it as user-defined', () => {
      // Mirrors the `_setCellMetaDeclarative` path Core exposes for built-in plugins (for example
      // ColumnSummary): the write lands on the cell meta but is not user-defined, so it survives the
      // viewport meta eviction yet is cleared and re-applied on an `updateSettings` cache reset.
      const metaManager = new MetaManager();

      metaManager.disableUserDefinedMetaRecording();
      metaManager.setCellMeta(3, 0, 'className', 'columnSummaryResult');
      metaManager.enableUserDefinedMetaRecording();

      expect(metaManager.getCellMeta(3, 0, { visualRow: 3, visualColumn: 0 }).className)
        .toBe('columnSummaryResult');
      expect(metaManager.getUserDefinedCellMetas()).toEqual([]);
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

  describe('getCellMetaUncached()', () => {
    it('should not retain a meta object for a cell with no overrides', () => {
      const metaManager = new MetaManager();

      const meta = metaManager.getCellMetaUncached(2, 3, { visualRow: 2, visualColumn: 3 });

      // positional props set, just like getCellMeta
      expect(meta.row).toBe(2);
      expect(meta.col).toBe(3);
      expect(meta.visualRow).toBe(2);
      expect(meta.visualCol).toBe(3);
      // ...but nothing was stored in the cell-meta cache
      expect(metaManager.cellMeta.hasMeta(2, 3)).toBe(false);
      expect(metaManager.cellMeta.getMetas()).toHaveLength(0);
    });

    it('should inherit column-layer settings through the prototype chain', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(4, { className: 'htCenter', type: 'numeric' });

      const meta = metaManager.getCellMetaUncached(10, 4, { visualRow: 10, visualColumn: 4 });

      expect(meta.className).toBe('htCenter');
      expect(meta.type).toBe('numeric');
      expect(metaManager.cellMeta.hasMeta(10, 4)).toBe(false);
    });

    it('should reuse the stored meta object when the cell already has its own meta', () => {
      const metaManager = new MetaManager();

      // give the cell an override -> it now has a cached meta object
      metaManager.setCellMeta(5, 1, 'className', 'htRight');

      const stored = metaManager.getCellMeta(5, 1, { visualRow: 5, visualColumn: 1, skipMetaExtension: true });
      const uncached = metaManager.getCellMetaUncached(5, 1, { visualRow: 5, visualColumn: 1 });

      // the override is preserved AND the same object is reused (not a throwaway copy)
      expect(uncached.className).toBe('htRight');
      expect(uncached).toBe(stored);
    });

    it('should return the stored meta object through a pending row-shift buffer', () => {
      const metaManager = new MetaManager();

      metaManager.setCellMeta(10, 1, 'className', 'htRight');

      const stored = metaManager.getCellMeta(10, 1, { visualRow: 10, visualColumn: 1, skipMetaExtension: true });

      // buffer a row shift without any read in between, as DataMap.removeRow does
      metaManager.removeRow(3, 1);

      const uncached = metaManager.getCellMetaUncached(9, 1, { visualRow: 9, visualColumn: 1 });

      expect(uncached).toBe(stored);
      expect(uncached.className).toBe('htRight');
    });

    it('should not materialize a row map when probing an empty row', () => {
      const metaManager = new MetaManager();

      metaManager.getCellMetaUncached(7, 0, { visualRow: 7, visualColumn: 0 });

      expect(metaManager.cellMeta.getMetaIfExists(7, 0)).toBeUndefined();
      expect(metaManager.cellMeta.metas.has(7)).toBe(false);
    });
  });

  describe('getCellMetaTransient()', () => {
    it('should run the "extendTransientCellMeta" local hook on the throwaway object without storing it', () => {
      const metaManager = new MetaManager();
      const extended = [];

      metaManager.addLocalHook('extendTransientCellMeta', (cellMeta) => {
        extended.push(cellMeta);
        cellMeta.readOnly = true; // simulates a `cells()`-driven property
      });

      const meta = metaManager.getCellMetaTransient(2, 3, { visualRow: 2, visualColumn: 3 });

      expect(extended).toEqual([meta]);
      expect(meta.readOnly).toBe(true);
      expect(meta.row).toBe(2);
      expect(meta.col).toBe(3);
      expect(meta.visualRow).toBe(2);
      expect(meta.visualCol).toBe(3);
      // nothing retained
      expect(metaManager.cellMeta.getMetaIfExists(2, 3)).toBeUndefined();
      expect(metaManager.cellMeta.getMetas()).toHaveLength(0);
    });

    it('should resolve stored meta once, without a second storage lookup', () => {
      const metaManager = new MetaManager();

      metaManager.setCellMeta(5, 1, 'className', 'htRight');

      const getMetaSpy = jest.spyOn(metaManager.cellMeta, 'getMeta');
      const meta = metaManager.getCellMetaTransient(5, 1, { visualRow: 5, visualColumn: 1 });

      expect(meta.className).toBe('htRight');
      expect(getMetaSpy).not.toHaveBeenCalled();
    });

    it('should route cells with stored meta through the regular memoized getCellMeta path', () => {
      const metaManager = new MetaManager();
      const transientHookCalls = [];
      const eagerHookCalls = [];

      metaManager.addLocalHook('extendTransientCellMeta', () => transientHookCalls.push(1));
      metaManager.addLocalHook('afterGetCellMeta', () => eagerHookCalls.push(1));

      metaManager.setCellMeta(5, 1, 'className', 'htRight');

      const meta = metaManager.getCellMetaTransient(5, 1, { visualRow: 5, visualColumn: 1 });

      expect(meta.className).toBe('htRight');
      expect(meta).toBe(metaManager.getCellMeta(5, 1, { visualRow: 5, visualColumn: 1, skipMetaExtension: true }));
      expect(transientHookCalls).toHaveLength(0);
      expect(eagerHookCalls).toHaveLength(1);
    });

    it('should inherit column-layer settings through the prototype chain', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(4, { className: 'htCenter' });

      const meta = metaManager.getCellMetaTransient(10, 4, { visualRow: 10, visualColumn: 4 });

      expect(meta.className).toBe('htCenter');
      expect(metaManager.cellMeta.getMetaIfExists(10, 4)).toBeUndefined();
    });
  });

  describe('an "editor" setting of `true`', () => {
    // `true` names no editor, so it has to read as "not passed" - the cell keeps the editor its
    // "type" (or a higher meta layer) provides. Without normalization the raw `true` reaches
    // `getEditorInstance()`, which throws on the first edit (GH #7561 follow-up).
    const textEditor = () => getCellType('text').editor;
    const numericEditor = () => getCellType('numeric').editor;

    it('should fall back to the default editor when passed to the global meta layer', () => {
      const metaManager = new MetaManager();

      metaManager.updateGlobalMeta({ editor: true });

      expect(metaManager.getGlobalMeta().editor).toBe(textEditor());
    });

    it('should fall back to the default editor when passed to the table meta layer', () => {
      const metaManager = new MetaManager();

      metaManager.updateTableMeta({ editor: true });

      expect(metaManager.getTableMeta().editor).toBe(textEditor());
    });

    it('should fall back to the default editor when passed to the column meta layer', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(2, { editor: true });

      const meta = metaManager.getCellMeta(0, 2, { visualRow: 0, visualColumn: 2 });

      expect(meta.editor).toBe(textEditor());
    });

    it('should fall back to the default editor when passed to the cell meta layer', () => {
      const metaManager = new MetaManager();

      metaManager.updateCellMeta(1, 1, { editor: true });

      const meta = metaManager.getCellMeta(1, 1, { visualRow: 1, visualColumn: 1 });

      expect(meta.editor).toBe(textEditor());
    });

    it('should keep the editor supplied by the cell "type" of the same column', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(3, { type: 'numeric', editor: true });

      const meta = metaManager.getCellMeta(0, 3, { visualRow: 0, visualColumn: 3 });

      expect(meta.editor).toBe(numericEditor());
      expect(meta.renderer).toBe(getCellType('numeric').renderer);
    });

    it('should keep the editor supplied by the cell "type" of the same cell', () => {
      const metaManager = new MetaManager();

      metaManager.updateCellMeta(2, 2, { type: 'numeric', editor: true });

      const meta = metaManager.getCellMeta(2, 2, { visualRow: 2, visualColumn: 2 });

      expect(meta.editor).toBe(numericEditor());
    });

    it('should keep the editor inherited from a higher meta layer', () => {
      const metaManager = new MetaManager();

      metaManager.updateGlobalMeta({ editor: 'password' });
      metaManager.updateColumnMeta(1, { editor: true });

      const meta = metaManager.getCellMeta(0, 1, { visualRow: 0, visualColumn: 1 });

      expect(meta.editor).toBe('password');
    });

    it('should not leave the raw `true` on the meta object', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(0, { type: 'numeric', editor: true });

      const meta = metaManager.getCellMeta(0, 0, { visualRow: 0, visualColumn: 0 });

      expect(meta.editor).not.toBe(true);
      expect(metaManager.getColumnMeta(0).editor).not.toBe(true);
    });

    it('should not affect an "editor" setting of `false`, which still disables editing', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(0, { type: 'numeric', editor: false });

      const meta = metaManager.getCellMeta(0, 0, { visualRow: 0, visualColumn: 0 });

      expect(meta.editor).toBe(false);
    });

    it('should not affect a named editor, which still wins over the cell "type"', () => {
      const metaManager = new MetaManager();

      metaManager.updateColumnMeta(0, { type: 'numeric', editor: 'password' });

      const meta = metaManager.getCellMeta(0, 0, { visualRow: 0, visualColumn: 0 });

      expect(meta.editor).toBe('password');
    });
  });
});
