import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

/**
 * Columns the client may sort and filter by.
 *
 * The service interpolates column names into SQL, so anything outside this
 * list is rejected with 400 before it reaches the query builder.
 */
const ALLOWED_COLUMNS = ['id', 'subject', 'status', 'priority', 'assignee', 'createdAt'] as const;

/**
 * A single filter condition sent by Handsontable's Filters plugin.
 *
 * Handsontable serializes filters as an array of objects, one per column:
 *   [{ prop: 'status', condition: 'eq', value: ['open'] }]
 *
 * The query string is encoded as:
 *   filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][]=open
 */
export class FilterConditionDto {
  @IsIn(ALLOWED_COLUMNS)
  prop: string;

  /**
   * Handsontable condition name, e.g. 'eq', 'contains', 'begins_with'.
   * Not whitelisted: the service skips condition names it doesn't handle.
   */
  @IsString()
  condition: string;

  /** Zero, one, or two values depending on the condition ('empty' sends none). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  value: string[] = [];
}

/**
 * A sort descriptor sent by Handsontable's ColumnSorting plugin.
 *
 * Handsontable serializes the active sort as a nested object:
 *   sort[column]=status&sort[order]=asc
 */
export class SortDto {
  /** The data property name of the sorted column. */
  @IsIn(ALLOWED_COLUMNS)
  column: string;

  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc';
}

/**
 * Query parameters for GET /tickets.
 *
 * NestJS uses class-transformer to convert query-string values (all strings)
 * to their TypeScript types before validation with class-validator runs.
 */
export class FetchTicketsDto {
  /** 1-based page number (Handsontable sends page starting from 1). */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number = 10;

  /** Optional sort descriptor; absent when no sort is applied. */
  @IsOptional()
  @ValidateNested()
  @Type(() => SortDto)
  sort?: SortDto;

  /**
   * Optional list of filter conditions.
   *
   * @Transform wraps a lone filter object in an array, then @Type turns each
   * item into a FilterConditionDto so @ValidateNested checks its constraints.
   */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  filters?: FilterConditionDto[];
}
