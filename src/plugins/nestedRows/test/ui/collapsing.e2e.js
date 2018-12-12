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
          data: getDataForNestedRows(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');
        const trimRowsPlugin = hot.getPlugin('trimRows');

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(trimRowsPlugin.isTrimmed(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(0);

        expect(trimRowsPlugin.isTrimmed(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(trimRowsPlugin.isTrimmed(i + 1)).toEqual(true);
        }

        expect(trimRowsPlugin.isTrimmed(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });

      it('should collapse all children nodes of the row provided as an object', () => {
        const hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');
        const trimRowsPlugin = hot.getPlugin('trimRows');
        const child = hot.getSourceData()[0];

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(trimRowsPlugin.isTrimmed(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(child);

        expect(trimRowsPlugin.isTrimmed(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(trimRowsPlugin.isTrimmed(i + 1)).toEqual(true);
        }

        expect(trimRowsPlugin.isTrimmed(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });
    });

    describe('expandChildren', () => {
      it('should collapse all children nodes of the row provided as a number', () => {
        const hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');
        const trimRowsPlugin = hot.getPlugin('trimRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(trimRowsPlugin.isTrimmed(i + 1)).toEqual(false);
        }
      });

      it('should collapse all children nodes of the row provided as an object', () => {
        const hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true,
        });

        const plugin = hot.getPlugin('nestedRows');
        const trimRowsPlugin = hot.getPlugin('trimRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(trimRowsPlugin.isTrimmed(i + 1)).toEqual(false);
        }
      });
    });

    describe('expandRows', () => {
      it('Should make the rows provided in the arguments visible', (done) => {
        const hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true,
          rowHeaders: true,
          trimRows: [1, 2, 3, 4], // "collapse" rows using the trimRows plugin
        });

        expect(hot.countRows()).toEqual(8);

        const plugin = hot.getPlugin('nestedRows');
        plugin.collapsingUI.expandRows([2], true, true);
        hot.render();

        setTimeout(() => {
          expect(hot.countRows()).toEqual(11);
          done();
        }, 100);
      });
    });

    describe('expandChildren', () => {
      it('Should make the child rows of the provided element visible', (done) => {
        const hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true,
          trimRows: [3, 4], // "collapse" rows using the trimRows plugin
        });

        expect(hot.countRows()).toEqual(10);

        const plugin = hot.getPlugin('nestedRows');
        plugin.collapsingUI.expandChildren(2);
        hot.render();

        setTimeout(() => {
          expect(hot.countRows()).toEqual(12);
          done();
        }, 100);
      });

      it('Should make the child rows of the provided element visible, even if some of them are already visible', (done) => {
        const hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true,
          trimRows: [3, 4], // "collapse" rows using the trimRows plugin
        });

        expect(hot.countRows()).toEqual(10);

        const plugin = hot.getPlugin('nestedRows');
        plugin.collapsingUI.expandChildren(0);
        hot.render();

        setTimeout(() => {
          expect(hot.countRows()).toEqual(12);
          done();
        }, 100);
      });
    });

  });
});
