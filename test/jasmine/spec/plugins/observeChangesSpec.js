describe('HandsontableObserveChanges', function () {
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

  function createHOT(data, observeChanges) {
    return handsontable({
      data: data,
      width: 200,
      height: 200,
      observeChanges: observeChanges
    });
  }

  it('should render newly added row', function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data.push(["A3", "B3"]);

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(3);
      expect(this.$container.find('col').length).toEqual(2);
    });
  });

  it('should render newly added column', function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data[0].push("C1");
    data[1].push("C2");

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(2);
      expect(this.$container.find('col').length).toEqual(3);
    });
  });

  it('should render removed row', function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data.splice(0, 1); //removes one row at index 0

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(1);
      expect(this.$container.find('col').length).toEqual(2);
    });
  });

  it('should render removed column', function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data[0].splice(0, 1); //removes one column at index 0 in first row
    data[1].splice(0, 1); //removes one column at index 0 in second row

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tr').length).toEqual(2);
      expect(this.$container.find('col').length).toEqual(1);
    });
  });

  it('should render cell change from string to string', function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data[0][0] = 'new string';

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('td:eq(0)').html()).toEqual('new string');
    });
  });

  it('should render cell change in a new row', function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data.push(["A3", "B3"]);

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
      afterRenderSpy.reset();
      data[2][0] = 'new string';
    });

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('new string');
    });
  });

  it('should not render cell change when turned off (`observeChanges: false`)', function () {
    var data = createSpreadsheetData(2, 2);
    createHOT(data, false);

    data[0][0] = 'new string';

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('td:eq(0)').html()).toEqual('A0');
    });
  });

  it("should be possible to enable plugin using updateSettings", function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, false);

    data[0][0] = 'new string';

    waits(100); //Object.observe is async

    runs(function () {
      expect(this.$container.find('td:eq(0)').html()).toEqual('A0');

      updateSettings({
        observeChanges: true
      });

      var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
      hot.addHook('afterRender', afterRenderSpy);

      data[1][0] = 'another new string';

      waitsFor(function(){
        return afterRenderSpy.callCount > 0;
      }, 'Table render', 1000);

     runs(function(){
       expect(this.$container.find('tr:eq(1) td:eq(0)').html()).toEqual('another new string');
     });

    });
  });

  it("should be possible to disable plugin using updateSettings", function () {
    var data = createSpreadsheetData(2, 2);
    var hot = createHOT(data, true);

    var afterRenderSpy = jasmine.createSpy('afterRenderSpy');
    hot.addHook('afterRender', afterRenderSpy);

    data[0][0] = 'new string';

    waitsFor(function(){
      return afterRenderSpy.callCount > 0;
    }, 'Table render', 1000);

    runs(function () {
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
    });

    runs(function(){
      updateSettings({
        observeChanges: false
      });

      data[1][0] = 'another new string';
    });

    waits(100);


    runs(function(){
      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('A1');
    });



    runs(function(){
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').html()).toEqual('new string');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').html()).toEqual('another new string');
    });

  });
});