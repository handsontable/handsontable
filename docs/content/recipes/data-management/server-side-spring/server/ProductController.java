package com.example.products;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller exposing the four endpoints consumed by Handsontable's
 * dataProvider plugin.
 *
 * GET  /api/products             -- fetchRows (pagination + sort + filter)
 * POST /api/products/create-rows -- onRowsCreate
 * PATCH /api/products/update-rows -- onRowsUpdate
 * DELETE /api/products/remove-rows -- onRowsRemove
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Returns a page of products with the total row count.
     *
     * Query parameters sent by Handsontable:
     * - page       1-based page number (default: 1)
     * - pageSize   rows per page (default: 10)
     * - sortProp   column to sort by (optional)
     * - sortOrder  "asc" or "desc" (optional)
     * - filters    JSON array of { column, value } objects (optional)
     *
     * Response shape:
     * { "rows": [...], "totalRows": 55 }
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int pageSize,
        @RequestParam(required = false) String sortProp,
        @RequestParam(required = false) String sortOrder,
        @RequestParam(required = false) String filters
    ) {
        Map<String, Object> result = productService.findAll(page, pageSize, sortProp, sortOrder, filters);
        return ResponseEntity.ok(result);
    }

    /**
     * Creates one or more empty product rows.
     *
     * The request body matches CreateRowsPayload:
     * { "position": "below", "referenceRowId": 7, "rowsAmount": 1 }
     */
    @PostMapping("/create-rows")
    public ResponseEntity<Void> createRows(@RequestBody CreateRowsPayload payload) {
        productService.createRows(payload);
        return ResponseEntity.ok().build();
    }

    /**
     * Applies cell edits to existing product rows.
     *
     * The request body is an array of UpdateRowPayload:
     * [{ "id": 3, "changes": { "price": 899.99, "stock": 12 } }]
     */
    @PatchMapping("/update-rows")
    public ResponseEntity<Void> updateRows(@RequestBody List<UpdateRowPayload> rows) {
        productService.updateRows(rows);
        return ResponseEntity.ok().build();
    }

    /**
     * Deletes the products with the given IDs.
     *
     * The request body is a JSON array of Long IDs: [4, 17, 23]
     */
    @DeleteMapping("/remove-rows")
    public ResponseEntity<Void> removeRows(@RequestBody List<Long> rowIds) {
        productService.removeRows(rowIds);
        return ResponseEntity.ok().build();
    }
}
