describe('MultiSelectEditor keyboard navigation', () => {
  const id = 'testContainer';

  using('configuration object', [
    { choices: ['yellow', 'red', 'orange', 'green'] },
    {
      choices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' },
      ],
    },
  ], ({ choices }) => {
    const getSampleInitialCellValue = (...selectedValues) =>
      selectedValues.map(value =>
        choices.find(choice => (choice.value === value || choice === value))
      );

    beforeEach(function() {
      this.$container =
        $(`<div id="${id}" style="width: 300px; height: 200px; overflow: auto"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('navigating the dropdown with arrow keys', () => {
      it('should move focus inside the dropdown with ArrowDown and ArrowUp, then return focus to the input when leaving the list', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();
        const $dropdown = $('.htMultiSelectEditor');

        expect(document.activeElement).toBe(editor.TEXTAREA);

        await keyDownUp('ArrowDown');
        await sleep(10);

        const focusedCheckbox1 = $dropdown.find('input[type="checkbox"]:focus')[0];

        expect(focusedCheckbox1).toBeDefined();
        expect(focusedCheckbox1.dataset.value).toBe('yellow');

        await keyDownUp('ArrowDown');
        await sleep(10);

        const focusedCheckbox2 = $dropdown.find('input[type="checkbox"]:focus')[0];

        expect(focusedCheckbox2).toBeDefined();
        expect(focusedCheckbox2.dataset.value).toBe('red');

        await keyDownUp('ArrowUp');
        await sleep(10);

        const focusedCheckbox3 = $dropdown.find('input[type="checkbox"]:focus')[0];

        expect(focusedCheckbox3).toBeDefined();
        expect(focusedCheckbox3.dataset.value).toBe('yellow');

        await keyDownUp('ArrowUp');
        await sleep(10);

        expect($dropdown.find('input[type="checkbox"]:focus').length).toBe(0);
        expect(document.activeElement).toBe(editor.TEXTAREA);
      });
    });

    describe('confirming the selection with Enter', () => {
      it('should save the selection to the cell when pressing Enter and close the editor', async() => {
        handsontable({
          data: [
            [getSampleInitialCellValue('yellow', 'red')],
          ],
          columns: [
            {
              type: 'multiSelect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();

        expect(editor.TEXTAREA.value).toBe('yellow, red');

        await keyDownUp('enter');
        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('yellow, red');
        expect(getSourceDataAtCell(0, 0)).toEqual(getSampleInitialCellValue('yellow', 'red'));
        expect(getActiveEditor().isOpened()).toBe(false);
      });
    });
  });
});
