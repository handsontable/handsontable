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

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
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

    /**
     * Columns compared as numbers by gt, gte, lt, lte, between, and not_between.
     *
     * Other columns, including id, are compared as text.
     */
    private static final Set<String> NUMERIC_COLUMNS = Set.of("price", "stock");

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
     * @param filtersJson JSON array of HOT filter columns ({ prop, operation, conditions }), or null.
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
     * the unique SKU constraint. Returns the saved rows with their database ids,
     * which Handsontable needs to track the new rows.
     */
    public List<Product> createRows(CreateRowsPayload payload) {
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

        return repository.saveAll(newProducts);
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
                    // JSON numbers arrive as Integer or Double; intValue() handles both.
                    product.setStock(val == null ? null : ((Number) val).intValue());
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
     * HOT sends one entry per filtered column, e.g.:
     * [{"prop":"price","operation":"conjunction","conditions":[{"name":"gt","args":[100]}]}]
     *
     * Conditions within a column are combined with OR when operation is
     * "disjunction", otherwise with AND. Columns are always combined with AND.
     * Columns not in ALLOWED_COLUMNS and condition names this method doesn't
     * handle are skipped.
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
                List<Predicate> columnPredicates = new ArrayList<>();
                for (Map<String, Object> filter : filters) {
                    Object prop = filter.get("prop");
                    Object conditions = filter.get("conditions");
                    if (!(prop instanceof String column) || !ALLOWED_COLUMNS.contains(column)
                            || !(conditions instanceof List<?> conditionList)) {
                        continue;
                    }
                    List<Predicate> conditionPredicates = new ArrayList<>();
                    for (Object condition : conditionList) {
                        if (condition instanceof Map<?, ?> c && c.get("name") instanceof String name) {
                            List<?> args = c.get("args") instanceof List<?> list ? list : List.of();
                            Predicate predicate = buildCondition(root, builder, column, name, args);
                            if (predicate != null) {
                                conditionPredicates.add(predicate);
                            }
                        }
                    }
                    // A column whose conditions were all skipped adds no predicate. An empty
                    // OR would match no rows.
                    if (conditionPredicates.isEmpty()) {
                        continue;
                    }
                    Predicate[] parts = conditionPredicates.toArray(new Predicate[0]);
                    columnPredicates.add("disjunction".equals(filter.get("operation"))
                        ? builder.or(parts)
                        : builder.and(parts));
                }
                return builder.and(columnPredicates.toArray(new Predicate[0]));
            };
        } catch (Exception e) {
            // If the filter JSON is malformed, return all rows unfiltered.
            return Specification.where(null);
        }
    }

    /**
     * Maps one HOT condition to a predicate, or returns null to skip it.
     *
     * Text comparisons are case-insensitive. Numeric comparisons (gt, gte, lt,
     * lte, between, not_between) apply only to NUMERIC_COLUMNS. The negated
     * conditions (neq, not_contains, not_between) keep NULL cells, as the grid's
     * own filter does: SQL comparisons with NULL are never true.
     */
    private Predicate buildCondition(Root<Product> root, CriteriaBuilder builder,
            String column, String name, List<?> args) {
        Path<Object> path = root.get(column);
        boolean numeric = NUMERIC_COLUMNS.contains(column);
        Expression<String> text = builder.lower(path.as(String.class));

        if (name.equals("empty")) {
            return numeric ? builder.isNull(path) : builder.or(builder.isNull(path), builder.equal(text, ""));
        }
        if (name.equals("not_empty")) {
            return numeric ? builder.isNotNull(path) : builder.and(builder.isNotNull(path), builder.notEqual(text, ""));
        }
        if (args.isEmpty() || args.get(0) == null) {
            return null;
        }
        String value = args.get(0).toString();

        try {
            switch (name) {
                case "eq":
                    return numeric
                        ? builder.equal(path.as(BigDecimal.class), new BigDecimal(value))
                        : builder.equal(text, value.toLowerCase());
                case "neq":
                    return builder.or(builder.isNull(path), numeric
                        ? builder.notEqual(path.as(BigDecimal.class), new BigDecimal(value))
                        : builder.notEqual(text, value.toLowerCase()));
                case "contains":
                    return builder.like(text, "%" + escapeLike(value) + "%", '\\');
                case "not_contains":
                    return builder.or(builder.isNull(path),
                        builder.notLike(text, "%" + escapeLike(value) + "%", '\\'));
                case "begins_with":
                    return builder.like(text, escapeLike(value) + "%", '\\');
                case "ends_with":
                    return builder.like(text, "%" + escapeLike(value), '\\');
                default:
                    break;
            }
            if (!numeric) {
                return null;
            }
            Expression<BigDecimal> number = path.as(BigDecimal.class);
            BigDecimal first = new BigDecimal(value);
            switch (name) {
                case "gt":
                    return builder.greaterThan(number, first);
                case "gte":
                    return builder.greaterThanOrEqualTo(number, first);
                case "lt":
                    return builder.lessThan(number, first);
                case "lte":
                    return builder.lessThanOrEqualTo(number, first);
                case "between":
                case "not_between":
                    if (args.size() < 2 || args.get(1) == null) {
                        return null;
                    }
                    BigDecimal second = new BigDecimal(args.get(1).toString());
                    BigDecimal low = first.min(second);
                    BigDecimal high = first.max(second);
                    return name.equals("between")
                        ? builder.between(number, low, high)
                        : builder.or(builder.isNull(path),
                            builder.lessThan(number, low), builder.greaterThan(number, high));
                default:
                    return null;
            }
        } catch (NumberFormatException e) {
            // A non-numeric argument for a numeric condition: skip the condition.
            return null;
        }
    }

    /** Escapes LIKE metacharacters so user input is matched literally. */
    private static String escapeLike(String value) {
        return value.toLowerCase()
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_");
    }
}
