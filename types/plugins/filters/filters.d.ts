import { BasePlugin } from '../base';

type OperationType = 'conjunction' | 'disjunction';
type ConditionName = 'begins_with' | 'between' | 'by_value' | 'contains' | 'empty' |
  'ends_with' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'not_between' | 'not_contains' |
  'not_empty' | 'neq';

export type ColumnConditions = {
  column: number;
  conditions: ConditionId[];
  operation: OperationType;
}

export interface ConditionId {
  args: any[];
  name?: ConditionName;
  command?: {
    key: ConditionName;
  }
}

interface CellLikeData {
  meta: {
    row: number;
    col: number;
    visualCol: number;
    visualRow: number;
    type: string;
    // instance: _Handsontable.Core;
    dateFormat?: string;
  };
  value: string;
}

export class Filters extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  addCondition(column: number, name: string, args: any[], operationId?: OperationType): void;
  removeConditions(column: number): void;
  clearConditions(column?: number): void;
  filter(): void;
  getSelectedColumn(): any;
  getDataMapAtColumn(column?: number): CellLikeData[];
}
