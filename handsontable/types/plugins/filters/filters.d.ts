import Core from '../../core';
import { BasePlugin } from '../base';
import ConditionCollection, {
  ConditionName as _ConditionName,
} from './conditionCollection';
import ConditionUpdateObserver from './conditionUpdateObserver';

type _OperationType = 'conjunction' | 'disjunction';
export type OperationType = _OperationType;
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
  importConditions(conditions: ColumnConditions[]): void;
  exportConditions(): ColumnConditions[];
  filter(): void;
  getSelectedColumn(): { physicalIndex: number, visualIndex: number } | null;
  getDataMapAtColumn(column?: number): CellLikeData[];
}
