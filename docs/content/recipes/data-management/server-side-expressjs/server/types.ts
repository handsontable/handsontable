import { z } from 'zod';

const ALLOWED_COLUMNS = ['id', 'subject', 'status', 'priority', 'assignee', 'createdAt'] as const;
const ALLOWED_CONDITIONS = ['eq', 'neq', 'contains', 'not_contains', 'begins_with', 'ends_with', 'empty', 'not_empty'] as const;

const filterSchema = z.object({
  prop: z.enum(ALLOWED_COLUMNS),
  condition: z.enum(ALLOWED_CONDITIONS),
  value: z.array(z.string()).default([]),
});

const sortSchema = z.object({
  column: z.enum(ALLOWED_COLUMNS),
  order: z.enum(['asc', 'desc']),
});

export const fetchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).default(10),
  sort: sortSchema.optional(),
  filters: z
    .union([z.array(filterSchema), filterSchema])
    .transform((v): z.infer<typeof filterSchema>[] => (Array.isArray(v) ? v : [v]))
    .optional(),
});
