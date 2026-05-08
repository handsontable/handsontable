export type OperationType = 'conjunction' | 'disjunction' | 'disjunctionWithExtraCondition';

export interface ConditionId {
  name: string;
  args: unknown[];
}

export interface ColumnConditions {
  column: number;
  conditions: ConditionId[];
  operation: OperationType;
}
