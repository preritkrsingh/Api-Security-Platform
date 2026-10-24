package com.shopnex.demo.service;

import com.shopnex.demo.dto.CreateProductRequest;
import com.shopnex.demo.dto.PagedResponse;
import com.shopnex.demo.dto.ProductDto;
import com.shopnex.demo.dto.UpdateProductRequest;
import com.shopnex.demo.entity.Product;
import com.shopnex.demo.exception.ResourceNotFoundException;
import com.shopnex.demo.repository.ProductRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductDto> getProducts(int page, int size, String category, String sortBy, String sortDir) {
        // Enforce safe limits on page and size
        int safePage = Math.max(page, 0);
        int safeSize = (size <= 0 || size > 100) ? 20 : size;

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String safeSortBy = ("price".equalsIgnoreCase(sortBy) || "name".equalsIgnoreCase(sortBy) || "createdAt".equalsIgnoreCase(sortBy))
                ? sortBy : "id";

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(direction, safeSortBy));

        Page<Product> productPage;
        if (category != null && !category.trim().isEmpty()) {
            productPage = productRepository.findByCategoryIgnoreCase(category.trim(), pageable);
        } else {
            productPage = productRepository.findAll(pageable);
        }

        List<ProductDto> dtos = productPage.getContent().stream()
                .map(this::mapToDto)
                .toList();

        return new PagedResponse<>(
                dtos,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return mapToDto(product);
    }

    @Transactional(readOnly = true)
    public Product getProductEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest request) {
        Product product = new Product(
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getPrice(),
                request.getStockQuantity(),
                request.getCategory().trim()
        );

        Product saved = productRepository.save(product);
        return mapToDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(request.getCategory().trim());

        Product updated = productRepository.save(product);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }
        productRepository.deleteById(id);
    }

    public ProductDto mapToDto(Product product) {
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getDiscountPercent(),
                product.getBadge(),
                product.getRating(),
                product.getReviewCount(),
                product.getStockQuantity(),
                product.getCategory(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
