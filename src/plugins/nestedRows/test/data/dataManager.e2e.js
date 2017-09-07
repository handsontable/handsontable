describe('NestedRows Data Manager', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('API', function() {
    describe('getDataObject', function() {
      it('should return the data source object corresponding to the provided visual row number', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.getDataObject(-5)).not.toBeDefined();
        expect(plugin.dataManager.getDataObject(0)).toEqual(sourceData[0]);
        expect(plugin.dataManager.getDataObject(2)).toEqual(sourceData[0].__children[1]);
        expect(plugin.dataManager.getDataObject(3)).toEqual(sourceData[0].__children[1].__children[0]);
        expect(plugin.dataManager.getDataObject(5)).toEqual(sourceData[0].__children[2]);
        expect(plugin.dataManager.getDataObject(10)).toEqual(sourceData[2].__children[1].__children[0]);
        expect(plugin.dataManager.getDataObject(15)).not.toBeDefined();
      });
    });

    describe('getRowIndex', function() {
      it('should return a visual row index for the provided source data row object', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.getRowIndex(sourceData[0])).toEqual(0);
        expect(plugin.dataManager.getRowIndex(sourceData[0].__children[1])).toEqual(2);
        expect(plugin.dataManager.getRowIndex(sourceData[0].__children[1].__children[0])).toEqual(3);
        expect(plugin.dataManager.getRowIndex(sourceData[0].__children[2])).toEqual(5);
        expect(plugin.dataManager.getRowIndex(sourceData[2].__children[1].__children[0])).toEqual(10);

      });
    });

    describe('getRowIndexWithinParent', function() {
      it('should return an index of the provided source data row object withing its parent', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowIndexWithinParent(-5)).toEqual(-1);
        expect(plugin.dataManager.getRowIndexWithinParent(0)).toEqual(0);
        expect(plugin.dataManager.getRowIndexWithinParent(2)).toEqual(1);
        expect(plugin.dataManager.getRowIndexWithinParent(3)).toEqual(0);
        expect(plugin.dataManager.getRowIndexWithinParent(5)).toEqual(2);
        expect(plugin.dataManager.getRowIndexWithinParent(10)).toEqual(0);
        expect(plugin.dataManager.getRowIndexWithinParent(15)).toEqual(-1);

      });
    });

    describe('countAllRows', function() {
      it('should return a number of all row objects within the data set', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.countAllRows()).toEqual(12);

      });
    });

    describe('countChildren', function() {
      it('should return a number of children (and children\'s children) of the row provided as an index', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.countChildren(-5)).toEqual(0);
        expect(plugin.dataManager.countChildren(0)).toEqual(5);
        expect(plugin.dataManager.countChildren(2)).toEqual(2);
        expect(plugin.dataManager.countChildren(3)).toEqual(1);
        expect(plugin.dataManager.countChildren(5)).toEqual(0);
        expect(plugin.dataManager.countChildren(10)).toEqual(0);
        expect(plugin.dataManager.countChildren(15)).toEqual(0);

      });

      it('should return a number of children (and children\'s children) of the row provided as a row object from the data source', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.countChildren(sourceData[0])).toEqual(5);
        expect(plugin.dataManager.countChildren(sourceData[0].__children[1])).toEqual(2);
        expect(plugin.dataManager.countChildren(sourceData[0].__children[1].__children[0])).toEqual(1);
        expect(plugin.dataManager.countChildren(sourceData[0].__children[2])).toEqual(0);
        expect(plugin.dataManager.countChildren(sourceData[2].__children[1].__children[0])).toEqual(0);

      });
    });

    describe('getRowParent', function() {
      it('should return a row object from the data source, being the parent node for the provided row index', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.getRowParent(-5)).toEqual(null);
        expect(plugin.dataManager.getRowParent(0)).toEqual(null);
        expect(plugin.dataManager.getRowParent(2)).toEqual(sourceData[0]);
        expect(plugin.dataManager.getRowParent(3)).toEqual(sourceData[0].__children[1]);
        expect(plugin.dataManager.getRowParent(5)).toEqual(sourceData[0]);
        expect(plugin.dataManager.getRowParent(10)).toEqual(sourceData[2].__children[1]);
        expect(plugin.dataManager.getRowParent(15)).toEqual(null);

      });

      it('should return a row object from the data source, being the parent node for the provided row object', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.getRowParent(sourceData[0])).toEqual(null);
        expect(plugin.dataManager.getRowParent(sourceData[0].__children[1])).toEqual(sourceData[0]);
        expect(plugin.dataManager.getRowParent(sourceData[0].__children[1].__children[0])).toEqual(sourceData[0].__children[1]);
        expect(plugin.dataManager.getRowParent(sourceData[0].__children[2])).toEqual(sourceData[0]);
        expect(plugin.dataManager.getRowParent(sourceData[2].__children[1].__children[0])).toEqual(sourceData[2].__children[1]);

      });
    });

    describe('getRowLevel', function() {
      it('should return the nesting level of the row, provided as an index', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');

        expect(plugin.dataManager.getRowLevel(-5)).toEqual(null);
        expect(plugin.dataManager.getRowLevel(0)).toEqual(0);
        expect(plugin.dataManager.getRowLevel(2)).toEqual(1);
        expect(plugin.dataManager.getRowLevel(3)).toEqual(2);
        expect(plugin.dataManager.getRowLevel(5)).toEqual(1);
        expect(plugin.dataManager.getRowLevel(10)).toEqual(2);
        expect(plugin.dataManager.getRowLevel(15)).toEqual(null);

      });

      it('should return a row object from the data source, being the parent node for the provided row object', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.getRowLevel(sourceData[0])).toEqual(0);
        expect(plugin.dataManager.getRowLevel(sourceData[0].__children[1])).toEqual(1);
        expect(plugin.dataManager.getRowLevel(sourceData[0].__children[1].__children[0])).toEqual(2);
        expect(plugin.dataManager.getRowLevel(sourceData[0].__children[2])).toEqual(1);
        expect(plugin.dataManager.getRowLevel(sourceData[2].__children[1].__children[0])).toEqual(2);

      });
    });

    describe('hasChildren', function() {
      it('should return whether the element at the provided row index has children', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();

        expect(plugin.dataManager.hasChildren(0)).toEqual(true);
        expect(plugin.dataManager.hasChildren(1)).toEqual(false);
        expect(plugin.dataManager.hasChildren(2)).toEqual(true);
        expect(plugin.dataManager.hasChildren(3)).toEqual(true);
        expect(plugin.dataManager.hasChildren(4)).toEqual(false);
        expect(plugin.dataManager.hasChildren(5)).toEqual(false);
        expect(plugin.dataManager.hasChildren(6)).toEqual(false);
        expect(plugin.dataManager.hasChildren(7)).toEqual(true);
        expect(plugin.dataManager.hasChildren(8)).toEqual(false);
        expect(plugin.dataManager.hasChildren(9)).toEqual(true);
        expect(plugin.dataManager.hasChildren(10)).toEqual(false);
        expect(plugin.dataManager.hasChildren(11)).toEqual(false);
      });
    });

    describe('addChild', function() {
      it('should add an empty child to the provided parent, when the second method arguments is not declared', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();
        var parentElement = sourceData[0].__children[1];

        expect(plugin.dataManager.countChildren(2)).toEqual(2);

        expect(parentElement.__children[0].a).toEqual('a0-a1-a0');
        expect(parentElement.__children[1]).toBeUndefined();

        plugin.dataManager.addChild(parentElement);
        expect(plugin.dataManager.countChildren(2)).toEqual(3);

        expect(parentElement.__children[0].a).toEqual('a0-a1-a0');
        expect(parentElement.__children[1].a).toEqual(null);
      });

      it('should add a provided row element as a child to the provided parent', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();
        var parentElement = sourceData[0].__children[1];
        var newElement = {
          a: 'test-a',
          b: 'test-b'
        };

        expect(plugin.dataManager.countChildren(2)).toEqual(2);

        expect(parentElement.__children[0].a).toEqual('a0-a1-a0');
        expect(parentElement.__children[1]).toBeUndefined();

        plugin.dataManager.addChild(parentElement, newElement);
        expect(plugin.dataManager.countChildren(2)).toEqual(3);

        expect(parentElement.__children[0].a).toEqual('a0-a1-a0');
        expect(parentElement.__children[1].a).toEqual('test-a');
        expect(parentElement.__children[1].b).toEqual('test-b');
      });

    });

    describe('detachFromParent', function() {
      it('should detach a child node from it\'s parent and re-attach it to the parent of it\'s parent', function() {
        var hot = handsontable({
          data: getDataForNestedRows(),
          nestedRows: true
        });

        var plugin = hot.getPlugin('nestedRows');
        var sourceData = hot.getSourceData();
        var parentElement = sourceData[0].__children[1];
        var grandparent = plugin.dataManager.getRowParent(parentElement) || sourceData;
        var child = parentElement.__children[0];

        expect(parentElement.__children.length).toEqual(1);
        expect(grandparent.__children ? grandparent.__children.length : sourceData.length).toEqual(3);

        plugin.dataManager.detachFromParent(child);

        expect(parentElement.__children.length).toEqual(0);
        expect(grandparent.__children ? grandparent.__children.length : sourceData.length).toEqual(4);
        expect(grandparent.__children ? grandparent.__children[3] : sourceData[3]).toEqual(child);

        parentElement = sourceData[2];
        grandparent = plugin.dataManager.getRowParent(parentElement) || sourceData;
        child = parentElement.__children[1];

        expect(parentElement.__children.length).toEqual(2);
        expect(grandparent.__children ? grandparent.__children.length : sourceData.length).toEqual(3);

        plugin.dataManager.detachFromParent(child);

        expect(parentElement.__children.length).toEqual(1);
        expect(grandparent.__children ? grandparent.__children.length : sourceData.length).toEqual(4);
        expect(grandparent.__children ? grandparent.__children[3] : sourceData[3]).toEqual(child);
      });
    });
  });
});
