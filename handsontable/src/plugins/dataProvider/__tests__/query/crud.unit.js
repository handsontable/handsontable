import {
  DATA_PROVIDER_ERROR_UPDATE_MISSING_ROW_ID,
} from '../../constants';
import {
  commitRowsUpdate as commitRowsUpdateImpl,
  enqueueMutation,
  filterChangesForBatchedServerUpdate,
  getRowIdFromRowData,
  handleBeforeAlterForCrud,
  isMissingRowId,
  queueCrud,
  rowIdsFromAlterRemove,
  runManualUpdateRowsMutation,
  runUpdateFromChanges,
  shouldIgnoreAfterChangeForServerUpdate,
} from '../../query/crud';

describe('dataProvider crud', () => {
  describe('getRowIdFromRowData', () => {
    it('should read property path when rowId is a string', () => {
      expect(getRowIdFromRowData({ a: { b: 7 } }, 'a.b')).toBe(7);
    });

    it('should call rowId function with row data', () => {
      expect(getRowIdFromRowData({ x: 1 }, r => r.x)).toBe(1);
    });

    it('should return undefined when rowId option is null or undefined', () => {
      expect(getRowIdFromRowData({ id: 1 }, null)).toBeUndefined();
      expect(getRowIdFromRowData({ id: 1 }, undefined)).toBeUndefined();
    });
  });

  describe('shouldIgnoreAfterChangeForServerUpdate', () => {
    it('should ignore when onRowsUpdate is missing or changes are empty', () => {
      expect(shouldIgnoreAfterChangeForServerUpdate(false, [[0, 'a', 1, 2]], 'edit')).toBe(true);
      expect(shouldIgnoreAfterChangeForServerUpdate(true, [], 'edit')).toBe(true);
      expect(shouldIgnoreAfterChangeForServerUpdate(true, null, 'edit')).toBe(true);
    });

    it('should ignore revert and sources outside batch set', () => {
      expect(shouldIgnoreAfterChangeForServerUpdate(true, [[0, 'a', 1, 2]], 'DataProvider.revert')).toBe(true);
      expect(shouldIgnoreAfterChangeForServerUpdate(true, [[0, 'a', 1, 2]], 'LoadData')).toBe(true);
    });

    it('should not ignore batched edit sources', () => {
      expect(shouldIgnoreAfterChangeForServerUpdate(true, [[0, 'a', 1, 2]], 'edit')).toBe(false);
      expect(shouldIgnoreAfterChangeForServerUpdate(true, [[0, 'a', 1, 2]], undefined)).toBe(false);
      expect(shouldIgnoreAfterChangeForServerUpdate(true, [[0, 'a', 1, 2]], 'ContextMenu.clearColumn')).toBe(false);
    });
  });

  describe('filterChangesForBatchedServerUpdate', () => {
    const hot = {
      propToCol: prop => (prop === 'bad' ? -1 : 0),
      getCellMeta: (row, col) => ({ valid: row === 0 && col === 0 }),
    };

    it('should drop no-op edits and invalid cells', () => {
      const changes = [
        [0, 'ok', 1, 2],
        [0, 'ok', 2, 2],
        [1, 'ok', 1, 3],
        [0, 'bad', 1, 9],
      ];

      expect(filterChangesForBatchedServerUpdate(hot, changes)).toEqual([[0, 'ok', 1, 2]]);
    });
  });

  describe('commitRowsUpdate', () => {
    it('should call onRequestFailed with update when onRowsUpdate rejects', async() => {
      const err = new Error('server update failed');
      const onRequestFailed = jest.fn();
      const hot = {
        render: jest.fn(),
        runHooks: jest.fn(),
      };

      await commitRowsUpdateImpl(hot, {
        getOnRowsUpdate: () => async() => {
          throw err;
        },
        fetchData: jest.fn(),
        logError: jest.fn(),
        onRequestFailed,
      }, [{ id: 1, changes: {}, rowData: {} }]);

      expect(onRequestFailed).toHaveBeenCalledWith('update', err);
      expect(hot.runHooks).toHaveBeenCalledWith('afterRowsMutationError', 'update', err, expect.any(Object));
    });

    it('should not call onRequestFailed when fetchData rejects after onRowsUpdate (fetchData owns fetch error UI)', async() => {
      const err = new Error('refetch failed');
      const onRequestFailed = jest.fn();
      const hot = {
        render: jest.fn(),
        runHooks: jest.fn(),
      };

      await commitRowsUpdateImpl(hot, {
        getOnRowsUpdate: () => async() => {},
        fetchData: async() => {
          throw err;
        },
        logError: jest.fn(),
        onRequestFailed,
      }, [{ id: 1, changes: {}, rowData: {} }]);

      expect(onRequestFailed).not.toHaveBeenCalled();
      expect(hot.runHooks).toHaveBeenCalledWith('afterRowsMutation', 'update', expect.any(Object));
      expect(hot.runHooks).toHaveBeenCalledWith('afterRowsMutationError', 'update', err, expect.any(Object));
    });
  });

  describe('queueCrud', () => {
    it('should call onRequestFailed with create when onRowsCreate rejects', async() => {
      const err = new Error('create failed');
      const onRequestFailed = jest.fn();
      const state = { tail: Promise.resolve() };

      await queueCrud(
        {
          enqueueMutation: fn => enqueueMutation(state, fn),
          runBeforeRowsMutation: () => undefined,
          runAfterRowsMutation: jest.fn(),
          runAfterRowsMutationError: jest.fn(),
          logError: jest.fn(),
          onRequestFailed,
        },
        'create',
        {},
        async() => {
          throw err;
        },
        async() => {}
      );

      expect(onRequestFailed).toHaveBeenCalledWith('create', err);
    });

    it('should not call onRequestFailed when refetch rejects after create (fetchData owns fetch error UI)', async() => {
      const err = new Error('reload failed');
      const onRequestFailed = jest.fn();
      const state = { tail: Promise.resolve() };

      await queueCrud(
        {
          enqueueMutation: fn => enqueueMutation(state, fn),
          runBeforeRowsMutation: () => undefined,
          runAfterRowsMutation: jest.fn(),
          runAfterRowsMutationError: jest.fn(),
          logError: jest.fn(),
          onRequestFailed,
        },
        'create',
        {},
        async() => {},
        async() => {
          throw err;
        }
      );

      expect(onRequestFailed).not.toHaveBeenCalled();
    });
  });

  describe('enqueueMutation', () => {
    it('should run mutations sequentially', async() => {
      const state = { tail: Promise.resolve() };
      const order = [];

      await enqueueMutation(state, async() => {
        order.push(1);
      });
      await enqueueMutation(state, async() => {
        order.push(2);
      });

      expect(order).toEqual([1, 2]);
    });
  });

  describe('isMissingRowId', () => {
    it('should be true only for null and undefined', () => {
      expect(isMissingRowId(undefined)).toBe(true);
      expect(isMissingRowId(null)).toBe(true);
      expect(isMissingRowId(0)).toBe(false);
      expect(isMissingRowId('')).toBe(false);
    });
  });

  describe('handleBeforeAlterForCrud', () => {
    it('should pass alter amount as rowsAmount to createRows for insert_row_above', () => {
      const createRows = jest.fn();
      const onRowsCreate = jest.fn();
      const ctx = {
        hot: {
          countSourceRows: () => 1,
          getSettings: () => ({}),
        },
        getOnRowsCreate: () => onRowsCreate,
        getOnRowsRemove: () => undefined,
        getRowIdOption: () => 'id',
        getRowId: () => 42,
        createRows,
        removeRows: jest.fn(),
      };

      const result = handleBeforeAlterForCrud(ctx, 'insert_row_above', 0, 3);

      expect(result).toBe(false);
      expect(createRows).toHaveBeenCalledWith({
        position: 'above',
        referenceRowId: 42,
        rowsAmount: 3,
      });
    });

    it('should pass alter amount as rowsAmount to createRows for insert_row_below', () => {
      const createRows = jest.fn();
      const onRowsCreate = jest.fn();
      const ctx = {
        hot: {
          countSourceRows: () => 1,
          getSettings: () => ({}),
        },
        getOnRowsCreate: () => onRowsCreate,
        getOnRowsRemove: () => undefined,
        getRowIdOption: () => 'id',
        getRowId: () => 7,
        createRows,
        removeRows: jest.fn(),
      };

      const result = handleBeforeAlterForCrud(ctx, 'insert_row_below', 0, 2);

      expect(result).toBe(false);
      expect(createRows).toHaveBeenCalledWith({
        position: 'below',
        referenceRowId: 7,
        rowsAmount: 2,
      });
    });
  });

  describe('rowIdsFromAlterRemove', () => {
    it('should throw when rowId is missing on a row', () => {
      const hot = {
        countRows: () => 1,
        toPhysicalRow: vr => vr,
        getSourceDataAtRow: () => ({ name: 'only' }),
      };

      expect(() => rowIdsFromAlterRemove(hot, 'id', 0, 1)).toThrow();
    });
  });

  describe('runUpdateFromChanges', () => {
    it('should not commit when row id is missing', async() => {
      const changes = [[0, 'name', 'A', 'B']];
      const commitRowsUpdate = jest.fn();
      const hot = {
        toPhysicalRow: vr => vr,
        getSourceDataAtRow: () => ({ name: 'A' }),
        propToCol: () => 0,
        colToProp: () => 'name',
        countRows: () => 1,
        batch: fn => fn(),
        setDataAtRowProp: jest.fn(),
        render: jest.fn(),
        runHooks: jest.fn(),
      };

      await runUpdateFromChanges(hot, {
        getRowIdOption: () => 'id',
        commitRowsUpdate,
      }, changes);

      expect(commitRowsUpdate).not.toHaveBeenCalled();
      expect(hot.runHooks).toHaveBeenCalledWith(
        'afterRowsMutationError',
        'update',
        expect.objectContaining({ message: DATA_PROVIDER_ERROR_UPDATE_MISSING_ROW_ID }),
        expect.any(Object)
      );
    });
  });

  describe('runManualUpdateRowsMutation', () => {
    it('should not commit when beforeRowsMutation returns false', async() => {
      const commitRowsUpdate = jest.fn();
      const hot = {
        runHooks: jest.fn(name => (name === 'beforeRowsMutation' ? false : undefined)),
      };

      await runManualUpdateRowsMutation(hot, {
        getRowIdOption: () => 'id',
        commitRowsUpdate,
      }, [{ id: 1, changes: {}, rowData: {} }]);

      expect(commitRowsUpdate).not.toHaveBeenCalled();
      expect(hot.runHooks).toHaveBeenCalledWith(
        'beforeRowsMutation',
        'update',
        expect.objectContaining({
          rows: [{ id: 1, changes: {}, rowData: {} }],
        })
      );
    });

    it('should not commit when validation fails for a present row', async() => {
      const commitRowsUpdate = jest.fn();
      const hot = {
        runHooks: jest.fn(),
        countRows: () => 1,
        toPhysicalRow: vr => vr,
        getSourceDataAtRow: () => ({ id: 1, name: 'a' }),
        propToCol: () => 0,
        colToProp: () => 'name',
        getCellMeta: () => ({ allowInvalid: false }),
        getCellValidator: () => () => {},
        validateCell: (value, cellMeta, cb) => {
          cb(false);
        },
      };

      await runManualUpdateRowsMutation(hot, {
        getRowIdOption: () => 'id',
        commitRowsUpdate,
      }, [{ id: 1, changes: { name: 'b' }, rowData: { id: 1, name: 'b' } }]);

      expect(commitRowsUpdate).not.toHaveBeenCalled();
      expect(hot.runHooks).toHaveBeenCalledWith(
        'afterRowsMutationError',
        'update',
        expect.objectContaining({ message: 'Row update validation failed' }),
        expect.any(Object)
      );
    });

    it('should commit when there is nothing to validate', async() => {
      const commitRowsUpdate = jest.fn().mockResolvedValue(undefined);
      const hot = { runHooks: jest.fn(), countRows: () => 0 };

      await runManualUpdateRowsMutation(hot, {
        getRowIdOption: () => 'id',
        commitRowsUpdate,
      }, [{ id: 1, changes: {}, rowData: {} }]);

      expect(commitRowsUpdate).toHaveBeenCalledWith([{ id: 1, changes: {}, rowData: {} }]);
    });
  });
});
