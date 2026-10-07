import type { ActionPayload, ProcessableMessage } from '@a2ui/web_core/v0_9';
import { CATALOG_ID } from './catalog';

export const SURFACE_ID = 'reorder-plan';

type Cell = string | number | boolean | null;
type LogEntry = { text: string };

// Example 2: the agent keeps editing a grid it already rendered. Every message
// after the first three is a partial `updateDataModel` aimed at one path inside
// the data model, so the grid updates in place instead of being rebuilt.
export const agentMessages: ProcessableMessage[] = [
  {
    version: 'v0.9',
    createSurface: { surfaceId: SURFACE_ID, catalogId: CATALOG_ID, sendDataModel: true },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: SURFACE_ID,
      components: [
        { id: 'root', component: 'Column', children: ['title', 'grid', 'actions', 'log'] },
        { id: 'title', component: 'Text', text: 'Reorder plan for next week', variant: 'h3' },
        {
          id: 'grid',
          component: 'HotGrid',
          columns: ['SKU', 'On hand', 'Reorder point', 'Order qty', 'Unit cost', 'Line cost'],
          columnTypes: ['text', 'numeric', 'numeric', 'numeric', 'numeric', 'numeric'],
          rows: { path: '/rows' },
          values: { path: '/values' },
          height: 230,
        },
        { id: 'actions', component: 'Row', children: ['approve', 'reject'], justify: 'end' },
        {
          id: 'approve',
          component: 'Button',
          child: 'approve_label',
          variant: 'primary',
          action: { event: { name: 'approve_plan', context: { rows: { path: '/rows' }, values: { path: '/values' }, log: { path: '/log' } } } },
        },
        { id: 'approve_label', component: 'Text', text: 'Approve plan' },
        {
          id: 'reject',
          component: 'Button',
          child: 'reject_label',
          action: { event: { name: 'reject_plan', context: { values: { path: '/values' }, log: { path: '/log' } } } },
        },
        { id: 'reject_label', component: 'Text', text: 'Ask for changes' },
        // Every message the agent has written, rendered as a list. `List` expands
        // the `log_item` template once per entry of the array at `/log`.
        { id: 'log', component: 'List', children: { path: '/log', componentId: 'log_item' } },
        { id: 'log_item', component: 'Text', text: { path: 'text' }, variant: 'caption' },
      ],
    },
  },
  {
    version: 'v0.9',
    updateDataModel: {
      surfaceId: SURFACE_ID,
      path: '/',
      value: {
        log: [{ text: 'Agent: here is the plan from the current stock levels.' }],
        rows: [
          ['SKU-1041', 12, 40, '=MAX(0,C1*2-B1)', 3.2, '=D1*E1'],
          ['SKU-2210', 55, 30, '=MAX(0,C2*2-B2)', 11.5, '=D2*E2'],
          ['SKU-3307', 4, 25, '=MAX(0,C3*2-B3)', 42, '=D3*E3'],
          ['Total', null, null, '=SUM(D1:D3)', null, '=SUM(F1:F3)'],
        ],
      },
    },
  },
  // The agent changes one cell: the reorder point of the third SKU.
  {
    version: 'v0.9',
    updateDataModel: { surfaceId: SURFACE_ID, path: '/rows/2/2', value: 60 },
  },
  {
    version: 'v0.9',
    // Appending to the log: the agent sends the whole array, since A2UI's
    // updateDataModel replaces the value at a path.
    updateDataModel: {
      surfaceId: SURFACE_ID,
      path: '/log',
      value: [{ text: 'Agent: here is the plan from the current stock levels.' }, { text: 'Agent: SKU-3307 sells out weekly, so I raised its reorder point to 60.' }],
    },
  },
  // The agent inserts a row. The totals row moves down and its formulas are rewritten.
  {
    version: 'v0.9',
    updateDataModel: {
      surfaceId: SURFACE_ID,
      path: '/rows',
      value: [
        ['SKU-1041', 12, 40, '=MAX(0,C1*2-B1)', 3.2, '=D1*E1'],
        ['SKU-2210', 55, 30, '=MAX(0,C2*2-B2)', 11.5, '=D2*E2'],
        ['SKU-3307', 4, 60, '=MAX(0,C3*2-B3)', 42, '=D3*E3'],
        ['SKU-4102', 0, 15, '=MAX(0,C4*2-B4)', 7.75, '=D4*E4'],
        ['Total', null, null, '=SUM(D1:D4)', null, '=SUM(F1:F4)'],
      ],
    },
  },
  {
    version: 'v0.9',
    updateDataModel: {
      surfaceId: SURFACE_ID,
      path: '/log',
      value: [{ text: 'Agent: here is the plan from the current stock levels.' }, { text: 'Agent: SKU-3307 sells out weekly, so I raised its reorder point to 60.' }, { text: 'Agent: SKU-4102 is out of stock, so I added it. Approve, or edit the plan and ask for changes.' }],
    },
  },
];

// A stand-in for the model: what the agent sends back after an action.
export function replyTo(action: ActionPayload): ProcessableMessage[] {
  const values = (action.context.values as Cell[][] | undefined) ?? [];
  const log = (action.context.log as LogEntry[] | undefined) ?? [];
  const total = values[values.length - 1];
  const text =
    action.name === 'approve_plan'
      ? `Agent: approved. I will raise purchase orders for ${values.length - 1} SKUs, ${total?.[3]} units, ${total?.[5]} total cost.`
      : 'Agent: understood. Edit the plan in the grid and click Approve plan when it looks right.';
  return [{ version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/log', value: [...log, { text }] } }];
}
