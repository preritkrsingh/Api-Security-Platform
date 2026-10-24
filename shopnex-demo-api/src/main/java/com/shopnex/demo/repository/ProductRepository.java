package com.shopnex.demo.repository;

import com.shopnex.demo.entity.Product;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByCategoryIgnoreCase(String category, Pageable pageable);

    List<Product> findByCategoryIgnoreCase(String category);

    boolean existsByNameIgnoreCase(String name);
}
