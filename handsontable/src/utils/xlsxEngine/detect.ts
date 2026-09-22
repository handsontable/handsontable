import { throwWithCause } from '../../helpers/errors';
import { CAPABILITIES, type XlsxEngineCapabilities, type XlsxEngineKind } from './capabilities';
import { excelJsAdapter, isExcelJsModule } from './adapters/exceljs';
import { nativeAdapter } from './adapters/native';
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
 * Builds the invalid-engine message for the plugin that asked for detection. Only the option name
 * varies; the leading sentence is part of the plugin's public error contract.
 */
function engineErrorMessage(optionName: string): string {
  return 'Invalid xlsx engine module. Pass a supported engine module via the `engines` option ' +
    `in the ${optionName} plugin settings (\`${optionName}: { engines: { xlsx: ExcelJS } }\`), ` +
    'or omit `engines` to use the built-in engine.';
}

/**
 * The built-in engine, selected when nothing was injected.
 */
function nativeDetected(): DetectedXlsxEngine {
  return {
    kind: 'native',
    version: null,
    module: null,
    adapter: nativeAdapter,
    capabilities: CAPABILITIES.native,
  };
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
 * Resolves the engine module one call runs on: the per-call override when the caller passed one,
 * otherwise the module configured for that format under the plugin's `engines` option.
 *
 * `null` and `undefined` mean the same thing on the override side — "no override" — so a per-call
 * `engine: null` never bypasses a configured engine. Both plugins resolve the override through this
 * helper so `importFile` and `exportFile` cannot drift apart again.
 */
export function resolveEngineOverride(override: unknown, configured: unknown): unknown {
  return override ?? configured;
}

/**
 * Detects which xlsx engine was injected. Duck-typed, never version-based. `undefined` selects the
 * built-in engine; any other value must duck-type to a known engine or the call throws. Retries once
 * on `injected.default` for ESM/CJS interop before giving up. `optionName` names the plugin option
 * the error message tells the user to configure, and is required so this shared helper never carries
 * one plugin's name as a default the other plugin inherits by accident.
 */
export function detectXlsxEngine(injected: unknown, optionName: string): DetectedXlsxEngine {
  if (injected === undefined) {
    return nativeDetected();
  }

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
