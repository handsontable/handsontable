describe('WalkontableBorder', () => {
  var $table,
    $container,
    $wrapper;

  beforeEach(() => {
    $container = $('<div></div>');
    $wrapper = $('<div></div>').css({overflow: 'hidden', position: 'relative'});
    $container.width(200).height(200);
    $table = $('<table></table>');
    $container.append($wrapper);
    $wrapper.append($table);
    $container.appendTo('body');
    createDataArray();
  });

  afterEach(() => {
    $container.remove();
  });

  it('should add/remove border to selection when cell is clicked', () => {
    var wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections: [
        new Walkontable.Selection({
          border: {
            width: 1,
            color: 'red'
          }
        })
      ],
      onCellMouseDown(event, coords, TD) {
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
    expect($top.position().top).toBe(25);
    expect($top.position().left).toBe(0);
    expect($right.css('width')).toBe('1px');
    expect($right.position().top).toBe(25);
    expect($right.position().left).toBe(100);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(50);
    expect($bottom.position().left).toBe(0);
    expect($left.css('width')).toBe('1px');
    expect($left.position().top).toBe(25);
    expect($left.position().left).toBe(0);

    $td2.simulate('mousedown');

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(50);
    expect($top.position().left).toBe(100);
    expect($right.css('width')).toBe('1px');
    expect($right.position().top).toBe(50);
    expect($right.position().left).toBe(200);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(75);
    expect($bottom.position().left).toBe(100);
    expect($left.css('width')).toBe('1px');
    expect($left.position().top).toBe(50);
    expect($left.position().left).toBe(100);
  });

  it('should add/remove corner to selection when cell is clicked', () => {
    var wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections: [
        new Walkontable.Selection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible() {
              return true;
            }
          }
        }),
        new Walkontable.Selection({})
      ],
      onCellMouseDown(event, coords, TD) {
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

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner[0].offsetTop).toBe(50);
    expect($corner[0].offsetLeft).toBe(100);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner[0].offsetTop).toBe(75);
    expect($corner[0].offsetLeft).toBe(200);
  });

  it('should move the fill handle / corner border to the left, if in the position it would overlap the container (e.g.: far-right)', () => {
    $container.css({
      overflow: 'hidden',
      width: '301px'
    });
    var wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: 5,
      totalColumns: 3,
      selections: [
        new Walkontable.Selection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible() {
              return true;
            }
          }
        }),
        new Walkontable.Selection({})
      ],
      onCellMouseDown(event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    shimSelectionProperties(wt);
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(3) td:eq(2)');
    var $td3 = $table.find('tbody tr:eq(2) td:eq(1)');
    var $corner = $(wt.selections.current.getBorder(wt).corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner[0].offsetTop).toBe(50);
    expect($corner[0].offsetLeft).toBe(100);
    expect($container[0].clientWidth === $container[0].scrollWidth).toBe(true);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner[0].offsetTop).toBe(100);
    expect($corner[0].offsetLeft).toBe(300 - 2);
    expect($container[0].clientWidth === $container[0].scrollWidth).toBe(true);

    $td3.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner[0].offsetTop).toBe(75);
    expect($corner[0].offsetLeft).toBe(200);
    expect($container[0].clientWidth === $container[0].scrollWidth).toBe(true);
  });
});
