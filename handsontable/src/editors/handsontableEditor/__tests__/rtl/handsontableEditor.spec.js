describe('HandsontableEditor (RTL mode)', () => {
  function getManufacturerData() {
    return [
      { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
      { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
      { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
      { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
      { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
      { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
    ];
  }

  function offsetForRtl(cell, editorWidth, rightBorderCompensation) {
    const $cell = $(cell);
    const offset = $cell.offset();

    offset.left = offset.left - editorWidth + $cell.outerWidth() + (rightBorderCompensation ? 0 : 1);

    return offset;
  }

  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should render an editable editor\'s element without messing with "dir" attribute', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        editor: 'handsontable',
      });

      selectCell(0, 0);

      const editableElement = getActiveEditor().TEXTAREA;

      expect(editableElement.getAttribute('dir')).toBeNull();
    });

    it('should render an editor in specified position at cell 0, 0', () => {
      handsontable({
        layoutDirection,
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          }
        ],
      });

      selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 0), editor.outerWidth(), true));
    });

    it('should render an editor in specified position at cell 0, 0 when all headers are selected', () => {
      handsontable({
        layoutDirection,
        rowHeaders: true,
        colHeaders: true,
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          }
        ],
      });

      selectAll();
      listen();

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      keyDown('F2');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 0), editor.outerWidth(), true));
    });

    it('should render an editor in specified position while opening an editor from top to bottom when ' +
      'top and bottom overlays are enabled', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(8, 2),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 3,
        fixedRowsBottom: 3,
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          },
          {},
        ],
      });

      selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      // Cells that do not touch the edges of the table have an additional top border.
      const editorOffset = () => ({
        top: editor.offset().top + 1,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual(offsetForRtl(getCell(1, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(2, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(3, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(4, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
      expect(editor.offset()).toEqual(offsetForRtl(getCell(5, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(6, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(7, 0, true), editor.outerWidth(), true));
    });

    it('should render an editor in specified position while opening an editor from right to left when ' +
      'right overlay is enabled', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        rowHeaders: true,
        colHeaders: true,
        fixedColumnsStart: 3,
        type: 'handsontable',
        handsontable: {
          colHeaders: ['Marque', 'Country', 'Parent company'],
          data: getManufacturerData()
        }
      });

      selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 0, true), editor.outerWidth(), true));

      selectCell(0, 1);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 1, true), editor.outerWidth()));

      selectCell(0, 2);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 2, true), editor.outerWidth()));

      selectCell(0, 3);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 3, true), editor.outerWidth()));

      selectCell(0, 4);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 4, true), editor.outerWidth()));
    });

    it('should render an editor in specified position while opening an editor from top to bottom when ' +
      'top and bottom overlays are enabled and the first row of the both overlays are hidden', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(8, 2),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 3,
        fixedRowsBottom: 3,
        hiddenRows: {
          indicators: true,
          rows: [0, 5],
        },
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          },
          {},
        ],
      });

      selectCell(1, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      keyDown('enter');

      // First renderable row index.
      expect(editor.offset()).toEqual(offsetForRtl(getCell(1, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      // Cells that do not touch the edges of the table have an additional top border.
      const editorOffset = () => ({
        top: editor.offset().top + 1,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual(offsetForRtl(getCell(2, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(3, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(4, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
      expect(editor.offset()).toEqual(offsetForRtl(getCell(6, 0, true), editor.outerWidth(), true));

      keyDown('enter');
      keyDown('enter');

      expect(editorOffset()).toEqual(offsetForRtl(getCell(7, 0, true), editor.outerWidth(), true));
    });

    it('should render an editor in specified position while opening an editor from right to left when ' +
      'right overlay is enabled and the first column of the overlay is hidden', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        rowHeaders: true,
        colHeaders: true,
        fixedColumnsStart: 3,
        hiddenColumns: {
          indicators: true,
          columns: [0],
        },
        type: 'handsontable',
        handsontable: {
          colHeaders: ['Marque', 'Country', 'Parent company'],
          data: getManufacturerData()
        }
      });

      selectCell(0, 1);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      keyDown('enter');

      // First renderable column index.
      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 1, true), editor.outerWidth(), true));

      selectCell(0, 2);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 2, true), editor.outerWidth()));

      selectCell(0, 3);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 3, true), editor.outerWidth()));

      selectCell(0, 4);
      keyDown('enter');

      expect(editor.offset()).toEqual(offsetForRtl(getCell(0, 4, true), editor.outerWidth()));
    });
  });
});
