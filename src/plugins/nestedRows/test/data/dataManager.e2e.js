describe('NestedRows Data Manager', () => {
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
    describe('getDataObject', () => {
      it('should return the data source object corresponding to the provided visual row number', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true,
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getDataObject(-5)).not.toBeDefined();
        expect(plugin.dataManager.getDataObject(0)).toEqual(data[0]);
        expect(plugin.dataManager.getDataObject(2)).toEqual(data[0].__children[1]);
        expect(plugin.dataManager.getDataObject(4)).toEqual(data[0].__children[2].__children[0]);
        expect(plugin.dataManager.getDataObject(6)).toEqual(data[0].__children[3]);
        expect(plugin.dataManager.getDataObject(11)).toEqual(data[2].__children[1].__children[0]);
        expect(plugin.dataManager.getDataObject(15)).not.toBeDefined();
      });
    });

    describe('getRowIndex', () => {
      it('should return a visual row index for the provided source data row object', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowIndex(data[0])).toEqual(0);
        expect(plugin.dataManager.getRowIndex(data[0].__children[2])).toEqual(3);
        expect(plugin.dataManager.getRowIndex(data[0].__children[2].__children[0])).toEqual(4);
        expect(plugin.dataManager.getRowIndex(data[0].__children[3])).toEqual(6);
        expect(plugin.dataManager.getRowIndex(data[2].__children[1].__children[0])).toEqual(11);
      });
    });

    describe('getRowIndexWithinParent', () => {
      it('should return an index of the provided source data row object withing its parent', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowIndexWithinParent(-5)).toEqual(-1);
        expect(plugin.dataManager.getRowIndexWithinParent(0)).toEqual(0);
        expect(plugin.dataManager.getRowIndexWithinParent(3)).toEqual(2);
        expect(plugin.dataManager.getRowIndexWithinParent(4)).toEqual(0);
        expect(plugin.dataManager.getRowIndexWithinParent(6)).toEqual(3);
        expect(plugin.dataManager.getRowIndexWithinParent(11)).toEqual(0);
        expect(plugin.dataManager.getRowIndexWithinParent(16)).toEqual(-1);

      });
    });

    describe('countAllRows', () => {
      it('should return a number of all row objects within the data set', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.countAllRows()).toEqual(13);

      });
    });

    describe('countChildren', () => {
      it('should return a number of children (and children\'s children) of the row provided as an index', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.countChildren(-5)).toEqual(0);
        expect(plugin.dataManager.countChildren(0)).toEqual(6);
        expect(plugin.dataManager.countChildren(3)).toEqual(2);
        expect(plugin.dataManager.countChildren(4)).toEqual(1);
        expect(plugin.dataManager.countChildren(6)).toEqual(0);
        expect(plugin.dataManager.countChildren(11)).toEqual(0);
        expect(plugin.dataManager.countChildren(16)).toEqual(0);

      });

      it('should return a number of children (and children\'s children) of the row provided as a row object from the data source', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.countChildren(data[0])).toEqual(6);
        expect(plugin.dataManager.countChildren(data[0].__children[2])).toEqual(2);
        expect(plugin.dataManager.countChildren(data[0].__children[2].__children[0])).toEqual(1);
        expect(plugin.dataManager.countChildren(data[0].__children[3])).toEqual(0);
        expect(plugin.dataManager.countChildren(data[2].__children[1].__children[0])).toEqual(0);

      });
    });

    describe('getRowParent', () => {
      it('should return a row object from the data source, being the parent node for the provided row index', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowParent(-5)).toEqual(null);
        expect(plugin.dataManager.getRowParent(0)).toEqual(null);
        expect(plugin.dataManager.getRowParent(3)).toEqual(data[0]);
        expect(plugin.dataManager.getRowParent(4)).toEqual(data[0].__children[2]);
        expect(plugin.dataManager.getRowParent(6)).toEqual(data[0]);
        expect(plugin.dataManager.getRowParent(11)).toEqual(data[2].__children[1]);
        expect(plugin.dataManager.getRowParent(16)).toEqual(null);

      });

      it('should return a row object from the data source, being the parent node for the provided row object', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowParent(data[0])).toEqual(null);
        expect(plugin.dataManager.getRowParent(data[0].__children[2])).toEqual(data[0]);
        expect(plugin.dataManager.getRowParent(data[0].__children[2].__children[0])).toEqual(data[0].__children[2]);
        expect(plugin.dataManager.getRowParent(data[0].__children[3])).toEqual(data[0]);
        expect(plugin.dataManager.getRowParent(data[2].__children[1].__children[0])).toEqual(data[2].__children[1]);

      });
    });

    describe('getRowLevel', () => {
      it('should return the nesting level of the row, provided as an index', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowLevel(-5)).toEqual(null);
        expect(plugin.dataManager.getRowLevel(0)).toEqual(0);
        expect(plugin.dataManager.getRowLevel(3)).toEqual(1);
        expect(plugin.dataManager.getRowLevel(4)).toEqual(2);
        expect(plugin.dataManager.getRowLevel(6)).toEqual(1);
        expect(plugin.dataManager.getRowLevel(11)).toEqual(2);
        expect(plugin.dataManager.getRowLevel(16)).toEqual(null);

      });

      it('should return a row object from the data source, being the parent node for the provided row object', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowLevel(data[0])).toEqual(0);
        expect(plugin.dataManager.getRowLevel(data[0].__children[2])).toEqual(1);
        expect(plugin.dataManager.getRowLevel(data[0].__children[2].__children[0])).toEqual(2);
        expect(plugin.dataManager.getRowLevel(data[0].__children[3])).toEqual(1);
        expect(plugin.dataManager.getRowLevel(data[2].__children[1].__children[0])).toEqual(2);

      });
    });

    describe('hasChildren', () => {
      it('should return whether the element at the provided row index has children', () => {
        const hot = handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.hasChildren(0)).toEqual(true);
        expect(plugin.dataManager.hasChildren(1)).toEqual(false);
        expect(plugin.dataManager.hasChildren(2)).toEqual(false);
        expect(plugin.dataManager.hasChildren(3)).toEqual(true);
        expect(plugin.dataManager.hasChildren(4)).toEqual(true);
        expect(plugin.dataManager.hasChildren(5)).toEqual(false);
        expect(plugin.dataManager.hasChildren(6)).toEqual(false);
        expect(plugin.dataManager.hasChildren(7)).toEqual(false);
        expect(plugin.dataManager.hasChildren(8)).toEqual(true);
        expect(plugin.dataManager.hasChildren(9)).toEqual(false);
        expect(plugin.dataManager.hasChildren(10)).toEqual(true);
        expect(plugin.dataManager.hasChildren(11)).toEqual(false);
        expect(plugin.dataManager.hasChildren(12)).toEqual(false);
      });
    });

    describe('addChild', () => {
      it('should add an empty child to the provided parent, when the second method arguments is not declared', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');
        const parentElement = data[0].__children[2];

        expect(plugin.dataManager.countChildren(3)).toEqual(2);

        expect(parentElement.__children[0].a).toEqual('a0-a2-a0');
        expect(parentElement.__children[1]).toBeUndefined();

        plugin.dataManager.addChild(parentElement);
        expect(plugin.dataManager.countChildren(3)).toEqual(3);

        expect(parentElement.__children[0].a).toEqual('a0-a2-a0');
        expect(parentElement.__children[1].a).toEqual(null);
      });

      it('should add a provided row element as a child to the provided parent', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');
        const parentElement = data[0].__children[2];
        const newElement = {
          a: 'test-a',
          b: 'test-b'
        };

        expect(plugin.dataManager.countChildren(3)).toEqual(2);

        expect(parentElement.__children[0].a).toEqual('a0-a2-a0');
        expect(parentElement.__children[1]).toBeUndefined();

        plugin.dataManager.addChild(parentElement, newElement);
        expect(plugin.dataManager.countChildren(3)).toEqual(3);

        expect(parentElement.__children[0].a).toEqual('a0-a2-a0');
        expect(parentElement.__children[1].a).toEqual('test-a');
        expect(parentElement.__children[1].b).toEqual('test-b');
      });

    });

    describe('detachFromParent', () => {
      it('should detach a child node from it\'s parent and re-attach it to the parent of it\'s parent', () => {
        const data = getMoreComplexNestedData();

        const hot = handsontable({
          data,
          nestedRows: true
        });

        const plugin = hot.getPlugin('nestedRows');
        let parentElement = data[0].__children[2];
        let grandparent = plugin.dataManager.getRowParent(parentElement) || data;
        let child = parentElement.__children[0];

        expect(parentElement.__children.length).toEqual(1);
        expect(grandparent.__children ? grandparent.__children.length : data.length).toEqual(4);

        plugin.dataManager.detachFromParent(child);

        expect(parentElement.__children.length).toEqual(0);
        expect(grandparent.__children ? grandparent.__children.length : data.length).toEqual(5);
        expect(grandparent.__children ? grandparent.__children[4] : data[4]).toEqual(child);

        parentElement = data[2];
        grandparent = plugin.dataManager.getRowParent(parentElement) || data;
        child = parentElement.__children[1];

        expect(parentElement.__children.length).toEqual(2);
        expect(grandparent.__children ? grandparent.__children.length : data.length).toEqual(3);

        plugin.dataManager.detachFromParent(child);

        expect(parentElement.__children.length).toEqual(1);
        expect(grandparent.__children ? grandparent.__children.length : data.length).toEqual(4);
        expect(grandparent.__children ? grandparent.__children[3] : data[3]).toEqual(child);
      });
    });
  });
});
