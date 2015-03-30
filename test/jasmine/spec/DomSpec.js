describe('Handsontable.Dom', function () {

  describe('offset', function () {
    var $window = $(window),
      $forceScrollbar = $('<div id="forceScrollbar"></div>').css({
        position: 'absolute',
        height: '4000px',
        width: '4000px',
        top: 0,
        left: 0
      });

    beforeEach(function () {
      $forceScrollbar.appendTo(document.body);
      this.$div = $('<div id="test"></div>').appendTo($forceScrollbar);
      this.div = this.$div[0];
    });

    afterEach(function () {
      this.$div.remove();
      $forceScrollbar.remove();
    });

    describe('top', function () {
      it("should return offset top with position absolute", function () {
        this.$div.css({position: 'absolute', top: 200});
        expect(Handsontable.Dom.offset(this.div).top).toEqual(200);
      });

      it("should return offset top with position absolute & scrolled window", function () {
        this.$div.css({position: 'absolute', top: 200});
        $window.scrollTop(1900);
        expect(Handsontable.Dom.offset(this.div).top).toEqual(200);
        $window.scrollTop(0);
      });

      it("should return offset top with position fixed", function () {
        this.$div.css({position: 'fixed', top: 200});
        expect(Handsontable.Dom.offset(this.div).top).toEqual(200);
      });

      it("should return offset top with position fixed & scrolled window", function () {
        this.$div.css({position: 'fixed', top: 200});
        $window.scrollTop(1900);
        expect(Handsontable.Dom.offset(this.div).top).toEqual(2100); //this is the same jQuery offset returns
        $window.scrollTop(0);
      });
    });

    describe('left', function () {
      it("should return offset left with position absolute", function () {
        this.$div.css({position: 'absolute', left: 200});
        expect(Handsontable.Dom.offset(this.div).left).toEqual(200);
      });

      it("should return offset left with position absolute & scrolled window", function () {
        this.$div.css({position: 'absolute', left: 200});
        $window.scrollLeft(1900);
        expect(Handsontable.Dom.offset(this.div).left).toEqual(200);
        $window.scrollLeft(0);
      });

      it("should return offset left with position fixed", function () {
        this.$div.css({position: 'fixed', left: 200});
        expect(Handsontable.Dom.offset(this.div).left).toEqual(200);
      });

      it("should return offset left with position fixed & scrolled window", function () {
        this.$div.css({position: 'fixed', left: 200});
        $window.scrollLeft(1900);
        expect(Handsontable.Dom.offset(this.div).left).toEqual(2100); //this is the same jQuery offset returns
        $window.scrollLeft(0);
      });
    });
  });

  describe('isVisible', function () {
    it("should return true for appended table", function () {
      var $table = $('<table></table>').appendTo('body');

      expect(Handsontable.Dom.isVisible($table[0])).toBe(true);

      $table.remove();
    });

    it("should return false for not appended table", function () {
      var $table = $('<table></table>');

      expect(Handsontable.Dom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it("should return false for table with `display: none`", function () {
      var $table = $('<table style="display: none"></table>').appendTo('body');

      expect(Handsontable.Dom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it("should return false for table with parent `display: none`", function () {
      var $div = $('<div style="display: none"></div>').appendTo('body');
      var $table = $('<table></table>').appendTo($div);

      expect(Handsontable.Dom.isVisible($table[0])).toBe(false);

      $table.remove();
    });

    it("should return false for something detached from DOM", function () {
      var $table = $('<table><tr><td></td></tr></table>').appendTo('body');

      var TD = $table.find('td')[0];
      var TR = TD.parentNode;
      expect(Handsontable.Dom.isVisible(TD)).toBe(true);
      TR.parentNode.removeChild(TR);
      expect(Handsontable.Dom.isVisible(TD)).toBe(false);

      $table.remove();
    });
  });

  describe('outerHeight', function () {
    it('should return correct outerHeight for table', function () {
      var $table = $('<table style="border-width: 0;"><tbody><tr><td style="border: 1px solid black"><div style="height: 30px">test</div></td></tr></tbody></table>').appendTo('body');

      expect(Handsontable.Dom.outerHeight($table[0])).toBe(38); //this is according to current stylesheet
      expect($table.outerHeight()).toBe(38); //jQuery check to confirm

      $table.remove();
    });

    it('should return correct outerHeight for table (with caption)', function () {
      var $table = $('<table style="border-width: 0;"><caption style="padding: 0; margin:0"><div style="height: 30px">caption</div></caption><tbody><tr><td style="border: 1px solid black"><div style="height: 30px">test</div></td></tr></tbody></table>').appendTo('body');

      expect(Handsontable.Dom.outerHeight($table[0])).toBe(68); //this is according to current stylesheet
      //expect($table.outerHeight()).toBe(68); //jQuery check is broken because of a bug in Firefox! (Firefox ignores caption, and so does jQuery)

      $table.remove();
    });
  });

  it('should return correct offset for table cell (table with caption)', function () {
    var $table = $('<table style="border-width: 0;"><caption style="padding: 0; margin:0"><div style="height: 30px">caption</div></caption><tbody><tr><td style="border: 1px solid black"><div style="height: 30px">test</div></td></tr></tbody></table>').appendTo('body');

    var tableOffset = Handsontable.Dom.offset($table[0]);
    var tdOffset = Handsontable.Dom.offset($table.find('td')[0]);

    expect(tdOffset.left - tableOffset.left).toBe(2); //this is according to current stylesheet
    //expect($table.outerHeight()).toBe(68); //jQuery check is broken because of a bug in Firefox! (Firefox ignores caption, and so does jQuery)
    expect(tdOffset.top - tableOffset.top).toBe(32); //this is according to current stylesheet
    //expect($table.outerHeight()).toBe(68); //jQuery check is broken because of a bug in Firefox! (Firefox ignores caption, and so does jQuery)

    $table.remove();
  });

  it("should return font size", function () {
    var $html = $('<style>.bigText{font: 12px serif;}</style><div class="bigText"><span id="testable"></span></div>').appendTo('body');

    var span = document.getElementById('testable');
    var compStyle = Handsontable.Dom.getComputedStyle(span);
    expect(compStyle['fontSize'], '12px');

    $html.remove();
  });

  it("should return top border width", function () {
    var $html = $('<style>.redBorder{border: 10px solid red;}</style><div class="redBorder" id="testable"></div>').appendTo('body');

    var div = document.getElementById('testable');
    var compStyle = Handsontable.Dom.getComputedStyle(div);
    expect(compStyle['borderTopWidth'], '10px');

    $html.remove();
  });

  it("should insert HTML properly", function () {
    var $html = $('<div id="testable"></div>').appendTo('body');
    var text = '<span>test<br>test</span>';
    var div = document.getElementById('testable');

    Handsontable.Dom.fastInnerHTML(div, text);
    Handsontable.Dom.fastInnerHTML(div, text);

    expect(div.childNodes[0].childNodes.length).toEqual(3);

    $html.remove();
  });

  it("should set the immediatePropagation properties properly for given event", function () {
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown',true,true,window, null, null, null, null, null, null, null, null, null ,null, null);

    expect(event.isImmediatePropagationEnabled).toBeUndefined();
    expect(event.isImmediatePropagationStopped).toBeUndefined();

    Handsontable.Dom.enableImmediatePropagation(event);

    expect(event.isImmediatePropagationEnabled).toBe(true);

    event.stopImmediatePropagation();

    expect(event.isImmediatePropagationEnabled).toBe(false);
    expect(event.isImmediatePropagationStopped()).toBe(true);
  });

  describe('getScrollableElement', function() {
    it("should return scrollable element with 'scroll' value of 'overflow', 'overflowX' or 'overflowY' property", function () {
      var $html = $([
        '<div style="overflow: scroll"><span class="overflow"></span></div>',
        '<div style="overflow-x: scroll"><span class="overflowX"></span></div>',
        '<div style="overflow-y: scroll"><span class="overflowY"></span></div>'
      ].join('')).appendTo('body');

      expect(Handsontable.Dom.getScrollableElement($html.find('.overflow')[0])).toBe($html[0]);
      expect(Handsontable.Dom.getScrollableElement($html.find('.overflowX')[0])).toBe($html[1]);
      expect(Handsontable.Dom.getScrollableElement($html.find('.overflowY')[0])).toBe($html[2]);

      $html.remove();
    });

    it("should return scrollable element with 'auto' value of 'overflow' or 'overflowY' property", function () {
      var $html = $([
        '<div style="overflow: auto; height: 50px;"><div class="knob" style="height: 100px"></div></div>',
        '<div style="overflow-y: auto; height: 50px;"><div class="knob" style="height: 100px"></div></div>',
        '<div style="overflow-y: auto; height: 50px;">',
          '<div>',
            '<div class="knob" style="height: 100px;"></div>',
          '</div>',
        '</div>'
      ].join('')).appendTo('body');

      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[0])).toBe($html[0]);
      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[1])).toBe($html[1]);
      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[2])).toBe($html[2]);

      $html.remove();
    });

    it("should return scrollable element with 'auto' value of 'overflow' or 'overflowX' property", function () {
      var $html = $([
        '<div style="overflow: auto; width: 50px; height: 10px"><div class="knob" style="width: 100px; height: 5px"></div></div>',
        '<div style="overflow-x: auto; width: 50px; height: 10px"><div class="knob" style="width: 100px; height: 5px"></div></div>',
        '<div style="overflow-x: auto; width: 50px; height: 10px">',
          '<div>',
            '<div class="knob" style="width: 100px; height: 5px"></div>',
          '</div>',
        '</div>'
      ].join('')).appendTo('body');

      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[0])).toBe($html[0]);
      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[1])).toBe($html[1]);
      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[2])).toBe($html[2]);

      $html.remove();
    });

    it("should return window object as scrollable element", function () {
      var $html = $([
        '<div style="overflow: hidden; width: 50px; height: 10px"><div class="knob" style="width: 100px; height: 5px"></div></div>',
        '<div style="width: 50px; height: 10px"><div class="knob" style="width: 100px; height: 5px"></div></div>'
      ].join('')).appendTo('body');

      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[0])).toBe(window);
      expect(Handsontable.Dom.getScrollableElement($html.find('.knob')[1])).toBe(window);

      $html.remove();
    });
  });

  //
  // Handsontable.Dom.isChildOfWebComponentTable
  //
  describe('isChildOfWebComponentTable', function() {
    it("should return correct Boolean value depending on whether an element exists in `hot-table` or not", function () {
      // skip if browser not support Shadow DOM natively
      if (!document.createElement('div').createShadowRoot) {
        return;
      }
      var hotTable = document.createElement('hot-table');
      var outsideDiv = document.createElement('div');

      expect(Handsontable.Dom.isChildOfWebComponentTable(hotTable)).toBe(true);
      expect(Handsontable.Dom.isChildOfWebComponentTable(outsideDiv)).toBe(false);

      var hotTableDiv = document.createElement('div');
      hotTable.appendChild(hotTableDiv);

      expect(Handsontable.Dom.isChildOfWebComponentTable(hotTableDiv)).toBe(true);

      var fragment = document.createDocumentFragment();

      expect(Handsontable.Dom.isChildOfWebComponentTable(fragment)).toBe(false);

      var myElement = document.createElement('my-element');

      expect(Handsontable.Dom.isChildOfWebComponentTable(myElement)).toBe(false);

      var shadowRoot = myElement.createShadowRoot();
      var insideDiv = shadowRoot.appendChild(document.createElement('div'));
      hotTable.createShadowRoot().appendChild(myElement);

      expect(Handsontable.Dom.isChildOfWebComponentTable(myElement)).toBe(true);
      expect(Handsontable.Dom.isChildOfWebComponentTable(insideDiv)).toBe(true);
    });
  });

  //
  // Handsontable.Dom.polymerWrap
  //
  describe('polymerWrap', function() {
    it("should wrap element into polymer wrapper if exists", function () {
      expect(Handsontable.Dom.polymerWrap(1)).toBe(1);

      window.wrap = function() { return 'wrapped'; };
      window.Polymer = {};

      expect(Handsontable.Dom.polymerWrap(1)).toBe('wrapped');

      // Test https://github.com/handsontable/handsontable/issues/2283
      window.wrap = document.createElement('div');

      expect(Handsontable.Dom.polymerWrap(1)).toBe(1);

      delete window.wrap;
      delete window.Polymer;
    });
  });

  //
  // Handsontable.Dom.polymerUnwrap
  //
  describe('polymerUnwrap', function() {
    it("should unwrap element from polymer wrapper if exists", function () {
      expect(Handsontable.Dom.polymerUnwrap('wrapped')).toBe('wrapped');

      window.unwrap = function() { return 1; };
      window.Polymer = {};

      expect(Handsontable.Dom.polymerUnwrap('wrapped')).toBe(1);

      window.unwrap = document.createElement('div');

      expect(Handsontable.Dom.polymerUnwrap('wrapped')).toBe('wrapped');

      delete window.unwrap;
      delete window.Polymer;
    });
  });

  //
  // Handsontable.Dom.addClass
  //
  describe('addClass', function() {
    it("should add class names as string to an element", function () {
      var element = document.createElement('div');

      expect(element.className).toBe('');

      Handsontable.Dom.addClass(element, 'test');

      expect(element.className).toBe('test');

      Handsontable.Dom.addClass(element, 'test test1 test2');

      expect(element.className).toBe('test test1 test2');

      Handsontable.Dom.addClass(element, 'test3');

      expect(element.className).toBe('test test1 test2 test3');

      Handsontable.Dom.addClass(element, undefined);

      expect(element.className).toBe('test test1 test2 test3');
    });

    it("should add class names as array to an element", function () {
      var element = document.createElement('div');

      expect(element.className).toBe('');

      Handsontable.Dom.addClass(element, ['test']);

      expect(element.className).toBe('test');

      Handsontable.Dom.addClass(element, ['test1', 'test2', 'test3']);

      expect(element.className).toBe('test test1 test2 test3');

      Handsontable.Dom.addClass(element, 'test4');

      expect(element.className).toBe('test test1 test2 test3 test4');
    });
  });

  //
  // Handsontable.Dom.removeClass
  //
  describe('removeClass', function() {
    it("should remove class names as string from an element", function () {
      var element = document.createElement('div');

      element.className = 'test test1 test2 test3 test4';

      Handsontable.Dom.removeClass(element, 'not-exists');

      expect(element.className).toBe('test test1 test2 test3 test4');

      Handsontable.Dom.removeClass(element, 'test');

      expect(element.className).toBe('test1 test2 test3 test4');

      Handsontable.Dom.removeClass(element, 'test test1 test4');

      expect(element.className).toBe('test2 test3');

      Handsontable.Dom.removeClass(element, undefined);

      expect(element.className).toBe('test2 test3');
    });

    it("should remove class names as array from an element", function () {
      var element = document.createElement('div');

      element.className = 'test test1 test2 test3 test4';

      Handsontable.Dom.removeClass(element, ['not-exists']);

      expect(element.className).toBe('test test1 test2 test3 test4');

      Handsontable.Dom.removeClass(element, ['test']);

      expect(element.className).toBe('test1 test2 test3 test4');

      Handsontable.Dom.removeClass(element, ['test', 'test1', 'test4']);

      expect(element.className).toBe('test2 test3');
    });
  });

  //
  // Handsontable.Dom.hasClass
  //
  describe('hasClass', function() {
    it("should checks if an element has passed class name", function () {
      var element = document.createElement('div');

      element.className = 'test test1 test2 test3 test4';

      expect(Handsontable.Dom.hasClass(element, 'not-exists')).toBe(false);
      expect(Handsontable.Dom.hasClass(element, 'test3')).toBe(true);
      expect(Handsontable.Dom.hasClass(element, 'test')).toBe(true);
    });
  });

});
