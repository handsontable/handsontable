export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  createdAt: string; // ISO date string, e.g. "2025-01-15"
}

/**
 * In-memory data store -- replace with TypeORM + SQLite for persistence.
 *
 * TypeORM example (zero-config with SQLite):
 *
 * @Entity()
 * export class TicketEntity {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *
 *   @Column()
 *   subject: string;
 *
 *   @Column({ default: 'open' })
 *   status: TicketStatus;
 *
 *   @Column({ default: 'medium' })
 *   priority: TicketPriority;
 *
 *   @Column()
 *   assignee: string;
 *
 *   @Column({ type: 'date' })
 *   createdAt: string;
 * }
 */
export const ticketsStore: Ticket[] = [
  { id: '1', subject: 'Login page throws 500 on Safari', status: 'open', priority: 'high', assignee: 'Ana García', createdAt: '2025-01-15' },
  { id: '2', subject: 'Export to CSV truncates long text fields', status: 'in-progress', priority: 'medium', assignee: 'James Okafor', createdAt: '2025-01-18' },
  { id: '3', subject: 'Dark mode colors incorrect in Firefox', status: 'open', priority: 'low', assignee: 'Li Wei', createdAt: '2025-01-22' },
  { id: '4', subject: 'Grid row virtualization skips rows at scroll end', status: 'resolved', priority: 'high', assignee: 'Ana García', createdAt: '2025-02-03' },
  { id: '5', subject: 'Filter dropdown overlaps pagination controls', status: 'closed', priority: 'low', assignee: 'James Okafor', createdAt: '2025-02-10' },
  { id: '6', subject: 'Column resize handle too narrow on touch screens', status: 'open', priority: 'medium', assignee: 'Li Wei', createdAt: '2025-02-14' },
  { id: '7', subject: 'Cell editor closes on any outside click', status: 'in-progress', priority: 'critical', assignee: 'Ana García', createdAt: '2025-02-20' },
  { id: '8', subject: 'Frozen columns desync on horizontal scroll', status: 'open', priority: 'high', assignee: 'James Okafor', createdAt: '2025-03-01' },
  { id: '9', subject: 'Nested headers do not reorder with column move', status: 'resolved', priority: 'medium', assignee: 'Li Wei', createdAt: '2025-03-05' },
  { id: '10', subject: 'Sort indicator missing after page reload', status: 'open', priority: 'low', assignee: 'Ana García', createdAt: '2025-03-12' },
  { id: '11', subject: 'Numeric cell accepts non-numeric paste', status: 'in-progress', priority: 'medium', assignee: 'James Okafor', createdAt: '2025-03-18' },
  { id: '12', subject: 'Context menu position off by 1px on HiDPI', status: 'closed', priority: 'low', assignee: 'Li Wei', createdAt: '2025-03-25' },
];
