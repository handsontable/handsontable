import { createSpreadsheetData, spreadsheetColumnLabel } from './create-spreadsheet-data';

describe('spreadsheetColumnLabel', () => {
  it('should return "A" for index 0', () => {
    expect(spreadsheetColumnLabel(0)).toBe('A');
  });

  it('should return "B" for index 1', () => {
    expect(spreadsheetColumnLabel(1)).toBe('B');
  });

  it('should return "Z" for index 25', () => {
    expect(spreadsheetColumnLabel(25)).toBe('Z');
  });

  it('should return "AA" for index 26', () => {
    expect(spreadsheetColumnLabel(26)).toBe('AA');
  });

  it('should return "AB" for index 27', () => {
    expect(spreadsheetColumnLabel(27)).toBe('AB');
  });

  it('should return "AZ" for index 51', () => {
    expect(spreadsheetColumnLabel(51)).toBe('AZ');
  });

  it('should return "BA" for index 52', () => {
    expect(spreadsheetColumnLabel(52)).toBe('BA');
  });

  it('should return "ZZ" for index 701', () => {
    expect(spreadsheetColumnLabel(701)).toBe('ZZ');
  });
});

describe('createSpreadsheetData', () => {
  it('should create 100x4 array with default arguments', () => {
    const data = createSpreadsheetData();
    expect(data.length).toBe(100);
    expect(data[0].length).toBe(4);
  });

  it('should create array with specified dimensions', () => {
    const data = createSpreadsheetData(3, 3);
    expect(data.length).toBe(3);
    expect(data[0].length).toBe(3);
  });

  it('should generate correct Excel-like cell labels', () => {
    const data = createSpreadsheetData(3, 3);
    expect(data[0][0]).toBe('A1');
    expect(data[0][1]).toBe('B1');
    expect(data[0][2]).toBe('C1');
    expect(data[1][0]).toBe('A2');
    expect(data[2][0]).toBe('A3');
    expect(data[2][2]).toBe('C3');
  });

  it('should return empty array when rows=0', () => {
    const data = createSpreadsheetData(0, 5);
    expect(data.length).toBe(0);
  });

  it('should return rows of empty arrays when columns=0', () => {
    const data = createSpreadsheetData(3, 0);
    expect(data.length).toBe(3);
    data.forEach(row => expect(row.length).toBe(0));
  });

  it('should generate "AA1" for column index 26', () => {
    const data = createSpreadsheetData(1, 27);
    expect(data[0][26]).toBe('AA1');
  });

  it('should produce unique values for each cell', () => {
    const data = createSpreadsheetData(5, 5);
    const allCells = data.flat();
    const uniqueCells = new Set(allCells);
    expect(uniqueCells.size).toBe(allCells.length);
  });
});
