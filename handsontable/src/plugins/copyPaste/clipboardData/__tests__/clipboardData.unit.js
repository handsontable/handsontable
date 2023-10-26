import {
  ClipboardData,
} from '../clipboardData';
import { PasteClipboardData } from '../../clipboardData';
import {
  simpleWithMergedCell,
  simpleTableWithOnlyHeaders,
  simpleHandsontableWithOnlyHeaders,
  simpleWithHeaders,
  simpleWithOnlyNestedHeaders,
  simpleWithNestedHeaders,
} from './dataExamples';

describe('ClipboardData', () => {
  it('should not be possible to create instance of abstract class', () => {
    expect(() => {
      const clipboardData = new ClipboardData();

      clipboardData.getData();
    }).toThrowError();
  });

  it('should create instance of PasteClipboardData properly (simple table with merged cell)', () => {
    const clipboardData = new PasteClipboardData('B2\t\n\t', simpleWithMergedCell);

    expect(clipboardData.getData()).toEqual([
      ['B2', null],
      [null, null],
    ]);
    expect(clipboardData.getMetaInfo()).toEqual({
      data: [
        ['B2', null],
        [null, null],
      ],
      mergeCells: [
        { row: 0, col: 0, rowspan: 2, colspan: 2 },
      ],
    });
  });

  it('should create instance of PasteClipboardData properly (simple table with headers)', () => {
    const clipboardData = new PasteClipboardData('A\tB\nA1\tB1', simpleWithHeaders);

    expect(clipboardData.getData()).toEqual([
      ['A', 'B'],
      ['A1', 'B1'],
    ]);
    expect(clipboardData.getMetaInfo()).toEqual({
      data: [
        ['A1', 'B1'],
      ],
      colHeaders: ['A', 'B'],
    });
  });

  it('should create instance of PasteClipboardData properly (simple table with only first level headers)', () => {
    const clipboardData = new PasteClipboardData('A-0-0\tA-0-1', simpleTableWithOnlyHeaders);

    expect(clipboardData.getData()).toEqual([
      ['A-0-0', 'A-0-1'],
    ]);
    expect(clipboardData.getMetaInfo()).toEqual({
      colHeaders: ['A-0-0', 'A-0-1'],
    });
  });

  it('should create instance of PasteClipboardData properly (simple table with only nested headers)', () => {
    const clipboardData = new PasteClipboardData('A-1\tB-1\nA-0\tB-0', simpleWithOnlyNestedHeaders);

    expect(clipboardData.getData()).toEqual([
      ['A-1', 'B-1'],
      ['A-0', 'B-0'],
    ]);
    expect(clipboardData.getMetaInfo()).toEqual({
      nestedHeaders: [
        ['A-1', 'B-1'],
        ['A-0', 'B-0'],
      ],
    });
  });

  it('should create instance of PasteClipboardData properly (simple table with nested headers)', () => {
    const clipboardData = new PasteClipboardData('A-1\tB-1\nA-0\tB-0\nA1\tB1', simpleWithNestedHeaders);

    expect(clipboardData.getData()).toEqual([
      ['A-1', 'B-1'],
      ['A-0', 'B-0'],
      ['A1', 'B1'],
    ]);
    expect(clipboardData.getMetaInfo()).toEqual({
      data: [['A1', 'B1']],
      nestedHeaders: [
        ['A-1', 'B-1'],
        ['A-0', 'B-0'],
      ],
    });
  });

  it('should parse source of the data properly', () => {
    const tableData = new PasteClipboardData('A-0-0\tA-0-1', simpleTableWithOnlyHeaders);
    const handsontableData = new PasteClipboardData('A-0-0\tA-0-1', simpleHandsontableWithOnlyHeaders);
    const simpleText = new PasteClipboardData('hello world',
      '<span style="color: rgb(55, 55, 55);">hello world</span>');

    expect(tableData.getType()).toBe('table');
    expect(handsontableData.getType()).toBe('handsontable');
    expect(simpleText.getType()).toBe('string');
  });

  it('should return proper values after using `getCellAt` and `setCellAt` methods', () => {
    const clipboardData = new PasteClipboardData('A-1\tB-1\nA-0\tB-0\nA1\tB1', simpleWithNestedHeaders);

    expect(clipboardData.getCellAt(0, 0)).toEqual('A1');
    expect(clipboardData.getCellAt(-1, 0)).toEqual('A-0');

    clipboardData.setCellAt(-1, 0, 'A-0-modified');
    clipboardData.setCellAt(0, 0, 'A1-modified');

    expect(clipboardData.getCellAt(0, 0)).toEqual('A1-modified');
    expect(clipboardData.getCellAt(-1, 0)).toEqual('A-0-modified');
  });
});
