import { CoreAbstract } from '../../3rdparty/walkontable/src/core/interfaces';
import { CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

export type ScrollStrategy = (cellCoords: CellCoords) => void | { row: number; col: number };

export type Core = CoreAbstract & {
  scrollViewportTo(coords: { row?: number; col?: number }): void;
  selection: {
    getSelectionSource(): string;
  };
  view: {
    getLastPartiallyVisibleColumn(): number;
    getLastPartiallyVisibleRow(): number;
  };
}; 