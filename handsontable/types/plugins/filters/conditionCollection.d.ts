import {
  ConditionId,
  OperationType,
  CellLikeData,
} from './filters';

export type ConditionName = 'begins_with' | 'between' | 'by_value' | 'contains' | 'empty' | 'ends_with' |
                            'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'not_between' | 'not_contains' |
                            'not_empty' | 'neq';

export interface Condition {
  name: ConditionName;
  args: any[];
  func: (dataRow: any, values: any[]) => boolean;
}

export default class ConditionCollection {
  addCondition(column: number, conditionDefinition: ConditionId, operation?: OperationType, position?: number): void;
  clean(): void;
  destroy(): void;
  exportAllConditions(): ConditionId[];
  getConditions(column: number): Condition[];
  getFilteredColumns(): number[];
  getColumnStackPosition(column: number): number | void;
  getOperation(column: number): void | OperationType;
  hasConditions(column: number, name: string): boolean;
  isEmpty(): boolean;
  isMatch(value: CellLikeData, column: number): boolean;
  isMatchInConditions(conditions: Condition[], value: CellLikeData, operationType?: OperationType): boolean;
  importAllConditions(conditions: ConditionId[]): void;
  removeConditions(column: number): void;
}
