// TODO(handsontable-codemod 18.0.0/type-columnsummary-endpoint): Replace Endpoint with SummaryEndpoint.
// TODO(handsontable-codemod 18.0.0/type-columnsummary-detailedsettings): Replace DetailedSettings with SummaryEndpoint. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-the-removed-detailedsettings-type-exports
import type { Endpoint, DetailedSettings } from 'handsontable/plugins/columnSummary';
import type { OperationType as _OperationType } from 'handsontable/plugins/filters';

interface OperationType {
  label: string;
}

export const endpoints: DetailedSettings[] = [];

export function describe(endpoint: Endpoint, operation: _OperationType): OperationType {
  return { label: `${endpoint.type}:${operation}` };
}
