export const META_COMMENT = 'comment';
export const META_COMMENT_VALUE = 'value';
export const META_STYLE = 'style';
export const META_READONLY = 'readOnly';

/**
 * Represents a comment's metadata stored in cell meta.
 */
export interface CommentMeta {
  [META_COMMENT_VALUE]?: string;
  [META_STYLE]?: { width: number; height: number };
  [META_READONLY]?: boolean;
}

export interface CommentObject extends CommentMeta { }
