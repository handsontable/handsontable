export function to2dArray(arr: any[]): void;
export function extendArray(arr: any[], extension: any[]): void;
export function pivot(arr: any[]): any[];
export function arrayReduce(array: any[], iteratee: (value: any, index: number, array: any[])
  => void, accumulator: any, initFromArray: boolean): any;
export function arrayFilter(array: any[], predicate: (value: any, index: number, array: any[]) => void): any[];
export function arrayMap(array: any[], iteratee: (value: any, index: number, array: any[]) => void): any[];
export function arrayEach(array: any[], iteratee: (value: any, index: number, array: any[]) => void): any[];
export function arraySum(array: any[]): number;
export function arrayMax(array: any[]): number;
export function arrayMin(array: any[]): number;
export function arrayAvg(array: any[]): number;
export function arrayFlatten(array: any[]): any[];
export function arrayUnique(array: any[]): any[];
export function getDifferenceOfArrays(...arrays: Array<Array<string | number>>): string[] | number[];
export function getIntersectionOfArrays(...arrays: Array<Array<string | number>>): string[] | number[];
export function getUnionOfArrays(...arrays: Array<Array<string | number>>): string[] | number[];
export function stringToArray(value: string, delimiter?: string | RegExp): string[];
