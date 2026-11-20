import type { Endpoint, DetailedSettings } from 'handsontable/plugins/columnSummary';
import type { _OperationType } from 'handsontable/plugins/filters';

interface OperationType {
  label: string;
}

export const endpoints: DetailedSettings[] = [];

export function describe(endpoint: Endpoint, operation: _OperationType): OperationType {
  return { label: `${endpoint.type}:${operation}` };
}
