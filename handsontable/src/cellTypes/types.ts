/**
 * Types for cell types module
 */

/**
 * Generic editor constructor type
 */
export type EditorConstructor = {
  new (hotInstance: any): any;
  EDITOR_TYPE: string;
};

/**
 * Renderer function type for use in CellTypeObject
 */
export interface TypedRenderer {
  (
    hotInstance: any,
    TD: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any,
    cellProperties: any
  ): void;
  RENDERER_TYPE: string;
}

/**
 * Validator function type for use in CellTypeObject
 */
export type ValidatorFunction = (value: any, callback: (valid: boolean) => void) => void;

/**
 * Cell type object interface
 */
export interface CellTypeObject {
  CELL_TYPE: string;
  editor?: EditorConstructor;
  renderer?: TypedRenderer;
  validator?: ValidatorFunction;
  [key: string]: any;
} 