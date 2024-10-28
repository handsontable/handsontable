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

  describe('cursor icon', () => {
    it('should change the cursor to `grab` when mouse is over a selected header and `manualColumMove` is enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnMove: true
      });

      const $headers = spec().$container.find('.ht_clone_top thead th');
      const $header = $headers.eq(0);

      $header.simulate('mousedown');
      $header.simulate('mouseup');

      $header.simulate('mouseover');
      expect($header.css('cursor')).toEqual('grab');

      $header.eq(1).simulate('mouseover');
      expect($headers.eq(1).css('cursor')).toEqual('default');

      const $cells = spec().$container.find('.ht_master tbody td');
      const $cell = $cells.eq(0);

      $cell.simulate('mouseover');
      expect($cell.css('cursor')).toEqual('default');
    });

    it('should change the cursor to `grabbing` when holding LMB over a selected header and `manualColumMove` is enabled', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnMove: true
      });

      const $headers = spec().$container.find('.ht_clone_top thead th');
      const $header = $headers.eq(0);

      $header.simulate('mousedown');
      $header.simulate('mouseup');

      $header.simulate('mouseover');
      $header.simulate('mousedown');

      expect($(hot.rootElement).attr('class')).toContain('on-moving--columns');
      expect($header.css('cursor')).toEqual('grabbing');
    });

    it('should change the cursor to `grabbing` when holding LMB on a selected header and moving the cursor anywhere ' +
    'else within the table (and `manualColumMove` is enabled)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnMove: true
      });

      const $headers = spec().$container.find('.ht_clone_top thead th');
      const $header = $headers.eq(0);

      $header.simulate('mousedown');
      $header.simulate('mouseup');

      $header.simulate('mouseover');
      $header.simulate('mousedown');

      expect($(hot.rootElement).attr('class')).toContain('on-moving--columns');
      expect($header.css('cursor')).toEqual('grabbing');

      expect($headers.eq(1).css('cursor')).toEqual('grabbing');

      const $cells = spec().$container.find('.ht_master tbody td');

      expect($cells.eq(0).css('cursor')).toEqual('grabbing');
      expect($cells.eq(5).css('cursor')).toEqual('grabbing');
      expect($cells.eq(10).css('cursor')).toEqual('grabbing');

      expect($('.ht__manualColumnMove--guideline').eq(0).css('cursor')).toEqual('grabbing');
    });
  });
});
