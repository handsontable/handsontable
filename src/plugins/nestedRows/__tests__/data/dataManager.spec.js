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

      it('should add a new child to the provided parent, when the parent is collapsed', () => {
        const data = getSimplerNestedData();
        const hot = handsontable({
          data,
          nestedRows: true,
          rowHeaders: true,
          colHeaders: true
        });

        const startRowCount = hot.countRows();
        const plugin = hot.getPlugin('nestedRows');
        const lastRowParentObject = plugin.dataManager.getRowParent(hot.countRows() - 1);
        const lastRowParentIndex = plugin.dataManager.getRowIndex(lastRowParentObject);
        const startLastRowChildCount = plugin.dataManager.countChildren(lastRowParentObject);

        plugin.collapsingUI.collapseChildren(lastRowParentIndex);

        plugin.dataManager.addChild(lastRowParentObject);

        expect(plugin.dataManager.countChildren(lastRowParentObject)).toEqual(startLastRowChildCount + 1);

        plugin.collapsingUI.expandAll();

        expect(hot.countRows()).toEqual(startRowCount + 1);
        expect(hot.getDataAtRow(hot.countRows() - 1)).toEqual([null, null, null, null]);
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

    describe('setData', () => {
      it('should set the internal data property of the class', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        dataManager.setData(getMoreComplexNestedData());
        expect(dataManager.data).toEqual(getMoreComplexNestedData());
      });
    });

    describe('getData', () => {
      it('should get the internal data property of the class', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        expect(dataManager.getData()).toEqual(getSimplerNestedData());
      });
    });

    describe('getRawSourceData', () => {
      it('should return the "raw" non-flattened version of the source data', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        expect(getSourceData().length).toEqual(18);
        expect(dataManager.getRawSourceData()).toEqual(getSimplerNestedData());
      });
    });

    describe('updateWithData', () => {
      it('should set the new data to the manager class and refresh the cache', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        dataManager.updateWithData(getMoreComplexNestedData());

        expect(dataManager.getData()).toEqual(getMoreComplexNestedData());
        expect(dataManager.cache.levelCount).toEqual(4);
      });
    });

    describe('isChild', () => {
      it('should return if row with the provided index is a child of any other row', () => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        expect(dataManager.isChild(0)).toEqual(false);
        expect(dataManager.isChild(1)).toEqual(true);
        expect(dataManager.isChild(2)).toEqual(true);
        expect(dataManager.isChild(3)).toEqual(true);
        expect(dataManager.isChild(4)).toEqual(true);
        expect(dataManager.isChild(5)).toEqual(true);
        expect(dataManager.isChild(6)).toEqual(true);
        expect(dataManager.isChild(7)).toEqual(false);
        expect(dataManager.isChild(8)).toEqual(false);
        expect(dataManager.isChild(9)).toEqual(true);
        expect(dataManager.isChild(10)).toEqual(true);
        expect(dataManager.isChild(11)).toEqual(true);
        expect(dataManager.isChild(12)).toEqual(true);
      });
    });

    describe('isRowHighestLevel', () => {
      it('should return if row with the provided index is at the highest level of the table', () => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        expect(dataManager.isRowHighestLevel(0)).toEqual(true);
        expect(dataManager.isRowHighestLevel(1)).toEqual(false);
        expect(dataManager.isRowHighestLevel(2)).toEqual(false);
        expect(dataManager.isRowHighestLevel(3)).toEqual(false);
        expect(dataManager.isRowHighestLevel(4)).toEqual(false);
        expect(dataManager.isRowHighestLevel(5)).toEqual(false);
        expect(dataManager.isRowHighestLevel(6)).toEqual(false);
        expect(dataManager.isRowHighestLevel(7)).toEqual(true);
        expect(dataManager.isRowHighestLevel(8)).toEqual(true);
        expect(dataManager.isRowHighestLevel(9)).toEqual(false);
        expect(dataManager.isRowHighestLevel(10)).toEqual(false);
        expect(dataManager.isRowHighestLevel(11)).toEqual(false);
        expect(dataManager.isRowHighestLevel(12)).toEqual(false);
      });
    });

    describe('spliceData', () => {
      it('should work analogously a native "splice" method, but for the nested data structure', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        let modifiedData = null;

        dataManager.spliceData(1, 2, [{ a: 'test' }]);

        modifiedData = getSourceData();

        expect(modifiedData[1].a).toEqual('test');
        expect(modifiedData[2].artist).toEqual('Foo Fighters');

        dataManager.spliceData(0, 1, [{ b: 'test' }]);

        modifiedData = getSourceData();

        expect(modifiedData[0].b).toEqual('test');
        expect(modifiedData[1].category).toEqual('Best Metal Performance');
        expect(modifiedData[2].artist).toEqual('Ghost');
      });
    });

    describe('rewriteCache', () => {
      it('should refresh the cache with the current dataset', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        dataManager.setData(getMoreComplexNestedData());
        dataManager.rewriteCache();

        expect(dataManager.cache.levelCount).toEqual(4);
      });
    });

    describe('cacheNode', () => {
      it('should add a new node to cache', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dummyNode = { a: 'test' };

        dataManager.cacheNode(dummyNode, 5, null);

        expect(dataManager.cache.levels[5][0]).toEqual(dummyNode);
        expect(dataManager.cache.levelCount).toEqual(3);
        expect(dataManager.cache.nodeInfo.get(dummyNode)).toEqual({
          parent: null,
          row: 18,
          level: 5
        });
      });
    });

    describe('mockParent', () => {
      it('should mock a parent node, basing on the first node from the dataset, adding all 0-level nodes as children', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        expect(dataManager.mockParent()).toEqual({
          category: null,
          artist: null,
          title: null,
          label: null,
          __children: dataManager.getRawSourceData()
        });
      });
    });

    describe('mockNode', () => {
      it('should mock a node, basing on the first node from the dataset', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;

        expect(dataManager.mockNode()).toEqual({
          category: null,
          artist: null,
          title: null,
          label: null,
          __children: null
        });
      });
    });

    describe('getRowObjectParent', () => {
      it('should return a parent of the provided row object', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dataInstance = getSimplerNestedData();

        dataManager.updateWithData(dataInstance);

        expect(dataManager.getRowObjectParent(dataInstance[0])).toEqual(null);
        expect(dataManager.getRowObjectParent(dataInstance[0].__children[0])).toEqual(dataInstance[0]);
      });
    });

    describe('getRowObjectLevel', () => {
      it('should return the level of the provided row object', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dataInstance = getSimplerNestedData();

        dataManager.updateWithData(dataInstance);

        expect(dataManager.getRowObjectLevel(dataInstance[0])).toEqual(0);
        expect(dataManager.getRowObjectLevel(dataInstance[0].__children[0])).toEqual(1);
      });
    });

    describe('isParent', () => {
      it('should return the level of the provided row object', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dataInstance = getSimplerNestedData();

        dataManager.updateWithData(dataInstance);

        expect(dataManager.isParent(dataInstance[0])).toEqual(true);
        expect(dataManager.isParent(dataInstance[0].__children[0])).toEqual(false);
      });
    });

    describe('addChildAtIndex', () => {
      it('should add a child node at a specified index', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dataInstance = getSimplerNestedData();

        dataManager.updateWithData(dataInstance);

        dataManager.addChildAtIndex(dataInstance[0], 3, { a: 'test' });

        expect(dataManager.getData()[0].__children[3].a).toEqual('test');
      });
    });

    describe('addSibling', () => {
      it('should add a new node next to the provided coordinates', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dataInstance = getSimplerNestedData();

        dataManager.updateWithData(dataInstance);

        // defaults to 'below'
        dataManager.addSibling(1);
        expect(dataManager.getData()[0].__children[1]).toEqual({
          artist: null,
          category: null,
          label: null,
          title: null,
          __children: null
        });

        dataManager.addSibling(4, 'above');
        expect(dataManager.getData()[0].__children[3]).toEqual({
          artist: null,
          category: null,
          label: null,
          title: null,
          __children: null
        });
      });
    });

    describe('filterData', () => {
      it('should remove the elements with indexes provided as the third argument of the method (TODO: probalby needs to be refactored)', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const nrPlugin = getPlugin('nestedRows');
        const dataManager = nrPlugin.dataManager;
        const dataInstance = getSimplerNestedData();
        const initialRowCount = dataManager.countAllRows();

        dataManager.updateWithData(dataInstance);

        dataManager.filterData(null, null, [0, 8, 9, 10]);

        expect(dataManager.countAllRows()).toEqual(initialRowCount - 9);
        expect(dataManager.getData()[0].category).toEqual('Best Metal Performance');
        expect(dataManager.getData()[0].__children[0].artist).toEqual('Ghost');
        expect(dataManager.getData()[0].__children[1].artist).toEqual('Slipknot');
      });
    });
  });
});
