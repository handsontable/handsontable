describe('RowHeader', () => {
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

  it('should not show row headers by default', () => {
    handsontable();

    expect(spec().$container.find('tbody th').length).toEqual(0);
  });

  it('should show row headers if true', () => {
    handsontable({
      rowHeaders: true
    });

    expect(spec().$container.find('tbody th').length).toBeGreaterThan(0);
  });

  it('should properly calculate colHeaders\' overlay width', () => {
    handsontable({
      rowHeaders: true,
      startCols: 1,
      startRows: 5,
      width: 150,
      height: 126,
      rowHeights: 25,
    });

    const cloneTop = spec().$container.find('.ht_clone_inline_start');
    const masterHolder = spec().$container.find('.ht_master .wtHolder');

    expect(cloneTop.height()).toBe(masterHolder.height());

    alter('insert_col_start', undefined, 10);

    expect(cloneTop.height()).toBeLessThan(masterHolder.height());
  });

  it('should show row headers numbered from `0` to `n` by default (where `n` is number of rows)', () => {
    const startRows = 5;

    handsontable({
      startRows: 5,
      rowHeaders: true
    });

    const ths = getInlineStartClone().find('tbody th');

    expect(ths.length).toEqual(startRows);
    expect($.trim(ths.eq(0).text())).toEqual('1');
    expect($.trim(ths.eq(1).text())).toEqual('2');
    expect($.trim(ths.eq(2).text())).toEqual('3');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
  });

  it('should show row headers with custom label', () => {
    const startRows = 5;

    handsontable({
      startRows,
      rowHeaders: ['First', 'Second', 'Third']
    });

    const ths = getInlineStartClone().find('tbody th');

    expect(ths.length).toEqual(startRows);
    expect($.trim(ths.eq(0).text())).toEqual('First');
    expect($.trim(ths.eq(1).text())).toEqual('Second');
    expect($.trim(ths.eq(2).text())).toEqual('Third');
    expect($.trim(ths.eq(3).text())).toEqual('4');
    expect($.trim(ths.eq(4).text())).toEqual('5');
  });

  it('should not show row headers if false', () => {
    handsontable({
      rowHeaders: false
    });

    expect(getInlineStartClone().find('tbody th').length).toEqual(0);
  });

  it('should hide rows headers after updateSetting', () => {
    const hot = handsontable({
      startCols: 100,
      startRows: 100,
      width: 250,
      height: 200,
      rowHeaders: true
    });
    let headers = getHtCore().find('tbody th').length;

    expect(headers).toBeGreaterThan(0);
    expect(getInlineStartClone().find('tbody th').length).toEqual(headers);

    hot.updateSettings({
      rowHeaders: false
    });

    headers = getHtCore().find('tbody th').length;

    expect(headers).toEqual(0);
    expect(getInlineStartClone().width()).toEqual(0);
  });

  it('should show rows headers after updateSettings', () => {
    const hot = handsontable({
      startRows: 5,
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
    expect(getInlineStartClone().find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getInlineStartClone().find('tbody th').length).toEqual(5);
  });

  it('should show/hide rows headers after multiple updateSettings', () => {
    const hot = handsontable({
      startRows: 5,
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
    expect(getInlineStartClone().find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getInlineStartClone().width()).toBeGreaterThan(0);

    hot.updateSettings({
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
    expect(getInlineStartClone().width()).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getInlineStartClone().width()).toBeGreaterThan(0);
  });

  it('should show new rows headers after updateSettings', () => {
    const hot = handsontable({
      startCols: 3,
      rowHeaders: ['A', 'B', 'C']
    });

    const leftClone = getInlineStartClone();

    expect(leftClone.find('tbody tr:eq(0) th:eq(0)').text()).toEqual('A');
    expect(leftClone.find('tbody tr:eq(1) th:eq(0)').text()).toEqual('B');
    expect(leftClone.find('tbody tr:eq(2) th:eq(0)').text()).toEqual('C');

    hot.updateSettings({
      rowHeaders: ['X', 'Y', 'Z']
    });

    expect(leftClone.find('tbody tr:eq(0) th:eq(0)').text()).toEqual('X');
    expect(leftClone.find('tbody tr:eq(1) th:eq(0)').text()).toEqual('Y');
    expect(leftClone.find('tbody tr:eq(2) th:eq(0)').text()).toEqual('Z');

  });

  it('should remove the row-headers-related css class from the Handsontable container after disabling the' +
    ' `rowHeaders` option using the updateSettings method and add the same css class after re-enabling the option in' +
    ' the same way', () => {
    handsontable({
      startCols: 2,
      startRows: 2,
      rowHeaders: true
    });

    expect(hot().rootElement.className).toContain('htRowHeaders');

    hot().updateSettings({
      rowHeaders: false
    });

    expect(hot().rootElement.className).not.toContain('htRowHeaders');

    hot().updateSettings({
      rowHeaders: true
    });

    expect(hot().rootElement.className).toContain('htRowHeaders');
  });

  it('should allow defining custom row header width using the rowHeaderWidth config option', () => {
    handsontable({
      startCols: 3,
      rowHeaders: true,
      rowHeaderWidth: 150
    });

    expect(spec().$container.find('th').eq(0).outerWidth()).toEqual(150);
    expect(spec().$container.find('col').first().css('width')).toEqual('150px');
  });

  it('should allow defining custom column header heights using the columnHeaderHeight config option, when multiple column header levels are defined', () => {
    const hot = handsontable({
      startCols: 3,
      rowHeaders: true,
      rowHeaderWidth: [66, 96],
      afterGetRowHeaderRenderers(array) {
        array.push((index, TH) => {
          TH.innerHTML = '';

          const div = document.createElement('div');
          const span = document.createElement('span');

          div.className = 'relative';
          span.className = 'rowHeader';

          span.innerText = index;

          div.appendChild(span);
          TH.appendChild(div);
        });

        return array;
      }
    });

    hot.render();

    expect(spec().$container.find('.handsontable.ht_clone_inline_start tr:nth-child(1) th:nth-child(1)').outerWidth())
      .toEqual(66);
    expect(spec().$container.find('.handsontable.ht_clone_inline_start tr:nth-child(1) th:nth-child(2)').outerWidth())
      .toEqual(96);

    expect(spec().$container.find('col').first().css('width')).toEqual('66px');
    expect(spec().$container.find('col').eq(1).css('width')).toEqual('96px');
  });

  it('should trigger `afterGetRowHeader` hook for all displayed rows on init', () => {
    const afterGetRowHeader = jasmine.createSpy('afterGetRowHeader');

    handsontable({
      startRows: 5,
      startCols: 5,
      rowHeaders: true,
      afterGetRowHeader,
    });

    expect(afterGetRowHeader).toHaveBeenCalledWith(0,
      spec().$container.find('.ht_clone_inline_start tbody tr:nth-child(1) th')[0]);
    expect(afterGetRowHeader).toHaveBeenCalledWith(1,
      spec().$container.find('.ht_clone_inline_start tbody tr:nth-child(2) th')[0]);
    expect(afterGetRowHeader).toHaveBeenCalledWith(2,
      spec().$container.find('.ht_clone_inline_start tbody tr:nth-child(3) th')[0]);
    expect(afterGetRowHeader).toHaveBeenCalledWith(3,
      spec().$container.find('.ht_clone_inline_start tbody tr:nth-child(4) th')[0]);
    expect(afterGetRowHeader).toHaveBeenCalledWith(4,
      spec().$container.find('.ht_clone_inline_start tbody tr:nth-child(5) th')[0]);
  });
});
