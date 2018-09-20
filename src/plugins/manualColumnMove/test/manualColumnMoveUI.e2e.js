describe('manualColumnMove', () => {
  const id = 'testContainer';
  const arrayOfArrays = Handsontable.helper.createSpreadsheetData(30, 30);

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
    it('should append UI elements to wtHider after click on row header', () => {
      handsontable({
        data: arrayOfArrays.slice(),
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
        data: arrayOfArrays.slice(),
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
        data: arrayOfArrays.slice(),
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

    it('should set properly width for the backlight element when stretchH is enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 5),
        width: 600,
        colHeaders: true,
        stretchH: 'all',
        manualColumnMove: true
      });

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(1)');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualColumnMove--backlight')[0].offsetWidth).toBe($headerTH[0].offsetWidth);
    });

    it('should set properly width for the backlight element when stretchH is enabled and column order was changed', () => {
      handsontable({
        data: [
          { id: 1, flag: 'EUR', currencyCode: 'EUR', currency: 'Euro', level: 0.9033, units: 'EUR / USD', asOf: '08/19/2015', onedChng: 0.0026 },
        ],
        width: 600,
        colHeaders: true,
        stretchH: 'all',
        manualColumnMove: [2, 4, 6, 3, 1, 0],
        columns: [
          { data: 'id', type: 'numeric', width: 40 },
          { data: 'currencyCode', type: 'text' },
          { data: 'currency', type: 'text' },
          { data: 'level', type: 'numeric', numericFormat: { pattern: '0.0000' } },
          { data: 'units', type: 'text' },
          { data: 'asOf', type: 'date', dateFormat: 'MM/DD/YYYY' },
          { data: 'onedChng', type: 'numeric', numericFormat: { pattern: '0.00%' } }
        ]
      });

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(6)');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualColumnMove--backlight')[0].offsetWidth).toBe($headerTH[0].offsetWidth);
    });

    it('should set proper left position of the backlight element when colWidths is undefined', () => {
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

      expect(spec().$container.find('.ht__manualColumnMove--backlight')[0].offsetLeft).toBe(100);
    });

    it('should set proper left position of the backlight element when colWidths is defined', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true,
        rowHeaders: true,
        colWidths: 100,
        colHeaders: true,
      });

      const header = spec().$container.find('thead tr:eq(0) th:eq(2)');

      header.simulate('mousedown');
      header.simulate('mouseup');
      header.simulate('mousedown');

      expect(spec().$container.find('.ht__manualColumnMove--backlight')[0].offsetLeft).toBe(150);
    });

    it('should not run moving ui if mousedown was fired on sorting element', () => {
      handsontable({
        data: arrayOfArrays.slice(),
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

      const displayProp = $backlight.currentStyle ? $backlight.currentStyle.display : getComputedStyle($backlight, null).display;
      expect(displayProp).toEqual('none');
    });

    it('should run moving ui if mousedown was fired on sorting element when sort header action is not enabled', function() {
      handsontable({
        data: arrayOfArrays.slice(),
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
