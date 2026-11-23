import {
  DESCRIPTION_ATTRIBUTE,
  MAX_FORMULA_TEXT_LENGTH,
  limitFormulaText,
  describeFormulaCell,
  undescribeFormulaCell,
  undescribeFormulaCells,
} from '../formulaCellDescription';

describe('formulaCellDescription', () => {
  const createCell = (text = '3'): HTMLTableCellElement => {
    const cell = document.createElement('td');

    cell.textContent = text;

    return cell;
  };

  it('should carry the text in an attribute and leave the content of the cell alone', () => {
    const cell = createCell();

    describeFormulaCell(cell, 'Formula: =SUM(A1:B1)');

    expect(cell.getAttribute(DESCRIPTION_ATTRIBUTE)).toBe('Formula: =SUM(A1:B1)');
    expect(cell.textContent).toBe('3');
    expect(cell.children).toHaveLength(0);
  });

  it('should replace the text when the cell is described again', () => {
    const cell = createCell();

    describeFormulaCell(cell, 'Formula: =A1');
    describeFormulaCell(cell, 'Formula: =A2');

    expect(cell.getAttribute(DESCRIPTION_ATTRIBUTE)).toBe('Formula: =A2');
  });

  it('should not write the attribute again for the same text', () => {
    const cell = createCell();

    describeFormulaCell(cell, 'Formula: =A1');

    const setAttribute = jest.spyOn(cell, 'setAttribute');

    describeFormulaCell(cell, 'Formula: =A1');

    expect(setAttribute).not.toHaveBeenCalled();
  });

  it('should take the description off a cell', () => {
    const cell = createCell();

    describeFormulaCell(cell, 'Formula: =A1');
    undescribeFormulaCell(cell);

    expect(cell.hasAttribute(DESCRIPTION_ATTRIBUTE)).toBe(false);
    expect(cell.textContent).toBe('3');
  });

  it('should do nothing for a cell that holds no description', () => {
    const cell = createCell();
    const removeAttribute = jest.spyOn(cell, 'removeAttribute');

    undescribeFormulaCell(cell);

    expect(removeAttribute).not.toHaveBeenCalled();
  });

  it('should take the description off every cell of a container', () => {
    const table = document.createElement('table');
    const row = table.insertRow();
    const cells = [row.insertCell(), row.insertCell(), row.insertCell()];

    cells.forEach((cell, index) => {
      cell.textContent = String(index);
    });
    describeFormulaCell(cells[0], 'Formula: =A1');
    describeFormulaCell(cells[2], 'Formula: =A3');
    undescribeFormulaCells(table);

    expect(table.querySelectorAll(`[${DESCRIPTION_ATTRIBUTE}]`)).toHaveLength(0);
    expect(table.textContent).toBe('012');
  });

  describe('limitFormulaText()', () => {
    it('should keep a formula that fits', () => {
      const formula = `=${'A'.repeat(MAX_FORMULA_TEXT_LENGTH - 1)}`;

      expect(limitFormulaText(formula)).toBe(formula);
    });

    it('should cut a longer formula and mark the cut', () => {
      const result = limitFormulaText(`=${'A'.repeat(MAX_FORMULA_TEXT_LENGTH)}`);

      expect(result).toBe(`=${'A'.repeat(MAX_FORMULA_TEXT_LENGTH - 1)}…`);
    });

    it('should not leave half of a surrogate pair at the cut', () => {
      const formula = `=${'A'.repeat(MAX_FORMULA_TEXT_LENGTH - 2)}😀😀`;
      const result = limitFormulaText(formula);

      expect(result.endsWith('…')).toBe(true);
      expect(result).not.toMatch(/[\uD800-\uDBFF]…$/);
    });
  });
});
