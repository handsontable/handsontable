export const META_COMMENT = 'comment';
export const META_COMMENT_VALUE = 'value';
export const META_STYLE = 'style';
export const META_READONLY = 'readOnly';

/**
 * The most, in pixels, the comment editor reaches above the cell it opens on. The selection border of a cell
 * is drawn this far outside the cell's box, so the editor's top edge can land on the border's top edge.
 */
export const EDITOR_TOP_OVERLAP = 1;

/**
 * Represents a comment's metadata stored in cell meta.
 */
export interface CommentMeta {
  [META_COMMENT_VALUE]?: string;
  [META_STYLE]?: { width: number; height: number };
  [META_READONLY]?: boolean;
}

export interface CommentObject extends CommentMeta { }
