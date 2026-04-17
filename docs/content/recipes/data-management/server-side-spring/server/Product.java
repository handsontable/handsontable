package com.example.products;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * JPA entity for a product in the catalog.
 *
 * Spring Data JPA maps each field to a column in the H2 `products` table.
 * The `id` field is auto-generated and acts as the row identifier that
 * Handsontable references via `dataProvider.rowId: 'id'`.
 */
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String sku;

    private String category;

    /** Stored with two decimal places -- matches the numeric column in Handsontable. */
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private Integer stock;

    // --- Getters and setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
}
