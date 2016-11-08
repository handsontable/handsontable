describe('DropdownEditor', function() {
  var id = 'testContainer';

  var choices = ["yellow", "red", "orange", "green", "blue", "gray", "black", "white", "purple", "lime", "olive", "cyan"];

  var hot;

  beforeEach(function() {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function() {
    if (hot) {
      hot = null;
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("open editor", function() {
    // see https://github.com/handsontable/handsontable/issues/3380
    it("should not throw error while selecting the next cell by hitting enter key", function() {
      var spy = jasmine.createSpyObj('error', ['test']);
      var prevError = window.onerror;

      window.onerror = function(messageOrEvent, source, lineno, colno, error) {
        spy.test();
      };
      handsontable({
        columns: [{
          editor: 'dropdown',
          source: choices
        }]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');
      keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });
  });

  describe("closing the editor", function() {
    it("should not close editor on scrolling", function(done) {
      hot = handsontable({
        data: [
          ['', 'two', 'three'],
          ['four', 'five', 'six']
        ],
        columns: [
          {
            type: 'dropdown',
            source: choices
          },
          {},
          {}
        ]
      });

      selectCell(0, 0);
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

      hot.view.wt.wtOverlays.topOverlay.scrollTo(1);
      var dropdown = Handsontable.editors.getEditor('dropdown', hot);

      setTimeout(function () {
        expect($(dropdown.htContainer).is(':visible')).toBe(true);
        selectCell(0, 0);
      }, 30);

      setTimeout(function () {
        $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
        $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

        hot.view.wt.wtOverlays.topOverlay.scrollTo(3);
      }, 150);

      setTimeout(function () {
        expect($(dropdown.htContainer).is(':visible')).toBe(true);
        done();
      }, 200);
    });
  });

  it("should mark all invalid values as invalid, after pasting them into dropdown-type cells", function(done) {
    hot = handsontable({
      data: [
        ['', 'two', 'three'],
        ['four', 'five', 'six']
      ],
      columns: [
        {
          type: 'dropdown',
          source: choices
        },
        {},
        {}
      ]
    });

    populateFromArray(0, 0, [['invalid'], ['input']], null, null, "paste");

    setTimeout(function () {
      expect(Handsontable.Dom.hasClass(getCell(0,0), 'htInvalid')).toBe(true);
      expect(Handsontable.Dom.hasClass(getCell(1,0), 'htInvalid')).toBe(true);
      done();
    }, 40);
  });
});
