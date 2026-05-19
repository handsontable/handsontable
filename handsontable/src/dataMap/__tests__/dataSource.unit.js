import DataSource from 'handsontable/dataMap/dataSource';

describe('DataSource', () => {
  function createHotMock(modifyRowData = null) {
    return {
      hasHook(hookName) {
        return hookName === 'modifyRowData' && modifyRowData !== null;
      },
      runHooks(hookName, rowIndex) {
        if (hookName === 'modifyRowData') {
          return modifyRowData(rowIndex);
        }
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
      const dataSource = new DataSource(createHotMock((rowIndex) => {
        if (rowIndex === 1) {
          return data[0].__children[0];
        }

        return data[rowIndex];
      }), data);

      dataSource.setAtCell(1, 'artist', 'Updated child');

      expect(data[0].__children[0].artist).toBe('Updated child');
      expect(data[1].artist).toBe('Second parent');
    });
  });
});
