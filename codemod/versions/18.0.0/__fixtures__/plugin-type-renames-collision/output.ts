import type { SummaryEndpoint, SummaryEndpoint as DetailedSettings } from 'handsontable/plugins/columnSummary';
import type { OperationType as _OperationType } from 'handsontable/plugins/filters';

interface OperationType {
  label: string;
}

export const endpoints: DetailedSettings[] = [];

export function describe(endpoint: SummaryEndpoint, operation: _OperationType): OperationType {
  return { label: `${endpoint.type}:${operation}` };
}
