describe('DropdownEditor', () => {
  const id = 'testContainer';
  const choices = ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white', 'purple', 'lime', 'olive', 'cyan'];

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: auto"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('open editor', () => {
    // see https://github.com/handsontable/handsontable/issues/3380
    it('should not throw error while selecting the next cell by hitting enter key', () => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();
      };
      handsontable({
        columns: [{
          editor: 'dropdown',
          source: choices
        }]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');
      keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });
  });

  describe('closing the editor', () => {
    it('should not close editor on scrolling', async() => {
      const hot = handsontable({
        data: [
          ['', 'two', 'three'],
          ['four', 'five', 'six']
        ],
        columns: [
          {
            type: 'dropdown',
            source: choices
          },
          {},
          {}
        ]
      });

      selectCell(0, 0);
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

      hot.view.wt.wtOverlays.topOverlay.scrollTo(1);
      const dropdown = hot.getActiveEditor();
      await sleep(50);

      expect($(dropdown.htContainer).is(':visible')).toBe(true);

      selectCell(0, 0);
      await sleep(50);

      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');
      hot.view.wt.wtOverlays.topOverlay.scrollTo(3);

      await sleep(50);

      expect($(dropdown.htContainer).is(':visible')).toBe(true);
    });
  });

  it('should mark all invalid values as invalid, after pasting them into dropdown-type cells', (done) => {
    handsontable({
      data: [
        ['', 'two', 'three'],
        ['four', 'five', 'six']
      ],
      columns: [
        {
          type: 'dropdown',
          source: choices
        },
        {},
        {}
      ]
    });

    populateFromArray(0, 0, [['invalid'], ['input']], null, null, 'paste');

    setTimeout(() => {
      expect(Handsontable.dom.hasClass(getCell(0, 0), 'htInvalid')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(1, 0), 'htInvalid')).toBe(true);
      done();
    }, 40);
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters (#839)', async() => {
    const focusListener = jasmine.createSpy('focus');
    const hot = handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'dropdown',
          source: choices,
        },
        {},
      ],
    });

    selectCell(0, 0);
    hot.getActiveEditor().TEXTAREA.addEventListener('focus', focusListener);

    await sleep(50);

    expect(focusListener).toHaveBeenCalled();

    hot.getActiveEditor().TEXTAREA.removeEventListener('focus', focusListener);
  });

  describe('IME support', () => {
    it('should focus editable element after selecting the cell', async() => {
      handsontable({
        columns: [
          {
            type: 'dropdown',
            source: choices,
          }
        ]
      });
      selectCell(0, 0, 0, 0, true, false);

      await sleep(10);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
