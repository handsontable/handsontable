import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

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
  @IsString()
  prop: string;

  /** Handsontable condition name, e.g. 'eq', 'contains', 'begins_with'. */
  @IsString()
  condition: string;

  /** One or two values depending on the condition type. */
  @IsArray()
  @IsString({ each: true })
  value: string[];
}

/**
 * A sort descriptor sent by Handsontable's ColumnSorting plugin.
 *
 * Handsontable serializes the active sort as a nested object:
 *   sort[column]=status&sort[order]=asc
 */
export class SortDto {
  /** The data property name of the sorted column. */
  @IsString()
  column: string;

  @IsString()
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
   * NestJS parses repeated bracket-style query params into arrays automatically
   * when ValidationPipe has transformOptions.enableImplicitConversion enabled.
   */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  filters?: FilterConditionDto[];
}
