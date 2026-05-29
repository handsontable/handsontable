/**
 * Types for the Walkontable border rendering system.
 * These are internal to Walkontable — not part of the public Handsontable API.
 */

export interface BorderPositionSettings {
  hide?: boolean;
  color?: string;
  width?: number;
  style?: string;
  [key: string]: unknown;
}

export interface BorderInstanceSettings {
  border?: {
    width?: number;
    color?: string;
    cornerVisible?: boolean | ((...args: unknown[]) => boolean);
    style?: string;
    [key: string]: unknown;
  };
  className?: string;
  layerLevel?: number;
  top?: BorderPositionSettings;
  start?: BorderPositionSettings;
  bottom?: BorderPositionSettings;
  end?: BorderPositionSettings;
  corner?: BorderPositionSettings;
  [key: string]: unknown;
}

export interface CornerDefaultStyle {
  width: number | string;
  height: number | string;
  borderWidth: number | string;
  borderStyle: string;
  borderColor: string;
  [key: string]: unknown;
}

export interface SelectionHandles {
  top: HTMLDivElement;
  topHitArea: HTMLDivElement;
  bottom: HTMLDivElement;
  bottomHitArea: HTMLDivElement;
  styles: {
    top: CSSStyleDeclaration;
    topHitArea: CSSStyleDeclaration;
    bottom: CSSStyleDeclaration;
    bottomHitArea: CSSStyleDeclaration;
    [key: string]: CSSStyleDeclaration;
  };
  [key: string]: unknown;
}
