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
  simpleWithGroupHeaders,
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

  it('should parse type of the data properly', () => {
    const tableData = new PasteClipboardData('A-0-0\tA-0-1', simpleTableWithOnlyHeaders);
    const handsontableData = new PasteClipboardData('A-0-0\tA-0-1', simpleHandsontableWithOnlyHeaders);
    const simpleText = new PasteClipboardData('hello world',
      '<span style="color: rgb(55, 55, 55);">hello world</span>');

    expect(tableData.getType()).toBe('table');
    expect(handsontableData.getType()).toBe('handsontable');
    expect(simpleText.getType()).toBe('unrecognizable');
  });

  it('should return proper values after using `getCellAt` and `setCellAt` methods', () => {
    const clipboardData = new PasteClipboardData('A-1\tB-1\nA-0\tB-0\nA1\tB1', simpleWithNestedHeaders);
    const clipboardData2 = new PasteClipboardData('B2\t\n\t', simpleWithMergedCell);

    expect(clipboardData.getCellAt(0, 0)).toEqual('A1');
    expect(clipboardData.getCellAt(-1, 0)).toEqual('A-0');

    clipboardData.setCellAt(-1, 0, 'A-0-modified');
    clipboardData.setCellAt(0, 0, 'A1-modified');

    expect(clipboardData.getCellAt(0, 0)).toEqual('A1-modified');
    expect(clipboardData.getCellAt(-1, 0)).toEqual('A-0-modified');

    expect(clipboardData2.getCellAt(0, 0)).toEqual('B2');
    expect(clipboardData2.getCellAt(0, 1)).toEqual(null);
    expect(clipboardData2.getCellAt(1, 0)).toEqual(null);
    expect(clipboardData2.getCellAt(1, 1)).toEqual(null);

    clipboardData2.setCellAt(0, 0, 'B2-modified');

    expect(clipboardData2.getCellAt(0, 0)).toEqual('B2-modified');
    expect(clipboardData2.getCellAt(0, 1)).toEqual(null);
    expect(clipboardData2.getCellAt(1, 0)).toEqual(null);
    expect(clipboardData2.getCellAt(1, 1)).toEqual(null);
  });

  it('should properly store data for grouped headers', () => {
    const clipboardData = new PasteClipboardData('A-0-0\t\tC-0-0\t\tG-0-0\tH-0-0', simpleWithGroupHeaders);

    expect(clipboardData.getData()).toEqual([
      ['A-0-0', '', '', 'D-0-0', '', '', 'G-0-0', 'H-0-0'],
    ]);

    expect(clipboardData.getMetaInfo()).toEqual({
      nestedHeaders: [[
        { label: 'A-0-0', colspan: 3 },
        { label: 'D-0-0', colspan: 3 },
        'G-0-0',
        'H-0-0',
      ]],
    });
  });

  it('should properly get data for grouped headers', () => {
    const clipboardData = new PasteClipboardData('A-0-0\t\tC-0-0\t\tG-0-0\tH-0-0', simpleWithGroupHeaders);

    expect(clipboardData.getCellAt(-1, 0)).toEqual('A-0-0');
    expect(clipboardData.getCellAt(-1, 1)).toEqual('A-0-0');
    expect(clipboardData.getCellAt(-1, 2)).toEqual('A-0-0');
    expect(clipboardData.getCellAt(-1, 3)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 4)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 5)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 6)).toEqual('G-0-0');
    expect(clipboardData.getCellAt(-1, 7)).toEqual('H-0-0');
  });

  it('should properly set data for grouped headers using `setCellAt` method', () => {
    const clipboardData = new PasteClipboardData('A-0-0\t\tC-0-0\t\tG-0-0\tH-0-0', simpleWithGroupHeaders);

    clipboardData.setCellAt(-1, 0, 'Z-0-0');
    clipboardData.setCellAt(-1, 6, 'hello world');

    expect(clipboardData.getMetaInfo()).toEqual({
      nestedHeaders: [[
        { label: 'Z-0-0', colspan: 3 },
        { label: 'D-0-0', colspan: 3 },
        'hello world',
        'H-0-0',
      ]],
    });

    expect(clipboardData.getCellAt(-1, 0)).toEqual('Z-0-0');
    expect(clipboardData.getCellAt(-1, 1)).toEqual('Z-0-0');
    expect(clipboardData.getCellAt(-1, 2)).toEqual('Z-0-0');
    expect(clipboardData.getCellAt(-1, 3)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 4)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 5)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 6)).toEqual('hello world');
    expect(clipboardData.getCellAt(-1, 7)).toEqual('H-0-0');
  });

  it('should properly set data for grouped headers using `setMetaInfo` method', () => {
    const clipboardData = new PasteClipboardData('A-0-0\t\tC-0-0\t\tG-0-0\tH-0-0', simpleWithGroupHeaders);

    clipboardData.setMetaInfo('nestedHeaders', [[
      { label: 'Z-0-0', colspan: 2 },
      { label: 'D-0-0', colspan: 3 },
      'hello world',
      'H-0-0',
    ]]);

    expect(clipboardData.getCellAt(-1, 0)).toEqual('Z-0-0');
    expect(clipboardData.getCellAt(-1, 1)).toEqual('Z-0-0');
    expect(clipboardData.getCellAt(-1, 2)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 3)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 4)).toEqual('D-0-0');
    expect(clipboardData.getCellAt(-1, 5)).toEqual('hello world');
    expect(clipboardData.getCellAt(-1, 6)).toEqual('H-0-0');

    clipboardData.getMetaInfo('nestedHeaders', [[
      { label: 'Z-0-0', colspan: 2 },
      { label: 'D-0-0', colspan: 3 },
      'hello world',
      'H-0-0',
    ]]);
  });
});
