import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

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
