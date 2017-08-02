describe('manualRowMove', () => {
  const id = 'testContainer';

  beforeEach(function () {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('UI', () => {
    it('should append UI elements to wtHider after click on row header', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualRowMove--guideline').length).toBe(1);
      expect(spec().$container.find('.ht__manualRowMove--backlight').length).toBe(1);
    });

    it('should part of UI elements be visible on dragging action', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualRowMove--guideline:visible').length).toBe(0);
      expect(spec().$container.find('.ht__manualRowMove--backlight:visible').length).toBe(1);
    });

    it('should all of UI elements be visible on dragging action', function () {
      handsontable({
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

      expect(spec().$container.find('.ht__manualRowMove--guideline:visible').length).toBe(1);
      expect(spec().$container.find('.ht__manualRowMove--backlight:visible').length).toBe(1);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row above first header)', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetInsideFn = target;
        }
      });
      const $fistHeader = this.$container.find('tbody tr:eq(0) th:eq(0)');
      let targetInsideFn;

      this.$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
      this.$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

      $fistHeader.simulate('mouseover');
      $fistHeader.simulate('mousemove', {
        clientY: $fistHeader.offset().bottom - $fistHeader.height() - 50
      });
      $fistHeader.simulate('mouseup');

      expect(targetInsideFn).toEqual(0);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the top of first header)', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        colHeaders: true,
        beforeRowMove: (rows, target) => {
          targetInsideFn = target;
        }
      });
      const $fistHeader = this.$container.find('tbody tr:eq(0) th:eq(0)');
      let targetInsideFn;

      this.$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
      this.$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

      $fistHeader.simulate('mouseover');
      $fistHeader.simulate('mousemove', {
        clientY: $fistHeader.offset().bottom - $fistHeader.height()
      });
      $fistHeader.simulate('mouseup');

      expect(targetInsideFn).toEqual(0);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the middle of the table)', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetInsideFn = target;
        }
      });
      let targetInsideFn;

      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      this.$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
      this.$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousemove');
      this.$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');

      expect(targetInsideFn).toEqual(2);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the top of last header)', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetInsideFn = target;
        }
      });
      let targetInsideFn;

      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      this.$container.find('tbody tr:eq(29) th:eq(0)').simulate('mouseover');
      this.$container.find('tbody tr:eq(29) th:eq(0)').simulate('mousemove');
      this.$container.find('tbody tr:eq(29) th:eq(0)').simulate('mouseup');

      expect(targetInsideFn).toEqual(29);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the bottom of last header)', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetInsideFn = target;
        }
      });
      const $lastHeader = this.$container.find('tbody tr:eq(29) th:eq(0)');
      let targetInsideFn;

      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      $lastHeader.simulate('mouseover');
      $lastHeader.simulate('mousemove', {
        clientY: $lastHeader.offset().top + $lastHeader.height()
      });
      $lastHeader.simulate('mouseup');

      expect(targetInsideFn).toEqual(30);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row below last header)', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetInsideFn = target;
        }
      });
      const $lastHeader = this.$container.find('tbody tr:eq(29) th:eq(0)');
      let targetInsideFn;

      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      $lastHeader.simulate('mouseover');
      $lastHeader.simulate('mousemove', {
        clientY: $lastHeader.offset().top + $lastHeader.height() + 200
      });
      $lastHeader.simulate('mouseup');

      expect(targetInsideFn).toEqual(30);
    });
  });
});
