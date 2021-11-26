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

  it('should properly calculate dimensions of the table if a container has border', () => {
    spec().$container[0].style.width = '250px';
    spec().$container[0].style.height = '200px';
    spec().$container[0].style.overflow = 'hidden';
    spec().$container[0].style.border = '10px solid #000';

    const hot = handsontable({
      startRows: 10,
      startCols: 10,
      colWidths: 50,
      rowHeights: 50,
      rowHeaders: true,
      colHeaders: true,
    });

    const scrollbarSize = hot.view.wt.wtOverlays.scrollbarSize;
    const {
      scrollWidth: masterScrollWidth,
      scrollHeight: masterScrollHeight
    } = spec().$container.find('.ht_master')[0];
    const topScrollWidth = spec().$container.find('.ht_clone_top')[0].scrollWidth;
    const leftScrollHeight = spec().$container.find('.ht_clone_left')[0].scrollHeight;

    expect(masterScrollWidth).toBe(250);
    expect(masterScrollHeight).toBe(200);
    expect(masterScrollWidth - scrollbarSize).toBe(topScrollWidth);
    expect(masterScrollHeight - scrollbarSize).toBe(leftScrollHeight);
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

  it('should scroll viewport to the last cell in the last row', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(120, 200),
      height: 300,
      width: 300,
      rowHeaders: true,
      colHeaders: true
    });

    await sleep(700);
    hot.scrollViewportTo(119, 199);
    await sleep(700);
    expect(hot.view.wt.wtScroll.getLastVisibleColumn()).toEqual(199);
    expect(hot.view.wt.wtScroll.getLastVisibleRow()).toEqual(119);
  });

  it('should scroll viewport properly when there are hidden columns ' +
    '(row argument for the `scrollViewportTo` is defined)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2]
      }
    });

    hot.scrollViewportTo(0, 15);
    hot.render(); // Renders synchronously so we don't have to put stuff in waits/runs.

    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(15 - 3); // 3 hidden, not rendered elements.
  });

  it('should scroll viewport properly when there are hidden columns ' +
    '(row argument for the `scrollViewportTo` is not defined)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2]
      }
    });

    hot.scrollViewportTo(void 0, 15);
    hot.render(); // Renders synchronously so we don't have to put stuff in waits/runs.

    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(15 - 3); // 3 hidden, not rendered elements before.
  });

  it('should scroll viewport to the right site of the destination index when the column is hidden (basing on visual indexes)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2, 7, 15]
      }
    });

    const scrollResult1 = hot.scrollViewportTo(0, 7);

    hot.render(); // Renders synchronously so we don't have to put stuff in waits/runs.

    expect(scrollResult1).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(8 - 4); // 4 hidden, not rendered elements before.

    const scrollResult2 = hot.scrollViewportTo(0, 15);

    hot.render();

    expect(scrollResult2).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(16 - 5); // 5 hidden, not rendered elements before.

    const scrollResult3 = hot.scrollViewportTo(0, 7);

    hot.render();

    expect(scrollResult3).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(8 - 4); // 4 hidden, not rendered elements before.

    const scrollResult4 = hot.scrollViewportTo(0, 0);

    hot.render();

    expect(scrollResult4).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(3 - 3); // 3 hidden, not rendered elements before.
  });

  it('should scroll viewport to the left site of the destination index when the column is hidden and there are ' +
    'no visible indexes on the right (basing on visual indexes)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2, 7, 15, 16, 17, 18, 19]
      }
    });

    const scrollResult1 = hot.scrollViewportTo(0, 15);

    hot.render(); // Renders synchronously so we don't have to put stuff in waits/runs.

    expect(scrollResult1).toBe(true);
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(14 - 4); // 4 hidden, not rendered elements before.

    hot.scrollViewportTo(0, 19);
    hot.render();

    const scrollResult2 = hot.scrollViewportTo(0, 17);

    hot.render();

    expect(scrollResult2).toBe(true);
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(14 - 4); // 4 hidden, not rendered elements before.

    const scrollResult3 = hot.scrollViewportTo(0, 19);

    hot.render();

    expect(scrollResult3).toBe(true);
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(14 - 4); // 4 hidden, not rendered elements before.
  });

  it('should scroll viewport to the the destination index when there are some hidden indexes (handling renderable indexes)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2, 7, 15]
      }
    });

    const scrollResult1 = hot.scrollViewportTo(0, 2, false, false, false);

    hot.render(); // Renders synchronously so we don't have to put stuff in waits/runs.

    expect(scrollResult1).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(2);

    const scrollResult2 = hot.scrollViewportTo(0, 14, false, false, false);

    hot.render();

    expect(scrollResult2).toBe(true);
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(14);

    const scrollResult3 = hot.scrollViewportTo(0, 2, false, false, false);

    hot.render();

    expect(scrollResult3).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(2);

    const scrollResult4 = hot.scrollViewportTo(0, 0, false, false, false);

    hot.render();

    expect(scrollResult4).toBe(true);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(0);
  });

  it('should not scroll viewport when all columns are hidden (basing on visual indexes)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 10,
      startCols: 10,
      hiddenColumns: {
        columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      }
    });

    const scrollResult1 = hot.scrollViewportTo(0, 0);

    hot.render(); // Renders synchronously so we don't have to put stuff in waits/runs.

    expect(scrollResult1).toBe(false);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(-1);

    const scrollResult2 = hot.scrollViewportTo(0, 5);

    hot.render();

    expect(scrollResult2).toBe(false);
    expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBe(-1);
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

    spec().$container.unwrap();
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

  it('should allow width to be a string', () => {
    handsontable({
      startRows: 10,
      startCols: 10,
      height: '50vh',
    });

    expect(spec().$container.height()).toEqual(Math.ceil(window.innerHeight / 2));
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

  it('should allow width to be a string', () => {
    handsontable({
      startRows: 10,
      startCols: 10,
      width: '50%',
    });

    const parentWidth = spec().$container.parent().width();

    expect(spec().$container.width()).toBeAroundValue(parentWidth * 0.5, 0.5);
  });

  it('should fire beforeViewRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(100, 3)
    });

    const beforeRenderCallback = jasmine.createSpy('beforeRenderCallback');

    hot.addHook('beforeViewRender', beforeRenderCallback);
    spec().$container.find('.ht_master .wtHolder').scrollTop(1000);

    await sleep(200);

    expect(beforeRenderCallback.calls.count()).toBe(1);
  });

  it('should fire afterViewRender event after table has been scrolled', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 3)
    });

    const afterRenderCallback = jasmine.createSpy('afterRenderCallback');

    hot.addHook('afterViewRender', afterRenderCallback);
    spec().$container.find('.ht_master .wtHolder').first().scrollTop(1000);

    await sleep(200);

    expect(afterRenderCallback.calls.count()).toBe(1);
  });

  it('should fire afterViewRender event after table physically rendered', async() => {
    spec().$container[0].style.width = '400px';
    spec().$container[0].style.height = '60px';
    spec().$container[0].style.overflow = 'hidden';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 3)
    });

    hot.addHook('afterViewRender', () => {
      hot.view.wt.wtTable.holder.style.overflow = 'scroll';
      hot.view.wt.wtTable.holder.style.width = '220px';
    });
    spec().$container.find('.ht_master .wtHolder').first().scrollTop(1000);

    await sleep(100);
    // after afterViewRender hook triggered element style shouldn't changed
    expect(hot.view.wt.wtTable.holder.style.overflow).toBe('scroll');
    expect(hot.view.wt.wtTable.holder.style.width).toBe('220px');
  });

  describe('scroll', () => {
    it('should call preventDefault in a wheel event on fixed overlay\'s element', async() => {
      spec().$container.css({
        width: '200px',
        height: '200px',
        overflow: 'hidden',
      });

      window.scrollTo(0, 0);

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
        colHeaders: true,
        rowHeaders: true,
      });

      const eventManager = new Handsontable.EventManager(hot);
      const spy = jasmine.createSpy();

      eventManager.addEventListener(window, 'wheel', spy);

      const wheelEvt = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaMode: 0,
        deltaX: 800,
        deltaY: 400,
      });

      // If run on a browser different than Chrome or a higher density display, the event is listened on a different element (https://github.com/handsontable/handsontable/pull/5921)
      if (!(/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor))
        || hot.view.wt.rootWindow.devicePixelRatio && hot.view.wt.rootWindow.devicePixelRatio > 1) {
        hot.view.wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);

      } else {
        spec().$container.find('.ht_clone_top_left_corner .wtHolder')[0].dispatchEvent(wheelEvt);
      }

      await sleep(100);

      expect(spy.calls.argsFor(0)[0].defaultPrevented).toBe(true);
      eventManager.destroy();
    });

    it('should not scroll window when a wheel event occurs on fixed overlay', async() => {
      spec().$container.css({
        width: '200px',
        height: '200px',
        overflow: 'hidden',
        margin: '2000px',
      });

      window.scrollTo(0, 0);

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
        colHeaders: true,
        rowHeaders: true,
      });

      const wheelEvt = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaMode: 0,
        deltaX: 800,
        deltaY: 400,
      });

      // If run on a browser different than Chrome or a higher density display, the event is listened on a different element (https://github.com/handsontable/handsontable/pull/5921)
      if (!(/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor))
        || hot.view.wt.rootWindow.devicePixelRatio && hot.view.wt.rootWindow.devicePixelRatio > 1) {
        hot.view.wt.wtTable.wtRootElement.dispatchEvent(wheelEvt);

      } else {
        spec().$container.find('.ht_clone_top_left_corner .wtHolder')[0].dispatchEvent(wheelEvt);
      }

      await sleep(100);
      const masterHolder = spec().$container.find('.ht_master .wtHolder')[0];

      expect(masterHolder.scrollLeft).toBe(800);
      expect(masterHolder.scrollTop).toBe(400);
      expect(window.scrollX).toBe(0);
      expect(window.scrollY).toBe(0);
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      spec().$iframe = $('<iframe style="width:"/>').appendTo(spec().$container);
      const doc = spec().$iframe[0].contentDocument;

      doc.open('text/html', 'replace');
      doc.write(`
        <!doctype html>
        <head>
          <link type="text/css" rel="stylesheet" href="../dist/handsontable.full.min.css">
        </head>`);
      doc.close();

      spec().$iframeContainer = $('<div/>').appendTo(doc.body);
    });

    afterEach(() => {
      if (spec().$iframe) {
        spec().$iframeContainer.handsontable('destroy');
        spec().$iframe.remove();
      }
    });

    it('should fire refreshDimensions hooks after window resize', async() => {
      spec().$iframe[0].style.width = '50%';
      spec().$iframe[0].style.height = '60px';

      const beforeRefreshDimensionsCallback = jasmine.createSpy('beforeRefreshDimensionsCallback');
      const afterRefreshDimensionsCallback = jasmine.createSpy('afterRefreshDimensions');

      spec().$iframeContainer.handsontable({
        beforeRefreshDimensions: beforeRefreshDimensionsCallback,
        afterRefreshDimensions: afterRefreshDimensionsCallback,
      });

      spec().$iframe[0].style.width = '50px';

      await sleep(300);

      expect(beforeRefreshDimensionsCallback.calls.count()).toBe(1);
      expect(afterRefreshDimensionsCallback.calls.count()).toBe(1);
    });

    it('should be possible to block auto refresh after window resize', async() => {
      spec().$iframe[0].style.width = '50%';
      spec().$iframe[0].style.height = '60px';

      const beforeRefreshDimensionsCallback = jasmine.createSpy('beforeRefreshDimensionsCallback');
      const afterRefreshDimensionsCallback = jasmine.createSpy('afterRefreshDimensionsCallback');

      beforeRefreshDimensionsCallback.and.callFake(() => false);

      spec().$iframeContainer.handsontable({
        beforeRefreshDimensions: beforeRefreshDimensionsCallback,
        afterRefreshDimensions: afterRefreshDimensionsCallback,
      });

      spec().$iframe[0].style.width = '50px';

      await sleep(300);

      expect(beforeRefreshDimensionsCallback.calls.count()).toBe(1);
      expect(afterRefreshDimensionsCallback.calls.count()).toBe(0);
    });

    it('should return actionPossible as false if container\'s dimensions didn\'t change', async() => {
      spec().$iframe[0].style.width = '50%';
      spec().$iframe[0].style.height = '60px';

      const beforeRefreshDimensionsCallback = jasmine.createSpy('beforeRefreshDimensionsCallback');
      const afterRefreshDimensionsCallback = jasmine.createSpy('afterRefreshDimensionsCallback');

      spec().$iframeContainer.handsontable({
        beforeRefreshDimensions: beforeRefreshDimensionsCallback,
        afterRefreshDimensions: afterRefreshDimensionsCallback,
        width: 300,
        height: 300,
      });

      spec().$iframe[0].style.width = '50px';

      await sleep(300);

      expect(beforeRefreshDimensionsCallback.calls.argsFor(0)[2]).toBe(false);
      expect(afterRefreshDimensionsCallback.calls.argsFor(0)[2]).toBe(false);
    });

    it('should run hooks if container\'s dimensions did change', () => {
      spec().$container[0].style.width = '50%';
      spec().$container[0].style.height = '60px';
      spec().$container[0].style.overflow = 'hidden';

      const beforeRefreshDimensionsCallback = jasmine.createSpy('beforeRefreshDimensionsCallback');
      const afterRefreshDimensionsCallback = jasmine.createSpy('afterRefreshDimensionsCallback');

      handsontable({
        beforeRefreshDimensions: beforeRefreshDimensionsCallback,
        afterRefreshDimensions: afterRefreshDimensionsCallback,
      });

      spec().$container[0].style.width = '50px';

      refreshDimensions();

      expect(beforeRefreshDimensionsCallback.calls.argsFor(0)[2]).toBe(true);
      expect(afterRefreshDimensionsCallback.calls.argsFor(0)[2]).toBe(true);
    });
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

      expect(spec().$container.find('.ht_clone_top_left_corner tbody tr:eq(1) td:eq(1)')[0].clientHeight)
        .toEqual(rowHeight);

      $(mainHolder).scrollTop(200);
      hot.render();

      expect(spec().$container.find('.ht_clone_top_left_corner tbody tr:eq(1) td:eq(1)')[0].clientHeight)
        .toEqual(rowHeight);
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

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
      expect(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0]).toBe(undefined);

      hot.updateSettings({
        manualColumnMove: false,
        fixedColumnsLeft: 2
      });

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(50);
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

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
      expect(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0]).toBe(undefined);

      hot.updateSettings({
        manualColumnMove: false,
        fixedColumnsLeft: 2
      });

      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(1)')[0])).toEqual(110);
      expect(Handsontable.dom.outerWidth(leftClone.find('tbody tr:nth-child(1) td:nth-child(2)')[0])).toEqual(50);
    });
  });

  describe('stretchH', () => {
    it('should stretch all visible columns with the ratio appropriate to the container\'s width', () => {
      // reset scrolled window
      window.scrollTo(0, 0);
      spec().$container[0].style.width = '300px';

      const hot = handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        colHeaders: true,
        stretchH: 'all'
      });
      const rowHeaderWidth = hot.view.wt.wtViewport.getRowHeaderWidth();

      expect(hot.view.wt.wtOverlays.leftOverlay.getScrollPosition()).toEqual(0);

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
