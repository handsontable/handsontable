const id = 'testContainer';

describe('Events', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should translate tap (`touchstart`) to `mousedown`', async() => {
    const afterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

    handsontable({
      width: 400,
      height: 400,
      afterOnCellMouseDown
    });

    const cell = hot.getCell(1, 1);

    expect(getSelected()).toBeUndefined();

    await triggerTouchEvent('touchstart', cell);

    await waitForNextAnimationFrames(2);

    expect(getSelected()).toBeDefined();
    expect(afterOnCellMouseDown).toHaveBeenCalled();
  });

  it('should translate double tap to `dblclick`', async() => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');

    handsontable({
      width: 400,
      height: 400,
    });

    hot.view._wt.update('onCellDblClick', onCellDblClick);

    const cell = hot.getCell(1, 1);

    expect(getSelected()).toBeUndefined();

    await triggerTouchEvent('touchstart', cell);
    await triggerTouchEvent('touchend', cell);
    await triggerTouchEvent('touchstart', cell);
    await triggerTouchEvent('touchend', cell);

    await waitForNextAnimationFrames(2);

    expect(getSelected()).toBeDefined();
    expect(onCellDblClick).toHaveBeenCalled();
  });

  it('should "preventDefault" only the second "touchend" event while double-tapping (issue #7824)', async() => {
    handsontable({
      width: 400,
      height: 400,
    });

    const cell = hot.getCell(1, 1);

    {
      await triggerTouchEvent('touchstart', cell);

      const event = await triggerTouchEvent('touchend', cell);

      expect(event.defaultPrevented).toBeTrue();
    }
    {
      await triggerTouchEvent('touchstart', cell);

      const event = await triggerTouchEvent('touchend', cell);

      // In the WebKit-based engines the second touch event is not prevent defaulted.
      // See ./handsontable/src/3rdparty/walkontable/src/event.js#L327
      if (Handsontable.helper.isIOS() &&
        (Handsontable.helper.isChromeWebKit() || Handsontable.helper.isFirefoxWebKit())) {
        expect(event.defaultPrevented).toBeTrue();

      } else {
        expect(event.defaultPrevented).toBeFalse();
      }
    }
  });

  it('should not "preventDefault" the second "touchend" event when interactive element is clicked (PR#7980)', async() => {
    handsontable({
      data: [['<a href="#justForTest">click me!</a>'], []],
      width: 400,
      height: 400,
      renderer: 'html',
    });

    const linkElement = hot.getCell(0, 0).firstChild;

    {
      await triggerTouchEvent('touchstart', linkElement);

      const event = await triggerTouchEvent('touchend', linkElement);

      expect(event.defaultPrevented).toBeTrue();
    }
    {
      await triggerTouchEvent('touchstart', linkElement);

      const event = await triggerTouchEvent('touchend', linkElement);

      expect(event.defaultPrevented).toBeFalse();
    }
  });

  it('should "preventDefault" the link element (block its default action) when the cell is not highlighted', async() => {
    handsontable({
      data: [['<a href="#justForTest">click me!</a>'], []],
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      renderer: 'html',
    });

    const linkElement = hot.getCell(0, 0).firstChild;

    location.hash = ''; // Resetting before test.

    // First touch
    await simulateTouch(linkElement);

    expect(location.hash).toBe('');
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);

    await waitForNextAnimationFrames(2); // To prevents double-click detection (emulation)

    // Second touch
    await simulateTouch(linkElement);

    expect(location.hash).toBe('#justForTest');
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);

    location.hash = ''; // Resetting after test.

    const anotherCell = getCell(1, 0);

    // First touch
    await simulateTouch(anotherCell);

    await waitForNextAnimationFrames(2); // To prevents double-click detection (emulation)

    expect(location.hash).toBe('');
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);

    // Second touch
    await simulateTouch(anotherCell);

    expect(location.hash).toBe('');
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);

    location.hash = ''; // Resetting after test.
  });

  it('touch on button inside header should not block default action  ' +
    '(header does not have to be selected at first)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 7),
      colHeaders: true,
      dropdownMenu: true
    });

    const dropDownIndicator = $(hot.getCell(-1, 2)).find('button')[0];

    await simulateTouch(dropDownIndicator);

    expect($('.htDropdownMenu').is(':visible')).toBe(true);
  });

  describe('long-press', () => {
    it('should open context menu after long-pressing a cell (#12302)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        width: 400,
        height: 400,
      });

      const cell = getCell(1, 1);

      await triggerTouchEvent('touchstart', cell);
      await sleep(600);

      expect($('.htContextMenu').is(':visible')).toBe(true);

      await triggerTouchEvent('touchend', cell);
    });

    it('should fire `beforeOnCellContextMenu` and `afterOnCellContextMenu` hooks on long-press (#12302)', async() => {
      const beforeOnCellContextMenu = jasmine.createSpy('beforeOnCellContextMenu');
      const afterOnCellContextMenu = jasmine.createSpy('afterOnCellContextMenu');

      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        width: 400,
        height: 400,
        beforeOnCellContextMenu,
        afterOnCellContextMenu,
      });

      const cell = getCell(1, 1);

      await triggerTouchEvent('touchstart', cell);
      await sleep(600);

      expect(beforeOnCellContextMenu).toHaveBeenCalledTimes(1);
      expect(afterOnCellContextMenu).toHaveBeenCalledTimes(1);

      await triggerTouchEvent('touchend', cell);
    });

    it('should not open context menu if touch ends before long-press threshold (#12302)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        width: 400,
        height: 400,
      });

      const cell = getCell(1, 1);

      await triggerTouchEvent('touchstart', cell);
      await sleep(100);
      await triggerTouchEvent('touchend', cell);
      await sleep(500);

      expect($('.htContextMenu').is(':visible')).toBeFalse();
    });

    it('should not open context menu if finger moves during touch (#12302)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        width: 400,
        height: 400,
      });

      const cell = getCell(1, 1);
      const cellRect = cell.getBoundingClientRect();

      await triggerTouchEvent('touchstart', cell);
      await sleep(100);

      // Simulate finger moving 50px away from the initial position.
      await triggerTouchEvent('touchmove', cell,
        parseInt(cellRect.left, 10) + 60,
        parseInt(cellRect.top, 10) + 60
      );

      await sleep(500);

      expect($('.htContextMenu').is(':visible')).toBeFalse();

      await triggerTouchEvent('touchend', cell);
    });

    it('should not open context menu if contextMenu option is disabled (#12302)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: false,
        width: 400,
        height: 400,
      });

      const cell = getCell(1, 1);

      await triggerTouchEvent('touchstart', cell);
      await sleep(600);

      expect($('.htContextMenu').is(':visible')).toBeFalse();

      await triggerTouchEvent('touchend', cell);
    });

    it('should select the cell before opening context menu on long-press (#12302)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        width: 400,
        height: 400,
      });

      const cell = getCell(2, 3);

      expect(getSelected()).toBeUndefined();

      await triggerTouchEvent('touchstart', cell);
      await sleep(600);

      expect(getSelected()).toEqual([[2, 3, 2, 3]]);
      expect($('.htContextMenu').is(':visible')).toBe(true);

      await triggerTouchEvent('touchend', cell);
    });
  });

  describe('disableVisualSelection with checkbox', () => {
    it('should not "preventDefault" touchend on checkbox INPUT when disableVisualSelection is "current"', async() => {
      handsontable({
        data: [[true], [false]],
        width: 400,
        height: 400,
        columns: [{ type: 'checkbox', disableVisualSelection: 'current' }],
      });

      const checkboxInput = hot.getCell(0, 0).querySelector('input[type="checkbox"]');

      await triggerTouchEvent('touchstart', checkboxInput);

      const event = await triggerTouchEvent('touchend', checkboxInput);

      expect(event.defaultPrevented).toBeFalse();
    });

    it('should not "preventDefault" touchend on checkbox INPUT when disableVisualSelection is true', async() => {
      handsontable({
        data: [[true], [false]],
        width: 400,
        height: 400,
        columns: [{ type: 'checkbox', disableVisualSelection: true }],
      });

      const checkboxInput = hot.getCell(0, 0).querySelector('input[type="checkbox"]');

      await triggerTouchEvent('touchstart', checkboxInput);

      const event = await triggerTouchEvent('touchend', checkboxInput);

      expect(event.defaultPrevented).toBeFalse();
    });
  });
});
