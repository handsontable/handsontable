/**
 * Type contract tests for BaseRenderer.
 *
 * A compile error here means the public BaseRenderer type has regressed.
 * These tests specifically guard against cellProperties being typed too
 * loosely (e.g. Record<string,unknown> instead of CellProperties), which
 * would prevent custom renderers typed against Handsontable.CellProperties
 * from being passed to registerRenderer.
 */
import type Handsontable from 'handsontable';
import type { CellProperties } from 'handsontable';
import {
  baseRenderer,
  registerRenderer,
  getRenderer,
} from 'handsontable/renderers';
import type { BaseRenderer } from 'handsontable/renderers';

// ---------------------------------------------------------------------------
// A custom renderer using Handsontable.CellProperties must be assignable to
// BaseRenderer and accepted by registerRenderer.
// ---------------------------------------------------------------------------

const customRenderer: BaseRenderer = (
  _instance,
  _td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  _value: unknown,
  cellProperties: CellProperties
) => {
  if (cellProperties.readOnly) {
    _td.classList.add('custom-readonly');
  }
};

registerRenderer('customRenderer', customRenderer);

// getRenderer must return a value assignable to BaseRenderer
const _retrieved: BaseRenderer = getRenderer('customRenderer');

// ---------------------------------------------------------------------------
// The built-in baseRenderer (which uses Record<string,unknown> internally)
// must still be assignable to BaseRenderer (contravariance: wider param
// function is assignable to narrower-param function type).
// ---------------------------------------------------------------------------

const _builtinBase: BaseRenderer = baseRenderer;

// ---------------------------------------------------------------------------
// The namespace alias Handsontable.renderers.BaseRenderer must also accept
// a renderer typed with CellProperties.
// ---------------------------------------------------------------------------

const _nsCustom: Handsontable.renderers.BaseRenderer = customRenderer;
const _nsBuiltin: Handsontable.renderers.BaseRenderer = baseRenderer;
