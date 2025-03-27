import { CellRange as BaseCellRange } from '../3rdparty/walkontable/src/selection/interfaces';
import CellRange from '../3rdparty/walkontable/src/cell/range';
import { CellCoords } from './../core/types';


/**
 * Extended CellCoords interface that adds additional functionality needed across the codebase
 */
export interface ExtendedCellCoords extends CellCoords {
  /**
   * Creates a clone of this coordinates object
   */
  clone(): ExtendedCellCoords;
  
  /**
   * Normalizes the coordinates
   */
  normalize(): ExtendedCellCoords;
  
  /**
   * Assigns coordinates from another coords object
   */
  assign(coords: CellCoords): CellCoords;
}

/**
 * Extended CellRange interface that combines functionality needed across the codebase
 */
export interface ExtendedCellRange extends BaseCellRange {
  /**
   * Highlight coordinates within the range
   */
  highlight: ExtendedCellCoords;
  
  /**
   * Starting coordinates of the range
   */
  from: ExtendedCellCoords;
  
  /**
   * Ending coordinates of the range
   */
  to: ExtendedCellCoords;
  
  /**
   * Sets the highlight coordinates for this range
   */
  setHighlight(coords: CellCoords): void;
  
  /**
   * Sets the starting coordinates for this range
   */
  setFrom(coords: ExtendedCellCoords): ExtendedCellRange;
  
  /**
   * Sets the ending coordinates for this range
   */
  setTo(coords: ExtendedCellCoords): ExtendedCellRange;
  
  /**
   * Gets the vertical direction of the range
   */
  getVerticalDirection(): string;
  
  /**
   * Gets the horizontal direction of the range
   */
  getHorizontalDirection(): string;
  
  /**
   * Gets the width of the range
   */
  getWidth(): number;
  
  /**
   * Gets the height of the range
   */
  getHeight(): number;
  
  /**
   * Check if the range is a single header
   */
  isSingleHeader(): boolean;
  
  /**
   * Check if the range includes the given coordinates
   */
  includes(coords: ExtendedCellCoords): boolean;
  
  /**
   * Check if the range overlaps with the given coordinates
   */
  overlaps(coords: CellCoords): boolean;
  
  /**
   * Creates a clone of this range
   */
  clone(): ExtendedCellRange;
  
  /**
   * Gets the top start corner of the range
   */
  getTopStartCorner(): CellCoords;
  
  /**
   * Gets the top end corner of the range
   */
  getTopEndCorner(): CellCoords;
  
  /**
   * Gets the bottom end corner of the range
   */
  getBottomEndCorner(): CellCoords;
}

/**
 * Extended SelectionRange interface that provides selection range functionality
 */
export interface ExtendedSelectionRange {
  /**
   * Gets the current cell range
   */
  current(): ExtendedCellRange | null;
  
  /**
   * Adds a cell coordinates to the selection range
   */
  add(coords: ExtendedCellCoords): ExtendedSelectionRange;
  
  /**
   * Clears the selection range
   */
  clear(): void;
  
  /**
   * Checks if the selection range is empty
   */
  isEmpty(): boolean;
  
  /**
   * Gets the number of ranges
   */
  size(): number;
  
  /**
   * Gets the range for a specific cell
   */
  getRangeForCell(row: number, col: number): ExtendedCellRange | null;
  
  /**
   * Array of cell ranges
   */
  ranges: ExtendedCellRange[];
  
  /**
   * Function to create a cell range
   */
  createCellRange: (coords: ExtendedCellCoords) => ExtendedCellRange;
  
  /**
   * Sets the selection to specific coordinates
   */
  set(coords: ExtendedCellCoords): ExtendedSelectionRange;
  
  /**
   * Removes and returns the last range
   */
  pop(): ExtendedSelectionRange;
  
  /**
   * Retrieves a range by index without removing it
   */
  peekByIndex(index?: number): ExtendedCellRange | undefined;
  
  /**
   * Gets the previous range
   */
  previous(): ExtendedCellRange | undefined;
  
  /**
   * Checks if the selection includes specific coordinates
   */
  includes(coords: ExtendedCellCoords): boolean;
  
  /**
   * Iterator for ranges
   */
  [Symbol.iterator](): IterableIterator<ExtendedCellRange>;
} 