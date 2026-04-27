describe('MultiSelectEditor', () => {
  const id = 'testContainer';

  using('configuration object', [
    {
      choices: ['yellow', 'red', 'orange', 'green'],
      longChoices: [
        'yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white', 'purple', 'lime',
        'olive', 'cyan', 'pink', 'brown', 'silver', 'gold', 'maroon', 'navy', 'teal', 'indigo',
        'violet', 'magenta', 'coral', 'crimson',
      ],
    },
    {
      choices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' }],
      longChoices: [
        { key: 'yel', value: 'yellow' },
        { key: 'red', value: 'red' },
        { key: 'ora', value: 'orange' },
        { key: 'grn', value: 'green' },
        { key: 'blu', value: 'blue' },
        { key: 'gry', value: 'gray' },
        { key: 'blk', value: 'black' },
        { key: 'wht', value: 'white' },
        { key: 'pur', value: 'purple' },
        { key: 'lim', value: 'lime' },
        { key: 'olv', value: 'olive' },
        { key: 'cyn', value: 'cyan' },
        { key: 'pnk', value: 'pink' },
        { key: 'brn', value: 'brown' },
        { key: 'siv', value: 'silver' },
        { key: 'gld', value: 'gold' },
        { key: 'mro', value: 'maroon' },
        { key: 'nvy', value: 'navy' },
        { key: 'tla', value: 'teal' },
        { key: 'ind', value: 'indigo' },
        { key: 'vlt', value: 'violet' },
        { key: 'mgt', value: 'magenta' },
        { key: 'crr', value: 'coral' },
        { key: 'crm', value: 'crimson' },
      ],
    },
  ], ({ choices, longChoices }) => {
    beforeEach(function() {
      this.$container =
        $(`<div id="${id}" style="width: 300px; height: 600px; overflow: auto"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('opening the editor', () => {
      it('should open the editor, display an empty dropdown and not throw any errors when the source ' +
      'is not provided', async() => {
        const spy = jasmine.createSpyObj('error', ['test']);
        const prevError = window.onerror;

        window.onerror = function() {
          spy.test();

          return true;
        };

        handsontable({
          columns: [
            {
              type: 'multiselect',
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(0);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
        expect(spy.test.calls.count()).toBe(0);

        window.onerror = prevError;
      });

      it('should open empty editor with no items checked when cell value is empty', async() => {
        handsontable({
          columns: [
            {
              type: 'multiselect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(choices.length);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        $checkboxes.each(function() {
          expect(this.checked).toBe(false);
        });
      });

      it('should open editor with items checked according to the cell value', async() => {
        handsontable({
          data: [
            [[choices[0], choices[3]]],
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
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');

        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(2);

        const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
        const $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(false);
        expect($orangeCheckbox.prop('checked')).toBe(false);
      });

      it('should open editor with no items checked when cell value is not in the dropdown', async() => {
        handsontable({
          data: [
            [['not-in-list']],
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
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $checkboxes = $dropdown.find('input[type="checkbox"]');

        expect($checkboxes.length).toBe(choices.length);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        $checkboxes.each(function() {
          expect(this.checked).toBe(false);
        });
      });

      it('should open editor with only the existing dropdown items checked when cell value ' +
        'contains mixed values', async() => {
        handsontable({
          data: [
            [[choices[0], 'not-in-list', choices[3]]],
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
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');

        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(2);

        const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');
        const $greenCheckbox = $dropdown.find('input[type="checkbox"][data-value="green"]');

        expect($yellowCheckbox.prop('checked')).toBe(true);
        expect($greenCheckbox.prop('checked')).toBe(true);
        expect($redCheckbox.prop('checked')).toBe(false);
        expect($orangeCheckbox.prop('checked')).toBe(false);
      });

      it('should open the editor downwards when there\'s enough space below the edited cell',
        async() => {
          spec().$container.css('height', '400px').css('overflow', 'auto');

          const data = [];

          for (let i = 0; i < 30; i++) {
            data[i] = [];

            for (let j = 0; j < 30; j++) {
              data[i].push([longChoices[j % longChoices.length]]);
            }
          }

          handsontable({
            data,
            type: 'multiselect',
            source: longChoices,
          });

          await selectCell(0, 0);
          await keyDownUp('enter');
          await sleep(10);

          expect(getActiveEditor().dropdownController.isFlippedVertically()).toBe(false);
          expect($('.ht-multi-select-editor').offset().top)
            .toBeGreaterThan($(getCell(0, 0)).offset().top);
        });

      it('should open the editor upwards when there\'s more space above than below the edited cell',
        async() => {
          spec().$container.css('height', '400px').css('overflow', 'auto');

          const data = [];

          for (let i = 0; i < 30; i++) {
            data[i] = [];

            for (let j = 0; j < 30; j++) {
              data[i].push([longChoices[j % longChoices.length]]);
            }
          }

          handsontable({
            data,
            type: 'multiselect',
            source: longChoices,
          });

          await selectCell(10, 0);
          await keyDownUp('enter');
          await sleep(10);

          expect(getActiveEditor().dropdownController.isFlippedVertically()).toBe(true);
          expect($('.ht-multi-select-editor').offset().top)
            .toBeLessThan(await $(getCell(10, 0)).offset().top);
        });

      describe('re-opening the editor after closing with ESC', () => {
        it('should show the same dropdown items when opening with ENTER after closing with ESC', async() => {
          handsontable({
            data: [[[]]],
            columns: [
              {
                type: 'multiselect',
                source: choices,
              },
            ],
          });

          await selectCell(0, 0);
          await keyDownUp('enter');
          await sleep(10);

          const $dropdownFirst = $('.ht-multi-select-editor');
          const itemsBeforeEsc = Array.from($dropdownFirst.find('li label')).map(label => label.textContent);

          await keyDownUp('escape');
          await sleep(10);

          await keyDownUp('enter');
          await sleep(10);

          const $dropdownSecond = $('.ht-multi-select-editor');
          const itemsAfterReopen = Array.from($dropdownSecond.find('li label')).map(label => label.textContent);

          expect(itemsAfterReopen).toEqual(itemsBeforeEsc);
        });
      });
    });

    describe('saving data', () => {
      it('should save the selection data after each change in the editor (unlike the other editors)', async() => {
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

        expect(getSourceDataAtCell(0, 0)).toEqual([]);

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        let $dropdown = $('.ht-multi-select-editor');
        let $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');

        expect($checkbox.prop('checked')).toBe(false);

        await simulateClick($checkbox);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect(getSourceDataAtCell(0, 0)).toEqual([choices[0]]);

        $dropdown = $('.ht-multi-select-editor');
        $checkbox = $dropdown.find('input[type="checkbox"][data-value="red"]');

        expect($checkbox.prop('checked')).toBe(false);

        await simulateClick($checkbox);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect(getSourceDataAtCell(0, 0)).toEqual([choices[0], choices[1]]);
      });
    });

    describe('`maxSelections` option', () => {
      it('should disable unchecked checkboxes after reaching the maxSelections limit', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              maxSelections: 2,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');

        await simulateClick($yellowCheckbox);
        await simulateClick($redCheckbox);
        await sleep(10);

        expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);

        const $uncheckedCheckboxes = $dropdown.find('input[type="checkbox"]:not(:checked)');

        expect($uncheckedCheckboxes.length).toBe(choices.length - 2);

        $uncheckedCheckboxes.each(function() {
          expect($(this)[0].getAttribute('data-disabled')).toBe('true');
        });

        await simulateClick($orangeCheckbox);
        await sleep(10);

        expect($orangeCheckbox.prop('checked')).toBe(false);
      });

      it('should re-enable unchecked checkboxes after deselecting below maxSelections', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              maxSelections: 2,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
        const $orangeCheckbox = $dropdown.find('input[type="checkbox"][data-value="orange"]');

        await simulateClick($yellowCheckbox);
        await simulateClick($redCheckbox);
        await sleep(10);

        $dropdown.find('input[type="checkbox"]:not(:checked)').each(function() {
          expect($(this)[0].getAttribute('data-disabled')).toBe('true');
        });

        await simulateClick($yellowCheckbox);
        await sleep(10);

        expect($yellowCheckbox.prop('checked')).toBe(false);

        $dropdown.find('input[type="checkbox"]').each(function() {
          expect($(this)[0].getAttribute('data-disabled')).toBe('false');
        });

        await simulateClick($orangeCheckbox);
        await sleep(10);

        expect($orangeCheckbox.prop('checked')).toBe(true);
        expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);
      });

      it('should keep unchecked entries disabled after filtering until selections are reduced, then enable them',
        async() => {
          handsontable({
            data: [
              [[]],
            ],
            columns: [
              {
                type: 'multiselect',
                source: choices,
                maxSelections: 2,
                filterSelectedItems: false,
              },
            ],
          });

          await selectCell(0, 0);
          await keyDownUp('enter');
          await sleep(10);

          const editor = getActiveEditor();
          const $dropdown = $('.ht-multi-select-editor');
          const $redCheckbox = $dropdown.find('input[type="checkbox"][data-value="red"]');
          let $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');

          await simulateClick($yellowCheckbox);
          await simulateClick($redCheckbox);
          await sleep(10);

          expect($dropdown.find('input[type="checkbox"]:checked').length).toBe(2);

          const input = editor.getInputElement();

          input.value = 'a';
          input.focus();
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await sleep(10);

          const $filteredDropdown = $('.ht-multi-select-editor');
          const $visibleCheckboxes = $filteredDropdown.find('input[type="checkbox"]');

          $visibleCheckboxes.each(function() {
            if (!$(this).prop('checked')) {
              expect($(this)[0].getAttribute('data-disabled')).toBe('true');
            }
          });

          const $orangeCheckbox = $filteredDropdown.find('input[type="checkbox"][data-value="orange"]');

          await simulateClick($orangeCheckbox);
          await sleep(10);

          expect($orangeCheckbox.prop('checked')).toBe(false);
          expect($orangeCheckbox[0].getAttribute('data-disabled')).toBe('true');

          $filteredDropdown.find('input[type="checkbox"]:not(:checked)').each(function() {
            expect($(this)[0].getAttribute('data-disabled')).toBe('true');
          });

          $yellowCheckbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
          await simulateClick($yellowCheckbox);
          await sleep(10);

          expect($yellowCheckbox.prop('checked')).toBe(false);
          expect($yellowCheckbox[0].getAttribute('data-disabled')).toBe('false');

          await simulateClick($orangeCheckbox);
          await sleep(10);

          expect($orangeCheckbox.prop('checked')).toBe(true);
          expect($orangeCheckbox[0].getAttribute('data-disabled')).toBe('false');

          $filteredDropdown.find('input[type="checkbox"]:not(:checked)').each(function() {
            expect($(this)[0].getAttribute('data-disabled')).toBe('true');
          });
        });
    });

    describe('`filteringCaseSensitive` option', () => {
      it('should filter case-insensitively when the option is disabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              filteringCaseSensitive: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();
        const $htContainer = $('.ht-multi-select-editor');

        expect($htContainer.find('li').length).toBe(choices.length);

        const input = editor.getInputElement();

        input.value = 'Y';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(10);

        const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

        expect(items).toEqual(
          choices
            .map(choice => choice?.value || choice)
            .filter(value => value.toLowerCase().includes('y'))
        );
      });

      it('should filter case-sensitively when the option is enabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              filteringCaseSensitive: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const editor = getActiveEditor();
        const $htContainer = $('.ht-multi-select-editor');

        expect($htContainer.find('li').length).toBe(choices.length);

        const input = editor.getInputElement();

        input.value = 'Y';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(10);

        const items = Array.from($htContainer.find('li label')).map(label => label.textContent);

        expect(items).toEqual([]);
      });
    });

    describe('`sourceSortFunction` option', () => {
      it('should use provided function to sort dropdown options', async() => {
        const sourceSortFunction = entries => entries
          .slice()
          .sort((a, b) => {
            const valueA = a?.value ?? a;
            const valueB = b?.value ?? b;

            return valueA.localeCompare(valueB);
          })
          .reverse();

        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              sourceSortFunction,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const items = Array.from($dropdown.find('li label')).map(label => label.textContent);
        const expectedOrder = choices
          .slice()
          .sort((a, b) => {
            const valueA = a?.value ?? a;
            const valueB = b?.value ?? b;

            return valueA.localeCompare(valueB);
          })
          .reverse()
          .map(choice => choice?.value ?? choice);

        expect(items).toEqual(expectedOrder);
      });
    });

    describe('`visibleRows` option', () => {
      it('should display as many entries as possible within the trimming container, when the `visibleRows` option is not set', async() => {
        handsontable({
          data: [
            [[]],
          ],
          width: 400,
          height: 500,
          columns: [
            {
              type: 'multiselect',
              source: choices,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const dropdown = $('.ht-multi-select-editor')[0];
        const bottomOfDropdown = dropdown.getBoundingClientRect().top + dropdown.getBoundingClientRect().height;
        const lastItem = dropdown.querySelector('li:last-child');
        const bottomOfLastItem = lastItem.getBoundingClientRect().top + lastItem.getBoundingClientRect().height;

        expect(bottomOfLastItem).toBeLessThan(bottomOfDropdown);
      });

      it('should limit the number of visible rows in the dropdown, when the `visibleRows` option is set', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              visibleRows: 2,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const dropdown = $('.ht-multi-select-editor')[0];
        const bottomOfDropdown = dropdown.getBoundingClientRect().top + dropdown.getBoundingClientRect().height;
        const getBottomOfItem = item => item.getBoundingClientRect().top + item.getBoundingClientRect().height;

        const items = dropdown.querySelectorAll('li');

        expect(getBottomOfItem(items[0])).toBeLessThan(bottomOfDropdown);
        expect(getBottomOfItem(items[1])).toBeLessThan(bottomOfDropdown);
        expect(getBottomOfItem(items[2])).toBeGreaterThan(bottomOfDropdown);
      });
    });

    describe('`searchInput` option', () => {
      it('should display the search input when the `searchInput` option is enabled', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              searchInput: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $searchInput = $dropdown.find('.ht-multi-select-editor-search-input');

        expect($searchInput.is(':visible')).toBe(true);
        expect($searchInput.val()).toBe('');
        expect($searchInput.attr('placeholder')).toBe('Search...');
      });

      it('should hide the search input when the `searchInput` option is disabled', async() => {
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
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $searchInput = $dropdown.find('.ht-multi-select-editor-search-input');

        expect($searchInput.is(':visible')).toBe(false);
      });

      it('should open the editor with the pressed character in the search input and filter the dropdown when ' +
        'search input is enabled (key: "Y")', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              searchInput: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('Y');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $searchInput = $dropdown.find('.ht-multi-select-editor-search-input');
        const visibleItems = Array.from($dropdown.find('li label')).map(label => label.textContent);
        const expectedValues = choices
          .map(choice => choice?.value ?? choice)
          .filter(value => value.toLowerCase().includes('y'));

        expect($searchInput.is(':visible')).toBe(true);
        expect($searchInput.val()).toBe('Y');
        expect(visibleItems).toEqual(expectedValues);
      });

      it('should open the editor with the pressed character in the search input and filter the dropdown when ' +
        'search input is enabled (key: space)', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: [...choices, 'with space'],
              searchInput: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('space');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $searchInput = $dropdown.find('.ht-multi-select-editor-search-input');
        const visibleItems = $dropdown.find('li').length;
        const searchValue = $searchInput.val();

        expect($searchInput.is(':visible')).toBe(true);
        expect(searchValue === ' ').toBe(true);
        expect(visibleItems).toBe(1);
      });

      it('should open the editor with the pressed character in the search input and filter the dropdown when ' +
        'search input is enabled (key: "#")', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: [...choices, 'with #'],
              searchInput: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('#', { extend: { key: '#', keyCode: 226 } });
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $searchInput = $dropdown.find('.ht-multi-select-editor-search-input');
        const visibleItems = $dropdown.find('li').length;

        expect($searchInput.is(':visible')).toBe(true);
        expect($searchInput.val()).toBe('#');
        expect(visibleItems).toBe(1);
      });
    });

    describe('`filterSelectedItems` option', () => {
      it('should filter out the selected items from the dropdown when the `filterSelectedItems` option is enabled', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              filterSelectedItems: true,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('Y');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const visibleItems = Array.from($dropdown.find('li label')).map(label => label.textContent);
        const expectedValues = choices
          .map(choice => choice?.value ?? choice)
          .filter(value => value.toLowerCase().includes('y'));

        expect(visibleItems).toEqual(expectedValues);
      });

      it('should keep the selected items in the dropdown when the `filterSelectedItems` option is disabled', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              filterSelectedItems: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('Y');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const visibleItems = Array.from($dropdown.find('li label')).map(label => label.textContent);
        const expectedValues = choices
          .map(choice => choice?.value ?? choice)
          .filter(value => value.toLowerCase().includes('y'));

        expect(visibleItems).toEqual(expectedValues);
      });
    });

    describe('opening the editor with a printable character when search input is disabled', () => {
      it('should open the dropdown without filtering when opening with "Y"', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              searchInput: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('Y');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const visibleCount = $dropdown.find('li').length;

        expect(visibleCount).toBe(choices.length);
      });

      it('should open the dropdown without filtering when opening with space', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: [...choices, 'with space'],
              searchInput: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('space');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const visibleCount = $dropdown.find('li').length;

        expect(visibleCount).toBe(choices.length + 1);
      });

      it('should open the dropdown without filtering when opening with "#"', async() => {
        handsontable({
          data: [[[]]],
          columns: [
            {
              type: 'multiselect',
              source: [...choices, 'with #'],
              searchInput: false,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('#', { extend: { key: '#', keyCode: 226 } });
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const visibleCount = $dropdown.find('li').length;

        expect(visibleCount).toBe(choices.length + 1);
      });
    });

    describe('clicking on dropdown items', () => {
      it('should toggle selection when clicking on the checkbox', async() => {
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
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        await simulateClick($checkbox);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(1);

        await simulateClick($checkbox);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
      });

      it('should toggle selection when clicking on the label', async() => {
        const hot = handsontable({
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

        const instanceId = hot.guid;

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $label = $dropdown.find(`label[for="${instanceId}-ht-multi-select-editor-item-0"]`);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        await simulateClick($label);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(1);

        await simulateClick($label);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
      });

      it('should toggle selection when clicking on the list item element', async() => {
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
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const $checkbox = $dropdown.find('input[type="checkbox"][data-value="yellow"]');
        const $listItem = $checkbox.closest('li');

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);

        await simulateClick($listItem);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(true);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(1);

        await simulateClick($listItem);
        await sleep(10);

        expect($checkbox.prop('checked')).toBe(false);
        expect($dropdown.find('li.ht-multi-select-editor-item-selected').length).toBe(0);
      });
    });

    describe('dropdown width', () => {
      it('should have a minimum width of 120px when source entries are short', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: ['a', 'b', 'c'],
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        expect($('.ht-multi-select-editor')[0].clientWidth).toEqual(120);
      });

      it('should size to content width when source entries are longer than min-width', async() => {
        handsontable({
          data: [
            [[]],
          ],
          columns: [
            {
              type: 'multiselect',
              source: ['This is a very long option text'],
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        const $dropdown = $('.ht-multi-select-editor');
        const dropdownWidth = $dropdown.outerWidth();

        const expectedWidth =
          $dropdown.find('li:first-child label').outerWidth() +
          $dropdown.find('li:first-child input').outerWidth() +
          (hot().stylesHandler.getCSSVariableValue('menu-item-horizontal-padding') * 2) +
          (hot().stylesHandler.getCSSVariableValue('menu-border-width') * 2);

        // Allow 1px tolerance for subpixel rounding differences across themes
        // (e.g. non-zero letter-spacing produces fractional text widths).
        expect(Math.abs(dropdownWidth - expectedWidth)).toBeLessThanOrEqual(1);
      });
    });

    describe('removing a chip', () => {
      it('the dropdown selections should reflect the cells state after removing a chip ' +
        'by clicking on the chip\'s remove button', async() => {
        handsontable({
          data: [[choices.filter(
            choice => ['yellow', 'red', 'orange'].includes(choice.value ?? choice)
          )]],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              width: 250,
            },
          ],
        });

        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        let $dropdown = $('.ht-multi-select-editor');
        let $checkedCheckboxes = $dropdown.find('input[type="checkbox"]:checked');

        expect($checkedCheckboxes.length).toEqual(3);
        expect($checkedCheckboxes.eq(0).data('value')).toBe('yellow');
        expect($checkedCheckboxes.eq(1).data('value')).toBe('red');
        expect($checkedCheckboxes.eq(2).data('value')).toBe('orange');

        const chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        const renderedChips = chipsContainer.find('.ht-multi-select-chip');
        const visibleChips = renderedChips.filter(':visible');

        const removeButton = visibleChips.eq(0).find('.ht-multi-select-chip-remove');

        removeButton.click();
        await sleep(10);

        $dropdown = $('.ht-multi-select-editor');
        $checkedCheckboxes = $dropdown.find('input[type="checkbox"]:checked');

        expect($checkedCheckboxes.length).toEqual(2);
        expect($checkedCheckboxes.eq(0).data('value')).toBe('red');
        expect($checkedCheckboxes.eq(1).data('value')).toBe('orange');

      });

      it('should not sync the dropdown when the chip removal action happened on a different cell, ' +
        'while the editor was still open', async() => {
        handsontable({
          data: [[choices.filter(
            choice => ['yellow', 'red', 'orange'].includes(choice.value ?? choice)
          ), choices.filter(
            choice => ['yellow', 'red', 'orange'].includes(choice.value ?? choice)
          )]],
          columns: [
            {
              type: 'multiselect',
              source: choices,
              width: 250,
            },
            {
              type: 'multiselect',
              source: choices,
              width: 250,
            },
          ],
        });

        await selectCell(0, 1);
        await keyDownUp('enter');
        await sleep(10);

        let $dropdown = $('.ht-multi-select-editor');
        let $checkedCheckboxes = $dropdown.find('input[type="checkbox"]:checked');

        expect($checkedCheckboxes.length).toEqual(3);
        expect($checkedCheckboxes.eq(0).data('value')).toBe('yellow');
        expect($checkedCheckboxes.eq(1).data('value')).toBe('red');
        expect($checkedCheckboxes.eq(2).data('value')).toBe('orange');

        const chipsContainer = $('table.htCore tr:eq(0) td:eq(0) .ht-multi-select-chips-container');
        const renderedChips = chipsContainer.find('.ht-multi-select-chip');
        const visibleChips = renderedChips.filter(':visible');

        const removeButton = visibleChips.eq(0).find('.ht-multi-select-chip-remove');

        removeButton.click();
        await sleep(10);

        getCell(0, 0).click();
        await sleep(10);

        $dropdown = $('.ht-multi-select-editor');
        $checkedCheckboxes = $dropdown.find('input[type="checkbox"]:checked');

        expect($checkedCheckboxes.length).toEqual(3);
        expect($checkedCheckboxes.eq(0).data('value')).toBe('yellow');
        expect($checkedCheckboxes.eq(1).data('value')).toBe('red');
        expect($checkedCheckboxes.eq(2).data('value')).toBe('orange');
      });
    });

    describe('multiple Handsontable instances on the same page', () => {
      it('should save the selection to the currently edited instance when clicking a label, ' +
        'not to a cell from a previously edited instance', async() => {
        handsontable({
          data: [[[]]],
          columns: [{ type: 'multiselect', source: choices }],
        });

        const $container2 = $('<div style="width: 300px; height: 300px;"></div>').appendTo('body');
        const hot2 = new Handsontable($container2[0], {
          data: [[[]]],
          columns: [{ type: 'multiselect', source: choices }],
        });

        // Open the editor on instance 1 then close it without selecting anything
        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);
        await keyDownUp('escape');
        await sleep(10);

        // Open the editor on instance 2
        hot2.selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(10);

        // Click the label of the first checkbox in instance 2's dropdown
        const $dropdown2 = $(hot2.rootElement).find('.ht-multi-select-editor');
        const $label2 = $dropdown2.find('label').first();

        await simulateClick($label2);
        await sleep(10);

        // The value should be saved to instance 2's cell
        expect(hot2.getSourceDataAtCell(0, 0)).toEqual([choices[0]]);

        // Instance 1's cell should remain unchanged
        expect(getSourceDataAtCell(0, 0)).toEqual([]);

        hot2.destroy();
        $container2.remove();
      });
    });
  });
});
