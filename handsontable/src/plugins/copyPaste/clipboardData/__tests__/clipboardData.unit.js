import {
  ClipboardData,
} from '../clipboardData';
import { PasteClipboardData } from '../../clipboardData';
import { simpleWithMergedCell, simpleTableWithOnlyHeaders, simpleHandsontableWithOnlyHeaders } from './dataExamples';

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

  it('should parse source of the data properly', () => {
    const tableData = new PasteClipboardData('A-0-0\tA-0-1', simpleTableWithOnlyHeaders);
    const handsontableData = new PasteClipboardData('A-0-0\tA-0-1', simpleHandsontableWithOnlyHeaders);
    const simpleText = new PasteClipboardData('hello world',
      '<span style="color: rgb(55, 55, 55);">hello world</span>');

    expect(tableData.getSource()).toBe('table');
    expect(handsontableData.getSource()).toBe('Handsontable');
    expect(simpleText.getSource()).toBe('string');
  });
});
