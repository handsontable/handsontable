/**
 * Shared types for helper functions
 */

/**
 * Object with any properties
 */
export interface AnyObject {
  [key: string]: any;
}

/**
 * Object with string keys and string values
 */
export interface StringObject {
  [key: string]: string;
}

/**
 * Function type
 */
export type AnyFunction = (...args: any[]) => any;

/**
 * DOM Element type (includes HTMLElement and Element types)
 */
export type DOMElement = HTMLElement | Element;

/**
 * Object containing HTMLElement references
 */
export interface ElementCache {
  [key: string]: HTMLElement;
}

/**
 * Function that provides an item name for array elements during comparison
 */
export type ItemsComparator = (item: any, index: number) => string;

/**
 * Type for array-like objects that can be iterated
 */
export interface ArrayLike<T> {
  length: number;
  [index: number]: T;
} 