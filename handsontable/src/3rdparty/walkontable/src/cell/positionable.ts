import CellCoords from "./coords";

/**
 * Interface defining positional relationship methods for cells and ranges.
 * 
 * This interface is implemented by both CellCoords and CellRange classes.
 */
export interface Positionable {
  isSouthEastOf(coords: CellCoords): boolean;
  isNorthWestOf(coords: CellCoords): boolean;
} 