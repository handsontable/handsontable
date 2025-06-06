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
      it('should collapse all children nodes of the row provided as a number', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(0);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(true);
        }

        expect(rowIndexMapper().isTrimmed(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });

      it('should keep collapsed rows after collapsing next ones', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);
        expect(rowIndexMapper().isTrimmed(1)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(2)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(3)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(4)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(5)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(6)).toEqual(false);

        plugin.collapsingUI.collapseChildren(6);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);
        expect(rowIndexMapper().isTrimmed(1)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(2)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(3)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(4)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(5)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(6)).toEqual(false);

        expect(rowIndexMapper().isTrimmed(6)).toEqual(false);
        expect(rowIndexMapper().isTrimmed(7)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(8)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(9)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(10)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(11)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(12)).toEqual(false);
      });

      it('should collapse all children nodes of the row provided as an object', async() => {
        const sourceDataReference = getMoreComplexNestedData();

        handsontable({
          data: sourceDataReference,
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');
        const child = sourceDataReference[0];

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(child);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(true);
        }

        expect(rowIndexMapper().isTrimmed(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });
    });

    describe('expandChildren', () => {
      it('should collapse all children nodes of the row provided as a number', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }
      });

      it('should collapse all children nodes of the row provided as an object', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true,
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }
      });
    });

    describe('expandRows', () => {
      it('Should make the rows provided in the arguments visible', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([1, 2, 3, 4, 5], true, true);
        await render();

        expect(countRows()).toEqual(8);

        plugin.collapsingUI.expandRows([3], true, true);
        await render();

        await sleep(100);

        expect(countRows()).toEqual(11);
      });
    });

    describe('expandChildren', () => {
      it('Should make the child rows of the provided element visible', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([4, 5], false, true);
        await render();

        expect(countRows()).toEqual(11);

        plugin.collapsingUI.expandChildren(3);
        await render();

        await sleep(100);

        expect(countRows()).toEqual(13);
      });

      it('Should make the child rows of the provided element visible, even if some of them are already visible', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([4, 5], false, true);
        await render();

        expect(countRows()).toEqual(11);

        plugin.collapsingUI.expandChildren(0);
        await render();

        await sleep(100);

        expect(countRows()).toEqual(13);
      });
    });

  });
});
