import { BasePlugin } from '../base';

export interface CommentObject {
  value?: string;
  readOnly?: boolean;
  style?: {
    height?: number;
    width?: number;
  }
}
export interface Settings {
  displayDelay?: number;
}
export interface CommentConfig {
  row: number,
  col: number,
  comment: CommentObject
}

export type CommentsRangeObject = {
  from: wot.CellCoords;
  to?: wot.CellCoords;
}

export class Comments extends BasePlugin {
  constructor(hotInstance: any);
  range: CommentsRangeObject;

  isEnabled(): boolean;
  setRange(range: CommentsRangeObject): void;
  clearRange(): void;
  setComment(value: string): void;
  setCommentAtCell(row: number, column: number, value: string): void;
  removeComment(forceRender?: boolean): void;
  removeCommentAtCell(row: number, column: number, forceRender?: boolean): void;
  getComment(): string;
  getCommentAtCell(row: number, column: number): string;
  show(): boolean;
  showAtCell(row: number, column: number): boolean;
  hide(): void;
  refreshEditor(force?: boolean): void;
  updateCommentMeta(row: number, column: number, metaObject: object): void;
  getCommentMeta(row: number, column: number, property: string): any;
}
