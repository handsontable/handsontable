import { Injectable } from '@nestjs/common';
import { FetchTicketsDto } from './fetch-tickets.dto';
import { Ticket, ticketsStore } from './ticket.entity';

export interface CreateTicketDto {
  subject: string;
  status: string;
  priority: string;
  assignee: string;
  createdAt: string;
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {
  id: string;
}

/**
 * Monotonically incrementing counter for ID generation.
 *
 * Using a counter instead of Date.now() avoids duplicate IDs when
 * onRowsCreate sends a batch of rows and the controller maps them
 * synchronously -- all calls happen within the same millisecond.
 */
let nextId = ticketsStore.length + 1;

/**
 * TicketsService encapsulates all data-access logic.
 *
 * This example uses an in-memory array (ticketsStore). To switch to TypeORM +
 * SQLite, inject the Repository<TicketEntity> and replace array operations
 * with repository methods (findAndCount, save, delete, etc.).
 */
@Injectable()
export class TicketsService {
  /**
   * Returns a paginated, sorted, and filtered slice of tickets.
   *
   * This is the method called by GET /tickets. It mirrors the shape expected
   * by Handsontable's dataProvider.fetchRows -- an object with rows and
   * totalRows so the grid can render the correct page count.
   */
  findAll(dto: FetchTicketsDto): { rows: Ticket[]; totalRows: number } {
    let tickets = [...ticketsStore];

    // -- Filtering --
    // Handsontable sends one condition object per active column filter.
    // Map each condition to an array.filter() predicate.
    if (dto.filters && dto.filters.length > 0) {
      for (const filter of dto.filters) {
        tickets = tickets.filter((ticket) => {
          const cellValue = String(ticket[filter.prop as keyof Ticket] ?? '').toLowerCase();

          switch (filter.condition) {
            case 'eq':
              return cellValue === String(filter.value[0]).toLowerCase();
            case 'neq':
              return cellValue !== String(filter.value[0]).toLowerCase();
            case 'contains':
              return cellValue.includes(String(filter.value[0]).toLowerCase());
            case 'not_contains':
              return !cellValue.includes(String(filter.value[0]).toLowerCase());
            case 'begins_with':
              return cellValue.startsWith(String(filter.value[0]).toLowerCase());
            case 'ends_with':
              return cellValue.endsWith(String(filter.value[0]).toLowerCase());
            case 'empty':
              return cellValue === '';
            case 'not_empty':
              return cellValue !== '';
            default:
              return true;
          }
        });
      }
    }

    // -- Sorting --
    // Handsontable sends { column: 'status', order: 'asc' } for the active sort.
    if (dto.sort) {
      const { column, order } = dto.sort;

      tickets.sort((a, b) => {
        const aVal = String(a[column as keyof Ticket] ?? '');
        const bVal = String(b[column as keyof Ticket] ?? '');
        const cmp = aVal.localeCompare(bVal);

        return order === 'asc' ? cmp : -cmp;
      });
    }

    // -- Pagination --
    const totalRows = tickets.length;
    const start = (dto.page - 1) * dto.pageSize;
    const rows = tickets.slice(start, start + dto.pageSize);

    return { rows, totalRows };
  }

  create(dto: CreateTicketDto): Ticket {
    const ticket: Ticket = {
      id: String(nextId++),
      subject: dto.subject,
      status: dto.status as Ticket['status'],
      priority: dto.priority as Ticket['priority'],
      assignee: dto.assignee,
      createdAt: dto.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    ticketsStore.push(ticket);

    return ticket;
  }

  updateMany(updates: UpdateTicketDto[]): Ticket[] {
    const updated: Ticket[] = [];

    for (const update of updates) {
      const idx = ticketsStore.findIndex((t) => t.id === update.id);

      if (idx !== -1) {
        ticketsStore[idx] = { ...ticketsStore[idx], ...update };
        updated.push(ticketsStore[idx]);
      }
    }

    return updated;
  }

  removeMany(ids: string[]): void {
    for (const id of ids) {
      const idx = ticketsStore.findIndex((t) => t.id === id);

      if (idx !== -1) {
        ticketsStore.splice(idx, 1);
      }
    }
  }
}
