import DataSource from 'handsontable/dataMap/dataSource';

describe('DataSource', () => {
  function createHotMock({ modifyRowData = null, hooksWithHandlers = [] } = {}) {
    const registeredHooks = new Map();

    return {
      _registeredHooks: registeredHooks,
      hasHook(hookName) {
        if (hookName === 'modifyRowData' && modifyRowData !== null) {
          return true;
        }

        return hooksWithHandlers.includes(hookName);
      },
      runHooks(hookName, rowIndex) {
        if (hookName === 'modifyRowData') {
          return modifyRowData(rowIndex);
        }
      },
      addHook(hookName, callback) {
        if (!registeredHooks.has(hookName)) {
          registeredHooks.set(hookName, new Set());
        }
        registeredHooks.get(hookName).add(callback);
      },
      removeHook(hookName, callback) {
        if (registeredHooks.has(hookName)) {
          registeredHooks.get(hookName).delete(callback);
        }
      },
      _triggerHook(hookName) {
        const callbacks = registeredHooks.get(hookName);

        if (callbacks) {
          callbacks.forEach(cb => cb());
        }
      },
      getSettings() {
        return { dataDotNotation: false };
      },
    };
  }

  describe('setAtCell', () => {
    it('should set value for a row based on the `modifyRowData` hook result', () => {
      const data = [
        {
          artist: 'Parent',
          __children: [
            { artist: 'Child' },
          ],
        },
        { artist: 'Second parent' },
      ];
      const dataSource = new DataSource(createHotMock({
        modifyRowData: (rowIndex) => {
          if (rowIndex === 1) {
            return data[0].__children[0];
          }

          return data[rowIndex];
        },
      }), data);

      dataSource.setAtCell(1, 'artist', 'Updated child');

      expect(data[0].__children[0].artist).toBe('Updated child');
      expect(data[1].artist).toBe('Second parent');
    });
  });

  describe('getData() memoization', () => {
    function makeArrayData() {
      return [['a', 'b'], ['c', 'd'], ['e', 'f']];
    }

    function makeObjectData() {
      return [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    }

    it('returns the same array reference on consecutive calls when no mutation occurs', () => {
      const dataSource = new DataSource(createHotMock(), makeArrayData());

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).toBe(first);
    });

    it('returns the same array reference on consecutive calls for object data', () => {
      const dataSource = new DataSource(createHotMock(), makeObjectData());

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).toBe(first);
    });

    it('caches getData(true) and getData(false) independently', () => {
      const dataSource = new DataSource(createHotMock(), makeArrayData());

      const asObjects = dataSource.getData(false);
      const asArrays = dataSource.getData(true);

      expect(dataSource.getData(false)).toBe(asObjects);
      expect(dataSource.getData(true)).toBe(asArrays);
      expect(asObjects).not.toBe(asArrays);
    });

    it('returns a new reference after setAtCell()', () => {
      const dataSource = new DataSource(createHotMock(), makeArrayData());

      const first = dataSource.getData();

      dataSource.setAtCell(0, 0, 'changed');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
      expect(second[0][0]).toBe('changed');
    });

    it('returns a new reference after setData()', () => {
      const dataSource = new DataSource(createHotMock(), makeArrayData());

      const first = dataSource.getData();

      dataSource.setData([['x', 'y']]);

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('bypasses cache when modifySourceData hook has handlers', () => {
      const hot = createHotMock({ hooksWithHandlers: ['modifySourceData'] });
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('bypasses cache when modifyRowData hook has handlers', () => {
      const data = makeArrayData();
      const hot = createHotMock({ modifyRowData: row => data[row] });
      const dataSource = new DataSource(hot, data);

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterChange hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterChange');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterCreateRow hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterCreateRow');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterRemoveRow hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterRemoveRow');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterCreateCol hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterCreateCol');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterRemoveCol hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterRemoveCol');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterLoadData hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterLoadData');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterUpdateData hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterUpdateData');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('invalidates cache when afterSetSourceDataAtCell hook fires', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, makeArrayData());

      const first = dataSource.getData();

      hot._triggerHook('afterSetSourceDataAtCell');

      const second = dataSource.getData();

      expect(second).not.toBe(first);
    });

    it('returns same reference for empty data without crashing', () => {
      const dataSource = new DataSource(createHotMock(), []);

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).toBe(first);
    });
  });

  describe('destroy()', () => {
    it('removes all registered cache invalidation hooks once getData() has been called', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, [['a']]);

      // Trigger lazy hook registration.
      dataSource.getData();

      const hooksRegisteredBeforeDestroy = Array.from(hot._registeredHooks.entries())
        .filter(([, callbacks]) => callbacks.size > 0)
        .map(([name]) => name);

      expect(hooksRegisteredBeforeDestroy.length).toBeGreaterThan(0);

      dataSource.destroy();

      const hooksRegisteredAfterDestroy = Array.from(hot._registeredHooks.entries())
        .filter(([, callbacks]) => callbacks.size > 0)
        .map(([name]) => name);

      expect(hooksRegisteredAfterDestroy).toEqual([]);
    });

    it('does not throw when destroy is called before getData was ever invoked', () => {
      const hot = createHotMock();
      const dataSource = new DataSource(hot, [['a']]);

      expect(() => dataSource.destroy()).not.toThrow();
    });
  });
});
