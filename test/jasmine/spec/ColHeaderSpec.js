describe('ColHeader', function() {
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

  it('should not show col headers by default', function() {
    var that = this;
    handsontable();

    expect(that.$container.find('thead th').length).toEqual(0);
  });

  it('should show col headers if true', function() {
    var that = this;
    handsontable({
      colHeaders: true
    });

    expect(that.$container.find('thead th').length).toBeGreaterThan(0);
  });

  it('should show col headers numbered 1-10 by default', function() {
    var that = this;
    var startCols = 5;
    handsontable({
      startCols: startCols,
      colHeaders: true
    });

    var ths = getHtCore().find('thead th');
    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('A');
    expect($.trim(ths.eq(1).text())).toEqual('B');
    expect($.trim(ths.eq(2).text())).toEqual('C');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should show col headers with custom label', function() {
    var that = this;
    var startCols = 5;
    handsontable({
      startCols: startCols,
      colHeaders: ['First', 'Second', 'Third']
    });

    var ths = getHtCore().find('thead th');
    expect(ths.length).toEqual(startCols);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('D');
    expect($.trim(ths.eq(4).text())).toEqual('E');
  });

  it('should not show col headers if false', function() {
    var that = this;
    handsontable({
      colHeaders: false
    });

    expect(that.$container.find('th.htColHeader').length).toEqual(0);
  });

  it('should hide columns headers after updateSettings', function() {
    var hot = handsontable({
      startCols: 5,
      colHeaders: true
    });

    expect(getHtCore().find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(this.$container.find('thead th').length).toEqual(0);
  });

  it('should show/hide columns headers after updateSettings', function() {
    var hot = handsontable({
      startCols: 5,
      colHeaders: true
    });

    var htCore = getHtCore();

    expect(htCore.find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(htCore.find('thead th').length).toEqual(0);

    hot.updateSettings({
      colHeaders: true
    });

    expect(htCore.find('thead th').length).toEqual(5);

    hot.updateSettings({
      colHeaders: false
    });

    expect(htCore.find('thead th').length).toEqual(0);
  });

  it('should show columns headers after updateSettings', function() {
    var hot = handsontable({
      startCols: 5,
      colHeaders: false
    });

    var htCore = getHtCore();

    expect(htCore.find('thead th').length).toEqual(0);

    hot.updateSettings({
      colHeaders: true
    });

    expect(htCore.find('thead th').length).toEqual(5);
  });

  it('should show new columns headers after updateSettings', function() {
    var hot = handsontable({
      startCols: 3,
      colHeaders: ['A', 'B', 'C']
    });

    var htCore = getHtCore();
    expect(htCore.find('thead th:eq(0)').text()).toEqual('A');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('B');
    expect(htCore.find('thead th:eq(2)').text()).toEqual('C');

    hot.updateSettings({
      colHeaders: ['X', 'Y', 'Z']
    });

    expect(htCore.find('thead th:eq(0)').text()).toEqual('X');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Y');
    expect(htCore.find('thead th:eq(2)').text()).toEqual('Z');

  });

  it('should be possible to define colHeaders with a function', function() {
    var hot = handsontable({
      startCols: 2,
      colHeaders: function(col) {
        switch (col) {
          case 0:
            return 'One';

          case 1:
            return 'Two';
        }
      }
    });

    var htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('One');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should be possible to set HTML in colHeaders', function() {
    var hot = handsontable({
      startCols: 2,
      colHeaders: ['One <input type="checkbox">', 'Two <input type="checkbox">']
    });

    var htCore = getHtCore();

    expect(htCore.find('thead th:eq(0) input[type=checkbox]').length).toEqual(1);
    expect(htCore.find('thead th:eq(1) input[type=checkbox]').length).toEqual(1);
  });

  it('should be possible to set colHeaders when columns array is present', function() {
    var hot = handsontable({
      startCols: 2,
      colHeaders: ['One', 'Two'],
      columns: [
        {type: 'text'},
        {type: 'text'}
      ]
    });

    var htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('One');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it('should be possible to set colHeaders using columns title property', function() {
    var hot = handsontable({
      startCols: 2,
      colHeaders: ['One', 'Two'],
      columns: [
        {type: 'text', title: 'Special title'},
        {type: 'text'}
      ]
    });

    var htCore = getHtCore();

    expect(htCore.find('thead th:eq(0)').text()).toEqual('Special title');
    expect(htCore.find('thead th:eq(1)').text()).toEqual('Two');
  });

  it("should resize all the column headers in the overlays, according to the other overlays' height", function() {
    var hot = handsontable({
      startCols: 5,
      colHeaders: ['a', 'a', 'a', 'a<BR>a', 'a'],
      fixedColumnsLeft: 2
    });

    var topHeaderExample = $(".ht_clone_top").find('thead tr:first-child th:nth-child(1)'),
      masterHeaderExample = $(".ht_master").find('thead tr:first-child th:nth-child(3)');

    expect(topHeaderExample.height()).toEqual(masterHeaderExample.height());
  });

  it('should allow defining custom column header height using the columnHeaderHeight config option', function() {
    var hot = handsontable({
      startCols: 3,
      colHeaders: true,
      columnHeaderHeight: 40
    });

    hot.render();

    expect(this.$container.find('th').eq(0).height()).toEqual(40);
  });

  it('should allow defining custom column header heights using the columnHeaderHeight config option, when multiple column header levels are defined', function() {
    var hot = handsontable({
      startCols: 3,
      colHeaders: true,
      columnHeaderHeight: [45, 65],
      afterGetColumnHeaderRenderers: function(array) {
          array.push(function(index, TH) {
            TH.innerHTML = '';

            var div = document.createElement('div');
            var span = document.createElement('span');

            div.className = 'relative';
            span.className = 'colHeader';

            span.innerText = index;

            div.appendChild(span);
            TH.appendChild(div);
          });

          return array;
      }
    });
    hot.render();

    expect(this.$container.find('.handsontable.ht_clone_top tr:nth-child(1) th:nth-child(1)').height()).toEqual(45);
    expect(this.$container.find('.handsontable.ht_clone_top tr:nth-child(2) th:nth-child(1)').height()).toEqual(65);
  });
});
