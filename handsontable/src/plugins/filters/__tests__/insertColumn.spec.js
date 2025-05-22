describe('Filter plugin with Core.alter method', () => {
  using('configuration object', [{ htmlDir: 'ltr' }, { htmlDir: 'rtl' }], ({ htmlDir }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('on `insert_col_start` action', () => {
      it('should not copy column filters from the source column to the new one', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          filters: true,
        });

        await getPlugin('filters').addCondition(1, 'by_value', [['B1']]);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([0, 1]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);

        await alter('insert_col_start', 1);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([0, 1, 2]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['B1']]);
      });

      it('should keep the column filters when the index sequence is reversed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          filters: true
        });

        columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

        // addCondition works by visual index
        await getPlugin('filters').addCondition(0, 'by_value', [['E1']]);
        await getPlugin('filters').addCondition(1, 'by_value', [['D1']]);
        await getPlugin('filters').addCondition(2, 'by_value', [['C1']]);
        await getPlugin('filters').addCondition(3, 'by_value', [['B1']]);
        await getPlugin('filters').addCondition(4, 'by_value', [['A1']]);

        // getConditions works by physical index
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);

        await alter('insert_col_start', 1);

        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', 'E1']);
        expect(getPlugin('filters').conditionCollection.getConditions(5)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['D1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
      });

      it('should keep the column filters when the index sequence is shifted', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          filters: true
        });

        columnIndexMapper().setIndexesSequence([4, 0, 1, 2, 3]);

        // addCondition works by visual index
        await getPlugin('filters').addCondition(0, 'by_value', [['E1']]);
        await getPlugin('filters').addCondition(1, 'by_value', [['A1']]);
        await getPlugin('filters').addCondition(2, 'by_value', [['B1']]);
        await getPlugin('filters').addCondition(3, 'by_value', [['C1']]);
        await getPlugin('filters').addCondition(4, 'by_value', [['D1']]);

        // getConditions works by physical index
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);

        await alter('insert_col_start', 2);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([5, 0, 1, 2, 3, 4]);
        expect(getPlugin('filters').conditionCollection.getConditions(5)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['D1']]);
      });
    });

    describe('on `insert_col_end` action', () => {
      it('should not copy column filters from the source column to the new one', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          filters: true,
        });

        await getPlugin('filters').addCondition(1, 'by_value', [['B1']]);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([0, 1]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);

        await alter('insert_col_end', 1);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([0, 1, 2]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)).toEqual([]);
      });

      it('should keep the column filters when the index sequence is reversed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          filters: true
        });

        columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

        // addCondition works by visual index
        await getPlugin('filters').addCondition(0, 'by_value', [['E1']]);
        await getPlugin('filters').addCondition(1, 'by_value', [['D1']]);
        await getPlugin('filters').addCondition(2, 'by_value', [['C1']]);
        await getPlugin('filters').addCondition(3, 'by_value', [['B1']]);
        await getPlugin('filters').addCondition(4, 'by_value', [['A1']]);

        // getConditions works by physical index
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);

        await alter('insert_col_end', 1);

        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', null, 'E1']);
        expect(getPlugin('filters').conditionCollection.getConditions(5)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(4)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
      });

      it('should keep the column filters when the index sequence is shifted', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          filters: true
        });

        columnIndexMapper().setIndexesSequence([4, 0, 1, 2, 3]);

        // addCondition works by visual index
        await getPlugin('filters').addCondition(0, 'by_value', [['E1']]);
        await getPlugin('filters').addCondition(1, 'by_value', [['A1']]);
        await getPlugin('filters').addCondition(2, 'by_value', [['B1']]);
        await getPlugin('filters').addCondition(3, 'by_value', [['C1']]);
        await getPlugin('filters').addCondition(4, 'by_value', [['D1']]);

        // getConditions works by physical index
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);

        await alter('insert_col_end', 1);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([5, 0, 1, 2, 3, 4]);
        expect(getPlugin('filters').conditionCollection.getConditions(5)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['D1']]);
      });
    });
  });
});
