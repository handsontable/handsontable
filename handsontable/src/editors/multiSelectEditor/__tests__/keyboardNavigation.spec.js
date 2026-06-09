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
      it('should focus the search input element after opening the editor if search input is enabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);

        const $dropdown = $('.ht-multi-select-editor');
        const searchInput = $dropdown.find('.ht-multi-select-editor-search-input')[0];

        expect(searchInput).toBeDefined();
        expect(document.activeElement).toBe(searchInput);
      });

      it('should focus the first item\'s checkbox after opening the editor if search input is disabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              searchInput: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);

        const $dropdown = $('.ht-multi-select-editor');
        const checkbox1 = $dropdown.find('input[type="checkbox"]').first()[0];

        expect(checkbox1).toBeDefined();
        expect(document.activeElement).toBe(checkbox1);
        expect(checkbox1.dataset.value).toBe('yellow');
      });

      it('should move focus inside the dropdown with ArrowDown and ArrowUp', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);

        const editor = getActiveEditor();
        const $dropdown = $('.ht-multi-select-editor');

        await keyDownUp('ArrowDown');
        await waitForNextAnimationFrames(1);

        const checkbox1 = $dropdown.find('input[type="checkbox"]').first()[0];

        expect(checkbox1).toBeDefined();
        expect(document.activeElement).toBe(checkbox1);
        expect(checkbox1.dataset.value).toBe('yellow');

        await keyDownUp('ArrowDown');
        await waitForNextAnimationFrames(1);

        let activeElement = document.activeElement;

        expect(activeElement).toBeDefined();
        expect(activeElement).toBe($dropdown.find('input[type="checkbox"]').eq(1)[0]);
        expect(activeElement.dataset.value).toBe('red');

        await keyDownUp('ArrowUp');
        await waitForNextAnimationFrames(1);

        activeElement = document.activeElement;

        expect(activeElement).toBeDefined();
        expect(activeElement).toBe($dropdown.find('input[type="checkbox"]').first()[0]);
        expect(activeElement.dataset.value).toBe('yellow');

        await keyDownUp('ArrowUp');
        await waitForNextAnimationFrames(1);

        activeElement = document.activeElement;

        expect(activeElement).toBe(editor.getInputElement());
      });
    });

    describe('utilizing the Enter key', () => {
      it('should keep the original data when pressing Enter twice on a cell when `enterCommits` is enabled.', async() => {
        handsontable({
          data: [
            [getSampleInitialCellValue('yellow', 'red')],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);
        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);

        expect(getDataAtCell(0, 0)).toBe('yellow, red');
        expect(getSourceDataAtCell(0, 0)).toEqual(getSampleInitialCellValue('yellow', 'red'));
        expect(getActiveEditor().isOpened()).toBe(false);
      });

      it('should select a dropdown entry when pressing Enter if `enterCommits` is disabled.', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              enterCommits: false,
              searchInput: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);

        const editor = getActiveEditor();
        const $dropdown = $('.ht-multi-select-editor');
        const checkbox1 = $dropdown.find('input[type="checkbox"]').first()[0];

        expect(checkbox1).toBeDefined();
        expect(document.activeElement).toBe(checkbox1);
        expect(checkbox1.dataset.value).toBe('yellow');
        expect(checkbox1.checked).toBe(false);

        await keyDownUp('enter');
        await waitForNextAnimationFrames(1);

        expect(checkbox1.checked).toBe(true);
        expect(getSourceDataAtCell(0, 0)).toEqual(getSampleInitialCellValue('yellow'));
        expect(editor.isOpened()).toBe(true);
      });
    });

    describe('opening the editor with a printable character', () => {
      it('should open the editor with a printable character and allow keyboard navigation', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('E');
        await waitForNextAnimationFrames(1);

        const editor = getActiveEditor();
        const $dropdown = $('.ht-multi-select-editor');

        expect(editor.isOpened()).toBe(true);
        expect($dropdown.find('.ht-multi-select-editor-search-input').val()).toBe('E');
        expect(document.activeElement).toBe(editor.getInputElement());

        await keyDownUp('ArrowDown');
        await waitForNextAnimationFrames(1);

        let activeCheckbox = $dropdown.find('input[type="checkbox"]:visible').first()[0];

        expect(document.activeElement).toBe(activeCheckbox);
        expect(activeCheckbox.dataset.value).toBe('yellow');

        await keyDownUp('ArrowDown');
        await waitForNextAnimationFrames(1);

        activeCheckbox = $dropdown.find('input[type="checkbox"]:visible').eq(1)[0];

        expect(document.activeElement).toBe(activeCheckbox);
        expect(activeCheckbox.dataset.value).toBe('red');
      });

      it('should open the editor with a printable character and allow keyboard navigation when search is disabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              searchInput: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('E');
        await waitForNextAnimationFrames(1);

        const editor = getActiveEditor();
        const $dropdown = $('.ht-multi-select-editor');

        expect(editor.isOpened()).toBe(true);

        let activeCheckbox = $dropdown.find('input[type="checkbox"]').first()[0];

        expect(document.activeElement).toBe(activeCheckbox);
        expect(activeCheckbox.dataset.value).toBe('yellow');

        await keyDownUp('ArrowDown');
        await waitForNextAnimationFrames(1);

        activeCheckbox = $dropdown.find('input[type="checkbox"]').eq(1)[0];
        expect(document.activeElement).toBe(activeCheckbox);
        expect(activeCheckbox.dataset.value).toBe('red');
      });
    });
  });
});
