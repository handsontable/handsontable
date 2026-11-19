/**
 * The header axis a rename applies to: `'column'` for a column header, `'row'` for a row header.
 */
export type HeaderAxis = 'column' | 'row';

/**
 * The object form of the `editableHeaders` option.
 */
export interface EditableHeadersSettings {
  /**
   * Whether users can rename column headers. Defaults to `true`.
   */
  columnHeaders?: boolean;
  /**
   * Whether users can rename row headers. Defaults to `false`.
   */
  rowHeaders?: boolean;
}
