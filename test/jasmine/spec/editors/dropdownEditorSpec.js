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

  describe("closing the editor", function() {
    it("should not close editor on scrolling", function() {
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

      waits(30);

      var dropdown = Handsontable.editors.getEditor('dropdown', hot);

      runs(function() {
        expect($(dropdown.htContainer).is(':visible')).toBe(true);
        selectCell(0, 0);
      });

      waits(30);

      runs(function() {
        $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
        $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

        dropdown.instance.view.wt.wtOverlays.topOverlay.scrollTo(3);
      });

      waits(30);

      runs(function() {
        expect($(dropdown.htContainer).is(':visible')).toBe(true);
      });
    });
  });

  it("should mark all invalid values as invalid, after pasting them into dropdown-type cells", function() {
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

    waits(40);

    runs(function() {
      expect(Handsontable.Dom.hasClass(getCell(0,0), 'htInvalid')).toBe(true);
      expect(Handsontable.Dom.hasClass(getCell(1,0), 'htInvalid')).toBe(true);
    });

  });

});
