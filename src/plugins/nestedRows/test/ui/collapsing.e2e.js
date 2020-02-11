describe('NestedRows Collapsing UI', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('API', () => {
    describe('collapseChildren', () => {
      it('should collapse all children nodes of the row provided as a number', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(hot.rowIndexMapper.isSkipped(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(0);

        expect(hot.rowIndexMapper.isSkipped(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(hot.rowIndexMapper.isSkipped(i + 1)).toEqual(true);
        }

        expect(hot.rowIndexMapper.isSkipped(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });

      it('should keep collapsed rows after collapsing next ones', () => {
        const hot = handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);

        expect(hot.rowIndexMapper.isSkipped(0)).toEqual(false);
        expect(hot.rowIndexMapper.isSkipped(1)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(2)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(3)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(4)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(5)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(6)).toEqual(false);

        plugin.collapsingUI.collapseChildren(6);

        expect(hot.rowIndexMapper.isSkipped(0)).toEqual(false);
        expect(hot.rowIndexMapper.isSkipped(1)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(2)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(3)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(4)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(5)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(6)).toEqual(false);

        expect(hot.rowIndexMapper.isSkipped(6)).toEqual(false);
        expect(hot.rowIndexMapper.isSkipped(7)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(8)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(9)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(10)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(11)).toEqual(true);
        expect(hot.rowIndexMapper.isSkipped(12)).toEqual(false);
      });

      it('should collapse all children nodes of the row provided as an object', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');
        const child = getSourceData()[0];

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(hot.rowIndexMapper.isSkipped(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(child);

        expect(hot.rowIndexMapper.isSkipped(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(hot.rowIndexMapper.isSkipped(i + 1)).toEqual(true);
        }

        expect(hot.rowIndexMapper.isSkipped(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });
    });

    describe('expandChildren', () => {
      it('should collapse all children nodes of the row provided as a number', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(hot.rowIndexMapper.isSkipped(i + 1)).toEqual(false);
        }
      });

      it('should collapse all children nodes of the row provided as an object', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true,
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(hot.rowIndexMapper.isSkipped(i + 1)).toEqual(false);
        }
      });
    });

    describe('expandRows', () => {
      it('Should make the rows provided in the arguments visible', (done) => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([1, 2, 3, 4, 5], true, true);
        render();

        expect(countRows()).toEqual(8);

        plugin.collapsingUI.expandRows([3], true, true);
        render();

        setTimeout(() => {
          expect(countRows()).toEqual(11);
          done();
        }, 100);
      });
    });

    describe('expandChildren', () => {
      it('Should make the child rows of the provided element visible', (done) => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([4, 5], false, true);
        render();

        expect(countRows()).toEqual(11);

        plugin.collapsingUI.expandChildren(3);
        render();

        setTimeout(() => {
          expect(countRows()).toEqual(13);
          done();
        }, 100);
      });

      it('Should make the child rows of the provided element visible, even if some of them are already visible', (done) => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([4, 5], false, true);
        render();

        expect(countRows()).toEqual(11);

        plugin.collapsingUI.expandChildren(0);
        render();

        setTimeout(() => {
          expect(countRows()).toEqual(13);
          done();
        }, 100);
      });
    });

  });
});
