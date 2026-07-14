import Handsontable from 'handsontable';
import { DynamicCellMetaMod } from '../dynamicCellMeta';
import MetaManager from '../../';
import { Hooks } from '../../../../core/hooks';
import { registerAllCellTypes } from '../../../../cellTypes';
import type { CellProperties } from '../../../../settings';

type MetaManagerArg = ConstructorParameters<typeof DynamicCellMetaMod>[0];

const createCellMeta = (meta: Partial<CellProperties>) => meta as CellProperties;

registerAllCellTypes();

jest.mock('handsontable');

beforeEach(() => {
  Handsontable.mockImplementation(() => {
    return {
      colToProp: visualCol => `prop_${visualCol}`,
      runHooks: () => {},
      hasHook: () => {},
    };
  });
});

describe('DynamicCellMetaMod', () => {
  it('should subscribe to the "afterGetCellMeta" hook of the MetaManager module', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
    };

    jest.spyOn(mod, 'extendCellMeta');

    metaManager.runLocalHooks('afterGetCellMeta', createCellMeta(cellMeta));

    expect(mod.extendCellMeta).toHaveBeenCalledTimes(1);
    expect(mod.extendCellMeta).toHaveBeenCalledWith(cellMeta);
  });

  it('should extend the cell meta object by reference through the "beforeGetCellMeta" hook', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
    };

    jest.spyOn(metaManager, 'updateCellMeta').mockReset();
    jest.spyOn(hotMock, 'runHooks').mockImplementation((hookName, row, column, cellProperties) => {
      if (hookName === 'beforeGetCellMeta') {
        cellProperties.type = 'password';
        cellProperties.myId = `${row}x${column}`;
      }
    });

    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(cellMeta).toEqual({
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      myId: '1x2',
      type: 'password',
    });
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledWith(1, 2, {
      type: 'password',
    });
  });

  it('should extend the cell meta object by reference through the "afterGetCellMeta" hook', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
    };

    jest.spyOn(metaManager, 'updateCellMeta').mockReset();
    jest.spyOn(hotMock, 'runHooks').mockImplementation((hookName, row, column, cellProperties) => {
      if (hookName === 'afterGetCellMeta') {
        cellProperties.type = 'password';
        cellProperties.myId = `${row}x${column}`;
      }
    });

    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(cellMeta).toEqual({
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      myId: '1x2',
      type: 'password',
    });
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(0);
  });

  it('should extend the cell meta object through the "cells" setting option (not by reference)', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      cells() {
        return {
          type: 'password',
          readOnly: true,
        };
      },
    };

    jest.spyOn(metaManager, 'updateCellMeta').mockReset();
    jest.spyOn(cellMeta, 'cells');

    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(cellMeta).toEqual({
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      cells: cellMeta.cells,
    });
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledWith(1, 2, {
      type: 'password',
      readOnly: true,
    });
    expect(cellMeta.cells).toHaveBeenCalledTimes(1);
    expect(cellMeta.cells).toHaveBeenCalledWith(1, 2, 'prop_2');
  });

  it('should extend the cell meta object only once per table slow render cycle', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      cells() {
        return {
          readOnly: true,
        };
      },
    };

    jest.spyOn(metaManager, 'updateCellMeta').mockReset();
    jest.spyOn(cellMeta, 'cells');
    jest.spyOn(hotMock, 'runHooks').mockImplementation((hookName, row, column, cellProperties) => {
      cellProperties.type = 'password';
      cellProperties.myId = `${row}x${column}`;
    });

    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellMeta.cells).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);

    expect(cellMeta).toEqual({
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      myId: '1x2',
      type: 'password',
      cells: cellMeta.cells,
    });
    expect(mod.metaSyncMemo.size).toBe(1);

    hotMock.runHooks.mockClear();
    cellMeta.cells.mockClear();
    metaManager.updateCellMeta.mockClear();

    mod.extendCellMeta(createCellMeta(cellMeta));
    mod.extendCellMeta(createCellMeta(cellMeta));
    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(0);
    expect(cellMeta.cells).toHaveBeenCalledTimes(0);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(0);
    expect(mod.metaSyncMemo.size).toBe(1);

    Hooks.getSingleton().run(hotMock, 'beforeRender', false); // Emulation of the fast render table cycle hook

    expect(mod.metaSyncMemo.size).toBe(1);

    mod.extendCellMeta(createCellMeta(cellMeta));
    mod.extendCellMeta(createCellMeta(cellMeta));
    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(0);
    expect(cellMeta.cells).toHaveBeenCalledTimes(0);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(0);
    expect(mod.metaSyncMemo.size).toBe(1);

    Hooks.getSingleton().run(hotMock, 'beforeRender', true); // Emulation of the slow render table cycle hook

    expect(mod.metaSyncMemo.size).toBe(0); // The cache is cleared

    mod.extendCellMeta(createCellMeta(cellMeta));
    mod.extendCellMeta(createCellMeta(cellMeta));
    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellMeta.cells).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(1);
  });

  it('should re-extend the cell meta object when the physical index is changed', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      cells() {
        return {
          readOnly: true,
        };
      },
    };

    jest.spyOn(metaManager, 'updateCellMeta').mockReset();
    jest.spyOn(cellMeta, 'cells');
    jest.spyOn(hotMock, 'runHooks').mockImplementation((hookName, row, column, cellProperties) => {
      cellProperties.type = 'password';
      cellProperties.myId = `${row}x${column}`;
    });

    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellMeta.cells).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);

    expect(cellMeta).toEqual({
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      myId: '1x2',
      type: 'password',
      cells: cellMeta.cells,
    });
    expect(mod.metaSyncMemo.size).toBe(1);

    hotMock.runHooks.mockClear();
    cellMeta.cells.mockClear();
    metaManager.updateCellMeta.mockClear();

    const cellMeta1 = {
      row: 3,
      col: 4,
      visualRow: 1,
      visualCol: 2,
      cells() {
        return {
          readOnly: true,
        };
      },
    };

    jest.spyOn(cellMeta1, 'cells');

    mod.extendCellMeta(createCellMeta(cellMeta1));
    mod.extendCellMeta(createCellMeta(cellMeta1));
    mod.extendCellMeta(createCellMeta(cellMeta1));

    expect(cellMeta1).toEqual({
      row: 3,
      col: 4,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      myId: '1x2',
      type: 'password',
      cells: cellMeta1.cells,
    });
    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellMeta1.cells).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(2);
  });

  it('should not re-extend the cell meta object when the visual index is changed', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      cells() {
        return {
          readOnly: true,
        };
      },
    };

    jest.spyOn(metaManager, 'updateCellMeta').mockReset();
    jest.spyOn(cellMeta, 'cells');
    jest.spyOn(hotMock, 'runHooks').mockImplementation((hookName, row, column, cellProperties) => {
      cellProperties.type = 'password';
      cellProperties.myId = `${row}x${column}`;
    });

    mod.extendCellMeta(createCellMeta(cellMeta));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellMeta.cells).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);

    expect(cellMeta).toEqual({
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
      prop: 'prop_2',
      myId: '1x2',
      type: 'password',
      cells: cellMeta.cells,
    });
    expect(mod.metaSyncMemo.size).toBe(1);

    hotMock.runHooks.mockClear();
    cellMeta.cells.mockClear();
    metaManager.updateCellMeta.mockClear();

    const cellMeta1 = {
      row: 1,
      col: 2,
      visualRow: 3,
      visualCol: 4,
      cells() {
        return {
          readOnly: true,
        };
      },
    };

    jest.spyOn(cellMeta1, 'cells');

    mod.extendCellMeta(createCellMeta(cellMeta1));
    mod.extendCellMeta(createCellMeta(cellMeta1));
    mod.extendCellMeta(createCellMeta(cellMeta1));

    expect(cellMeta1).toEqual({
      row: 1,
      col: 2,
      visualRow: 3,
      visualCol: 4,
      cells: cellMeta1.cells,
    });
    expect(hotMock.runHooks).toHaveBeenCalledTimes(0);
    expect(cellMeta1.cells).toHaveBeenCalledTimes(0);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(0);
    expect(mod.metaSyncMemo.size).toBe(1);
  });

  it('should extend the cell meta object that are not yet marked as cached', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
    const cellsSpy = jest.fn();

    jest.spyOn(hotMock, 'runHooks');

    mod.extendCellMeta(createCellMeta({ row: 0, col: 0, visualRow: 0, visualCol: 0, cells: cellsSpy }));
    mod.extendCellMeta(createCellMeta({ row: 1, col: 0, visualRow: 1, visualCol: 0, cells: cellsSpy }));
    mod.extendCellMeta(createCellMeta({ row: 0, col: 1, visualRow: 0, visualCol: 1, cells: cellsSpy }));
    mod.extendCellMeta(createCellMeta({ row: 1, col: 1, visualRow: 1, visualCol: 1, cells: cellsSpy }));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(8);
    expect(cellsSpy).toHaveBeenCalledTimes(4);
    expect(mod.metaSyncMemo.size).toBe(2);

    mod.extendCellMeta(createCellMeta({ row: 0, col: 0, visualRow: 0, visualCol: 0, cells: cellsSpy }));
    mod.extendCellMeta(createCellMeta({ row: 1, col: 0, visualRow: 1, visualCol: 0, cells: cellsSpy }));
    mod.extendCellMeta(createCellMeta({ row: 0, col: 1, visualRow: 0, visualCol: 1, cells: cellsSpy }));
    mod.extendCellMeta(createCellMeta({ row: 1, col: 1, visualRow: 1, visualCol: 1, cells: cellsSpy }));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(8);
    expect(cellsSpy).toHaveBeenCalledTimes(4);
    expect(mod.metaSyncMemo.size).toBe(2);

    hotMock.runHooks.mockClear();
    cellsSpy.mockClear();

    mod.extendCellMeta(createCellMeta({ row: 2, col: 2, visualRow: 2, visualCol: 2, cells: cellsSpy }));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellsSpy).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(3);

    mod.extendCellMeta(createCellMeta({ row: 2, col: 2, visualRow: 2, visualCol: 2, cells: cellsSpy }));

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellsSpy).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(3);
  });

  describe('extendTransientCellMeta()', () => {
    it('should subscribe to the "extendTransientCellMeta" hook of the MetaManager module', () => {
      const hotMock = new Handsontable();
      const metaManager = new MetaManager(hotMock);
      const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
      const cellMeta = {
        row: 1,
        col: 2,
        visualRow: 1,
        visualCol: 2,
      };

      jest.spyOn(mod, 'extendTransientCellMeta');

      metaManager.runLocalHooks('extendTransientCellMeta', createCellMeta(cellMeta));

      expect(mod.extendTransientCellMeta).toHaveBeenCalledTimes(1);
      expect(mod.extendTransientCellMeta).toHaveBeenCalledWith(cellMeta);
    });

    it('should apply the "cells" settings directly on the object without calling updateCellMeta', () => {
      const hotMock = new Handsontable();
      const metaManager = new MetaManager(hotMock);
      const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
      const cellMeta = {
        row: 1,
        col: 2,
        visualRow: 1,
        visualCol: 2,
        cells() {
          return {
            readOnly: true,
            className: 'htDimmed',
          };
        },
      };

      jest.spyOn(metaManager, 'updateCellMeta').mockReset();

      mod.extendTransientCellMeta(createCellMeta(cellMeta));

      expect(metaManager.updateCellMeta).not.toHaveBeenCalled();
      expect(cellMeta.readOnly).toBe(true);
      expect(cellMeta.className).toBe('htDimmed');
      expect(cellMeta.prop).toBe('prop_2');
    });

    it('should expand the "type" produced by hooks or "cells" directly on the object', () => {
      const hotMock = new Handsontable();
      const metaManager = new MetaManager(hotMock);
      const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
      const cellMeta = {
        row: 1,
        col: 2,
        visualRow: 1,
        visualCol: 2,
        cells() {
          return { type: 'password' };
        },
      };

      jest.spyOn(metaManager, 'updateCellMeta').mockReset();

      mod.extendTransientCellMeta(createCellMeta(cellMeta));

      expect(metaManager.updateCellMeta).not.toHaveBeenCalled();
      // `type: 'password'` expands to the registered cell type's editor/renderer set
      expect(cellMeta.type).toBe('password');
      expect(cellMeta.editor).toBeDefined();
      expect(cellMeta.renderer).toBeDefined();
    });

    it('should run the hooks on every call and never touch the metaSyncMemo', () => {
      const hotMock = new Handsontable();
      const metaManager = new MetaManager(hotMock);
      const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
      const cellsSpy = jest.fn();

      jest.spyOn(hotMock, 'runHooks');

      mod.extendTransientCellMeta(createCellMeta({ row: 1, col: 2, visualRow: 1, visualCol: 2, cells: cellsSpy }));
      mod.extendTransientCellMeta(createCellMeta({ row: 1, col: 2, visualRow: 1, visualCol: 2, cells: cellsSpy }));

      // beforeGetCellMeta + afterGetCellMeta per call, no memo short-circuit
      expect(hotMock.runHooks).toHaveBeenCalledTimes(4);
      expect(cellsSpy).toHaveBeenCalledTimes(2);
      expect(mod.metaSyncMemo.size).toBe(0);
    });

    it('should not short-circuit a transient extension for a cell already in the memo', () => {
      const hotMock = new Handsontable();
      const metaManager = new MetaManager(hotMock);
      const mod = new DynamicCellMetaMod(metaManager as MetaManagerArg);
      const cellsSpy = jest.fn();

      mod.extendCellMeta(createCellMeta({ row: 1, col: 2, visualRow: 1, visualCol: 2, cells: cellsSpy }));

      expect(mod.metaSyncMemo.size).toBe(1);

      mod.extendTransientCellMeta(createCellMeta({ row: 1, col: 2, visualRow: 1, visualCol: 2, cells: cellsSpy }));

      expect(cellsSpy).toHaveBeenCalledTimes(2);
      expect(mod.metaSyncMemo.size).toBe(1);
    });
  });
});
