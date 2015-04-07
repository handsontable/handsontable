describe('WalkontableBorder', function () {
  var $table,
    $container,
    $wrapper,
    debug = false;

  beforeEach(function () {
    $container = $('<div></div>');
    $wrapper = $('<div></div>');
    $container.width(100).height(200);
    $table = $('<table></table>');
    $container.append($wrapper);
    $wrapper.append($table);
    $container.appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $container.remove();
  });

  it("should add/remove border to selection when cell is clicked", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections: [
        new WalkontableSelection({
          border: {
            width: 1,
            color: 'red'
          }
        })
      ],
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    shimSelectionProperties(wt);
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(2) td:eq(1)');
    var $top = $(wt.selections.current.getBorder(wt).top);
    var $right = $(wt.selections.current.getBorder(wt).right);
    var $bottom = $(wt.selections.current.getBorder(wt).bottom);
    var $left = $(wt.selections.current.getBorder(wt).left);

    $td1.simulate('mousedown');

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(23);
    expect($top.position().left).toBe(0);
    expect($right.css('width')).toBe('1px');
    expect($right.position().top).toBe(23);
    expect($right.position().left).toBe(49);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(46);
    expect($bottom.position().left).toBe(0);
    expect($left.css('width')).toBe('1px');
    expect($left.position().top).toBe(23);
    expect($left.position().left).toBe(0);

    $td2.simulate('mousedown');

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(46);
    expect($top.position().left).toBe(49);
    expect($right.css('width')).toBe('1px');
    expect($right.position().top).toBe(46);
    expect($right.position().left).toBe(99);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(69);
    expect($bottom.position().left).toBe(49);
    expect($left.css('width')).toBe('1px');
    expect($left.position().top).toBe(46);
    expect($left.position().left).toBe(49);
  });

  it("should add/remove corner to selection when cell is clicked", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections: [
        new WalkontableSelection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible: function () {
              return true;
            }
          }
        }),
        new WalkontableSelection({})
      ],
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    shimSelectionProperties(wt);
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(2) td:eq(1)');
    var $corner = $(wt.selections.current.getBorder(wt).corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('5px');
    expect($corner.css('height')).toBe('5px');
    expect($corner.position().top).toBe(42);
    expect($corner.position().left).toBe(45);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('5px');
    expect($corner.css('height')).toBe('5px');
    expect($corner.position().top).toBe(65);
    expect($corner.position().left).toBe(95);
  });

  it("should move the fill handle / corner border to the left, if in the position it would overlap the container (e.g.: far-right)", function () {
    $container.css({
      overflow: 'hidden',
      width: '200px'
    });
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: 5,
      totalColumns: 4,
      selections: [
        new WalkontableSelection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible: function () {
              return true;
            }
          }
        }),
        new WalkontableSelection({})
      ],
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    shimSelectionProperties(wt);
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(3) td:eq(3)');
    var $td3 = $table.find('tbody tr:eq(2) td:eq(1)');
    var $corner = $(wt.selections.current.getBorder(wt).corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('5px');
    expect($corner.css('height')).toBe('5px');
    expect($corner.position().top).toBe(42);
    expect($corner.position().left).toBe(45);
    expect($container[0].clientWidth === $container[0].scrollWidth).toBe(true);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('5px');
    expect($corner.css('height')).toBe('5px');
    expect($corner.position().top).toBe(88);
    expect($corner.position().left).toBe(193);
    expect($container[0].clientWidth === $container[0].scrollWidth).toBe(true);

    $td3.simulate('mousedown');

    expect($corner.css('width')).toBe('5px');
    expect($corner.css('height')).toBe('5px');
    expect($corner.position().top).toBe(65);
    expect($corner.position().left).toBe(95);
    expect($container[0].clientWidth === $container[0].scrollWidth).toBe(true);
  });
});
