describe('settings', () => {
  describe('should display data properly when minSpareRow or / and minRows or / and startRows options are set', () => {
    const id = 'testContainer';

    const dataWithoutEmptyCells = [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
    ];

    const dataWithEmptyRow = [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      [null, null, null],
    ];

    const dataWithOnlyEmptyCells = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('data.length < minRows; no empty cells in dataset, minSpareRows set', async() => {
      const hot = handsontable({
        data: dataWithoutEmptyCells,
        minRows: 5,
        minSpareRows: 4
      });

      expect(hot.getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      hot.setDataAtCell(4, 0, 'test');

      await sleep(100);

      expect(hot.getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        [null, null, null],
        ['test', null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('data.length < minRows; empty cells in dataset, minSpareRows set', async() => {
      const hot = handsontable({
        data: dataWithEmptyRow,
        minRows: 5,
        minSpareRows: 4
      });

      expect(hot.getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      hot.setDataAtCell(5, 0, 'test');

      await sleep(100);

      expect(hot.getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        ['test', null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('dataset full of empty cells, minSpareRows set', async() => {
      const hot = handsontable({
        data: dataWithOnlyEmptyCells,
        minSpareRows: 4
      });

      expect(hot.getData()).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      hot.setDataAtCell(1, 0, 'test');

      await sleep(100);

      expect(hot.getData()).toEqual([
        [null, null, null],
        ['test', null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    describe('data.length === 0; startRows set, minSpareRows set', () => {
      it('startRows === minRows, startRows > minSpareRows', async() => {
        const hot = handsontable({
          startRows: 5,
          minRows: 5,
          minSpareRows: 4
        });

        expect(hot.getData()).toEqual([
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ]);

        hot.setDataAtCell(1, 0, 'test');

        await sleep(100);

        expect(hot.getData()).toEqual([
          [null, null, null, null, null],
          ['test', null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ]);
      });

      it('startRows > minRows > minSpareRows', async() => {
        const hot = handsontable({
          startRows: 6,
          minRows: 5,
          minSpareRows: 4
        });

        expect(hot.getData()).toEqual([
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ]);

        hot.setDataAtCell(1, 0, 'test');

        await sleep(100);

        expect(hot.getData()).toEqual([
          [null, null, null, null, null],
          ['test', null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ]);

        hot.setDataAtCell(2, 0, 'test');

        await sleep(100);

        expect(hot.getData()).toEqual([
          [null, null, null, null, null],
          ['test', null, null, null, null],
          ['test', null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ]);
      });
    });
  });

  describe('should display data properly when minSpareCols or / and minCols or / and startCols options are set', () => {
    const id = 'testContainer';

    const dataWithoutEmptyCells = [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
    ];

    const dataWithEmptyColumn = [
      ['A1', 'B1', null],
      ['A2', 'B2', null],
      ['A3', 'B3', null],
    ];

    const dataWithOnlyEmptyCells = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('data.length < minCols; no empty cells in dataset, minSpareCols set', async() => {
      const hot = handsontable({
        data: dataWithoutEmptyCells,
        minCols: 5,
        minSpareCols: 4
      });

      expect(hot.getData()).toEqual([
        ['A1', 'B1', 'C1', null, null, null, null],
        ['A2', 'B2', 'C2', null, null, null, null],
        ['A3', 'B3', 'C3', null, null, null, null],
      ]);

      hot.setDataAtCell(0, 4, 'test');

      await sleep(100);

      expect(hot.getData()).toEqual([
        ['A1', 'B1', 'C1', null, 'test', null, null, null, null],
        ['A2', 'B2', 'C2', null, null, null, null, null, null],
        ['A3', 'B3', 'C3', null, null, null, null, null, null],
      ]);
    });

    it('data.length < minCols; empty cells in dataset, minSpareCols set', async() => {
      const hot = handsontable({
        data: dataWithEmptyColumn,
        minCols: 5,
        minSpareCols: 4
      });

      expect(hot.getData()).toEqual([
        ['A1', 'B1', null, null, null, null],
        ['A2', 'B2', null, null, null, null],
        ['A3', 'B3', null, null, null, null],
      ]);

      hot.setDataAtCell(0, 5, 'test');

      await sleep(100);

      expect(hot.getData()).toEqual([
        ['A1', 'B1', null, null, null, 'test', null, null, null, null],
        ['A2', 'B2', null, null, null, null, null, null, null, null],
        ['A3', 'B3', null, null, null, null, null, null, null, null],
      ]);
    });

    it('dataset full of empty cells, minSpareCols set', async() => {
      const hot = handsontable({
        data: dataWithOnlyEmptyCells,
        minSpareCols: 4
      });

      expect(hot.getData()).toEqual([
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]);

      hot.setDataAtCell(0, 1, 'test');

      await sleep(100);

      expect(hot.getData()).toEqual([
        [null, 'test', null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ]);
    });

    describe('data.length === 0; startCols set, minSpareCols set', () => {
      it('startCols === minCols, startCols > minSpareCols', async() => {
        const hot = handsontable({
          startCols: 5,
          minCols: 5,
          minSpareCols: 4
        });

        expect(hot.getData()).toEqual([
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ]);

        hot.setDataAtCell(0, 1, 'test');

        await sleep(100);

        expect(hot.getData()).toEqual([
          [null, 'test', null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
        ]);
      });

      it('startRows > minRows > minSpareRows', async() => {
        const hot = handsontable({
          startCols: 6,
          minCols: 5,
          minSpareCols: 4
        });

        expect(hot.getData()).toEqual([
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
        ]);

        hot.setDataAtCell(0, 1, 'test');

        await sleep(100);

        expect(hot.getData()).toEqual([
          [null, 'test', null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
          [null, null, null, null, null, null],
        ]);

        hot.setDataAtCell(0, 2, 'test');

        await sleep(100);

        expect(hot.getData()).toEqual([
          [null, 'test', 'test', null, null, null, null],
          [null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null],
        ]);
      });
    });
  });
});
