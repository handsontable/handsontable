import Core from '../../core';
import { BasePlugin } from '../base';
import ConditionCollection from './conditionCollection';
import ConditionUpdateObserver from './conditionUpdateObserver';

type _OperationType = 'conjunction' | 'disjunction';
export type OperationType = _OperationType;

type _ConditionName = 'begins_with' | 'between' | 'by_value' | 'contains' | 'empty' |
  'ends_with' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'not_between' | 'not_contains' |
  'not_empty' | 'neq';
export type ConditionName = _ConditionName;

export interface ColumnConditions {
  column: number;
  conditions: ConditionId[];
  operation: OperationType;
}

export interface ConditionId {
  args: any[];
  name?: ConditionName;
  command?: {
    key: ConditionName;
  };
}

export interface CellLikeData {
  meta: {
    row: number;
    col: number;
    visualCol: number;
    visualRow: number;
    type: string;
    instance: Core;
    dateFormat?: string;
  };
  value: string;
}

export type Settings = boolean;

export declare class Filters extends BasePlugin {
  constructor(hotInstance: Core);

  conditionUpdateObserver: ConditionUpdateObserver;
  conditionCollection: ConditionCollection;

  isEnabled(): boolean;
  addCondition(column: number, name: string, args: any[], operationId?: OperationType): void;
  removeConditions(column: number): void;
  clearConditions(column?: number): void;
  filter(): void;
  getSelectedColumn(): { physicalIndex: number, visualIndex: number } | null;
  getDataMapAtColumn(column?: number): CellLikeData[];
}
