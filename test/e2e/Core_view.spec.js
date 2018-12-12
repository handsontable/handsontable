describe('Core_view', () => {
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

  it('should focus cell after viewport is scrolled using down arrow', () => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    handsontable({
      startRows: 20
    });
    selectCell(0, 0);

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(getSelected()).toEqual([[4, 0, 4, 0]]);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(true);
  });

  it('should scroll viewport if selected cell is out of the viewport and renderAllRows is enabled', () => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '50px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      startRows: 20,
      renderAllRows: true,
    });

    selectCell(0, 0);

    const scrollableElement = hot.view.wt.wtOverlays.topOverlay.mainTableScrollableElement;
    const initialScrollTop = scrollableElement.scrollTop;

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(scrollableElement.scrollTop).toBeGreaterThan(initialScrollTop);
  });

  it('should not render "undefined" class name', () => {
    spec().$container[0].style.width = '501px';
    spec().$container[0].style.height = '100px';
    spec().$container[0].style.overflow = 'hidden';

    handsontable({
      startRows: 10,
      startCols: 5,
      colWidths: [47, 47, 47, 47, 47],
      rowHeaders: true,
      colHeaders: true,
      stretchH: 'all'
    });

    selectCell(0, 0);

    expect(spec().$container.find('.undefined').length).toBe(0);
  });

  it('should scroll viewport when partially visible cell is clicked', () => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 3),
      height: 60
    });

    const htCore = getHtCore();
    const scrollTop = hot.rootElement.querySelector('.wtHolder').scrollTop;

    expect(scrollTop).toBe(0);
    expect(spec().$container.height()).toEqual(60);
    expect(spec().$container.find('.wtHolder .wtHider').height()).toBeGreaterThan(60);

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    htCore.find('tr:eq(3) td:eq(0)').simulate('mousedown');

    expect(hot.rootElement.querySelector('.wtHolder').scrollTop).toBeGreaterThan(scrollTop);
    expect(getSelected()).toEqual([[3, 0, 3, 0]]);
  });

  it('should scroll viewport without cell selection', () => {
    spec().$container[0].style.width = '400px';

    const hot1 = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      height: 100
    });

    hot1.scrollViewportTo(10, 10);

    const wtHolder = spec().$container.find('.ht_master .wtHolder');

    expect(wtHolder[0].scrollTop).toEqual(230);
    expect(wtHolder[0].scrollLeft).toEqual(500);

  });

  it('should not throw error while scrolling viewport to 0, 0 (empty data)', () => {
    spec().$container[0].style.width = '400px';

    const hot1 = handsontable({
      data: [],
      height: 100
    });

    expect(() => {
      hot1.view.scrollViewport({ row: 0, col: 0 });
    }).not.toThrow();
  });

  it('should throw error while scrolling viewport below 0 (empty data)', () => {
    spec().$container[0].style.width = '400px';

    const hot1 = handsontable({
      data: [],
      height: 100
    });

    expect(hot1.view.scrollViewport({ row: -1, col: 0 })).toBe(false);
    expect(hot1.view.scrollViewport({ row: 0, col: -1 })).toBe(false);
    expect(hot1.view.scrollViewport({ row: -1, col: -1 })).toBe(false);
  });

  it('should scroll viewport, respecting fixed rows', () => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 9),
      fixedRowsTop: 1,
      height: 60
    });

    const htCore = getHtCore();
    const scrollTop = hot.rootElement.querySelector('.wtHolder').scrollTop;

    expect(scrollTop).toBe(0);
    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(0) td:eq(1)').html()).toEqual('B1');
    expect(htCore.find('tr:eq(0) td:eq(2)').html()).toEqual('C1');

    selectCell(0, 0);

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(hot.rootElement.querySelector('.wtHolder').scrollTop).toBeGreaterThan(scrollTop);
  });

  it('should enable to change fixedRowsTop with updateSettings', () => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';

    const HOT = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 9),
      fixedRowsTop: 1,
      width: 200,
      height: 100
    });

    selectCell(0, 0);

    const htCore = getHtCore();
    const topClone = getTopClone();

    expect(topClone.find('tr').length).toEqual(1);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');

    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');
    keyDown('arrow_down');

    expect(topClone.find('tr').length).toEqual(1);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');

    HOT.updateSettings({
      fixedRowsTop: 2
    });

    expect(topClone.find('tr').length).toEqual(2);
    expect(topClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(topClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(htCore.find('tr:eq(3) td:eq(0)').html()).toEqual('A4');
  });

  it('should scroll viewport, respecting fixed columns', () => {
    spec().$container[0].style.width = '200px';
    spec().$container[0].style.height = '100px';

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 9),
      fixedColumnsLeft: 1
    });

    const htCore = getHtCore();
    const leftClone = spec().$container.find('.ht_clone_left');

    expect(leftClone.find('tr:eq(0) td').length).toEqual(1);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    expect(htCore.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(htCore.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(htCore.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    selectCell(0, 3);

    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');

    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

  });

  it('should enable to change fixedColumnsLeft with updateSettings', () => {
    spec().$container[0].style.width = '200px';
    spec().$container[0].style.height = '100px';

    const HOT = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 9),
      fixedColumnsLeft: 1
    });

    selectCell(0, 0);

    const leftClone = spec().$container.find('.ht_clone_left');

    expect(leftClone.find('tr:eq(0) td').length).toEqual(1);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');
    keyDown('arrow_right');

    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');

    selectCell(0, 0);

    HOT.updateSettings({
      fixedColumnsLeft: 2
    });

    expect(leftClone.find('tr:eq(0) td').length).toEqual(2);
    expect(leftClone.find('tr:eq(0) td:eq(0)').html()).toEqual('A1');
    expect(leftClone.find('tr:eq(0) td:eq(1)').html()).toEqual('B1');
    expect(leftClone.find('tr:eq(1) td:eq(0)').html()).toEqual('A2');
    expect(leftClone.find('tr:eq(1) td:eq(1)').html()).toEqual('B2');
    expect(leftClone.find('tr:eq(2) td:eq(0)').html()).toEqual('A3');
    expect(leftClone.find('tr:eq(2) td:eq(1)').html()).toEqual('B3');

  });

  it('should not scroll viewport when last cell is clicked', () => {
    handsontable({
      startRows: 40
    });

    $(window).scrollTop(10000);

    const lastScroll = $(window).scrollTop();

    render(); // renders synchronously so we don't have to put stuff in waits/runs
    selectCell(39, 0);

    expect($(window).scrollTop()).toEqual(lastScroll);

    keyDown('arrow_right');

    expect(getSelected()).toEqual([[39, 1, 39, 1]]);
    expect($(window).scrollTop()).toEqual(lastScroll);
  });

  it('should not shrink table when width and height is not specified for container', async() => {
    spec().$container[0].style.overflow = 'hidden';
    spec().$container.wrap('<div style="width: 50px;"></div>');
    handsontable({
      startRows: 10,
      startCols: 10
    });

    await sleep(250);

    const initHeight = spec().$container.height();

    await sleep(250);

    expect(spec().$container.height()).toEqual(initHeight);
  });

  it('should allow height to be a number', () => {
    handsontable({
      startRows: 10,
      startCols: 10,
      height: 107
    });

    expect(spec().$container.height()).toEqual(107);
  });

  it('should allow height to be a function', () => {
    handsontable({
      startRows: 10,
      startCols: 10,
      height() {
        return 107;
      }
    });

    expect(spec().$container.height()).toEqual(107);
  });

  it('should allow width to be a number', () => {
    handsontable({
      startRows: 10,
      startCols: 10,
      width: 107,
    });

    expect(spec().$container.width()).toEqual(107); // rootElement is full width but this should do the trick
  });

  it('should allow width to be a function', () => {
    handsontable({
      startRows: 10,
      startCols: 10,
      width() {
        return 107;
      }
    });

    expect(spec().$container.width()).toEqual(107); // rootElement is full width but this should do the trick
  });

  it('should fire beforeRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(100, 3)
    });

    const beforeRenderCallback = jasmine.createSpy('beforeRenderCallback');

    hot.addHook('beforeRender', beforeRenderCallback);
    spec().$container.find('.ht_master .wtHolder').scrollTop(1000);

    await sleep(200);

    expect(beforeRenderCallback.calls.count()).toBe(1);
  });

  it('should fire afterRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 3)
    });

    const afterRenderCallback = jasmine.createSpy('afterRenderCallback');
    hot.addHook('afterRender', afterRenderCallback);
    spec().$container.find('.ht_master .wtHolder').first().scrollTop(1000);

    await sleep(200);

    expect(afterRenderCallback.calls.count()).toBe(1);
  });

  it('should fire afterRender event after table physically rendered', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 3)
    });

    hot.addHook('afterRender', () => {
      hot.view.wt.wtTable.holder.style.overflow = 'scroll';
      hot.view.wt.wtTable.holder.style.width = '220px';
    });
    spec().$container.find('.ht_master .wtHolder').first().scrollTop(1000);

    await sleep(100);
    // after afterRender hook triggered element style shouldn't changed
    expect(hot.view.wt.wtTable.holder.style.overflow).toBe('scroll');
    expect(hot.view.wt.wtTable.holder.style.width).toBe('220px');
  });

  // TODO fix these tests - https://github.com/handsontable/handsontable/issues/1559
  describe('maximumVisibleElementWidth', () => {
    it('should return maximum width until right edge of the viewport', () => {
      const hot = handsontable({
        startRows: 2,
        startCols: 10,
        width: 100,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementWidth(0)).toEqual(100);
    });

    it('should return maximum width until right edge of the viewport (excluding the scrollbar)', () => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 100,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementWidth(200)).toBeLessThan(100);
    });
  });

  describe('maximumVisibleElementHeight', () => {
    it('should return maximum height until bottom edge of the viewport', () => {
      const hot = handsontable({
        startRows: 10,
        startCols: 2,
        width: 120,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementHeight(0)).toEqual(100);
    });

    it('should return maximum height until bottom edge of the viewport (excluding the scrollbar)', () => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 120,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementHeight()).toBeLessThan(100);
    });
  });

  describe('fixed column row heights', () => {
    it('should be the same as the row heights in the main table', () => {
      const hot = handsontable({
        data: [['A', 'B', 'C', 'D'], ['a', 'b', 'c\nc', 'd'], ['aa', 'bb', 'cc', 'dd']],
        startRows: 3,
        startCols: 4,
        fixedColumnsLeft: 2,
      });

      expect(hot.getCell(1, 2).clientHeight).toEqual(hot.getCell(1, 1).clientHeight);

      hot.setDataAtCell(1, 2, 'c');

      expect(hot.getCell(1, 2).clientHeight).toEqual(hot.getCell(1, 1).clientHeight);
    });

    it('should be the same as the row heights in the main table (after scroll)', () => {
      const myData = Handsontable.helper.createSpreadsheetData(20, 4);
      myData[1][3] = 'very\nlong\ntext';
      myData[5][3] = 'very\nlong\ntext';
      myData[10][3] = 'very\nlong\ntext';
      myData[15][3] = 'very\nlong\ntext';

      const hot = handsontable({
        data: myData,
        startRows: 3,
        startCols: 4,
        fixedRowsTop: 2,
        fixedColumnsLeft: 2,
        width: 200,
        height: 200
      });

      const mainHolder = hot.view.wt.wtTable.holder;

      $(mainHolder).scrollTop(200);
      hot.render();

      const masterTD = spec().$container.find('.ht_master tbody tr:eq(5) td:eq(1)')[0];
      const cloneTD = spec().$container.find('.ht_clone_left tbody tr:eq(5) td:eq(1)')[0];

      expect(cloneTD.clientHeight).toEqual(masterTD.clientHeight);
    });

    it('should be the same as the row heights in the main table (after scroll, in corner)', () => {
      const myData = Handsontable.helper.createSpreadsheetData(20, 4);
      myData[1][3] = 'very\nlong\ntext';
      myData[5][3] = 'very\nlong\ntext';
      myData[10][3] = 'very\nlong\ntext';
      myData[15][3] = 'very\nlong\ntext';

      const hot = handsontable({
        data: myData,
        startRows: 3,
        startCols: 4,
        fixedRowsTop: 2,
        fixedColumnsLeft: 2,
        width: 200,
        height: 200
      });

      const rowHeight = hot.getCell(1, 3).clientHeight;
      const mainHolder = hot.view.wt.wtTable.holder;

      expect(spec().$container.find('.ht_clone_top_left_corner tbody tr:eq(1) td:eq(1)')[0].clientHeight).toEqual(rowHeight);

      $(mainHolder).scrollTop(200);
      hot.render();

      expect(spec().$container.find('.ht_clone_top_left_corner tbody tr:eq(1) td:eq(1)')[0].clientHeight).toEqual(rowHeight);
    });
  });

  describe('fixed column widths', () => {
    it('should set the columns width correctly after changes made during updateSettings', () => {
      const hot = handsontable({
        startRows: 2,
        fixedColumnsLeft: 2,
        columns: [{
          width: 50
        }, {
          width: 80
        }, {
          width: 110
        }, {
          width: 140
        }, {
          width: 30
        }, {
          width: 30
        }, {
          width: 30
        }]
      });

      const leftClone = spec().$container.find('.ht_clone_left');

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(80);

      hot.updateSettings({
        manualColumnMove: [2, 0, 1],
        fixedColumnsLeft: 1
      });

      expect(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0]).toBe(undefined);

      hot.updateSettings({
        manualColumnMove: false,
        fixedColumnsLeft: 2
      });

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(80);
    });

    it('should set the columns width correctly after changes made during updateSettings when columns is a function', () => {
      const hot = handsontable({
        startCols: 7,
        startRows: 2,
        fixedColumnsLeft: 2,
        columns(column) {
          let colMeta = {};

          if (column === 0) {
            colMeta.width = 50;

          } else if (column === 1) {
            colMeta.width = 80;

          } else if (column === 2) {
            colMeta.width = 110;

          } else if (column === 3) {
            colMeta.width = 140;

          } else if ([4, 5, 6].indexOf(column) > -1) {
            colMeta.width = 30;

          } else {
            colMeta = null;
          }

          return colMeta;
        }
      });

      const leftClone = spec().$container.find('.ht_clone_left');

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(80);

      hot.updateSettings({
        manualColumnMove: [2, 0, 1],
        fixedColumnsLeft: 1
      });

      expect(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0]).toBe(undefined);

      hot.updateSettings({
        manualColumnMove: false,
        fixedColumnsLeft: 2
      });

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(80);
    });
  });

  describe('stretchH', () => {
    it('should stretch all visible columns with the ratio appropriate to the container\'s width', () => {
      spec().$container[0].style.width = '300px';

      const hot = handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        colHeaders: true,
        stretchH: 'all'
      });
      const rowHeaderWidth = hot.view.wt.wtViewport.getRowHeaderWidth();
      let expectedCellWidth = (parseInt(spec().$container[0].style.width, 10) - rowHeaderWidth) / 5;

      expect(getCell(0, 0).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 1).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 2).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 3).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 4).offsetWidth).toEqual(expectedCellWidth);

      spec().$container[0].style.width = '';
      spec().$container.wrap('<div class="temp_wrapper" style="width:400px;"></div>');
      hot.render();

      expectedCellWidth = (parseInt($('.temp_wrapper')[0].style.width, 10) - rowHeaderWidth) / 5;

      expect(getCell(0, 0).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 1).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 2).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 3).offsetWidth).toEqual(expectedCellWidth);
      expect(getCell(0, 4).offsetWidth).toEqual(expectedCellWidth);

      spec().$container.unwrap();
    });

    it('should stretch all visible columns with overflow hidden', () => {
      spec().$container[0].style.width = '501px';
      spec().$container[0].style.height = '100px';
      spec().$container[0].style.overflow = 'hidden';

      handsontable({
        startRows: 10,
        startCols: 5,
        colWidths: [47, 47, 47, 47, 47],
        rowHeaders: true,
        colHeaders: true,
        stretchH: 'all'
      });

      const masterTH = spec().$container[0].querySelectorAll('.ht_master thead tr th');
      const overlayTH = spec().$container[0].querySelectorAll('.ht_clone_top thead tr th');

      expect(masterTH[0].offsetWidth).toEqual(50);
      expect(overlayTH[0].offsetWidth).toEqual(50);

      expect(masterTH[1].offsetWidth).toBeInArray([86, 87, 88, 90]);
      expect(overlayTH[1].offsetWidth).toBeInArray([86, 87, 88, 90]); // if you get 90, it means it is calculated before scrollbars were applied, or show scroll on scrolling is enabled

      expect(masterTH[2].offsetWidth).toEqual(overlayTH[2].offsetWidth);
      expect(masterTH[3].offsetWidth).toEqual(overlayTH[3].offsetWidth);
      expect(masterTH[4].offsetWidth).toEqual(overlayTH[4].offsetWidth);
      expect(masterTH[5].offsetWidth).toEqual(overlayTH[5].offsetWidth);
    });

    it('should respect stretched widths returned in beforeStretchingColumnWidth hook', () => {
      spec().$container[0].style.width = '501px';
      spec().$container[0].style.height = '100px';
      spec().$container[0].style.overflow = 'hidden';

      const callbackSpy = jasmine.createSpy();

      callbackSpy.and.callFake((width, column) => {
        if (column === 1) {
          return 150;
        }

        return width;
      });

      handsontable({
        startRows: 2,
        startCols: 5,
        rowHeaders: true,
        colHeaders: true,
        stretchH: 'all',
        beforeStretchingColumnWidth: callbackSpy
      });

      const $columnHeaders = spec().$container.find('thead tr:eq(0) th');

      expect($columnHeaders.eq(0).width()).toEqual(48);
      expect($columnHeaders.eq(1).width()).toEqual(73);
      expect($columnHeaders.eq(2).width()).toEqual(149);
      expect($columnHeaders.eq(3).width()).toEqual(74);
      expect($columnHeaders.eq(4).width()).toEqual(74);

      expect(callbackSpy).toHaveBeenCalled();
      // First cycle to check what columns has permanent width
      expect(callbackSpy.calls.argsFor(0)[0]).not.toBeDefined();
      expect(callbackSpy.calls.argsFor(0)[1]).toBe(0);
      expect(callbackSpy.calls.argsFor(1)[0]).not.toBeDefined();
      expect(callbackSpy.calls.argsFor(1)[1]).toBe(1);
      expect(callbackSpy.calls.argsFor(2)[0]).not.toBeDefined();
      expect(callbackSpy.calls.argsFor(2)[1]).toBe(2);
      expect(callbackSpy.calls.argsFor(3)[0]).not.toBeDefined();
      expect(callbackSpy.calls.argsFor(3)[1]).toBe(3);
      expect(callbackSpy.calls.argsFor(4)[0]).not.toBeDefined();
      expect(callbackSpy.calls.argsFor(4)[1]).toBe(4);
      // // Second cycle retrieve stretched width or permanent width
      expect(callbackSpy.calls.argsFor(5)[0]).toBe(75);
      expect(callbackSpy.calls.argsFor(6)[0]).toBe(75);
      expect(callbackSpy.calls.argsFor(7)[0]).toBe(75);
      expect(callbackSpy.calls.argsFor(8)[0]).toBe(75);
      expect(callbackSpy.calls.argsFor(9)[0]).toBe(75);
    });
  });
});
