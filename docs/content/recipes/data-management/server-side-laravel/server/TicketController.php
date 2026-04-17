<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FetchTicketsRequest;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * TicketController handles the four endpoints used by Handsontable's dataProvider.
 *
 *   GET    /api/tickets           -- fetchRows (paginated, sorted, filtered)
 *   POST   /api/tickets           -- onRowsCreate
 *   PATCH  /api/tickets           -- onRowsUpdate
 *   DELETE /api/tickets           -- onRowsRemove
 */
class TicketController extends Controller
{
    /**
     * GET /api/tickets
     *
     * Returns the paginated, sorted, and filtered list of tickets.
     * The response shape { rows, totalRows } is what Handsontable's
     * dataProvider.fetchRows callback must return.
     */
    public function index(FetchTicketsRequest $request): JsonResponse
    {
        $query = Ticket::query();

        // ---- Filtering ----
        // Handsontable sends a JSON-encoded array of filter conditions.
        // Each condition has { prop, condition, value } -- map to query builder.
        if ($request->filled('filters')) {
            $filters = json_decode($request->input('filters'), true) ?? [];

            foreach ($filters as $filter) {
                $prop      = $filter['prop'];
                $condition = $filter['condition'];
                $value     = $filter['value'][0] ?? '';

                match ($condition) {
                    'eq'           => $query->where($prop, $value),
                    'neq'          => $query->where($prop, '!=', $value),
                    'contains'     => $query->where($prop, 'LIKE', "%{$value}%"),
                    'not_contains' => $query->where($prop, 'NOT LIKE', "%{$value}%"),
                    'begins_with'  => $query->where($prop, 'LIKE', "{$value}%"),
                    'ends_with'    => $query->where($prop, 'LIKE', "%{$value}"),
                    'empty'        => $query->whereNull($prop)->orWhere($prop, ''),
                    'not_empty'    => $query->whereNotNull($prop)->where($prop, '!=', ''),
                    default        => null,
                };
            }
        }

        // ---- Sorting ----
        // Handsontable sends a JSON-encoded { column, order } object.
        if ($request->filled('sort')) {
            $sort = json_decode($request->input('sort'), true);

            // Whitelist columns to prevent SQL injection via the sort parameter.
            $allowed = ['id', 'subject', 'status', 'priority', 'assignee', 'created_at'];

            if (isset($sort['column']) && in_array($sort['column'], $allowed, true)) {
                $query->orderBy($sort['column'], $sort['order'] === 'desc' ? 'desc' : 'asc');
            }
        } else {
            $query->orderBy('id');
        }

        // ---- Pagination ----
        $page     = $request->integer('page');
        $pageSize = $request->integer('pageSize');

        $totalRows = $query->count();
        $rows      = $query->forPage($page, $pageSize)->get();

        return response()->json(['rows' => $rows, 'totalRows' => $totalRows]);
    }

    /**
     * POST /api/tickets
     *
     * Creates one or more tickets.
     * Handsontable's onRowsCreate callback receives the array of created rows
     * (including server-assigned IDs) in the response. Without returning
     * the created rows, the grid cannot replace its temporary client-side IDs.
     */
    public function store(Request $request): JsonResponse
    {
        $rows = $request->json()->all();

        // Accept either a single object or an array of objects.
        if (isset($rows['subject'])) {
            $rows = [$rows];
        }

        $created = collect($rows)->map(function (array $row) {
            return Ticket::create($row);
        });

        return response()->json($created, 201);
    }

    /**
     * PATCH /api/tickets
     *
     * Updates one or more tickets.
     * Each element in the request body is { id, ...changes } where
     * changes contains only the columns the user modified.
     */
    public function update(Request $request): JsonResponse
    {
        foreach ($request->json()->all() as $row) {
            $ticket = Ticket::find($row['id']);

            if ($ticket) {
                $ticket->fill(array_diff_key($row, ['id' => true]));
                $ticket->save();
            }
        }

        return response()->json(null, 204);
    }

    /**
     * DELETE /api/tickets
     *
     * Deletes tickets by ID.
     * Handsontable's onRowsRemove callback sends an array of ID strings.
     */
    public function destroy(Request $request): JsonResponse
    {
        Ticket::destroy($request->json()->all());

        return response()->json(null, 204);
    }
}
