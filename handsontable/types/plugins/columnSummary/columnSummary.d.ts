import Core from '../../core';
import { BasePlugin } from '../base';

export type DetailedSettings = {
  destinationRow: number;
  destinationColumn: number;
  forceNumeric?: boolean;
  reversedRowCoords?: boolean;
  suppressDataTypeErrors?: boolean;
  readOnly?: boolean;
  roundFloat?: boolean | number;
  ranges?: number[][];
  sourceColumn?: number;
} & ({
  type: 'sum' | 'min' | 'max' | 'count' | 'average';
} | {
  type: 'custom';
  customFunction: (this: ColumnSummary, endpoint: Endpoint) => number;
});

export type Settings = DetailedSettings[] | ((this: ColumnSummary) => DetailedSettings[]);

export interface Endpoint {
  destinationRow: number;
  destinationColumn: number;
  forceNumeric: boolean;
  reversedRowCoords: boolean;
  suppressDataTypeErrors: boolean;
  readOnly: boolean;
  roundFloat: boolean | number;
  ranges: number[][];
  sourceColumn: number;
  type: 'sum' | 'min' | 'max' | 'count' | 'average' | 'custom';
  result: number;
  customFunction: ((this: ColumnSummary, endpoint: Endpoint) => number) | null;
}

export interface Endpoints {
  plugin: ColumnSummary;
  endpoints: Endpoint[];
  settings: object | (() => void);
  settingsType: string;
  currentEndpoint: object | undefined;

  assignSetting(settings: object, endpoint: object, name: string, defaultValue: any): void;
  getAllEndpoints(): any[];
  getEndpoint(index: number): object;
  parseSettings(settings: any[]): void;
  refreshAllEndpoints(init: boolean): void;
  refreshChangedEndpoints(changes: any[]): void;
  refreshEndpoint(endpoint: object): void;
  resetAllEndpoints(endpoints: any[], useOffset?: boolean): void;
  resetEndpointValue(endpoint: object, useOffset?: boolean): void;
  setEndpointValue(endpoint: object, source: string, render?: boolean): void;
}

export class ColumnSummary extends BasePlugin {
  constructor(hotInstance: Core);

  endpoints: Endpoints | undefined;

  isEnabled(): boolean;
  calculate(endpoint: Endpoint): void;
  calculateSum(endpoint: Endpoint): number;
  calculateAverage(endpoint: Endpoint): number;
  calculateMinMax(endpoint: Endpoint, type: 'min' | 'max'): number | string;
  countEmpty(rowRange: number[][], column: number): number;
  countEntries(endpoint: Endpoint): number;
  getCellValue(row: number, column: number): any;
  getPartialMinMax(rowRange: number[][], column: number, type: 'min' | 'max'): number;
  getPartialSum(rowRange: number[][], column: number): number;
}
