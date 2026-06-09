package com.example.products;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Spring Data repository for Product entities.
 *
 * Extending JpaSpecificationExecutor enables the `findAll(Specification, Pageable)`
 * method used in ProductService to apply server-side filters.
 */
public interface ProductRepository
        extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
}
