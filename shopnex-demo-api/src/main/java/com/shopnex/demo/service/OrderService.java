package com.shopnex.demo.service;

import com.shopnex.demo.dto.CreateOrderItemRequest;
import com.shopnex.demo.dto.CreateOrderRequest;
import com.shopnex.demo.dto.OrderDto;
import com.shopnex.demo.dto.OrderItemDto;
import com.shopnex.demo.dto.PagedResponse;
import com.shopnex.demo.entity.Customer;
import com.shopnex.demo.entity.Order;
import com.shopnex.demo.entity.OrderItem;
import com.shopnex.demo.entity.OrderStatus;
import com.shopnex.demo.entity.Product;
import com.shopnex.demo.exception.InsufficientStockException;
import com.shopnex.demo.exception.InvalidOrderException;
import com.shopnex.demo.exception.ResourceNotFoundException;
import com.shopnex.demo.repository.CustomerRepository;
import com.shopnex.demo.repository.OrderRepository;
import com.shopnex.demo.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        CustomerRepository customerRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderDto> getAllOrders(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = (size <= 0 || size > 100) ? 20 : size;

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<Order> orderPage = orderRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<OrderDto> dtos = orderPage.getContent().stream()
                .map(this::mapToDto)
                .toList();

        return new PagedResponse<>(
                dtos,
                orderPage.getNumber(),
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        return mapToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByCustomerId(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer", customerId);
        }
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new InvalidOrderException("Order must contain at least one product item.");
        }

        Order order = new Order(customer, BigDecimal.ZERO, OrderStatus.CONFIRMED);
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemRequest : request.getItems()) {
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new InvalidOrderException("Item quantity must be greater than zero.");
            }

            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemRequest.getProductId()));

            // Stock availability check
            if (product.getStockQuantity() < itemRequest.getQuantity()) {
                throw new InsufficientStockException(product.getName(), itemRequest.getQuantity(), product.getStockQuantity());
            }

            // Deduct stock safely within transaction
            product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());
            productRepository.save(product);

            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = new OrderItem(
                    order,
                    product,
                    product.getName(),
                    unitPrice,
                    itemRequest.getQuantity(),
                    subtotal
            );
            order.addItem(orderItem);
        }

        order.setTotalAmount(totalAmount);
        Order saved = orderRepository.save(order);
        return mapToDto(saved);
    }

    private OrderDto mapToDto(Order order) {
        List<OrderItemDto> itemDtos = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                itemDtos.add(new OrderItemDto(
                        item.getId(),
                        item.getProduct() != null ? item.getProduct().getId() : null,
                        item.getProductName(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                ));
            }
        }

        return new OrderDto(
                order.getId(),
                order.getCustomer() != null ? order.getCustomer().getId() : null,
                order.getCustomer() != null ? order.getCustomer().getName() : null,
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                itemDtos
        );
    }
}
