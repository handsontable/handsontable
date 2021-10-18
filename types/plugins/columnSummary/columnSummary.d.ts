import { BasePlugin } from '../base';

export type Settings = {
  destinationRow: number;
  destinationColumn: number;
  forceNumeric?: boolean;
  reversedRowCoords?: boolean;
  suppressDataTypeErrors?: boolean;
  readOnly?: boolean;
  roundFloat?: boolean;
  ranges?: number[][];
  sourceColumn?: number;
} & ({
  type: 'sum' | 'min' | 'max' | 'count' | 'average';
} | {
  type: 'custom';
  customFunction: (this: ColumnSummary, endpoint: Endpoint) => number;
});

export interface Endpoint {
  destinationRow: number;
  destinationColumn: number;
  forceNumeric: boolean;
  reversedRowCoords: boolean;
  suppressDataTypeErrors: boolean;
  readOnly: boolean;
  roundFloat: boolean;
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
  currentEndpoint: object | void;

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
  constructor(hotInstance: any);
  isEnabled(): boolean;
  settings: any;
  currentEndpoint: any;
}
