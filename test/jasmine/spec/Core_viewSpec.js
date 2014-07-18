describe('Core_view', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should focus cell after viewport is scrolled using down arrow', function () {
    this.$container[0].style.width = '400px';
    this.$container[0].style.height = '60px';

    handsontable({
      startRows: 20
    });
    selectCell(0, 0);

    expect(document.activeElement.nodeName).toBe('BODY');

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(getSelected()).toEqual([4, 0, 4, 0]);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(true);
  });

  xit('should scroll viewport when partially visible cell is clicked', function () {
    this.$container[0].style.width = '400px';
    this.$container[0].style.height = '60px';

    handsontable({
      data: createSpreadsheetData(10, 3),
      height: 60
    });
    
    var htCore = getHtCore();

    expect(this.$container.height()).toEqual(60);
    expect(this.$container.find('.wtHolder .wtHider').height()).toBeGreaterThan(60);

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");

    htCore.find('tr:eq(3) td:eq(0)').trigger('mousedown');
    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A1"); //test whether it scrolled
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A2"); //test whether it scrolled
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A3"); //test whether it scrolled
    expect(getSelected()).toEqual([3, 0, 3, 0]); //test whether it is selected
  });

  xit('should scroll viewport, respecting fixed rows', function () {
    this.$container[0].style.width = '200px';
    this.$container[0].style.height = '100px';

    handsontable({
      data: createSpreadsheetData(10, 9),
      fixedRowsTop: 1
    });

    var htCore = getHtCore();

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(0) td:eq(1)').html()).toEqual("B0");
    expect(htCore.find('tr:eq(0) td:eq(2)').html()).toEqual("C0");

    selectCell(0, 0);

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A2");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A3");

  });

  xit('should enable to change fixedRowsTop with updateSettings', function () {
    this.$container[0].style.width = '400px';
    this.$container[0].style.height = '60px';

    var HOT = handsontable({
      data: createSpreadsheetData(10, 9),
      fixedRowsTop: 1,
      width: 200,
      height: 100
    });

    selectCell(0, 0);

    var htCore = getHtCore();
    var topClone = this.$container.find('.ht_clone_top');

    expect(topClone.find('tr').length).toEqual(1);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual("A3");

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(topClone.find('tr').length).toEqual(1);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A2");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A3");
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual("A4");

    selectCell(0, 0);

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual("A3");

    HOT.updateSettings({
      fixedRowsTop: 2
    });

    expect(topClone.find('tr').length).toEqual(2);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(topClone.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual("A3");

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A3");
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual("A4");

  });

  it('should scroll viewport, respecting fixed columns', function () {
    this.$container[0].style.width = '200px';
    this.$container[0].style.height = '100px';

    handsontable({
      data: createSpreadsheetData(10, 9),
      fixedColumnsLeft: 1
    });

    var htCore = getHtCore();
    var leftClone = this.$container.find('.ht_clone_left');


    expect(leftClone.find('tr:eq(0) td').length).toEqual(1);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");

    selectCell(0, 3);

    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');

    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");


  });

  it('should enable to change fixedColumnsLeft with updateSettings', function () {
    this.$container[0].style.width = '200px';
    this.$container[0].style.height = '100px';

    var HOT = handsontable({
      data: createSpreadsheetData(10, 9),
      fixedColumnsLeft: 1
    });


    selectCell(0, 0);

    var leftClone = this.$container.find('.ht_clone_left');

    expect(leftClone.find('tr:eq(0) td').length).toEqual(1);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");

    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');

    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");

    selectCell(0, 0);

    HOT.updateSettings({
      fixedColumnsLeft: 2
    });

    expect(leftClone.find('tr:eq(0) td').length).toEqual(2);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual("A0");
    expect(leftClone.find('tr:eq(0) td:eq(1)').html()).toEqual("B0");
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual("A1");
    expect(leftClone.find('tr:eq(1) td:eq(1)').html()).toEqual("B1");
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual("A2");
    expect(leftClone.find('tr:eq(2) td:eq(1)').html()).toEqual("B2");



  });

  it('should not scroll viewport when last cell is clicked', function () {
    handsontable({
      startRows: 40
    });

    var lastScroll;

    $(window).scrollTop(10000);
    lastScroll = $(window).scrollTop();
    render(); //renders synchronously so we don't have to put stuff in waits/runs
    selectCell(39, 0);

    expect($(window).scrollTop()).toEqual(lastScroll);

    keyDown('arrow_right');

    expect(getSelected()).toEqual([39, 1, 39, 1]);
    expect($(window).scrollTop()).toEqual(lastScroll);
  });

  it('should not shrink table when width and height is not specified for container', function () {

    var initHeight;

    runs(function () {
      this.$container[0].style.overflow = 'scroll';
      this.$container.wrap('<div style="width: 50px;"></div>');
      handsontable({
        startRows: 10,
        startCols: 10
      });
    });

    waits(250);

    runs(function () {
      initHeight = this.$container.height();
    });

    waits(250);

    runs(function () {
      expect(this.$container.height()).toEqual(initHeight);
    });

  });

  it('should allow height to be a number', function () {
    handsontable({
      startRows: 10,
      startCols: 10,
      height: 107
    });

    expect(this.$container.height()).toEqual(107);
  });

  it('should allow height to be a function', function () {
    handsontable({
      startRows: 10,
      startCols: 10,
      height: function () {
        return 107;
      }
    });

    expect(this.$container.height()).toEqual(107);
  });

  it('should allow width to be a number', function () {
    handsontable({
      startRows: 10,
      startCols: 10,
      width: 107
    });

    expect(this.$container.find('.wtHider').width()).toEqual(107); //rootElement is full width but this should do the trick
  });

  it('should allow width to be a function', function () {
    handsontable({
      startRows: 10,
      startCols: 10,
      width: function () {
        return 107;
      }
    });

    expect(this.$container.find('.wtHider').width()).toEqual(107); //rootElement is full width but this should do the trick
  });

  it("should fire beforeRender event after table has been scrolled", function () {
    this.$container[0].style.width = '400px';
    this.$container[0].style.height = '60px';
    this.$container[0].style.overflow = 'auto';

    var hot = handsontable({
      data: createSpreadsheetData(100, 3)
    });

    var beforeRenderCallback = jasmine.createSpy('beforeRenderCallback');

    hot.addHook('beforeRender', beforeRenderCallback);

    this.$container.scrollTop(1000);

    waitsFor(function(){
      return beforeRenderCallback.calls.length > 0;
    }, 'beforeRender event to fire', 1000);

  });

  it("should fire afterRender event after table has been scrolled", function () {
    this.$container[0].style.width = '400px';
    this.$container[0].style.height = '60px';
    this.$container[0].style.overflow = 'auto';

    var hot = handsontable({
      data: createSpreadsheetData(20, 3)
    });

    var afterRenderCallback = jasmine.createSpy('afterRenderCallback');

    hot.addHook('afterRender', afterRenderCallback);

    this.$container.scrollTop(1000);

    waitsFor(function(){
      return afterRenderCallback.calls.length > 0;
    }, 'afterRender event to fire', 1000);

  });

  //TODO fix these tests - https://github.com/handsontable/jquery-handsontable/issues/1559
  describe('maximumVisibleElementWidth', function () {
    it('should return maximum width until right edge of the viewport', function () {
      var hot = handsontable({
        startRows: 2,
        startCols: 10,
        width: 100,
        height: 100
      });

      expect(hot.view.maximumVisibleElementWidth(0)).toEqual(100);
    });

    it('should return maximum width until right edge of the viewport (excluding the scrollbar)', function () {
      var hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 100,
        height: 100
      });

      expect(hot.view.maximumVisibleElementWidth(200)).toBeLessThan(100);
    });
  });

  describe('maximumVisibleElementHeight', function () {
    it('should return maximum height until bottom edge of the viewport', function () {
      var hot = handsontable({
        startRows: 10,
        startCols: 2,
        width: 120,
        height: 100
      });

      expect(hot.view.maximumVisibleElementHeight(0)).toEqual(100);
    });

    it('should return maximum height until bottom edge of the viewport (excluding the scrollbar)', function () {
      var hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 120,
        height: 100
      });

      expect(hot.view.maximumVisibleElementHeight()).toBeLessThan(100);
    });
  });

  describe('fixed column row heights', function () {
    it('should be the same as the row heights in the main table', function () {
      var hot = handsontable({
        startRows: 3,
        startCols: 4,
        fixedColumnsLeft: 2
      });

      expect(hot.view.maximumVisibleElementHeight(0)).toEqual(100);
    });

  });

});