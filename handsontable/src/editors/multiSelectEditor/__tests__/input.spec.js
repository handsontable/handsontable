describe('MultiSelectEditor input', () => {
  const id = 'testContainer';

  using('configuration object', [
    { choices: ['yellow', 'red', 'orange', 'green'] },
    {
      choices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }],
    },
  ], ({ choices }) => {
    const getChoiceValue = choice => choice.value || choice;
    const getSampleInitialCellValue = (...selectedValues) =>
      selectedValues.map(value => choices.filter(choice => choice.value === value || choice === value)[0]);

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

    it('should add checked value to the editor\'s textarea', async() => {
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
      const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      const $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect(editor.TEXTAREA.value).toBe('');

      await simulateClick($yellowCheckbox);

      expect(editor.TEXTAREA.value).toBe('yellow');

      await simulateClick($greenCheckbox);
      await sleep(10);

      expect(editor.TEXTAREA.value).toBe('yellow, green');
    });

    it('should check the corresponding checkboxes when typing the values in the editor\'s textarea and ' +
      'commiting the changes by pressing the comma key', async() => {
      handsontable({
        data: [
          [[]],
          [[]],
        ],
        columns: [
          {
            type: 'multiSelect',
            source: choices,
          },
        ],
      });

      // Variant 1: comma without space (",")
      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(10);

      let editor = getActiveEditor();
      let $dropdown = $('.htMultiSelectEditor');

      let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      let $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(false);
      expect($greenCheckbox.prop('checked')).toBe(false);

      editor.TEXTAREA.value = 'yellow,green';

      editor.TEXTAREA.focus();
      await keyDownUp(',');
      await sleep(10);

      $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(true);
      expect($greenCheckbox.prop('checked')).toBe(true);

      // Variant 2: comma with space (", ")
      await selectCell(1, 0);
      await keyDownUp('enter');
      await sleep(10);

      editor = getActiveEditor();
      $dropdown = $('.htMultiSelectEditor');
      $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(false);
      expect($greenCheckbox.prop('checked')).toBe(false);

      editor.TEXTAREA.value = 'yellow, green';

      editor.TEXTAREA.focus();
      await keyDownUp(',');
      await sleep(10);

      $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(true);
      expect($greenCheckbox.prop('checked')).toBe(true);
    });

    it('should not check any items when typing random text in the editor\'s textarea ' +
      '(accepted by pressing ",")', async() => {
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

      let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      let $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
      let $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
      let $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(false);
      expect($redCheckbox.prop('checked')).toBe(false);
      expect($orangeCheckbox.prop('checked')).toBe(false);
      expect($greenCheckbox.prop('checked')).toBe(false);

      editor.TEXTAREA.value = 'some random text';

      editor.TEXTAREA.focus();
      await keyDownUp(',');
      await sleep(10);

      $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
      $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
      $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(false);
      expect($redCheckbox.prop('checked')).toBe(false);
      expect($orangeCheckbox.prop('checked')).toBe(false);
      expect($greenCheckbox.prop('checked')).toBe(false);
    });

    it('should check the correct items when typing a value in between existing values in the editor\'s textarea ' +
      '(accepted by pressing ",")', async() => {
      handsontable({
        data: [
          [getSampleInitialCellValue('yellow', 'green')],
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

      let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      let $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
      let $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
      let $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(true);
      expect($greenCheckbox.prop('checked')).toBe(true);
      expect($redCheckbox.prop('checked')).toBe(false);
      expect($orangeCheckbox.prop('checked')).toBe(false);

      // Now type a value "in between" in the textarea: "yellow, red, green".
      editor.TEXTAREA.value = 'yellow, red, green';
      editor.TEXTAREA.focus();
      await keyDownUp(',');
      await sleep(10);

      $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
      $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
      $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
      $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(true);
      expect($redCheckbox.prop('checked')).toBe(true);
      expect($greenCheckbox.prop('checked')).toBe(true);
      expect($orangeCheckbox.prop('checked')).toBe(false);
    });

    it('should filter the dropdown based on the TEXTAREA value, updating on every keystroke', async() => {
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
      const $htContainer = $('.htMultiSelectEditor');

      expect($htContainer.find('li').length).toBe(choices.length);

      editor.TEXTAREA.value = 'r';
      editor.TEXTAREA.focus();
      await keyDownUp('r');
      await sleep(10);

      let items = Array.from($htContainer.find('li label')).map(label => label.textContent);

      expect(items).toEqual(choices.map(choice => choice?.value || choice).filter(
        choice => getChoiceValue(choice).toLowerCase().includes('r')),
      );

      editor.TEXTAREA.value = 're';
      editor.TEXTAREA.focus();
      await keyDownUp('e');
      await sleep(10);

      items = Array.from($htContainer.find('li label')).map(label => label.textContent);
      expect(items).toEqual(choices.map(choice => choice?.value || choice).filter(
        choice => getChoiceValue(choice).toLowerCase().includes('re')),
      );
    });

    it('should filter the dropdown when typing a new TEXTAREA item manually without committing, ' +
      'leaving all items unchecked', async() => {
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
      const $htContainer = $('.htMultiSelectEditor');

      expect($htContainer.find('li').length).toBe(choices.length);
      $htContainer.find('input[type="checkbox"]').each((_, checkbox) => {
        expect($(checkbox).prop('checked')).toBe(false);
      });

      editor.TEXTAREA.value = 're';
      editor.TEXTAREA.focus();
      await keyDownUp('r');
      await keyDownUp('e');
      await sleep(10);

      const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

      expect(items).toEqual(choices.map(choice => choice?.value || choice).filter(
        choice => getChoiceValue(choice).toLowerCase().includes('re')),
      );

      $htContainer.find('input[type="checkbox"]').each((_, checkbox) => {
        expect($(checkbox).prop('checked')).toBe(false);
      });
    });

    it('should allow committing a fully-typed TEXTAREA item by clicking on the checkbox in the filtered dropdown',
      async() => {
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
        const $htContainer = $('.htMultiSelectEditor');

        editor.TEXTAREA.value = 'red';
        editor.TEXTAREA.focus();
        await keyDownUp('r');
        await keyDownUp('e');
        await keyDownUp('d');
        await sleep(10);

        const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

        expect(items).toEqual(['red']);

        const $redCheckbox = $htContainer.find('input[type="checkbox"][data-value="red"]');

        await simulateClick($redCheckbox);
        await sleep(10);

        expect($redCheckbox.prop('checked')).toBe(true);
        expect(editor.TEXTAREA.value).toBe('red');
      });

    it('should allow committing a partially-typed TEXTAREA item by clicking on a checkbox ' +
      'when multiple dropdown items are visible', async() => {
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
      const $htContainer = $('.htMultiSelectEditor');

      editor.TEXTAREA.value = 'r';
      editor.TEXTAREA.focus();
      await keyDownUp('r');
      await sleep(10);

      const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

      expect(items).toEqual(choices.map(choice => choice?.value || choice).filter(
        choice => getChoiceValue(choice).toLowerCase().includes('r')),
      );

      const $redCheckbox = $htContainer.find('input[type="checkbox"][data-value="red"]');

      await simulateClick($redCheckbox);
      await sleep(10);

      const $orangeCheckbox = $htContainer.find('input[type="checkbox"][data-value="orange"]');
      const $greenCheckbox = $htContainer.find('input[type="checkbox"][data-value="green"]');

      expect($redCheckbox.prop('checked')).toBe(true);
      expect($orangeCheckbox.prop('checked')).toBe(false);
      expect($greenCheckbox.prop('checked')).toBe(false);
      expect(editor.TEXTAREA.value).toBe('red');
    });

    it('should filter the dropdown based on the TEXTAREA value, updating on every keystroke, ' +
      'keeping the selected items in the dropdown', async() => {
      handsontable({
        data: [
          [getSampleInitialCellValue('yellow', 'green')],
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
      const $htContainer = $('.htMultiSelectEditor');

      expect($htContainer.find('li').length).toBe(choices.length);

      editor.TEXTAREA.value = 'r';
      editor.TEXTAREA.focus();
      await keyDownUp('r');
      await sleep(10);

      let items = Array.from($htContainer.find('li label')).map(label => label.textContent);

      expect(items).toEqual(choices.map(choice => choice?.value || choice).filter(
        choice => getChoiceValue(choice).toLowerCase().includes('r') || ['yellow', 'green'].includes(choice)),
      );

      editor.TEXTAREA.value = 're';
      editor.TEXTAREA.focus();
      await keyDownUp('e');
      await sleep(10);

      items = Array.from($htContainer.find('li label')).map(label => label.textContent);
      expect(items).toEqual(choices.map(choice => choice?.value || choice).filter(
        choice => getChoiceValue(choice).toLowerCase().includes('re') || ['yellow', 'green'].includes(choice)),
      );
    });

    it('should update the dropdown when manually editing existing TEXTAREA items (accepted by pressing ",")',
      async() => {
        handsontable({
          data: [
            [getSampleInitialCellValue('yellow', 'green')],
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

        let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        let $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        let $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
        let $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(false);
        expect($orangeCheckbox.prop('checked')).toBe(false);

        editor.TEXTAREA.value = 'yellow, gre';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
        $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(false);
        expect($greenCheckbox.prop('checked')).toBe(false);
        expect($orangeCheckbox.prop('checked')).toBe(false);

        editor.TEXTAREA.value = 'yellow, red';
        editor.TEXTAREA.focus();
        await keyDownUp(',');
        await sleep(10);

        $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
        $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(false);
        expect($orangeCheckbox.prop('checked')).toBe(false);
      });

    it('should filter after the last updated TEXTAREA item when adding a new item and then ' +
      'editing an already selected one', async() => {
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
      const $htContainer = $('.htMultiSelectEditor');

      // Step 1: add a new item manually ("yellow") and commit it.
      editor.TEXTAREA.value = 'yellow';
      editor.TEXTAREA.focus();
      await keyDownUp(',');
      await sleep(10);

      const $yellowCheckbox = $htContainer.find('input[type="checkbox"][data-value="yellow"]');
      const $redCheckbox = $htContainer.find('input[type="checkbox"][data-value="red"]');
      const $orangeCheckbox = $htContainer.find('input[type="checkbox"][data-value="orange"]');
      const $greenCheckbox = $htContainer.find('input[type="checkbox"][data-value="green"]');

      expect($yellowCheckbox.prop('checked')).toBe(true);
      expect($greenCheckbox.prop('checked')).toBe(false);
      expect($redCheckbox.prop('checked')).toBe(false);
      expect($orangeCheckbox.prop('checked')).toBe(false);

      // Step 2: start typing a new (second) item and stop midway ("gre").
      editor.TEXTAREA.value = 'yellow, gre';
      editor.TEXTAREA.focus();
      editor.TEXTAREA.setSelectionRange(editor.TEXTAREA.value.length, editor.TEXTAREA.value.length);
      await keyDownUp('e');
      await sleep(10);

      let items = Array.from($htContainer.find('li label')).map(label => label.textContent);

      // The filter should now be based on the last word ("gree" / "gre"), so only "green" should match.
      expect(items).toEqual(['yellow', 'green']); // "yellow" is kept as a selected item.

      // Step 3: move the caret back to the already-selected item ("yellow") and edit it.
      editor.TEXTAREA.value = 'red, gre';
      editor.TEXTAREA.focus();
      editor.TEXTAREA.setSelectionRange(3, 3);
      await keyDownUp('d');
      await sleep(10);

      items = Array.from($htContainer.find('li label')).map(label => label.textContent);

      // The filter should now follow the last edited word ("red"), so only "red" + already selected items
      // should be visible.
      expect(items).toEqual(['yellow', 'red']);
    });
  });
});
