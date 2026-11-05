import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, isISO8601, Matches, MaxLength, ValidateIf } from 'class-validator';
import { Repository } from 'typeorm';
import { FetchTicketsDto } from './fetch-tickets.dto';
import { TICKET_PRIORITIES, TICKET_STATUSES, TicketEntity, TicketPriority, TicketStatus } from './ticket.entity';

/**
 * Dates are stored as 'YYYY-MM-DD' strings, the format Handsontable's date cells use.
 * @Matches checks the shape and @IsISO8601 rejects impossible dates such as 2025-02-30.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Like @IsOptional(), but rejects null: every column is NOT NULL. */
const IfPresent = () => ValidateIf((_object, value) => value !== undefined);

/** Clearing a text cell sends null. Store it as an empty string. */
const NullToEmpty = () => Transform(({ value }) => (value === null ? '' : value));

/**
 * Normalizes a date filter value to 'YYYY-MM-DD'.
 *
 * The grid's date inputs send 'YYYY-MM-DD'. A full ISO 8601 date-time is cut to
 * its date part, and anything else returns 400. An empty input becomes null,
 * which matches no row, the same as in the grid's own filter.
 */
function toIsoDate(value: string | undefined): string | null {
  if (value === undefined || value === '') return null;
  if (!isISO8601(value, { strict: true }) || !ISO_DATE.test(value.slice(0, 10))) {
    throw new BadRequestException(`Invalid date filter value: ${value}`);
  }
  return value.slice(0, 10);
}

/**
 * Returns the server's local date, shifted by a number of days, as 'YYYY-MM-DD'.
 *
 * date_today, date_tomorrow, and date_yesterday send no value, so "today" is the
 * server's local date. The grid's own filter uses the browser's time zone.
 */
function localIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * One row of the POST /tickets body.
 *
 * The controller validates each array item against this class, so an unknown
 * status or an over-long subject returns 400 instead of reaching the database.
 * MaxLength values match the VARCHAR columns in the migration.
 */
export class CreateTicketDto {
  @NullToEmpty()
  @IsString()
  @MaxLength(500)
  subject: string;

  @IsIn(TICKET_STATUSES)
  status: TicketStatus;

  @IsIn(TICKET_PRIORITIES)
  priority: TicketPriority;

  @NullToEmpty()
  @IsString()
  @MaxLength(200)
  assignee: string;

  /** Defaults to today when omitted. */
  @IsOptional()
  @Matches(ISO_DATE)
  @IsISO8601({ strict: true })
  createdAt?: string;
}

/**
 * One row of the PATCH /tickets body: the row id plus only the changed columns.
 */
export class UpdateTicketDto {
  @IsUUID()
  id: string;

  @NullToEmpty()
  @IfPresent()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IfPresent()
  @IsIn(TICKET_STATUSES)
  status?: TicketStatus;

  @IfPresent()
  @IsIn(TICKET_PRIORITIES)
  priority?: TicketPriority;

  @NullToEmpty()
  @IfPresent()
  @IsString()
  @MaxLength(200)
  assignee?: string;

  @IfPresent()
  @Matches(ISO_DATE)
  @IsISO8601({ strict: true })
  createdAt?: string;
}

/**
 * TicketsService encapsulates all data-access logic via TypeORM.
 *
 * The Repository<TicketEntity> is injected by NestJS when AppModule
 * imports TypeOrmModule.forFeature([TicketEntity]).
 */
