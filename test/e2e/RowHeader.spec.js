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

  it('should show row headers numbered 1-10 by default', () => {
    const startRows = 5;
    handsontable({
      startRows,
      rowHeaders: true
    });

    const ths = getLeftClone().find('tbody th');
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

    const ths = getLeftClone().find('tbody th');
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

    expect(getLeftClone().find('tbody th').length).toEqual(0);
  });

  it('should hide rows headers after updateSetting', () => {
    const hot = handsontable({
      startRows: 5,
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getLeftClone().find('tbody th').length).toEqual(5);

    hot.updateSettings({
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
  });

  it('should show rows headers after updateSettings', () => {
    const hot = handsontable({
      startRows: 5,
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
    expect(getLeftClone().find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getLeftClone().find('tbody th').length).toEqual(5);
  });

  it('should show/hide rows headers after multiple updateSettings', () => {
    const hot = handsontable({
      startRows: 5,
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
    expect(getLeftClone().find('tbody th').length).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getLeftClone().width()).toBeGreaterThan(0);

    hot.updateSettings({
      rowHeaders: false
    });

    expect(getHtCore().find('tbody th').length).toEqual(0);
    expect(getLeftClone().width()).toEqual(0);

    hot.updateSettings({
      rowHeaders: true
    });

    expect(getHtCore().find('tbody th').length).toEqual(5);
    expect(getLeftClone().width()).toBeGreaterThan(0);
  });

  it('should show new rows headers after updateSettings', () => {
    const hot = handsontable({
      startCols: 3,
      rowHeaders: ['A', 'B', 'C']
    });

    const leftClone = getLeftClone();

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

    expect(spec().$container.find('.handsontable.ht_clone_left tr:nth-child(1) th:nth-child(1)').outerWidth()).toEqual(66);
    expect(spec().$container.find('.handsontable.ht_clone_left tr:nth-child(1) th:nth-child(2)').outerWidth()).toEqual(96);

    expect(spec().$container.find('col').first().css('width')).toEqual('66px');
    expect(spec().$container.find('col').eq(1).css('width')).toEqual('96px');
  });
});
