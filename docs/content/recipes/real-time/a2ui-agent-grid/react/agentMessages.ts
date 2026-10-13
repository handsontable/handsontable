import type { ActionPayload, ProcessableMessage } from '@a2ui/web_core/v0_9';
import { CATALOG_ID } from './catalog';

export const SURFACE_ID = 'purchase-order-review';

type Cell = string | number | boolean | null;
type LogEntry = { text: string };

// The messages an agent streams to the client to open the surface. In a real
// app they arrive over A2A, AG-UI, or MCP. Here they are hardcoded so the demo
// runs without a backend or an API key. The format is A2UI v0.9.
export const agentMessages: ProcessableMessage[] = [
  {
    version: 'v0.9',
    createSurface: {
      surfaceId: SURFACE_ID,
      catalogId: CATALOG_ID,
      // Ask the client to attach the whole data model to every action it sends.
      sendDataModel: true,
    },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: SURFACE_ID,
      components: [
        { id: 'root', component: 'Column', children: ['title', 'intro', 'grid', 'actions', 'log'] },
        { id: 'title', component: 'Text', text: 'Purchase order PO-4471: workstation refresh', variant: 'h3' },
        {
          id: 'intro',
          component: 'Text',
          text: 'Adjust any quantity or unit price. The Total column and the grand total are formulas; HyperFormula recalculates them in your browser.',
          variant: 'body',
        },
        {
          id: 'grid',
          component: 'HotGrid',
          columns: ['Item', 'Qty', 'Unit price', 'Total'],
          columnTypes: ['text', 'numeric', 'numeric', 'numeric'],
          rows: { path: '/rows' },
          values: { path: '/values' },
          height: 230,
        },
        { id: 'actions', component: 'Row', children: ['send_button'], justify: 'end' },
        {
          id: 'send_button',
          component: 'Button',
          child: 'send_label',
          variant: 'primary',
          action: {
            event: {
              name: 'submit_purchase_order',
              // Resolved from the data model when the button is clicked.
              context: { rows: { path: '/rows' }, values: { path: '/values' }, log: { path: '/log' } },
            },
          },
        },
        { id: 'send_label', component: 'Text', text: 'Send to agent' },
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
        log: [{ text: 'Agent: here is the order as requested. Change anything, then send it to me for review.' }],
        rows: [
          ['Standing desk', 4, 480, '=B1*C1'],
          ['27" monitor', 8, 219, '=B2*C2'],
          ['Docking station', 8, 145, '=B3*C3'],
          ['Cable kit', 20, 12.5, '=B4*C4'],
          ['Grand total', null, null, '=SUM(D1:D4)'],
        ],
      },
    },
  },
];

// A stand-in for the model: what the agent sends back after it receives an
// action. It reads the rows the user sent, so the user's edits are kept, and
// inserts a discount line before the grand total the first time it sees an
// order above the discount threshold.
export function replyTo(action: ActionPayload): ProcessableMessage[] {
  const rows = (action.context.rows as Cell[][] | undefined) ?? [];
  const values = (action.context.values as Cell[][] | undefined) ?? [];
  const log = (action.context.log as LogEntry[] | undefined) ?? [];
  const grandTotal = values[values.length - 1]?.[3];
  const hasDiscount = rows.some((r) => String(r[0]).startsWith('Volume discount'));

  if (hasDiscount || typeof grandTotal !== 'number' || grandTotal < 2500) {
    return [
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: SURFACE_ID,
          path: '/log',
          value: [...log, { text: `Agent: received. Grand total ${grandTotal}. I will route PO-4471 for approval.` }],
        },
      },
    ];
  }

  const lineItems = rows.slice(0, -1);
  const n = lineItems.length;
  return [
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: SURFACE_ID,
        path: '/rows',
        value: [
          ...lineItems,
          ['Volume discount (8%)', null, null, `=-SUM(D1:D${n})*0.08`],
          ['Grand total', null, null, `=SUM(D1:D${n + 1})`],
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: SURFACE_ID,
        path: '/log',
        value: [...log, { text: 'Agent: orders over 2,500 get an 8% volume discount, so I added it as a line. Send again if you change anything.' }],
      },
    },
  ];
}
