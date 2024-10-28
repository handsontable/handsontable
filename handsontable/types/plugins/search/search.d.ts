import Core from '../../core';
import { CellValue } from '../../common';
import { CellProperties } from '../../settings';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  callback?: SearchCallback;
  queryMethod?: SearchQueryMethod;
  searchResultClass?: string;
}

export type Settings = boolean | DetailedSettings;

export type SearchCallback = (instance: Core, row: number, column: number, value: CellValue, result: boolean) => void;

export type SearchQueryMethod = (queryStr: string, value: CellValue, cellProperties: CellProperties) => boolean;

export class Search extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  query(queryStr: string, callback?: SearchCallback, queryMethod?: SearchQueryMethod): any[];
  getCallback(): SearchCallback;
  setCallback(newCallback: SearchCallback): void;
  getQueryMethod(): SearchQueryMethod;
  setQueryMethod(newQueryMethod: SearchQueryMethod): void;
  getSearchResultClass(): string;
  setSearchResultClass(newElementClass: string): void;
}
