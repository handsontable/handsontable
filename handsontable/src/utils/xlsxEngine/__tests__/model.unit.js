import { createWorkbookSnapshot, createSheetSnapshot, createCellSnapshot } from '../model';

describe('xlsxEngine model factories', () => {
  it('should create an empty workbook with no compression', () => {
    expect(createWorkbookSnapshot()).toEqual({ sheets: [], compression: false });
  });

  it('should create a visible, LTR, unprotected sheet with empty collections', () => {
    expect(createSheetSnapshot('Sheet1')).toEqual({
      name: 'Sheet1',
      state: 'visible',
      rtl: false,
      rows: [],
      colWidths: [],
      rowHeights: [],
      hiddenCols: [],
      hiddenRows: [],
      merges: [],
      freeze: null,
      protection: null,
      conditionalFormatting: [],
    });
  });

  it('should create a cell with every field null', () => {
    expect(createCellSnapshot()).toEqual({
      value: null,
      formula: null,
      numFmt: null,
      style: null,
      validation: null,
      locked: null,
      comment: null,
    });
  });
});
