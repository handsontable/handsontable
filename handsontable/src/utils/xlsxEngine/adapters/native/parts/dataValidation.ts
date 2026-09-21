import type { CellValidationSnapshot } from '../../../model';
import { colIndexToLetter } from '../../../cellRef';
import { XmlWriter } from '../xml/writer';

/**
 * One cell carrying a list validation, 0-based.
 */
export interface ValidationCell {
  row: number;
  col: number;
  validation: CellValidationSnapshot;
}

/**
 * Turns a set of cells into the space-separated `sqref` of vertical runs (`A2:A4 A6 C2`).
 */
function toSqref(cells: Array<{ row: number; col: number }>): string {
  const sorted = [...cells].sort((a, b) => (a.col - b.col) || (a.row - b.row));
  const runs: string[] = [];
  let start: { row: number; col: number } | null = null;
  let last: { row: number; col: number } | null = null;

  /**
   * Closes the current run into A1 notation.
   */
  const flush = (): void => {
    if (start === null || last === null) {
      return;
    }

    const letter = colIndexToLetter(start.col + 1);
    const from = `${letter}${start.row + 1}`;

    runs.push(start.row === last.row ? from : `${from}:${letter}${last.row + 1}`);
  };

  sorted.forEach((cell) => {
    if (last !== null && cell.col === last.col && cell.row === last.row + 1) {
      last = cell;

      return;
    }

    flush();
    start = cell;
    last = cell;
  });
  flush();

  return runs.join(' ');
}

/**
 * Serializes `<dataValidations>`. Cells with the same formulae and `allowBlank` share one element,
 * which is what Excel itself writes for a validated column. Returns `''` for no validations.
 */
export function dataValidationsXml(cells: ValidationCell[]): string {
  if (cells.length === 0) {
    return '';
  }

  const groups = new Map<string, { validation: CellValidationSnapshot; cells: Array<{ row: number; col: number }> }>();

  cells.forEach((cell) => {
    const key = `${cell.validation.allowBlank ? 1 : 0}\u0000${cell.validation.formulae.join('\u0000')}`;
    const group = groups.get(key);

    if (group) {
      group.cells.push(cell);
    } else {
      groups.set(key, { validation: cell.validation, cells: [cell] });
    }
  });

  const w = new XmlWriter(false).open('dataValidations', { count: groups.size });

  groups.forEach(({ validation, cells: members }) => {
    w.open('dataValidation', {
      type: 'list',
      allowBlank: validation.allowBlank ? '1' : undefined,
      showErrorMessage: '1',
      sqref: toSqref(members),
    });
    validation.formulae.slice(0, 2).forEach((formula, index) => w.leaf(`formula${index + 1}`, undefined, formula));
    w.close();
  });

  return w.close().toString();
}
