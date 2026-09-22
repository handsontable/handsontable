import { throwWithCause } from '../../helpers/errors';
import { CAPABILITIES, type XlsxEngineCapabilities, type XlsxEngineKind } from './capabilities';
import { excelJsAdapter, isExcelJsModule } from './adapters/exceljs';
import type { XlsxEngineAdapter } from './adapters/types';

/**
 * The result of engine detection: which engine, its adapter and its capability row.
 */
export interface DetectedXlsxEngine {
  kind: XlsxEngineKind;
  version: string | null;
  module: unknown;
  adapter: XlsxEngineAdapter;
  capabilities: XlsxEngineCapabilities;
}

/**
 * Builds the missing-engine message for the plugin that asked for detection. Only the option name
 * varies; the leading sentence is part of the plugin's public error contract.
 */
function engineErrorMessage(optionName: string): string {
  return 'Missing or invalid ExcelJS engine. Pass the ExcelJS module via the `engines` option ' +
    `in the ${optionName} plugin settings: \`${optionName}: { engines: { xlsx: ExcelJS } }\`.`;
}

/**
 * Matches an injected module against the known engine shapes. Returns `null` for no match.
 * The ExcelJS check runs first so a module exposing both shapes keeps today's path.
 */
function toDetected(injected: unknown): DetectedXlsxEngine | null {
  if (isExcelJsModule(injected)) {
    return {
      kind: 'exceljs',
      version: null,
      module: injected,
      adapter: excelJsAdapter,
      capabilities: CAPABILITIES.exceljs,
    };
  }

  return null;
}

/**
 * Detects which xlsx engine was injected. Duck-typed, never version-based. Retries once on
 * `injected.default` for ESM/CJS interop and throws when neither shape matches. `optionName` names
 * the plugin option the error message tells the user to configure, and is required so this shared
 * helper never carries one plugin's name as a default the other plugin inherits by accident.
 */
export function detectXlsxEngine(injected: unknown, optionName: string): DetectedXlsxEngine {
  const direct = toDetected(injected);

  if (direct) {
    return direct;
  }

  const nested = typeof injected === 'object' && injected !== null
    ? (injected as { default?: unknown }).default
    : undefined;
  const viaDefault = nested === undefined ? null : toDetected(nested);

  if (viaDefault) {
    return viaDefault;
  }

  throwWithCause(engineErrorMessage(optionName));
}
