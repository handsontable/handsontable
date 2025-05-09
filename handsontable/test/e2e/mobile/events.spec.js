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

    await sleep(100);

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

    await sleep(100);

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

    await sleep(600); // To prevents double-click detection (emulation)

    // Second touch
    await simulateTouch(linkElement);

    expect(location.hash).toBe('#justForTest');
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);

    location.hash = ''; // Resetting after test.

    const anotherCell = getCell(1, 0);

    // First touch
    await simulateTouch(anotherCell);

    await sleep(550); // To prevents double-click detection (emulation)

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
});
