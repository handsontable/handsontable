/**
 * Minimal GraphQL HTTP server for the support-tickets DataProvider demo.
 * Uses graphql-js with an SDL schema (same shape as the recipe).
 * Default port 4011. Run: npm run server:graphql
 */
import express from 'express';
import { buildSchema, graphql } from 'graphql';
import { applyServerFilters } from './server-filter-utils.mjs';

const schema = buildSchema(`
  enum TicketPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum TicketStatus {
    OPEN
    PENDING
    RESOLVED
  }

  enum SortDir {
    ASC
    DESC
  }

  enum RowInsertPosition {
    ABOVE
    BELOW
  }

  type SupportTicket {
    id: ID!
    subject: String!
    requesterEmail: String!
    priority: TicketPriority!
    status: TicketStatus!
  }

  type TicketPage {
    nodes: [SupportTicket!]!
    totalCount: Int!
  }

  type Query {
    openTickets(
      page: Int!
      pageSize: Int!
      sortBy: String
      sortDir: SortDir
      filtersJson: String
    ): TicketPage!
  }

  input TicketChangesInput {
    subject: String
    requesterEmail: String
    priority: TicketPriority
    status: TicketStatus
  }

  input TicketUpdateInput {
    id: ID!
    changes: TicketChangesInput!
  }

  type Mutation {
    createSupportTickets(
      count: Int!
      position: RowInsertPosition
      referenceRowId: ID
    ): Boolean!
    updateSupportTickets(updates: [TicketUpdateInput!]!): Boolean!
    removeSupportTickets(ids: [ID!]!): Boolean!
  }
`);

/** @type {Array<{ id: string, subject: string, requesterEmail: string, priority: string, status: string }>} */
let tickets = [];
let nextId = 1;

for (let i = 0; i < 85; i += 1) {
  tickets.push({
    id: String(nextId),
    subject: `Ticket ${i}: issue report`,
    requesterEmail: `user${i % 20}@example.com`,
    priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT'][i % 4],
    status: i % 7 === 0 ? 'RESOLVED' : 'OPEN',
  });
  nextId += 1;
}

const root = {
  openTickets: ({ page, pageSize, sortBy, sortDir, filtersJson }) => {
    let open = tickets.filter((t) => t.status === 'OPEN');

    if (typeof filtersJson === 'string' && filtersJson.length > 0) {
      try {
        const parsed = JSON.parse(filtersJson);

        if (Array.isArray(parsed)) {
          open = applyServerFilters(open, parsed);
        }
      } catch {
        // Invalid filters JSON: ignore and return unfiltered open tickets.
      }
    }

    if (sortBy) {
      const dir = sortDir === 'DESC' ? -1 : 1;

      open.sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        let cmp = av < bv ? -1 : av > bv ? 1 : 0;

        if (cmp === 0) {
          cmp = a.id.localeCompare(b.id);
        }

        return cmp * dir;
      });
    }

    const totalCount = open.length;
    const start = (page - 1) * pageSize;

    return {
      nodes: open.slice(start, start + pageSize),
      totalCount,
    };
  },
  createSupportTickets: ({ count, position, referenceRowId }) => {
    const newTickets = [];

    for (let i = 0; i < count; i += 1) {
      newTickets.push({
        id: String(nextId),
        subject: 'New ticket',
        requesterEmail: 'new@example.com',
        priority: 'NORMAL',
        status: 'OPEN',
      });
      nextId += 1;
    }

    if (referenceRowId === undefined || referenceRowId === null || referenceRowId === '') {
      tickets.push(...newTickets);

      return true;
    }

    const refKey = String(referenceRowId);
    const idx = tickets.findIndex((t) => t.id === refKey);

    if (idx === -1) {
      tickets.push(...newTickets);

      return true;
    }

    const placeBelow = position !== 'ABOVE';
    const insertAt = placeBelow ? idx + 1 : idx;

    tickets.splice(insertAt, 0, ...newTickets);

    return true;
  },
  updateSupportTickets: ({ updates }) => {
    updates.forEach(({ id, changes }) => {
      const row = tickets.find((t) => t.id === String(id));

      if (!row || !changes) {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'subject')) {
        row.subject = changes.subject;
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'requesterEmail')) {
        row.requesterEmail = changes.requesterEmail;
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'priority')) {
        row.priority = String(changes.priority).toUpperCase();
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'status')) {
        row.status = String(changes.status).toUpperCase();
      }
    });

    return true;
  },
  removeSupportTickets: ({ ids }) => {
    const idSet = new Set((ids || []).map((id) => String(id)));

    tickets = tickets.filter((t) => !idSet.has(t.id));

    return true;
  },
};

const app = express();
const port = Number.parseInt(process.env.PORT || '4011', 10);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(204).end();

    return;
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

app.post('/graphql', async(req, res) => {
  const { query: source, variables: variableValues } = req.body || {};

  const result = await graphql({
    schema,
    source,
    variableValues: variableValues || undefined,
    rootValue: root,
  });

  res.json(result);
});

app.listen(port, () => {
  console.log(`Support tickets GraphQL listening on http://localhost:${port}/graphql`);
});
