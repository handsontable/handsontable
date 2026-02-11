export type BaseRenderer = (
  instance: any,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Record<string, unknown>
) => void;

export declare const baseRenderer: BaseRenderer;

export declare function registerRenderer(name: string, renderer: any): void;
