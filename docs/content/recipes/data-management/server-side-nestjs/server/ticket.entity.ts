import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const TICKET_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column({ default: 'open' })
  status: TicketStatus;

  @Column({ default: 'medium' })
  priority: TicketPriority;

  @Column()
  assignee: string;

  @Column({ name: 'created_at' })
  createdAt: string;
}
