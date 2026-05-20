import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
import { FetchTicketsDto } from './fetch-tickets.dto';
import { CreateTicketDto, TicketsService, UpdateTicketDto } from './tickets.service';

/**
 * TicketsController maps HTTP verbs to TicketsService methods.
 *
 * Endpoint summary:
 *
 *   GET    /tickets  -- paginated + sorted + filtered list
 *   POST   /tickets  -- create one or more tickets (onRowsCreate payload shape)
 *   PATCH  /tickets  -- batch update   (onRowsUpdate payload shape)
 *   DELETE /tickets  -- batch delete   (array of row IDs)
 */
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * GET /tickets?page=1&pageSize=10&sort[column]=status&sort[order]=asc
   *                &filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
   *
   * @Query() binds the parsed query string to FetchTicketsDto.
   * NestJS ValidationPipe (configured in main.ts) transforms string values to
   * their declared types (number, nested object) before the handler runs.
   */
  @Get()
  async findAll(@Query() query: FetchTicketsDto) {
    return this.ticketsService.findAll(query);
  }

  /**
   * POST /tickets
   *
   * Handsontable's onRowsCreate callback receives { rowsAmount } and the
   * frontend constructs default row objects for each new row. Each object
   * contains the column data keyed by the `data` property names configured
   * in Handsontable's columns option.
   *
   * Example body: [{ subject: '', status: 'open', priority: 'medium', ... }]
   *
   * The server persists the rows and returns them with database-generated
   * UUIDs so the grid can update its row map.
   */
  @Post()
  @HttpCode(201)
  async create(@Body() body: CreateTicketDto | CreateTicketDto[]) {
    const rows = Array.isArray(body) ? body : [body];

    return Promise.all(rows.map((dto) => this.ticketsService.create(dto)));
  }

  /**
   * PATCH /tickets
   *
   * Handsontable's onRowsUpdate callback receives an array of changed row
   * objects. The frontend flattens each { id, changes } into { id, ...changes }
   * before sending.
   *
   * Example body: [{ id: 'uuid-3', status: 'resolved' }]
   */
  @Patch()
  async updateMany(@Body() body: UpdateTicketDto[]) {
    return this.ticketsService.updateMany(body);
  }

  /**
   * DELETE /tickets
   *
   * Handsontable's onRowsRemove callback receives an array of row ID strings.
   *
   * Example body: ['uuid-3', 'uuid-7']
   */
  @Delete()
  @HttpCode(204)
  async removeMany(@Body() ids: string[]) {
    await this.ticketsService.removeMany(ids);
  }
}
