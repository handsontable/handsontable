import { localeLowerCase } from '../../helpers/string';
import { parseCellRef } from './cellRef';
import type { DefinedNameSnapshot } from './model';

/**
 * A name Excel accepts: a letter, underscore or backslash first, then letters, digits, dots,
 * underscores or backslashes. A letter is any Unicode letter (a German umlaut, a CJK character), as
 * in Excel and HyperFormula; an ASCII-only class refused those names and left the cells over them as
 * `#NAME?` in Excel. This file stays 7-bit ASCII, so the class is written with `\p{L}`.
 */
const DEFINED_NAME_PATTERN = /^[\p{L}_\\][\p{L}\p{N}_.\\]{0,254}$/u;

/**
 * The R1C1 spellings Excel reads as references (`R`, `C`, `RC`, `R2C`, `RC3`, `R1C1`), which it
 * refuses as names.
 */
const R1C1_NAME_PATTERN = /^(?:[RC]|R\d*C\d*)$/i;

/**
 * A defined name a writer will write, with the 0-based index of the sheet it is scoped to
 * (`undefined` for a workbook-scoped name).
 */
export interface WritableDefinedName {
  name: string;
  formula: string;
  sheetName: string | null;
  localSheetId: number | undefined;
}

/**
 * Picks the defined names both writers can write, so the two engines accept the same set. A name is
 * left out when it is not a valid name, spells a cell reference or an R1C1 reference, is scoped to a
 * sheet `sheetNames` does not hold, has an empty definition, or repeats an earlier name of the same
 * scope (names compare case-insensitively).
 *
 * @param {DefinedNameSnapshot[]} definedNames The names the snapshot holds.
 * @param {string[]} sheetNames The sheet names of the workbook being written.
 * @returns {{ entries: WritableDefinedName[], skipped: boolean }} The names to write, and whether any was left out.
 */
export function selectWritableDefinedNames(
  definedNames: DefinedNameSnapshot[],
  sheetNames: string[],
): { entries: WritableDefinedName[]; skipped: boolean } {
  const lowerSheetNames = sheetNames.map(sheetName => localeLowerCase(sheetName));
  const entries: WritableDefinedName[] = [];
  const seen = new Set<string>();
  let skipped = false;

  definedNames.forEach(({ name, formula, sheetName }) => {
    const localSheetId = sheetName === null ? undefined : lowerSheetNames.indexOf(localeLowerCase(sheetName));
    const key = `${localSheetId ?? ''}\u0000${localeLowerCase(name)}`;

    if (!DEFINED_NAME_PATTERN.test(name) || parseCellRef(name) !== null || R1C1_NAME_PATTERN.test(name)
      || localSheetId === -1 || formula.trim() === '' || seen.has(key)) {
      skipped = true;
    } else {
      seen.add(key);
      entries.push({ name, formula, sheetName, localSheetId });
    }
  });

  return { entries, skipped };
}
