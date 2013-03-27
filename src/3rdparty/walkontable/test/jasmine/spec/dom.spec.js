describe('WalkontableDom', function () {

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
});