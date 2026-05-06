import DataSource from 'handsontable/dataMap/dataSource';

describe('DataSource', () => {
  function createHotMock({ modifyRowData = null, hooksWithHandlers = [], dataDotNotation = false } = {}) {
    return {
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
      getSettings() {
        return { dataDotNotation };
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

  describe('getData()', () => {
    it('returns a fresh outer array on every call (array data)', () => {
      const dataSource = new DataSource(createHotMock(), [['a', 'b'], ['c', 'd']]);

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).not.toBe(first);
      expect(second).toEqual(first);
    });

    it('returns a fresh outer array on every call (object data)', () => {
      const dataSource = new DataSource(createHotMock(), [{ x: 1 }, { x: 2 }]);

      const first = dataSource.getData();
      const second = dataSource.getData();

      expect(second).not.toBe(first);
      expect(second).toEqual(first);
    });

    it('returns row clones so mutations to the returned array do not leak across calls (array data)', () => {
      const dataSource = new DataSource(createHotMock(), [['a', 'b'], ['c', 'd']]);

      const first = dataSource.getData();

      first[0][0] = 'X';

      const second = dataSource.getData();

      expect(second[0][0]).toBe('a');
    });

    it('returns row clones so mutations to the returned array do not leak across calls (object data)', () => {
      const dataSource = new DataSource(createHotMock(), [{ x: 1 }, { x: 2 }]);

      const first = dataSource.getData();

      first[0].x = 99;

      const second = dataSource.getData();

      expect(second[0].x).toBe(1);
    });

    it('does not mutate the underlying source data array reference', () => {
      const data = [['a', 'b']];
      const dataSource = new DataSource(createHotMock(), data);

      const result = dataSource.getData();

      expect(result).not.toBe(data);
      expect(result[0]).not.toBe(data[0]);
    });

    it('handles mixed row shapes per row instead of inferring from this.data[0]', () => {
      const dataSource = new DataSource(createHotMock(), [['a', 'b'], { x: 1 }]);

      const result = dataSource.getData();

      expect(Array.isArray(result[0])).toBe(true);
      expect(result[0]).toEqual(['a', 'b']);
      expect(result[0]).not.toBe(dataSource.data[0]);
      expect(result[1]).toEqual({ x: 1 });
      expect(result[1]).not.toBe(dataSource.data[1]);
    });

    it('falls back to getByRange when modifySourceData hook has handlers', () => {
      const dataSource = new DataSource(createHotMock({ hooksWithHandlers: ['modifySourceData'] }), [['a', 'b']]);
      const spy = jest.spyOn(dataSource, 'getByRange');

      dataSource.getData();

      expect(spy).toHaveBeenCalledWith(null, null, false);
    });

    it('falls back to getByRange when modifyRowData hook has handlers', () => {
      const data = [['a', 'b']];
      const dataSource = new DataSource(createHotMock({ modifyRowData: row => data[row] }), data);
      const spy = jest.spyOn(dataSource, 'getByRange');

      dataSource.getData();

      expect(spy).toHaveBeenCalledWith(null, null, false);
    });

    it('falls back to getByRange when toArray is requested', () => {
      const dataSource = new DataSource(createHotMock(), [{ a: 1, b: 2 }]);
      const spy = jest.spyOn(dataSource, 'getByRange');

      dataSource.getData(true);

      expect(spy).toHaveBeenCalledWith(null, null, true);
    });

    it('uses the fast clone path even when dataDotNotation is enabled (rows are already normalized)', () => {
      const dataSource = new DataSource(createHotMock({ dataDotNotation: true }), [{ a: 1, nested: { b: 2 } }]);
      const spy = jest.spyOn(dataSource, 'getByRange');

      const result = dataSource.getData();

      expect(spy).not.toHaveBeenCalled();
      expect(result[0]).toEqual({ a: 1, nested: { b: 2 } });
      expect(result[0]).not.toBe(dataSource.data[0]);
    });

    it('returns the underlying empty array reference for empty data', () => {
      const data = [];
      const dataSource = new DataSource(createHotMock(), data);

      expect(dataSource.getData()).toBe(data);
    });

    it('returns the underlying value when data is null', () => {
      const dataSource = new DataSource(createHotMock(), null);

      expect(dataSource.getData()).toBe(null);
    });
  });
});
