/**
 * Types for renderers module
 */

/**
 * Renderer function type
 */
export type RendererFunction = (
  hotInstance: any, 
  TD: HTMLTableCellElement, 
  row: number, 
  col: number, 
  prop: string | number, 
  value: any, 
  cellProperties: any
) => void;

/**
 * Renderer with type information
 */
export interface TypedRenderer extends RendererFunction {
  RENDERER_TYPE: string;
} 