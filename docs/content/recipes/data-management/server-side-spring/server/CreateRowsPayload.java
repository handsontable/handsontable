package com.example.products;

/**
 * Request body for POST /api/products/create-rows.
 *
 * Handsontable sends this payload when the user adds one or more rows.
 *
 * Fields:
 * - position      -- "above" or "below" relative to referenceRowId.
 * - referenceRowId -- the row ID adjacent to the insertion point, or null
 *                    when inserting at the very end of the dataset.
 * - rowsAmount    -- how many empty rows to create.
 */
public class CreateRowsPayload {

    private String position;
    private Long referenceRowId;
    private int rowsAmount;

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Long getReferenceRowId() { return referenceRowId; }
    public void setReferenceRowId(Long referenceRowId) { this.referenceRowId = referenceRowId; }

    public int getRowsAmount() { return rowsAmount; }
    public void setRowsAmount(int rowsAmount) { this.rowsAmount = rowsAmount; }
}
