describe('Handsontable.Dom', () => {

  describe('offset', () => {
    const $window = $(window);
    const $forceScrollbar = $('<div id="forceScrollbar"></div>').css({
      position: 'absolute',
      height: '10000px',
      width: '10000px',
      top: 0,
      left: 0
    });

    beforeEach(function() {
      $forceScrollbar.appendTo(document.body);
      this.$div = $('<div id="test"></div>').appendTo($forceScrollbar);
      this.div = this.$div[0];
    });

    afterEach(function() {
      this.$div.remove();
      $forceScrollbar.remove();
    });

    describe('top', () => {
      it('should return offset top with position absolute', function() {
        this.$div.css({ position: 'absolute', top: 200 });

        expect(Handsontable.dom.offset(this.div).top).toEqual(200);
      });

      it('should return offset top with position absolute & scrolled window', function() {
        this.$div.css({ position: 'absolute', top: 200 });
        $window.scrollTop(1900);

        expect(Handsontable.dom.offset(this.div).top).toEqual(200);

        $window.scrollTop(0);
      });

      it('should return offset top with position fixed', function() {
        this.$div.css({ position: 'fixed', top: 200 });

        expect(Handsontable.dom.offset(this.div).top).toEqual(200);
      });

      it('should return offset top with position fixed & scrolled window', function() {
        this.$div.css({ position: 'fixed', top: 200 });
        $window.scrollTop(1900);

        expect(Handsontable.dom.offset(this.div).top).toEqual(2100); // this is the same jQuery offset returns

        $window.scrollTop(0);
      });
    });

    describe('left', () => {
      it('should return offset left with position absolute', function() {
        this.$div.css({ position: 'absolute', left: 200 });

        expect(Handsontable.dom.offset(this.div).left).toEqual(200);
      });

      it('should return offset left with position absolute & scrolled window', function() {
        this.$div.css({ position: 'absolute', left: 200 });
        $window.scrollLeft(1900);

        expect(Handsontable.dom.offset(this.div).left).toEqual(200);

        $window.scrollLeft(0);
      });

      it('should return offset left with position fixed', function() {
        this.$div.css({ position: 'fixed', left: 200 });

        expect(Handsontable.dom.offset(this.div).left).toEqual(200);
      });

      it('should return offset left with position fixed & scrolled window', function() {
        this.$div.css({ position: 'fixed', left: 200 });
        $window.scrollLeft(1900);

        expect(Handsontable.dom.offset(this.div).left).toEqual(2100); // this is the same jQuery offset returns

        $window.scrollLeft(0);
      });
    });
  });

  describe('isVisible', () => {
    it('should return true for appended table', () => {
      const $table = $('<table></table>').appendTo('body');

      expect(Handsontable.dom.isVisible($table[0])).toBe(true);

      $table.remove();
    });

    it('should return false for not appended table', () => {
      const $table = $('<table></table>');

      expect(Handsontable.dom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it('should return false for table with `display: none`', () => {
      const $table = $('<table style="display: none"></table>').appendTo('body');

      expect(Handsontable.dom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it('should return false for table with parent `display: none`', () => {
      const $div = $('<div style="display: none"></div>').appendTo('body');
      const $table = $('<table></table>').appendTo($div);

      expect(Handsontable.dom.isVisible($table[0])).toBe(false);

      $div.remove();
    });

    it('should return false for something detached from DOM', () => {
      const $table = $('<table><tr><td></td></tr></table>').appendTo('body');

      const TD = $table.find('td')[0];
      const TR = TD.parentNode;

      expect(Handsontable.dom.isVisible(TD)).toBe(true);
      TR.parentNode.removeChild(TR);
      expect(Handsontable.dom.isVisible(TD)).toBe(false);

      $table.remove();
    });
  });

  describe('outerHeight', () => {
    it('should return correct outerHeight for table', () => {
      const $table = $('<table style="border-width: 0;"><tbody><tr><td style="border: 1px solid black">' +
                      '<div style="height: 30px">test</div></td>' +
                      '</tr></tbody></table>').appendTo('body');

      expect(Handsontable.dom.outerHeight($table[0])).toBe(38); // this is according to current stylesheet
      expect($table.outerHeight()).toBe(38); // jQuery check to confirm

      $table.remove();
    });

    xit('should return correct outerHeight for table (with caption)', () => {
      const $table = $('<table style="border-width: 0;"><caption style="padding: 0; margin:0">' +
                       '<div style="height: 30px">caption</div></caption><tbody>' +
                       '<tr><td style="border: 1px solid black">' +
                       '<div style="height: 30px">test</div></td></tr></tbody></table>').appendTo('body');

      expect(Handsontable.dom.outerHeight($table[0])).toBe(68); // this is according to current stylesheet

      $table.remove();
    });
  });

  describe('outerWidth', () => {
    let element;

    beforeEach(() => {
      element = $('<div/>').appendTo('body');
    });

    afterEach(() => {
      element.remove();
      element = null;
    });

    it('should properly calculate element\'s width if it\'s an integer value', () => {
      element.css({ width: '10px' });

      expect(Handsontable.dom.outerWidth(element[0])).toBe(10);
    });

    it('should properly calculate element\'s width if it\'s a floating value (less than x.5)', () => {
      element.css({ width: '10.25px' });

      expect(Handsontable.dom.outerWidth(element[0])).toBe(11);
    });

    it('should properly calculate element\'s width if it\'s a floating value (equal or greater than x.5)', () => {
      element.css({ width: '10.5px' });

      expect(Handsontable.dom.outerWidth(element[0])).toBe(11);
    });
  });

  xit('should return correct offset for table cell (table with caption)', () => {
    const $table = $('<table style="border-width: 0;"><caption style="padding: 0; margin:0">' +
                     '<div style="height: 30px">caption</div></caption><tbody>' +
                     '<tr><td style="border: 1px solid black">' +
                     '<div style="height: 30px">test</div></td></tr></tbody></table>').appendTo('body');

    const tableOffset = Handsontable.dom.offset($table[0]);
    const tdOffset = Handsontable.dom.offset($table.find('td')[0]);

    expect(parseInt(tdOffset.left - tableOffset.left, 10)).toBeAroundValue(2); // this is according to current stylesheet
    expect(parseInt(tdOffset.top - tableOffset.top, 10)).toBeAroundValue(32); // this is according to current stylesheet

    $table.remove();
  });

  it('should return font size', () => {
    const $html = $('<style>.bigText{font: 12px serif;}</style><div class="bigText"><span id="testable"></span></div>')
      .appendTo('body');

    const span = document.getElementById('testable');
    const compStyle = Handsontable.dom.getComputedStyle(span);

    expect(compStyle.fontSize).toBe('12px');

    $html.remove();
  });

  it('should return top border width', () => {
    const $html = $('<style>.redBorder{border: 10px solid red;}</style><div class="redBorder" id="testable"></div>')
      .appendTo('body');

    const div = document.getElementById('testable');
    const compStyle = Handsontable.dom.getComputedStyle(div);

    expect(compStyle.borderTopWidth).toBe('10px');

    $html.remove();
  });

  it('should insert HTML properly', () => {
    const $html = $('<div id="testable"></div>').appendTo('body');
    const text = '<span>test<br>test</span>';
    const div = document.getElementById('testable');

    Handsontable.dom.fastInnerHTML(div, text);
    Handsontable.dom.fastInnerHTML(div, text);

    expect(div.childNodes[0].childNodes.length).toEqual(3);

    $html.remove();
  });

  it('should set the immediatePropagation properties properly for given event', () => {
    const event = document.createEvent('MouseEvents');

    event.initMouseEvent('mousedown', true, true, window, null, null, null, null, null,
      null, null, null, null, null, null);

    Handsontable.dom.stopImmediatePropagation(event);

    expect(event.isImmediatePropagationEnabled).toBe(false);

    expect(Handsontable.dom.isImmediatePropagationStopped(event)).toBe(true);
  });

  describe('getScrollableElement', () => {
    it('should return scrollable element with \'scroll\' value of \'overflow\', \'overflowX\' or \'overflowY\' property', () => {
      const $html = $([
        '<div style="overflow: scroll"><span class="overflow"></span></div>',
        '<div style="overflow-x: scroll"><span class="overflowX"></span></div>',
        '<div style="overflow-y: scroll"><span class="overflowY"></span></div>'
      ].join('')).appendTo('body');

      expect(Handsontable.dom.getScrollableElement($html.find('.overflow')[0])).toBe($html[0]);
      expect(Handsontable.dom.getScrollableElement($html.find('.overflowX')[0])).toBe($html[1]);
      expect(Handsontable.dom.getScrollableElement($html.find('.overflowY')[0])).toBe($html[2]);

      $html.remove();
    });

    it('should return scrollable element with \'auto\' value of \'overflow\' or \'overflowY\' property', () => {
      const $html = $([
        '<div style="overflow: auto; height: 50px;"><div class="knob" style="height: 100px"></div></div>',
        '<div style="overflow-y: auto; height: 50px;"><div class="knob" style="height: 100px"></div></div>',
        '<div style="overflow-y: auto; height: 50px;">',
        '<div>',
        '<div class="knob" style="height: 100px;"></div>',
        '</div>',
        '</div>'
      ].join('')).appendTo('body');

      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[0])).toBe($html[0]);
      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[1])).toBe($html[1]);
      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[2])).toBe($html[2]);

      $html.remove();
    });

    it('should return scrollable element with \'auto\' value of \'overflow\' or \'overflowX\' property', () => {
      const $html = $([
        '<div style="overflow: auto; width: 50px; height: 10px">' +
          '<div class="knob" style="width: 100px; height: 5px"></div></div>',
        '<div style="overflow-x: auto; width: 50px; height: 10px">' +
          '<div class="knob" style="width: 100px; height: 5px"></div></div>',
        '<div style="overflow-x: auto; width: 50px; height: 10px">',
        '<div>',
        '<div class="knob" style="width: 100px; height: 5px"></div>',
        '</div>',
        '</div>'
      ].join('')).appendTo('body');

      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[0])).toBe($html[0]);
      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[1])).toBe($html[1]);
      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[2])).toBe($html[2]);

      $html.remove();
    });

    it('should return window object as scrollable element', () => {
      const $html = $([
        '<div style="overflow: hidden; width: 50px; height: 10px">' +
          '<div class="knob" style="width: 100px; height: 5px"></div></div>',
        '<div style="width: 50px; height: 10px"><div class="knob" style="width: 100px; height: 5px"></div></div>'
      ].join('')).appendTo('body');

      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[0])).toBe(window);
      expect(Handsontable.dom.getScrollableElement($html.find('.knob')[1])).toBe(window);

      $html.remove();
    });
  });

  //
  // Handsontable.dom.addClass
  //
  describe('addClass', () => {
    it('should add class names as string to an element', () => {
      const element = document.createElement('div');

      expect(element.className).toBe('');

      Handsontable.dom.addClass(element, 'test');

      expect(element.className).toBe('test');

      Handsontable.dom.addClass(element, 'test test1 test2');

      expect(element.className).toBe('test test1 test2');

      Handsontable.dom.addClass(element, 'test3');

      expect(element.className).toBe('test test1 test2 test3');

      Handsontable.dom.addClass(element, '');

      expect(element.className).toBe('test test1 test2 test3');
    });

    it('should add class names as array to an element', () => {
      const element = document.createElement('div');

      expect(element.className).toBe('');

      Handsontable.dom.addClass(element, ['test']);

      expect(element.className).toBe('test');

      Handsontable.dom.addClass(element, ['test1', 'test2', 'test3']);

      expect(element.className).toBe('test test1 test2 test3');

      Handsontable.dom.addClass(element, 'test4');

      expect(element.className).toBe('test test1 test2 test3 test4');

      Handsontable.dom.addClass(element, '');

      expect(element.className).toBe('test test1 test2 test3 test4');
    });
  });

  //
  // Handsontable.dom.removeClass
  //
  describe('removeClass', () => {
    it('should remove class names as string from an element', () => {
      const element = document.createElement('div');

      element.className = 'test test1 test2 test3 test4';

      Handsontable.dom.removeClass(element, 'not-exists');

      expect(element.className).toBe('test test1 test2 test3 test4');

      Handsontable.dom.removeClass(element, 'test');

      expect(element.className).toBe('test1 test2 test3 test4');

      Handsontable.dom.removeClass(element, 'test test1 test4');

      expect(element.className).toBe('test2 test3');

      Handsontable.dom.removeClass(element, '');

      expect(element.className).toBe('test2 test3');
    });

    it('should remove class names as array from an element', () => {
      const element = document.createElement('div');

      element.className = 'test test1 test2 test3 test4';

      Handsontable.dom.removeClass(element, ['not-exists']);

      expect(element.className).toBe('test test1 test2 test3 test4');

      Handsontable.dom.removeClass(element, ['test']);

      expect(element.className).toBe('test1 test2 test3 test4');

      Handsontable.dom.removeClass(element, ['test', 'test1', 'test4']);

      expect(element.className).toBe('test2 test3');

      Handsontable.dom.removeClass(element, ['test', '', '']);

      expect(element.className).toBe('test2 test3');
    });
  });

  //
  // Handsontable.dom.hasClass
  //
  describe('hasClass', () => {
    it('should checks if an element has passed class name', () => {
      const element = document.createElement('div');

      element.className = 'test test1 test2 test3 test4';

      expect(Handsontable.dom.hasClass(element, 'not-exists')).toBe(false);
      expect(Handsontable.dom.hasClass(element, 'test3')).toBe(true);
      expect(Handsontable.dom.hasClass(element, 'test')).toBe(true);
      expect(Handsontable.dom.hasClass(element, '')).toBe(false);
    });
  });

});
