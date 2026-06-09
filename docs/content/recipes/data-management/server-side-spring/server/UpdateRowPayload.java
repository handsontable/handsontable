package com.example.products;

import java.util.Map;

/**
 * A single element in the request body for PATCH /api/products/update-rows.
 *
 * Handsontable sends one entry per modified row. The `id` field identifies the
 * row, and `changes` is a map of column names to their new values -- only the
 * columns the user edited are included.
 *
 * Example payload:
 * [
 *   { "id": 7, "changes": { "name": "Laptop Pro 16", "price": 1399.99 } },
 *   { "id": 12, "changes": { "stock": 0 } }
 * ]
 */
public class UpdateRowPayload {

    private Long id;
    private Map<String, Object> changes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Map<String, Object> getChanges() { return changes; }
    public void setChanges(Map<String, Object> changes) { this.changes = changes; }
}
