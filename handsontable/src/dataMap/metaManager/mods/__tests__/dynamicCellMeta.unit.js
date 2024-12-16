import Handsontable from 'handsontable';
import { DynamicCellMetaMod } from '../dynamicCellMeta';
import MetaManager from '../../';
import { Hooks } from '../../../../core/hooks';
import { registerAllCellTypes } from '../../../../cellTypes';

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
    const mod = new DynamicCellMetaMod(metaManager);
    const cellMeta = {
      row: 1,
      col: 2,
      visualRow: 1,
      visualCol: 2,
    };

    jest.spyOn(mod, 'extendCellMeta');

    metaManager.runLocalHooks('afterGetCellMeta', cellMeta);

    expect(mod.extendCellMeta).toHaveBeenCalledTimes(1);
    expect(mod.extendCellMeta).toHaveBeenCalledWith(cellMeta);
  });

  it('should extend the cell meta object by reference through the "beforeGetCellMeta" hook', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager);
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

    mod.extendCellMeta(cellMeta);

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
    const mod = new DynamicCellMetaMod(metaManager);
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

    mod.extendCellMeta(cellMeta);

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
    const mod = new DynamicCellMetaMod(metaManager);
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

    mod.extendCellMeta(cellMeta);

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
    const mod = new DynamicCellMetaMod(metaManager);
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

    mod.extendCellMeta(cellMeta);

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

    mod.extendCellMeta(cellMeta);
    mod.extendCellMeta(cellMeta);
    mod.extendCellMeta(cellMeta);

    expect(hotMock.runHooks).toHaveBeenCalledTimes(0);
    expect(cellMeta.cells).toHaveBeenCalledTimes(0);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(0);
    expect(mod.metaSyncMemo.size).toBe(1);

    Hooks.getSingleton().run(hotMock, 'beforeRender', false); // Emulation of the fast render table cycle hook

    expect(mod.metaSyncMemo.size).toBe(1);

    mod.extendCellMeta(cellMeta);
    mod.extendCellMeta(cellMeta);
    mod.extendCellMeta(cellMeta);

    expect(hotMock.runHooks).toHaveBeenCalledTimes(0);
    expect(cellMeta.cells).toHaveBeenCalledTimes(0);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(0);
    expect(mod.metaSyncMemo.size).toBe(1);

    Hooks.getSingleton().run(hotMock, 'beforeRender', true); // Emulation of the slow render table cycle hook

    expect(mod.metaSyncMemo.size).toBe(0); // The cache is cleared

    mod.extendCellMeta(cellMeta);
    mod.extendCellMeta(cellMeta);
    mod.extendCellMeta(cellMeta);

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellMeta.cells).toHaveBeenCalledTimes(1);
    expect(metaManager.updateCellMeta).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(1);
  });

  it('should re-extend the cell meta object when the physical index is changed', () => {
    const hotMock = new Handsontable();
    const metaManager = new MetaManager(hotMock);
    const mod = new DynamicCellMetaMod(metaManager);
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

    mod.extendCellMeta(cellMeta);

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

    mod.extendCellMeta(cellMeta1);
    mod.extendCellMeta(cellMeta1);
    mod.extendCellMeta(cellMeta1);

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
    const mod = new DynamicCellMetaMod(metaManager);
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

    mod.extendCellMeta(cellMeta);

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

    mod.extendCellMeta(cellMeta1);
    mod.extendCellMeta(cellMeta1);
    mod.extendCellMeta(cellMeta1);

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
    const mod = new DynamicCellMetaMod(metaManager);
    const cellsSpy = jest.fn();

    jest.spyOn(hotMock, 'runHooks');

    mod.extendCellMeta({ row: 0, col: 0, visualRow: 0, visualCol: 0, cells: cellsSpy });
    mod.extendCellMeta({ row: 1, col: 0, visualRow: 1, visualCol: 0, cells: cellsSpy });
    mod.extendCellMeta({ row: 0, col: 1, visualRow: 0, visualCol: 1, cells: cellsSpy });
    mod.extendCellMeta({ row: 1, col: 1, visualRow: 1, visualCol: 1, cells: cellsSpy });

    expect(hotMock.runHooks).toHaveBeenCalledTimes(8);
    expect(cellsSpy).toHaveBeenCalledTimes(4);
    expect(mod.metaSyncMemo.size).toBe(2);

    mod.extendCellMeta({ row: 0, col: 0, visualRow: 0, visualCol: 0, cells: cellsSpy });
    mod.extendCellMeta({ row: 1, col: 0, visualRow: 1, visualCol: 0, cells: cellsSpy });
    mod.extendCellMeta({ row: 0, col: 1, visualRow: 0, visualCol: 1, cells: cellsSpy });
    mod.extendCellMeta({ row: 1, col: 1, visualRow: 1, visualCol: 1, cells: cellsSpy });

    expect(hotMock.runHooks).toHaveBeenCalledTimes(8);
    expect(cellsSpy).toHaveBeenCalledTimes(4);
    expect(mod.metaSyncMemo.size).toBe(2);

    hotMock.runHooks.mockClear();
    cellsSpy.mockClear();

    mod.extendCellMeta({ row: 2, col: 2, visualRow: 2, visualCol: 2, cells: cellsSpy });

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellsSpy).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(3);

    mod.extendCellMeta({ row: 2, col: 2, visualRow: 2, visualCol: 2, cells: cellsSpy });

    expect(hotMock.runHooks).toHaveBeenCalledTimes(2);
    expect(cellsSpy).toHaveBeenCalledTimes(1);
    expect(mod.metaSyncMemo.size).toBe(3);
  });
});
