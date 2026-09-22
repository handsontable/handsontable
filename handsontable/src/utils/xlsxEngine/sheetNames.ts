/**
 * The worksheet-name rules the XLSX format enforces, declared once for both sides of the xlsx
 * boundary: `exportFile` sanitizes a grid's sheet name against them before a snapshot exists, and
 * the built-in engine's writer refuses a snapshot that breaks them. Re-declaring any of them in a
 * plugin or an adapter lets the two drift.
 */

/**
 * The longest worksheet name the XLSX format accepts. A longer one is truncated by Excel itself,
 * and by the ExcelJS engine with a console warning.
 */
export const SHEET_NAME_MAX_LENGTH = 31;

/**
 * The characters a worksheet name may not contain: `* ? : / \ [ ]`. The pattern carries no `g`
 * flag, so it is safe to `test()` with; use `stripIllegalSheetNameChars` to remove them all.
 */
export const ILLEGAL_SHEET_NAME_CHARS = /[*?:/\\[\]]/;

/**
 * The name the XLSX format reserves for a workbook's change history.
 */
export const RESERVED_SHEET_NAME = 'History';

/**
 * The same character class with the `g` flag, for the replace path only. Built from the pattern
 * above so the class itself is written once.
 */
const ILLEGAL_SHEET_NAME_CHARS_ALL = new RegExp(ILLEGAL_SHEET_NAME_CHARS.source, 'g');

/**
 * Removes every character a worksheet name may not contain.
 */
export function stripIllegalSheetNameChars(name: string): string {
  return name.replace(ILLEGAL_SHEET_NAME_CHARS_ALL, '');
}

/**
 * Whether a name is the reserved one. Excel reserves it case-insensitively, the same way it
 * compares names for duplicates.
 */
export function isReservedSheetName(name: string): boolean {
  return name.toLowerCase() === RESERVED_SHEET_NAME.toLowerCase();
}
