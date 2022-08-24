describe('manualColumnMove', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('UI', () => {
    it('should append UI elements to wtHider after click on column header', () => {
      handsontable({
        data: createSpreadsheetData(30, 30),
        colHeaders: true,
        manualColumnMove: true
      });

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(0)');

      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualColumnMove--guideline').length).toBe(1);
      expect(spec().$container.find('.ht__manualColumnMove--backlight').length).toBe(1);
    });

    it('should part of UI elements be visible on dragging action', () => {
      handsontable({
        data: createSpreadsheetData(30, 30),
        colHeaders: true,
        manualColumnMove: true
      });

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(0)');

      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualColumnMove--guideline:visible').length).toBe(0);
      expect(spec().$container.find('.ht__manualColumnMove--backlight:visible').length).toBe(1);
    });

    it('should all of UI elements be visible on dragging action', () => {
      handsontable({
        data: createSpreadsheetData(30, 30),
        colHeaders: true,
        manualColumnMove: true
      });

      const $headers = [
        spec().$container.find('thead tr:eq(0) th:eq(0)'),
        spec().$container.find('thead tr:eq(0) th:eq(1)'),
        spec().$container.find('thead tr:eq(0) th:eq(2)'),
      ];

      $headers[0].simulate('mousedown');
      $headers[0].simulate('mouseup');
      $headers[0].simulate('mousedown');
      $headers[1].simulate('mouseover');
      $headers[2].simulate('mouseover');

      expect(spec().$container.find('.ht__manualColumnMove--guideline:visible').length).toBe(1);
      expect(spec().$container.find('.ht__manualColumnMove--backlight:visible').length).toBe(1);
    });

    it('should set proper z-index of the backlight and guideline element and be greater than top overlay z-index', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      const header = spec().$container.find('thead tr:eq(0) th:eq(2)');

      header.simulate('mousedown');
      header.simulate('mouseup');
      header.simulate('mousedown');

      expect($('.ht__manualColumnMove--backlight').css('z-index')).toBeGreaterThan(getTopClone().css('z-index'));
      expect($('.ht__manualColumnMove--guideline').css('z-index')).toBeGreaterThan(getTopClone().css('z-index'));
    });

    it('should not run moving ui if mousedown was fired on sorting element', () => {
      handsontable({
        data: createSpreadsheetData(30, 30),
        colHeaders: true,
        manualColumnMove: true,
        columnSorting: true
      });

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(6)');
      const $summaryElement = $headerTH.find('.columnSorting');

      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');

      const $backlight = spec().$container.find('.ht__manualColumnMove--backlight')[0];

      $summaryElement.simulate('mousedown');

      const displayProp = $backlight.currentStyle ?
        $backlight.currentStyle.display : getComputedStyle($backlight, null).display;

      expect(displayProp).toEqual('none');
    });

    it('should run moving ui if mousedown was fired on sorting element when sort header action is not enabled', function() {
      handsontable({
        data: createSpreadsheetData(30, 30),
        colHeaders: true,
        manualColumnMove: true,
        columnSorting: {
          headerAction: false
        }
      });

      const $headerTH = this.$container.find('thead tr:eq(0) th:eq(6)');
      const $summaryElement = $headerTH.find('.columnSorting');

      $summaryElement.simulate('mousedown');

      const $backlight = this.$container.find('.ht__manualColumnMove--backlight');

      expect($backlight.length).toBe(0);
    });
  });
});
