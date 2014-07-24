describe('DropdownEditor', function () {
  var id = 'testContainer';

  var choices = ["yellow", "red", "orange", "green", "blue", "gray", "black", "white", "purple", "lime", "olive", "cyan"];

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px; overflow: auto"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("closing the editor", function () {
    it("should not close editor on scrolling", function(){
      var hot = handsontable({
        data: [
        ['', 'two','three'],
        ['four', 'five', 'six']
        ],
        columns: [
        {
          type: 'dropdown',
          source: choices
        },
        {

        },
        {

        }
        ]
      });

      selectCell(0, 0);
      $(getCell(0, 0)).find('.htAutocompleteArrow').mousedown();
      $(getCell(0, 0)).find('.htAutocompleteArrow').mouseup();

      var dropdown = hot.getActiveEditor().$htContainer;

      hot.view.wt.wtScrollbars.vertical.scrollTo(1);

      waits(30);

      runs(function () {
        expect($(dropdown[0]).is(':visible')).toBe(true);
        selectCell(0, 0);
      });

      waits(30);

      runs(function () {
        $(getCell(0, 0)).find('.htAutocompleteArrow').mousedown();
        $(getCell(0, 0)).find('.htAutocompleteArrow').mouseup();

        dropdown.handsontable('getInstance').view.wt.wtScrollbars.vertical.scrollTo(3);
      });

      waits(30);

      runs(function () {
        expect($(dropdown[0]).is(':visible')).toBe(true);
      });
    });  
});

});