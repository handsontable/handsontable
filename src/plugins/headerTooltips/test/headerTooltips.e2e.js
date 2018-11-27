describe('Header tooltips', () => {
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

  describe('initialization', () => {
    it('should be initialized by HOT config', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        headerTooltips: {
          columns: true,
          rows: true,
          onlyTrimmed: false
        },
        width: 500,
        height: 300
      });

      const headers = hot.view.wt.wtTable.THEAD.childNodes[0].childNodes;

      for (let i = 0; i < headers.length; i++) {
        const title = headers[i].getAttribute('title');
        expect(headers[i].getAttribute('title')).not.toBe(null);
        expect(title).toEqual(headers[i].textContent);
      }
    });

    it('should be initialized by the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        width: 500,
        height: 300
      });

      hot.updateSettings({
        headerTooltips: {
          columns: true,
          rows: true,
          onlyTrimmed: false
        }
      });

      const headers = hot.view.wt.wtTable.THEAD.childNodes[0].childNodes;

      for (let i = 0; i < headers.length; i++) {
        const title = headers[i].getAttribute('title');
        expect(headers[i].getAttribute('title')).not.toBe(null);
        expect(title).toEqual(headers[i].textContent);
      }
    });

    it('should be disabled by the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        headerTooltips: {
          columns: true,
          rows: true,
          onlyTrimmed: false
        },
        width: 500,
        height: 300
      });

      hot.getPlugin('headerTooltips').disablePlugin();

      const headers = hot.view.wt.wtTable.THEAD.childNodes[0].childNodes;

      for (let i = 0; i < headers.length; i++) {
        expect(headers[i].getAttribute('title')).toBe(null);
      }
    });

    it('should be re-enabled by the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        headerTooltips: {
          columns: true,
          rows: true,
          onlyTrimmed: false
        },
        width: 500,
        height: 300
      });

      hot.getPlugin('headerTooltips').disablePlugin();

      hot.getPlugin('headerTooltips').enablePlugin();
      hot.render();

      const headers = hot.view.wt.wtTable.THEAD.childNodes[0].childNodes;

      for (let i = 0; i < headers.length; i++) {
        const title = headers[i].getAttribute('title');
        expect(headers[i].getAttribute('title')).not.toBe(null);
        expect(title).toEqual(headers[i].textContent);
      }
    });

  });

  describe('adding the title attribute', () => {
    it('should add the "title" attribute to both rows and columns, if both "rows" and "columns" properties are set to "true"', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        headerTooltips: {
          columns: true,
          rows: true,
          onlyTrimmed: false
        },
        width: 500,
        height: 300
      });

      const $colHeaders = $('thead th');
      const $rowHeaders = $('tbody th');

      $colHeaders.each(function() {
        expect($(this).attr('title')).toEqual($(this).text());
      });

      $rowHeaders.each(function() {
        expect($(this).attr('title')).toEqual($(this).text());
      });
    });

    it('should add the "title" attribute to only rows, of only "rows" property is set to "true"', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        headerTooltips: {
          columns: false,
          rows: true,
          onlyTrimmed: false
        },
        width: 500,
        height: 300
      });

      const $colHeaders = $('thead th');
      const $rowHeaders = $('tbody th');

      $colHeaders.each(function() {
        expect($(this).attr('title')).not.toBeDefined();
      });

      $rowHeaders.each(function() {
        expect($(this).attr('title')).toEqual($(this).text());
      });
    });

    it('should add the "title" attribute to only columns, of only "columns" property is set to "true"', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: true,
        headerTooltips: {
          columns: true,
          rows: false,
          onlyTrimmed: false
        },
        width: 500,
        height: 300
      });

      const $colHeaders = $('thead th');
      const $rowHeaders = $('tbody th');

      $colHeaders.each(function() {
        expect($(this).attr('title')).toEqual($(this).text());
      });

      $rowHeaders.each(function() {
        expect($(this).attr('title')).toEqual(null);
      });
    });

    it('should add the "title" attribute only if the header content exceeds the header with, when onlyTrimmed property is set to true', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        colHeaders: ['very long column header', 'B', 'very long column header', 'C'],
        rowHeaders: ['very long column header', '1', 'very long column header', '3'],
        colWidths: [20, 20, 20, 20, 20, 20, 20],
        headerTooltips: {
          columns: true,
          rows: true,
          onlyTrimmed: true
        },
        width: 500,
        height: 300
      });

      expect($('thead th').eq(1).attr('title')).toEqual($('thead th').eq(1).text());
      expect($('thead th').eq(2).attr('title')).not.toBeDefined();
      expect($('thead th').eq(3).attr('title')).toEqual($('thead th').eq(3).text());
      expect($('thead th').eq(4).attr('title')).not.toBeDefined();

      expect($('tbody th').eq(0).attr('title')).toEqual($('tbody th').eq(0).text());
      expect($('tbody th').eq(1).attr('title')).not.toBeDefined();
      expect($('tbody th').eq(2).attr('title')).toEqual($('tbody th').eq(2).text());
      expect($('tbody th').eq(3).attr('title')).not.toBeDefined();
    });

  });

});
