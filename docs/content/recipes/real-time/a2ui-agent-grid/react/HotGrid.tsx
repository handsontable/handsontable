import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { CommonSchemas } from '@a2ui/web_core/v0_9';
import { createComponentImplementation } from '@a2ui/react/v0_9';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { currentMode, onModeChange, type Mode } from './theme';

registerAllModules();

type Cell = string | number | boolean | null;
const themeFor = (mode: Mode) => (mode === 'dark' ? 'ht-theme-main-dark' : 'ht-theme-main');
const cellSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

// 1. The component API: what the agent is allowed to send.
//    `rows` and `values` accept a literal 2D array or a `{ path }` binding into the
//    surface data model. Cells that start with "=" are HyperFormula formulas.
export const HotGridApi = {
  name: 'HotGrid',
  schema: z
    .object({
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
      weight: z.number().optional(),
      columns: CommonSchemas.DynamicStringList.describe('Column header labels.'),
      columnTypes: CommonSchemas.DynamicStringList.optional().describe(
        'Handsontable cell type per column, in column order: "text", "numeric", "checkbox" or "date". Defaults to text.',
      ),
      rows: z
        .union([z.array(z.array(cellSchema)), CommonSchemas.DataBinding])
        .describe('Source cells. A string starting with "=" is a formula, evaluated by HyperFormula in the browser.'),
      values: z
        .union([z.array(z.array(cellSchema)), CommonSchemas.DataBinding])
        .optional()
        .describe('Computed cell values, written back by the grid after every edit. Bind it to a path so an action can send it to the agent.'),
      readOnly: CommonSchemas.DynamicBoolean.optional(),
      height: z.number().optional().describe('Grid height in pixels. Defaults to 260.'),
    })
    .strict(),
};

// 2. The React implementation. The generic binder resolves `{ path }` bindings before
//    render and injects `setRows` / `setValues` setters for two-way binding.
export const HotGrid = createComponentImplementation(HotGridApi, ({ props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hotRef = useRef<Handsontable | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const rows = (Array.isArray(props.rows) ? props.rows : []) as Cell[][];
  const rowsKey = JSON.stringify(rows);
  // What the grid last wrote to the data model. When `rows` comes back equal to
  // it, the change is our own echo and the grid must not be reloaded.
  const lastSyncedKey = useRef<string | null>(null);

  // Push the grid's state into the A2UI data model. `rows` keeps the formulas,
  // `values` holds what HyperFormula computed, so the agent can read either.
  const syncToDataModel = () => {
    const hot = hotRef.current;
    if (!hot) return;
    const source = hot.getSourceData() as Cell[][];
    lastSyncedKey.current = JSON.stringify(source);
    propsRef.current.setRows?.(source);
    propsRef.current.setValues?.(hot.getData() as Cell[][]);
  };

  // Mount Handsontable once. The grid owns its data after this.
  useEffect(() => {
    if (!containerRef.current) return;
    const hot = new Handsontable(containerRef.current, {
      data: rows.map((r) => [...r]),
      colHeaders: props.columns,
      columns: props.columnTypes?.map((type) => ({ type: String(type) })),
      rowHeaders: true,
      themeName: themeFor(currentMode()),
      height: props.height ?? 260,
      stretchH: 'all',
      readOnly: props.readOnly ?? false,
      formulas: { engine: HyperFormula },
      // Structural changes are off on purpose. Sorting, filtering and row
      // moving break aggregate formulas such as =SUM(D1:D4) that live in the
      // grid, and inserting or removing rows shifts the ranges those formulas
      // cover. The user edits values; the agent owns the shape of the sheet and
      // rewrites the formulas when it adds or removes rows.
      columnSorting: false,
      filters: false,
      manualRowMove: false,
      contextMenu: ['undo', 'redo'],
      afterChange: (_changes, source) => {
        if (source !== 'loadData' && source !== 'updateData') syncToDataModel();
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    hotRef.current = hot;
    // Publish the initial computed values so `values` is never empty.
    propsRef.current.setValues?.(hot.getData() as Cell[][]);
    // Follow the page's light/dark mode.
    const unsubscribe = onModeChange((mode) => hot.useTheme(themeFor(mode)));

    return () => {
      unsubscribe();
      hot.destroy();
      hotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The agent changed `rows` (a full replacement or a patch to one path):
  // load the new cells into the existing grid instead of rebuilding it.
  useEffect(() => {
    const hot = hotRef.current;
    if (!hot || rowsKey === lastSyncedKey.current) return;
    hot.updateData(rows.map((r) => [...r]));
    propsRef.current.setValues?.(hot.getData() as Cell[][]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey]);

  useEffect(() => {
    hotRef.current?.updateSettings({
      colHeaders: props.columns,
      columns: props.columnTypes?.map((type) => ({ type: String(type) })),
      readOnly: props.readOnly ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(props.columns), JSON.stringify(props.columnTypes), props.readOnly]);

  return <div ref={containerRef} />;
});
