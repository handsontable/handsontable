describe('HiddenRows', () => {
  const id = 'testContainer';

  const CONTEXTMENU_ITEM_SHOW = 'hidden_rows_show';

  function extractDOMStructure(overlay) {
    const overlayBody = overlay.find('tbody')[0].cloneNode(true);

    Array.from(overlayBody.querySelectorAll('th')).forEach((TH) => {
      // Simplify header content
      TH.innerText = TH.querySelector('.rowHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${overlayBody.outerHTML}`;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class']
      }
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('manualRowMove', () => {
    it('should properly render hidden ranges after moving action (moving not hidden rows just before the hidden one)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [0],
          indicators: true
        },
        manualRowMove: true,
      });

      getPlugin('manualRowMove').moveRows([2, 3, 4], 0);
      await render();

      expect(getData()).toEqual([
        ['A3', 'B3'],
        ['A4', 'B4'],
        ['A5', 'B5'],
        ['A1', 'B1'], // Hidden row
        ['A2', 'B2'],
      ]);
      expect(getRowHeight(3)).toBe(0);
      expect(getPlugin('hiddenRows').isHidden(3)).toBeTruthy();
      expect(extractDOMStructure(getMaster())).toMatchHTML(`
        <tbody>
          <tr class="ht__row_odd">
            <th class="">1</th>
            <td class="">A3</td>
            <td class="">B3</td>
          </tr>
          <tr class="ht__row_even">
            <th class="">2</th>
            <td class="">A4</td>
            <td class="">B4</td>
          </tr>
          <tr class="ht__row_odd">
            <th class="${CSS_CLASS_BEFORE_HIDDEN_ROW}">3</th>
            <td class="">A5</td>
            <td class="">B5</td>
          </tr>
          <tr class="ht__row_even">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW}">5</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A2</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B2</td>
          </tr>
        </tbody>
        `);
    });

    it('should properly render hidden ranges after moving action (moving not hidden rows just after the hidden one)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [4],
          indicators: true
        },
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([0, 1, 2], 2);
      await render();

      expect(getData()).toEqual([
        ['A4', 'B4'],
        ['A5', 'B5'], // Hidden row
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
      ]);
      expect(getRowHeight(1)).toBe(0);
      expect(getPlugin('hiddenRows').isHidden(1)).toBeTruthy();
      expect(extractDOMStructure(getMaster())).toMatchHTML(`
        <tbody>
          <tr class="ht__row_odd">
            <th class="${CSS_CLASS_BEFORE_HIDDEN_ROW}">1</th>
            <td class="">A4</td>
            <td class="">B4</td>
          </tr>
          <tr class="ht__row_even">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW}">3</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A1</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B1</td>
          </tr>
          <tr class="ht__row_odd">
            <th class="">4</th>
            <td class="">A2</td>
            <td class="">B2</td>
          </tr>
          <tr class="ht__row_even">
            <th class="">5</th>
            <td class="">A3</td>
            <td class="">B3</td>
          </tr>
        </tbody>
        `);
    });

    it('should properly render hidden ranges after moving action (moving only hidden row)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [4],
          indicators: true
        },
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([4], 1);
      await render();

      expect(getData()).toEqual([
        ['A1', 'B1'],
        ['A5', 'B5'], // Hidden row
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
      ]);
      expect(getRowHeight(1)).toBe(0);
      expect(getPlugin('hiddenRows').isHidden(1)).toBeTruthy();
      expect(extractDOMStructure(getMaster())).toMatchHTML(`
        <tbody>
          <tr class="ht__row_odd">
            <th class="${CSS_CLASS_BEFORE_HIDDEN_ROW}">1</th>
            <td class="">A1</td>
            <td class="">B1</td>
          </tr>
          <tr class="ht__row_even">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW}">3</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A2</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B2</td>
          </tr>
          <tr class="ht__row_odd">
            <th class="">4</th>
            <td class="">A3</td>
            <td class="">B3</td>
          </tr>
          <tr class="ht__row_even">
            <th class="">5</th>
            <td class="">A4</td>
            <td class="">B4</td>
          </tr>
        </tbody>
        `);
    });

    it('should properly render hidden ranges after moving action (moving range of rows containing a hidden row)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [3],
          indicators: true
        },
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([2, 3, 4], 1);
      await render();

      expect(getData()).toEqual([
        ['A1', 'B1'],
        ['A3', 'B3'],
        ['A4', 'B4'], // Hidden row
        ['A5', 'B5'],
        ['A2', 'B2'],
      ]);
      expect(getRowHeight(2)).toBe(0);
      expect(getPlugin('hiddenRows').isHidden(2)).toBeTruthy();
      expect(extractDOMStructure(getMaster())).toMatchHTML(`
        <tbody>
          <tr class="ht__row_odd">
            <th class="">1</th>
            <td class="">A1</td>
            <td class="">B1</td>
          </tr>
          <tr class="ht__row_even">
            <th class="${CSS_CLASS_BEFORE_HIDDEN_ROW}">2</th>
            <td class="">A3</td>
            <td class="">B3</td>
          </tr>
          <tr class="ht__row_odd">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW}">4</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A5</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B5</td>
          </tr>
          <tr class="ht__row_even">
            <th class="">5</th>
            <td class="">A2</td>
            <td class="">B2</td>
          </tr>
        </tbody>
        `);
    });

    it('should properly render hidden ranges after moving action (shifts between hidden rows)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
          indicators: true
        },
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([3, 1, 2], 1);
      await render();

      expect(getData()).toEqual([
        ['A1', 'B1'],
        ['A4', 'B4'], // Hidden row
        ['A2', 'B2'], // Hidden row
        ['A3', 'B3'], // Hidden row
        ['A5', 'B5'],
      ]);
      expect(getRowHeight(1)).toBe(0);
      expect(getRowHeight(2)).toBe(0);
      expect(getRowHeight(3)).toBe(0);
      expect(getPlugin('hiddenRows').isHidden(1)).toBeTruthy();
      expect(getPlugin('hiddenRows').isHidden(2)).toBeTruthy();
      expect(getPlugin('hiddenRows').isHidden(3)).toBeTruthy();
      expect(extractDOMStructure(getMaster())).toMatchHTML(`
        <tbody>
          <tr class="ht__row_odd">
            <th class="${CSS_CLASS_BEFORE_HIDDEN_ROW}">1</th>
            <td class="">A1</td>
            <td class="">B1</td>
          </tr>
          <tr class="ht__row_even">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW}">5</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A5</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B5</td>
          </tr>
        </tbody>
        `);
    });

    it('should properly render hidden ranges after moving action (moving part of hidden rows)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [1, 3, 4],
          indicators: true
        },
        manualRowMove: true
      });

      getPlugin('manualRowMove').moveRows([3, 4], 0);
      await render();

      expect(getData()).toEqual([
        ['A4', 'B4'], // Hidden row
        ['A5', 'B5'], // Hidden row
        ['A1', 'B1'],
        ['A2', 'B2'], // Hidden row
        ['A3', 'B3'],
      ]);
      expect(getRowHeight(0)).toBe(0);
      expect(getRowHeight(1)).toBe(0);
      expect(getRowHeight(3)).toBe(0);
      expect(getPlugin('hiddenRows').isHidden(0)).toBeTruthy();
      expect(getPlugin('hiddenRows').isHidden(1)).toBeTruthy();
      expect(getPlugin('hiddenRows').isHidden(3)).toBeTruthy();
      expect(extractDOMStructure(getMaster())).toMatchHTML(`
        <tbody>
          <tr class="ht__row_odd">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW} ${CSS_CLASS_BEFORE_HIDDEN_ROW}">3</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A1</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B1</td>
          </tr>
          <tr class="ht__row_even">
            <th class="${CSS_CLASS_AFTER_HIDDEN_ROW}">5</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">A3</td>
            <td class="${CSS_CLASS_AFTER_HIDDEN_ROW}">B3</td>
          </tr>
        </tbody>
        `);
    });

    describe('selection', () => {
      it('should correctly set the selection of the unhidden row when it\'s placed as a most-top ' +
         'table record (caused by moving first visible row under hidden one)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 2),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: [CONTEXTMENU_ITEM_SHOW],
          hiddenRows: {
            rows: [1],
          },
          manualRowMove: true,
        });

        getPlugin('manualRowMove').moveRow(0, 2);
        await render();

        await selectRows(1);

        await contextMenu();
        getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

        expect(spec().$container.find('.ht_master tbody th').length).toBe(5);
        expect(getCell(0, 0).innerText).toBe('A2');
        expect(getCell(1, 0).innerText).toBe('A3');
        expect(getCell(2, 0).innerText).toBe('A1');
        expect(getCell(3, 0).innerText).toBe('A4');
        expect(getCell(4, 0).innerText).toBe('A5');
        expect(getSelected()).toEqual([[0, -1, 1, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(0);
        expect(getSelectedRangeLast().from.col).toBe(-1);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
          |   ║ - : - |
          |===:===:===|
          | * ║ A : 0 |
          | * ║ 0 : 0 |
          |   ║   :   |
          |   ║   :   |
          |   ║   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('UI', () => {
      describe('backlight', () => {
        it('should get correct position and size while grabing the row placed after hidden rows', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [0, 1],
              indicators: true
            },
            manualRowMove: true,
          });

          const $headerTH = spec().$container.find('tbody tr:eq(2) th:eq(0)'); // header "5"

          $headerTH.simulate('mousedown');
          $headerTH.simulate('mouseup');
          $headerTH.simulate('mousedown'); // Triggers backlight

          const $backlight = spec().$container.find('.ht__manualRowMove--backlight');

          expect($backlight.offset().top).toBe($headerTH.offset().top);
          expect($backlight.height()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(23);
            main.toBe(29);
            horizon.toBe(37);
          });
        });

        it('should get correct position and size while grabing the multiple rows placed after hidden rows', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [0, 1],
              indicators: true
            },
            manualRowMove: true,
          });

          const $firstHeaderTH = spec().$container.find('tbody tr:eq(2) th:eq(0)');

          $firstHeaderTH
            .simulate('mousedown')
          ; // header "5"
          spec().$container.find('tbody tr:eq(3) th:eq(0)')
            .simulate('mouseover')
          ; // header "6"
          spec().$container.find('tbody tr:eq(4) th:eq(0)')
            .simulate('mouseover')
            .simulate('mouseup')
            .simulate('mousedown') // Triggers backlight
          ; // header "7"

          const $backlight = spec().$container.find('.ht__manualRowMove--backlight');

          expect($backlight.offset().top).toBe($firstHeaderTH.offset().top);
          expect($backlight.height()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(69); // 23 * 3
            main.toBe(87); // 29 * 3
            horizon.toBe(111); // 37 * 3
          });
        });

        it('should get correct position and size while grabing the row placed before hidden rows', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [8, 9],
              indicators: true
            },
            manualRowMove: true,
          });

          const $headerTH = spec().$container.find('tbody tr:eq(2) th:eq(0)'); // header "3"

          $headerTH.simulate('mousedown');
          $headerTH.simulate('mouseup');
          $headerTH.simulate('mousedown');

          const $backlight = spec().$container.find('.ht__manualRowMove--backlight');

          expect($backlight.offset().top).toBe($headerTH.offset().top);
          expect($backlight.height()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(23);
            main.toBe(29);
            horizon.toBe(37);
          });
        });

        it('should get correct position and size while grabing the multiple rows placed before hidden rows', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [8, 9],
              indicators: true
            },
            manualRowMove: true,
          });

          const $firstHeaderTH = spec().$container.find('tbody tr:eq(2) th:eq(0)');

          $firstHeaderTH
            .simulate('mousedown')
          ; // header "3"
          spec().$container.find('tbody tr:eq(3) th:eq(0)')
            .simulate('mouseover')
          ; // header "4"
          spec().$container.find('tbody tr:eq(4) th:eq(0)')
            .simulate('mouseover')
            .simulate('mouseup')
            .simulate('mousedown') // Triggers backlight
          ; // header "5"

          const $backlight = spec().$container.find('.ht__manualRowMove--backlight');

          expect($backlight.offset().top).toBe($firstHeaderTH.offset().top);
          expect($backlight.height()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(69); // 23 * 3
            main.toBe(87); // 29 * 3
            horizon.toBe(111); // 37 * 3
          });
        });
      });

      describe('guideline', () => {
        it('should get correct position while grabing the row placed after hidden rows (moving down)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [0, 1],
              indicators: true
            },
            manualRowMove: true,
          });

          const $firstHeaderTH = spec().$container.find('tbody tr:eq(2) th:eq(0)');
          const $secondHeaderTH = spec().$container.find('tbody tr:eq(3) th:eq(0)');

          $firstHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // Header "5"
          $secondHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              offsetX: 5,
              offsetY: 5,
            })
          ; // Header "6"

          const $guideline = spec().$container.find('.ht__manualRowMove--guideline');

          expect($guideline.offset().top).forThemes(({ classic, main, horizon }) => {
            classic.toBe($secondHeaderTH.offset().top - 2);
            main.toBe($secondHeaderTH.offset().top - 1.5);
            horizon.toBe($secondHeaderTH.offset().top - 1.5);
          });
        });

        it('should get correct position while grabing the row placed after hidden rows (moving up)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [0, 1],
              indicators: true
            },
            manualRowMove: true,
          });

          const $firstHeaderTH = spec().$container.find('tbody tr:eq(2) th:eq(0)');
          const $secondHeaderTH = spec().$container.find('tbody tr:eq(3) th:eq(0)');

          $secondHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // Header "6"
          $firstHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              clientY: $firstHeaderTH.offset().top + $firstHeaderTH.height(),
            })
          ; // Header "5"

          const $guideline = spec().$container.find('.ht__manualRowMove--guideline');

          expect($guideline.offset().top).forThemes(({ classic, main, horizon }) => {
            classic.toBe($firstHeaderTH.offset().top + $firstHeaderTH.height() - 1);
            main.toBe($firstHeaderTH.offset().top + $firstHeaderTH.height() - 0.5);
            horizon.toBe($firstHeaderTH.offset().top + $firstHeaderTH.height() - 0.5);
          });
        });

        it('should get correct position while grabing the row placed before hidden rows (moving down)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [8, 9],
              indicators: true
            },
            manualRowMove: true,
          });

          const $firstHeaderTH = spec().$container.find('tbody tr:eq(2) th:eq(0)');
          const $secondHeaderTH = spec().$container.find('tbody tr:eq(3) th:eq(0)');

          $firstHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // Header "3"
          $secondHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              offsetX: 5,
              offsetY: 5,
            })
          ; // Header "4"

          const $guideline = spec().$container.find('.ht__manualRowMove--guideline');

          expect($guideline.offset().top).forThemes(({ classic, main, horizon }) => {
            classic.toBe($secondHeaderTH.offset().top - 2);
            main.toBe($secondHeaderTH.offset().top - 1.5);
            horizon.toBe($secondHeaderTH.offset().top - 1.5);
          });
        });

        it('should get correct position while grabing the row placed before hidden rows (moving up)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            hiddenRows: {
              rows: [8, 9],
              indicators: true
            },
            manualRowMove: true,
          });

          const $firstHeaderTH = spec().$container.find('tbody tr:eq(2) th:eq(0)');
          const $secondHeaderTH = spec().$container.find('tbody tr:eq(3) th:eq(0)');

          $secondHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // Header "4"
          $firstHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              clientY: $firstHeaderTH.offset().top + $firstHeaderTH.height(),
            })
          ; // Header "3"

          const $guideline = spec().$container.find('.ht__manualRowMove--guideline');

          expect($guideline.offset().top).forThemes(({ classic, main, horizon }) => {
            classic.toBe($firstHeaderTH.offset().top + $firstHeaderTH.height() - 1);
            main.toBe($firstHeaderTH.offset().top + $firstHeaderTH.height() - 0.5);
            horizon.toBe($firstHeaderTH.offset().top + $firstHeaderTH.height() - 0.5);
          });
        });
      });
    });
  });
});
