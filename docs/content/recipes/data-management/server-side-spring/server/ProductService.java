package com.example.products;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.*;

/**
 * Service layer for all product data operations.
 *
 * Responsibilities:
 * - Convert Handsontable's 1-based page index to Spring Data's 0-based index.
 * - Map HOT sort parameters ({ prop, order }) to a Spring Sort object.
 * - Deserialize HOT's JSON filter array and apply it as a JPA Specification.
 * - Handle all three CRUD mutations in a single @Transactional boundary.
 */
@Service
@Transactional
public class ProductService {

    /**
     * Columns that may be used in ORDER BY and WHERE clauses.
     *
     * Whitelisting prevents SQL injection via unsanitised sortProp / filter column values.
     */
    private static final Set<String> ALLOWED_COLUMNS = Set.of(
        "id", "name", "sku", "category", "price", "stock"
    );

    private final ProductRepository repository;
    private final ObjectMapper objectMapper;

    public ProductService(ProductRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * Returns a page of products plus the total row count.
     *
     * @param page        1-based page number (sent by Handsontable).
     * @param pageSize    Rows per page.
     * @param sortProp    Column name to sort by, or null for default (id ASC).
     * @param sortOrder   "asc" or "desc", or null.
     * @param filtersJson JSON array of { column, value } filter objects, or null.
     * @return Map with keys "rows" (List<Product>) and "totalRows" (long).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> findAll(int page, int pageSize,
                                       String sortProp, String sortOrder,
                                       String filtersJson) {
        Sort sort = buildSort(sortProp, sortOrder);

        // Handsontable sends page 1 for the first page.
        // Spring Data PageRequest.of() expects 0-based index -- subtract 1.
        Pageable pageable = PageRequest.of(page - 1, pageSize, sort);

        Specification<Product> spec = buildFilters(filtersJson);
        Page<Product> result = repository.findAll(spec, pageable);

        // Map Spring Data's Page object to the shape Handsontable expects:
        // { rows: [...], totalRows: N }
        Map<String, Object> response = new HashMap<>();
        response.put("rows", result.getContent());
        response.put("totalRows", result.getTotalElements());
        return response;
    }

    /**
     * Creates rowsAmount empty product rows.
     *
     * Each new row gets a placeholder name and a UUID-derived SKU to satisfy
     * the unique SKU constraint.
     */
    public void createRows(CreateRowsPayload payload) {
        List<Product> newProducts = new ArrayList<>();

        for (int i = 0; i < payload.getRowsAmount(); i++) {
            Product p = new Product();
            p.setName("New Product");
            p.setSku("SKU-NEW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            p.setCategory("Uncategorized");
            p.setPrice(BigDecimal.ZERO);
            p.setStock(0);
            newProducts.add(p);
        }

        repository.saveAll(newProducts);
    }

    /**
     * Applies the changes from each UpdateRowPayload to the matching product.
     *
     * Only the keys present in the `changes` map are updated -- if the user
     * only edits the price column, name/sku/etc. are left untouched.
     */
    public void updateRows(List<UpdateRowPayload> rows) {
        for (UpdateRowPayload row : rows) {
            repository.findById(row.getId()).ifPresent(product -> {
                Map<String, Object> changes = row.getChanges();

                if (changes.containsKey("name")) {
                    product.setName((String) changes.get("name"));
                }
                if (changes.containsKey("sku")) {
                    product.setSku((String) changes.get("sku"));
                }
                if (changes.containsKey("category")) {
                    product.setCategory((String) changes.get("category"));
                }
                if (changes.containsKey("price")) {
                    Object val = changes.get("price");
                    product.setPrice(val == null ? null : new BigDecimal(val.toString()));
                }
                if (changes.containsKey("stock")) {
                    Object val = changes.get("stock");
                    product.setStock(val == null ? null : Integer.parseInt(val.toString()));
                }

                repository.save(product);
            });
        }
    }

    /**
     * Deletes all products whose IDs are in rowIds.
     *
     * deleteAllById() executes a single batch DELETE, avoiding N+1 queries.
     */
    public void removeRows(List<Long> rowIds) {
        repository.deleteAllById(rowIds);
    }

    // --- Private helpers ---

    /**
     * Builds a Spring Sort from HOT's { prop, order } parameters.
     *
     * Falls back to id ASC when sortProp is absent or not in the whitelist.
     */
    private Sort buildSort(String sortProp, String sortOrder) {
        if (sortProp == null || !ALLOWED_COLUMNS.contains(sortProp)) {
            return Sort.by(Sort.Direction.ASC, "id");
        }

        Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder)
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

        return Sort.by(direction, sortProp);
    }

    /**
     * Deserializes HOT's JSON filter array and converts it to a JPA Specification.
     *
     * HOT sends filters as a JSON array -- e.g.:
     *   [{"column":"category","value":"Electronics"}]
     *
     * Each filter becomes a LIKE predicate on the matching column.
     * Columns not in ALLOWED_COLUMNS are silently ignored.
     */
    private Specification<Product> buildFilters(String filtersJson) {
        if (filtersJson == null || filtersJson.isBlank()) {
            return Specification.where(null);
        }

        try {
            List<Map<String, Object>> filters = objectMapper.readValue(
                filtersJson,
                new TypeReference<>() {}
            );

            return (root, query, builder) -> {
                List<Predicate> predicates = new ArrayList<>();

                for (Map<String, Object> filter : filters) {
                    String column = (String) filter.get("column");
                    String value  = String.valueOf(filter.get("value"));

                    if (column != null && ALLOWED_COLUMNS.contains(column)) {
                        predicates.add(builder.like(
                            builder.lower(root.get(column).as(String.class)),
                            "%" + value.toLowerCase() + "%"
                        ));
                    }
                }

                return builder.and(predicates.toArray(new Predicate[0]));
            };
        } catch (Exception e) {
            // If the filter JSON is malformed, return all rows unfiltered.
            return Specification.where(null);
        }
    }
}