@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly repo: Repository<TicketEntity>,
  ) {}

  /**
   * Returns a paginated, sorted, and filtered slice of tickets.
   *
   * Uses QueryBuilder so filters and sorts translate directly to SQL rather
   * than loading all rows into memory.
   */
  async findAll(dto: FetchTicketsDto): Promise<{ rows: TicketEntity[]; totalRows: number }> {
    const qb = this.repo.createQueryBuilder('ticket');

    // -- Filtering --
    // Each FetchTicketsDto filter carries a single condition object.
    // The frontend flattens multi-condition column filters before sending, so
    // one entry here maps to one WHERE clause in the query.
    if (dto.filters && dto.filters.length > 0) {
      for (const [i, filter] of dto.filters.entries()) {
        const param = `val${i}`;
        const col = `ticket.${filter.prop}`;
        // CAST(... AS text), not ::text: TypeORM maps ticket.createdAt to the
        // created_at column only when a space, "=", ")", or "," follows the name.
        const text = `CAST(${col} AS text)`;
        const val = filter.value[0];

        // Escape LIKE metacharacters so user input is treated literally.
        const esc = (s: string) => s.replace(/!/g, '!!').replace(/%/g, '!%').replace(/_/g, '!_');
        const like = `LIKE LOWER(:${param}) ESCAPE '!'`;
        const notLike = `NOT LIKE LOWER(:${param}) ESCAPE '!'`;

        switch (filter.condition) {
          case 'eq':
            if (val !== undefined) qb.andWhere(`LOWER(${text}) = LOWER(:${param})`, { [param]: val });
            break;
          case 'neq':
            if (val !== undefined) qb.andWhere(`LOWER(${text}) != LOWER(:${param})`, { [param]: val });
            break;
          case 'contains':
            if (val !== undefined) qb.andWhere(`LOWER(${text}) ${like}`, { [param]: `%${esc(val)}%` });
            break;
          case 'not_contains':
            if (val !== undefined) qb.andWhere(`LOWER(${text}) ${notLike}`, { [param]: `%${esc(val)}%` });
            break;
          case 'begins_with':
            if (val !== undefined) qb.andWhere(`LOWER(${text}) ${like}`, { [param]: `${esc(val)}%` });
            break;
          case 'ends_with':
            if (val !== undefined) qb.andWhere(`LOWER(${text}) ${like}`, { [param]: `%${esc(val)}` });
            break;
          case 'empty':
            qb.andWhere(`(${col} IS NULL OR ${text} = '')`);
            break;
          case 'not_empty':
            qb.andWhere(`(${col} IS NOT NULL AND ${text} != '')`);
            break;
          // created_at holds 'YYYY-MM-DD' text, so string order is date order.
          case 'date_before':
            qb.andWhere(`${col} < :${param}`, { [param]: toIsoDate(val) });
            break;
          case 'date_before_or_equal':
            qb.andWhere(`${col} <= :${param}`, { [param]: toIsoDate(val) });
            break;
          case 'date_after':
            qb.andWhere(`${col} > :${param}`, { [param]: toIsoDate(val) });
            break;
          case 'date_after_or_equal':
            qb.andWhere(`${col} >= :${param}`, { [param]: toIsoDate(val) });
            break;
          case 'between':
            // Inclusive on both ends. The grid offers it only for createdAt.
            qb.andWhere(`${col} >= :${param}from AND ${col} <= :${param}to`, {
              [`${param}from`]: toIsoDate(val),
              [`${param}to`]: toIsoDate(filter.value[1]),
            });
            break;
          case 'date_today':
            qb.andWhere(`${col} = :${param}`, { [param]: localIsoDate(0) });
            break;
          case 'date_tomorrow':
            qb.andWhere(`${col} = :${param}`, { [param]: localIsoDate(1) });
            break;
          case 'date_yesterday':
            qb.andWhere(`${col} = :${param}`, { [param]: localIsoDate(-1) });
            break;
          default:
            // Unreachable: FilterConditionDto accepts only the names handled above.
            throw new BadRequestException(`Unsupported condition: ${filter.condition satisfies never}`);
        }
      }
    }

    // -- Sorting --
    // Handsontable sends { column: 'status', order: 'asc' } for the active sort.
    if (dto.sort) {
      qb.orderBy(`ticket.${dto.sort.column}`, dto.sort.order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      qb.orderBy('ticket.createdAt', 'ASC');
    }

    // -- Pagination --
    const [rows, totalRows] = await qb
      .skip((dto.page - 1) * dto.pageSize)
      .take(dto.pageSize)
      .getManyAndCount();

    return { rows, totalRows };
  }

  async create(dto: CreateTicketDto): Promise<TicketEntity> {
    const ticket = this.repo.create({
      subject: dto.subject,
      status: dto.status,
      priority: dto.priority,
      assignee: dto.assignee,
      createdAt: dto.createdAt ?? new Date().toISOString().slice(0, 10),
    });

    return this.repo.save(ticket);
  }

  async updateMany(updates: UpdateTicketDto[]): Promise<TicketEntity[]> {
    const updated: TicketEntity[] = [];

    for (const { id, ...rest } of updates) {
      // Skip the write when validation stripped every column but the id.
      if (Object.keys(rest).length > 0) {
        await this.repo.update(id, rest);
      }

      const ticket = await this.repo.findOneBy({ id });
      if (ticket) updated.push(ticket);
    }

    return updated;
  }

  async removeMany(ids: string[]): Promise<void> {
    if (ids.length > 0) {
      await this.repo.delete(ids);
    }
  }
}
