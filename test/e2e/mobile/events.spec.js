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

    const hot = handsontable({
      width: 400,
      height: 400,
      afterOnCellMouseDown
    });

    const cell = hot.getCell(1, 1);

    expect(getSelected()).toBeUndefined();

    triggerTouchEvent('touchstart', cell);

    await sleep(100);

    expect(getSelected()).toBeDefined();
    expect(afterOnCellMouseDown).toHaveBeenCalled();
  });

  it('should translate double tap to `dblclick`', async() => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');

    const hot = handsontable({
      width: 400,
      height: 400,
    });
    hot.view.wt.update('onCellDblClick', onCellDblClick);

    const cell = hot.getCell(1, 1);

    expect(getSelected()).toBeUndefined();

    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);
    triggerTouchEvent('touchstart', cell);
    triggerTouchEvent('touchend', cell);

    await sleep(100);

    expect(getSelected()).toBeDefined();
    expect(onCellDblClick).toHaveBeenCalled();
  });

  // Currently, this test is skipped. There is a problem with opening link from an anchor element using only simulated touch event.
  it('should block default action related to link touch and translate from the touch to click on a cell', async() => {
    const hot = handsontable({
      data: [['<a href="#justForTest">click me!</a>'], []],
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      columns: [
        {
          renderer: 'html'
        }
      ]
    });

    const linkElement = hot.getCell(0, 0).firstChild;
    location.hash = ''; // Resetting before test.

    // First touch
    triggerTouchEvent('touchstart', linkElement);
    triggerTouchEvent('touchend', linkElement);

    expect(location.hash).toBe('');
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);

    await sleep(600); // To prevents double-click detection (emulation)

    // Second touch
    triggerTouchEvent('touchstart', linkElement);
    triggerTouchEvent('touchend', linkElement);

    expect(location.hash).toBe('#justForTest');
    expect(getSelected()).toEqual([[0, 0, 0, 0]]);

    location.hash = ''; // Resetting after test.
    
    const anotherCell = getCell(1, 0);

    // First touch
    triggerTouchEvent('touchstart', anotherCell);
    triggerTouchEvent('touchend', anotherCell);

    await sleep(600); // To prevents double-click detection (emulation)

    expect(location.hash).toBe('');
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);

    // Second touch
    triggerTouchEvent('touchstart', anotherCell);
    triggerTouchEvent('touchend', anotherCell);

    expect(location.hash).toBe('');
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);

    location.hash = ''; // Resetting after test.
  });
  
  // Test doesn't work.
  xit('touch on button inside header should not block default action  ' +
    '(header does not have to be selected at first)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 7),
      colHeaders: true,
      dropdownMenu: true
    });

    const dropDownIndicator = $(hot.getCell(-1, 2)).find('button')[0];

    triggerTouchEvent('touchstart', dropDownIndicator);
    triggerTouchEvent('touchend', dropDownIndicator);

    expect($('.htDropdownMenu').is(':visible')).toBe(true);
  })
});
