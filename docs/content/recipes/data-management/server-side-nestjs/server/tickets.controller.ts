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
 *   POST   /tickets  -- create one ticket (onRowsCreate payload shape)
 *   PATCH  /tickets  -- batch update   (onRowsUpdate payload shape)
 *   DELETE /tickets  -- batch delete   (array of row IDs)
 */
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * GET /tickets?page=1&pageSize=10&sort[column]=status&sort[order]=asc
   *                &filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][]=open
   *
   * @Query() binds the parsed query string to FetchTicketsDto.
   * NestJS ValidationPipe (configured in main.ts) transforms string values to
   * their declared types (number, nested object) before the handler runs.
   */
  @Get()
  findAll(@Query() query: FetchTicketsDto) {
    return this.ticketsService.findAll(query);
  }

  /**
   * POST /tickets
   *
   * Handsontable's onRowsCreate callback receives an array of new row objects.
   * Each object contains the column data keyed by the `data` property names
   * configured in Handsontable's columns option.
   *
   * Example body: [{ subject: 'New bug', status: 'open', priority: 'medium', ... }]
   */
  @Post()
  @HttpCode(201)
  create(@Body() body: CreateTicketDto | CreateTicketDto[]) {
    const rows = Array.isArray(body) ? body : [body];

    return rows.map((dto) => this.ticketsService.create(dto));
  }

  /**
   * PATCH /tickets
   *
   * Handsontable's onRowsUpdate callback receives an array of changed row
   * objects. Each object includes the row ID (rowId field) plus only the
   * changed properties.
   *
   * Example body: [{ id: '3', status: 'resolved' }]
   */
  @Patch()
  updateMany(@Body() body: UpdateTicketDto[]) {
    return this.ticketsService.updateMany(body);
  }

  /**
   * DELETE /tickets
   *
   * Handsontable's onRowsRemove callback receives an array of row ID strings.
   *
   * Example body: ['3', '7']
   */
  @Delete()
  @HttpCode(204)
  removeMany(@Body() ids: string[]) {
    this.ticketsService.removeMany(ids);
  }
}
