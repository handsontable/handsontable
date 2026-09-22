import HyperFormula from 'hyperformula';

describe('Formulas public API', () => {
  const debug = false;

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (debug) {
      return;
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('isFormulaCellType()', () => {
    it('should return `true` when under the cell is formula', async() => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          ['', ''],
          ['', ''],
          ['=A1', '\'=A1'],
          [0, true],
          [null, undefined],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

      const formulas = getPlugin('formulas');

      expect(formulas.isFormulaCellType(0, 0)).toBe(false);
      expect(formulas.isFormulaCellType(0, 1)).toBe(false);
      expect(formulas.isFormulaCellType(1, 0)).toBe(false);
      expect(formulas.isFormulaCellType(2, 0)).toBe(true);
      expect(formulas.isFormulaCellType(3, 0)).toBe(false);
      expect(formulas.isFormulaCellType(4, 0)).toBe(true);
      expect(formulas.isFormulaCellType(4, 1)).toBe(false);
      expect(formulas.isFormulaCellType(5, 0)).toBe(false);
      expect(formulas.isFormulaCellType(5, 1)).toBe(false);
      expect(formulas.isFormulaCellType(6, 0)).toBe(false);
      expect(formulas.isFormulaCellType(6, 1)).toBe(false);
    });
  });

  describe('getCellType()', () => {
    it('should detect cells correctly', async() => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          [null, null],
          [null, null],
          ['=A1', '\'=A1'],
          [0, true],
          [null, undefined],
          ['', 1.1],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

      const formulas = getPlugin('formulas');

      expect(formulas.getCellType(0, 0)).toBe('VALUE');
      expect(formulas.getCellType(0, 1)).toBe('VALUE');
      expect(formulas.getCellType(1, 0)).toBe('VALUE');
      expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
      expect(formulas.getCellType(3, 0)).toBe('ARRAY');
      expect(formulas.getCellType(4, 0)).toBe('FORMULA');
      expect(formulas.getCellType(4, 1)).toBe('VALUE');
      expect(formulas.getCellType(5, 0)).toBe('VALUE');
      expect(formulas.getCellType(5, 1)).toBe('VALUE');
      expect(formulas.getCellType(6, 0)).toBe('EMPTY');
      expect(formulas.getCellType(6, 1)).toBe('EMPTY');
      expect(formulas.getCellType(7, 0)).toBe('VALUE');
      expect(formulas.getCellType(7, 1)).toBe('VALUE');

      await setDataAtCell(2, 0, '=ARRAYFORMULA(A1:A2*B1:B2)');

      expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
      expect(formulas.getCellType(3, 0)).toBe('ARRAY');
    });
  });

  // `getCellDependents` / `getCellPrecedents` are public-API delegations with no DOM interaction, exactly
  // like the `getCellType` / `isFormulaCellType` tests above. Their coverage lives here beside those
  // sibling tests rather than in a new Playwright spec: there is nothing to drive in a real browser, and
  // splitting the four closely-related public-API methods across two suites would only obscure them.
  describe('getCellDependents()', () => {
    it('should return the cells that depend on the given cell', async() => {
      handsontable({
        data: [['1', '=A1', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // B1 (=A1) and C1 (=A1+B1) both reference A1.
      expect(formulas.getCellDependents({ sheet: 0, row: 0, col: 0 })).toEqual(
        jasmine.arrayWithExactContents([
          { sheet: 0, row: 0, col: 1 },
          { sheet: 0, row: 0, col: 2 },
        ])
      );
    });

    it('should accept a cell range and return the cells that depend on it', async() => {
      handsontable({
        data: [['1'], ['2'], ['=SUM(A1:A2)']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // A3 (=SUM(A1:A2)) depends on the range A1:A2. `arrayContaining` (not `arrayWithExactContents`)
      // because HyperFormula may also return other ranges/cells related to A1:A2; A3 must be among them.
      expect(formulas.getCellDependents({
        start: { sheet: 0, row: 0, col: 0 },
        end: { sheet: 0, row: 1, col: 0 },
      })).toEqual(jasmine.arrayContaining([
        { sheet: 0, row: 2, col: 0 },
      ]));
    });

    it('should return a range (not only single cells) when a dependent is a range', async() => {
      handsontable({
        data: [['1'], ['2'], ['=SUM(A1:A2)']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // A1 is part of the range A1:A2 read by =SUM(A1:A2), so its dependent is that range, not a cell.
      expect(formulas.getCellDependents({ sheet: 0, row: 0, col: 0 })).toEqual(
        jasmine.arrayWithExactContents([
          {
            start: { sheet: 0, row: 0, col: 0 },
            end: { sheet: 0, row: 1, col: 0 },
          },
        ])
      );
    });

    it('should report a named-expression dependent with a `sheet` id of `-1`', async() => {
      handsontable({
        data: [['1']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
          namedExpressions: [
            { name: 'MyExpr', expression: '=Sheet1!$A$1' },
          ],
        }
      });

      const formulas = getPlugin('formulas');

      // The named expression reads A1, so A1's dependent is the named-expression reference (sheet: -1).
      expect(formulas.getCellDependents({ sheet: 0, row: 0, col: 0 })).toEqual(
        jasmine.arrayContaining([
          { sheet: -1, row: 0, col: 0 },
        ])
      );
    });
  });

  describe('getCellPrecedents()', () => {
    it('should return the cells that the given cell depends on', async() => {
      handsontable({
        data: [['1', '=A1', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // C1 (=A1+B1) reads A1 and B1.
      expect(formulas.getCellPrecedents({ sheet: 0, row: 0, col: 2 })).toEqual(
        jasmine.arrayWithExactContents([
          { sheet: 0, row: 0, col: 0 },
          { sheet: 0, row: 0, col: 1 },
        ])
      );
    });

    it('should accept a cell range and return the cells it depends on', async() => {
      handsontable({
        data: [['1'], ['2'], ['=SUM(A1:A2)']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // The range A1:A2 is read by =SUM(A1:A2) in A3, so its precedents are A1 and A2.
      expect(formulas.getCellPrecedents({
        start: { sheet: 0, row: 0, col: 0 },
        end: { sheet: 0, row: 1, col: 0 },
      })).toEqual(jasmine.arrayWithExactContents([
        { sheet: 0, row: 0, col: 0 },
        { sheet: 0, row: 1, col: 0 },
      ]));
    });
  });

  describe('showFormulas() / hideFormulas() / isShowingFormulas()', () => {
    it('should report calculated values by default', async() => {
      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      expect(formulas.isShowingFormulas()).toBe(false);
      expect(getDataAtCell(0, 2)).toBe(3);
    });

    // Display-only, matching Excel/Sheets: `showFormulas()` changes what the cell PAINTS, not what
    // `getDataAtCell()` reports. See the "does not affect other features" tests below for the
    // sort/filter/validate proof that this boundary holds.
    it('should display the formula text in the rendered cell without changing getDataAtCell()', async() => {
      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      formulas.showFormulas();

      expect(formulas.isShowingFormulas()).toBe(true);
      expect(getCell(0, 2).textContent).toBe('=A1+B1');
      expect(getDataAtCell(0, 2)).toBe(3);
      // A non-formula cell is unaffected.
      expect(getCell(0, 0).textContent).toBe('1');
    });

    it('should revert the rendered cell to the calculated value after hideFormulas()', async() => {
      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      formulas.showFormulas();
      formulas.hideFormulas();

      expect(formulas.isShowingFormulas()).toBe(false);
      expect(getCell(0, 2).textContent).toBe('3');
      expect(getDataAtCell(0, 2)).toBe(3);
    });

    it('should reset to hidden on a disable/re-enable cycle, and reject calls while disabled', async() => {
      const hot = handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      formulas.showFormulas();
      expect(formulas.isShowingFormulas()).toBe(true);

      hot.updateSettings({ formulas: false });

      // Calling the API while the plugin is disabled must not silently set the flag: there is no
      // `modifyData` hook registered to act on it, so it would misreport a mode that shows nothing.
      formulas.showFormulas();
      expect(formulas.isShowingFormulas()).toBe(false);

      hot.updateSettings({ formulas: { engine: HyperFormula } });

      expect(formulas.isShowingFormulas()).toBe(false);
      expect(getDataAtCell(0, 2)).toBe(3);
    });

    it('should show the formula text only on an array formula\'s origin cell, leaving its spill' +
      ' cells at their calculated values', async() => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          [null, null],
          [null, null],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

      const formulas = getPlugin('formulas');

      expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
      expect(formulas.getCellType(3, 1)).toBe('ARRAY');

      formulas.showFormulas();

      // Only the origin cell has its own formula text to show; a spill cell has none of its own,
      // so it keeps displaying the value HyperFormula computed for it.
      expect(getCell(2, 0).textContent).toBe('=TRANSPOSE(A1:B2)');
      expect(getCell(2, 1).textContent).toBe('3');
      expect(getCell(3, 0).textContent).toBe('2');
      expect(getCell(3, 1).textContent).toBe('4');
    });

    it('should copy the formula text, not the calculated value, while formulas are shown', async() => {
      spyOn(document, 'execCommand');

      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');
      const copyPaste = getPlugin('copyPaste');

      formulas.showFormulas();

      await selectCell(0, 2);

      const copyEvent = getClipboardEvent();

      copyPaste.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('=A1+B1');
    });

    it('should copy the calculated value, not the formula text, while formulas are hidden', async() => {
      spyOn(document, 'execCommand');

      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const copyPaste = getPlugin('copyPaste');

      await selectCell(0, 2);

      const copyEvent = getClipboardEvent();

      copyPaste.onCopy(copyEvent);

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('3');
    });

    describe('does not affect other Handsontable features while formulas are shown', () => {
      it('should sort a formula column by its calculated value, not its formula text', async() => {
        handsontable({
          // The formula text in column 1, read row by row, is already ascending ('=A1' < '=A2' <
          // '=A3'): a leak that sorted by formula text would leave the rows in this original
          // order. Sorting by the calculated value (3, 1, 2) reorders them.
          data: [
            ['3', '=A1'],
            ['1', '=A2'],
            ['2', '=A3'],
          ],
          columnSorting: true,
          formulas: {
            engine: HyperFormula
          }
        });

        getPlugin('formulas').showFormulas();
        getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

        expect(getDataAtCol(0)).toEqual(['1', '2', '3']);
      });

      it('should list a formula column\'s calculated values, not its formula text, in the filter-by-value dropdown', async() => {
        handsontable({
          data: [
            ['1', '2', '=A1+B1'],
            ['3', '4', '=A2+B2'],
          ],
          colHeaders: true,
          dropdownMenu: true,
          filters: true,
          formulas: {
            engine: HyperFormula
          }
        });

        getPlugin('formulas').showFormulas();

        await dropdownMenu(2);

        expect($(byValueBoxRootElement()).find('label:eq(0)').text()).toBe('3');
      });

      it('should validate a numeric formula column against its calculated value, not its formula text', async() => {
        handsontable({
          data: [['1', '2', '=A1+B1']],
          columns: [{}, {}, { type: 'numeric' }],
          formulas: {
            engine: HyperFormula
          }
        });

        getPlugin('formulas').showFormulas();

        // eslint-disable-next-line handsontable/require-await
        await new Promise(resolve => validateCells(resolve));

        expect(getCellMeta(0, 2).valid).toBe(true);
      });
    });

    // The legacy jQuery-simulated `keydown`/`keyup` events this suite's `keyDownUp()` helper builds
    // do not carry a real `which`/`keyCode` for the backquote key (there's no entry for it in
    // `KEY_CODES_MAP`), so a simulated press cannot prove the shortcut fires on a genuine keypress -
    // that's covered by a Playwright spec instead (`tests/e2e/formulas-show-formulas.spec.ts`). This
    // asserts the wiring a unit-level test CAN prove: exactly one shortcut is registered for the
    // real key combo, and invoking it runs the toggle.
    it('should register exactly one grid shortcut for control+backquote that toggles the mode', async() => {
      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');
      const gridContext = hot().getShortcutManager().getContext('grid');
      const shortcuts = gridContext.getShortcuts(['control', 'backquote']);

      expect(shortcuts.length).toBe(1);

      shortcuts[0].callback();

      expect(formulas.isShowingFormulas()).toBe(true);

      shortcuts[0].callback();

      expect(formulas.isShowingFormulas()).toBe(false);
    });
  });

  describe('coordinate space', () => {
    it('should use HyperFormula index space (not visual) for the argument and the returned coordinates', async() => {
      handsontable({
        // HyperFormula/physical rows: 0:'1', 1:'2', 2:'3', 3:'=A1+A2'.
        data: [['1'], ['2'], ['3'], ['=A1+A2']],
        // Trim the first physical row, so visual indexes no longer match HyperFormula indexes:
        // visual 0 -> HF 1, visual 1 -> HF 2, visual 2 -> HF 3 (the formula cell).
        trimRows: [0],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // Sanity check that the two index spaces really diverge here: the formula sits at HF row 3
      // but visual row 2.
      expect(formulas.isFormulaCellType(2, 0)).toBe(true);

      // Precedents of the formula cell, addressed by its HF index (row 3), come back in HF index space:
      // A1 (HF row 0, a trimmed row that has no visual index) and A2 (HF row 1). A visual-translating
      // implementation would neither accept row 3 as the formula cell nor return the trimmed row 0.
      expect(formulas.getCellPrecedents({ sheet: 0, row: 3, col: 0 })).toEqual(
        jasmine.arrayWithExactContents([
          { sheet: 0, row: 0, col: 0 },
          { sheet: 0, row: 1, col: 0 },
        ])
      );
    });
  });
});
