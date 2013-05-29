describe('WalkontableDom', function () {

  describe('isVisible', function () {
    it("should return true for appended table", function () {
      var $table = $('<table></table>').appendTo('body');

      var wtDom = new WalkontableDom();
      expect(wtDom.isVisible($table[0])).toBe(true);

      $table.remove();
    });

    it("should return true for Walkontable", function () {
      var $table = $('<table></table>').appendTo('body');
      createDataArray(2, 2);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      var wtDom = new WalkontableDom();
      expect(wtDom.isVisible($table[0])).toBe(true);

      $table.remove();
    });

    it("should return false for not appended table", function () {
      var $table = $('<table></table>');

      var wtDom = new WalkontableDom();
      expect(wtDom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it("should return false for table with `display: none`", function () {
      var $table = $('<table style="display: none"></table>').appendTo('body');

      var wtDom = new WalkontableDom();
      expect(wtDom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it("should return false for table with parent `display: none`", function () {
      var $div = $('<div style="display: none"></div>').appendTo('body');
      var $table = $('<table></table>').appendTo($div);

      var wtDom = new WalkontableDom();
      expect(wtDom.isVisible($table[0])).toBe(false);

      $table.remove();
    });
  });

  it("should return offset top", function () {
    var wtDom = new WalkontableDom();
    var top = 2000;

    var $body = $(document.body);
    var $outer = $('<div></div>');
    $outer.css({
      position: 'absolute',
      height: '4000px',
      width: '4000px',
      top: 0,
      left: 0
    });
    var $inner = $('<div></div>');
    $inner.css({
      position: 'absolute',
      top: top + 'px',
      left: 0
    });
    $outer.append($inner);
    $body.append($outer);

    $(window).scrollTop(1900);
    expect($(window).scrollTop()).toEqual(1900);
    expect($($inner).offset().top + 1).toEqual(top + 1); //jQuery sanity check
    expect(wtDom.offset($inner[0]).top).toEqual(top); //wtDom check

    $outer.remove();
  });

  it("should return offset left", function () {
    var wtDom = new WalkontableDom();
    var left = 2000;

    var $body = $(document.body);
    var $outer = $('<div></div>');
    $outer.css({
      position: 'absolute',
      height: '4000px',
      width: '4000px',
      top: 0,
      left: 0
    });
    var $inner = $('<div></div>');
    $inner.css({
      position: 'absolute',
      left: left + 'px',
      top: 0
    });
    $outer.append($inner);
    $body.append($outer);

    $(window).scrollLeft(1900);
    expect($(window).scrollLeft()).toEqual(1900);
    expect($($inner).offset().left).toEqual(left); //jQuery sanity check
    expect(wtDom.offset($inner[0]).left).toEqual(left); //wtDom check

    $outer.remove();
  });

  it("should return font size", function () {
    var wtDom = new WalkontableDom();

    var $html = $('<style>.bigText{font: 12px serif;}</style><div class="bigText"><span id="testable"></span></div>').appendTo('body');

    var span = document.getElementById('testable');
    var compStyle = wtDom.getComputedStyle(span);
    expect(compStyle['fontSize'], '12px');

    $html.remove();
  });

  it("should return top border width", function () {
    var wtDom = new WalkontableDom();

    var $html = $('<style>.redBorder{border: 10px solid red;}</style><div class="redBorder" id="testable"></div>').appendTo('body');

    var div = document.getElementById('testable');
    var compStyle = wtDom.getComputedStyle(div);
    expect(compStyle['borderTopWidth'], '10px');

    $html.remove();
  });
});