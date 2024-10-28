import { parse } from '../';

describe('SheetClip', () => {
  describe('parse', () => {
    it('should parse letter into one cell', () => {
      const entry = 'A';
      const result = parse(entry);
      const expected = [
        ['A'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse letters into one cell', () => {
      const entry = 'A B C';
      const result = parse(entry);
      const expected = [
        ['A B C'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse tab separated values into separated cells in one row', () => {
      const entry = 'A\tB';
      const result = parse(entry);
      const expected = [
        ['A', 'B'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse non-alphanumeric data into separated cells', () => {
      const entry = '£§!@#$%^&*()\t_-+=~`{[}]:;"\t\'\\|<,>.?/';
      const result = parse(entry);
      const expected = [
        ['£§!@#$%^&*()', '_-+=~`{[}]:;"', '\'\\|<,>.?/'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse quotes chars into cell if there is no tab char', () => {
      const entry = '{"json": "like", "value": ""}';
      const result = parse(entry);
      const expected = [
        ['{"json": "like", "value": ""}'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse multiline text into one cell', () => {
      const entry = '"A\r\nB"';
      const result = parse(entry);
      const expected = [
        ['A\r\nB'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse multiline text with new lines at the end into many rows', () => {
      const entry = '"A\r\nB"\r\n\r\n';
      const result = parse(entry);
      const expected = [
        ['A\r\nB'],
        [''],
        [''],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse text into cells in separated rows', () => {
      const entry = 'A\r\nB\r\nC';
      const result = parse(entry);
      const expected = [
        ['A'],
        ['B'],
        ['C'],
      ];

      expect(result).toEqual(expected);
    });

    it('should ignore tab char separator in a multiline text', () => {
      const entry = 'A\r\n"B\tC\r\nD"\r\nE';
      const result = parse(entry);
      const expected = [
        ['A'],
        ['B\tC\r\nD'],
        ['E'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse multiline phrase into separated cells with multiline text at the end of middle row', () => {
      const entry = 'A\tB\tC\r\nD\tE\t"F\r\nG\r\n\r\nH"\r\nI\tJ\tK';
      const result = parse(entry);
      const expected = [
        ['A', 'B', 'C'],
        ['D', 'E', 'F\r\nG\r\n\r\nH'],
        ['I', 'J', 'K'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse empty cells 2x2 into array with two rows with two column each', () => {
      const entry = '\t\r\n\t';
      const result = parse(entry);
      const expected = [
        ['', ''],
        ['', ''],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse empty cells 2x1 into array with two rows with one column each', () => {
      const entry = '\r\n';
      const result = parse(entry);
      const expected = [
        [''],
        [''],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse following empty lines into rows with empty strings', () => {
      const entry = '\r\n\r\n';
      const result = parse(entry);
      const expected = [
        [''],
        [''],
        [''],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse empty cell into array with one column in one row', () => {
      const entry = '';
      const result = parse(entry);
      const expected = [
        [''],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse text in quotes separated by tab into two cells in one row', () => {
      const entry = '"A"\t"B"';
      const result = parse(entry);
      const expected = [
        ['A', 'B'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse text in quotes separated by new line into two rows with one column each', () => {
      const entry = '"A"\n"B"';
      const result = parse(entry);
      const expected = [
        ['A'],
        ['B'],
      ];

      expect(result).toEqual(expected);
    });

    it('should ignore inproperly escaped quotes in cell value separated by tab into two cells in one row with', () => {
      const entry = '""A""\t""B""';
      const result = parse(entry);
      const expected = [
        ['A', 'B'],
      ];

      expect(result).toEqual(expected);
    });

    it('should ignore inproperly escaped quotes in cell value separated by new line into two rows with one column each', () => {
      const entry = '""A""\n""B""';
      const result = parse(entry);
      const expected = [
        ['A'],
        ['B'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse properly escaped quotes in cell value separated by tab into two cells in one row with', () => {
      const entry = '"""A"""\t"""B"""';
      const result = parse(entry);
      const expected = [
        ['"A"', '"B"'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse properly escaped quotes in cell value separated by new line into two rows with one column each', () => {
      const entry = '"""A"""\n"""B"""';
      const result = parse(entry);
      const expected = [
        ['"A"'],
        ['"B"'],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse empty quotes separated by tab into two empty cells in one row', () => {
      const entry = '""\t""';
      const result = parse(entry);
      const expected = [
        ['', ''],
      ];

      expect(result).toEqual(expected);
    });

    it('should parse text in quotes separated by new line into two rows with one empty cell each', () => {
      const entry = '""\n""';
      const result = parse(entry);
      const expected = [
        [''],
        [''],
      ];

      expect(result).toEqual(expected);
    });
  });
});
