describe('manualRowMove', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('UI', function() {
    it('should append UI elements to wtHider after click on row header', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      var $headerTH = this.$container.find('tbody tr:eq(0) th:eq(0)');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(this.$container.find('.ht__manualRowMove--guideline').length).toBe(1);
      expect(this.$container.find('.ht__manualRowMove--backlight').length).toBe(1);
    });

    it('should part of UI elements be visible on dragging action', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      var $headerTH = this.$container.find('tbody tr:eq(0) th:eq(0)');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(this.$container.find('.ht__manualRowMove--guideline:visible').length).toBe(0);
      expect(this.$container.find('.ht__manualRowMove--backlight:visible').length).toBe(1);
    });

    it('should all of UI elements be visible on dragging action', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      var $headers = [
        this.$container.find('tbody tr:eq(0) th:eq(0)'),
        this.$container.find('tbody tr:eq(1) th:eq(0)'),
        this.$container.find('tbody tr:eq(2) th:eq(0)'),
      ];

      $headers[0].simulate('mousedown');
      $headers[0].simulate('mouseup');
      $headers[0].simulate('mousedown');
      $headers[1].simulate('mouseover');
      $headers[2].simulate('mouseover');

      expect(this.$container.find('.ht__manualRowMove--guideline:visible').length).toBe(1);
      expect(this.$container.find('.ht__manualRowMove--backlight:visible').length).toBe(1);
    });
  });
});
