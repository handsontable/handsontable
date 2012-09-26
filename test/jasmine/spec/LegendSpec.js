describe('Legend', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if($container) {
     $container.remove();
    }
  });

  it('legend icon should update col header', function () {
    var called = false;
    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];
    var widthBeforeLoad;

    runs(function(){
      $container.handsontable({
        rowHeaders: true,
        colHeaders: true
      });
      $container.handsontable('loadData', data);
      widthBeforeLoad = $container.find('table.htCore').width();
      $container.handsontable('updateSettings', {
        legend: [
          {
            match: function (row, col, data) {
              return (row === 0 && data()[row][col]); //if it is first row with data
            },
            icon: {
              src: "lib/jasmine-1.2.0/jasmine_favicon.png",
              click: function (row, col, data, icon) {
              }
            }
          }
        ]
      });
      $container.find("td img").on("load", function(){
        called = true;
      });
    });

    waitsFor(function () {
      return (called === true)
    }, "legend icon loaded", 500);

    waits(100);

    runs(function(){
      var widthAfterLoad = $container.find('table.htCore').width();
      expect(widthBeforeLoad).not.toEqual(widthAfterLoad);
      expect(widthBeforeLoad).toBeGreaterThan(300);
      expect(widthAfterLoad).toBeGreaterThan(300);
      expect($container.find('table.htCore').width()).toEqual($container.find('table.htBlockedRows').width());
    });
  });
});