package com.shopnex.demo.service;

import com.shopnex.demo.dto.AuthResponseDto;
import com.shopnex.demo.dto.CustomerDto;
import com.shopnex.demo.dto.LoginRequest;
import com.shopnex.demo.dto.RegisterRequest;
import com.shopnex.demo.entity.Customer;
import com.shopnex.demo.exception.ResourceNotFoundException;
import com.shopnex.demo.repository.CustomerRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final CustomerRepository customerRepository;

    public AuthService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 hashing algorithm not available", e);
        }
    }

    @Transactional
    public AuthResponseDto register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (customerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with email '" + request.getEmail() + "' already exists.");
        }

        String passwordHash = hashPassword(request.getPassword());
        Customer customer = new Customer(
                request.getName().trim(),
                normalizedEmail,
                passwordHash,
                request.getPhone() != null ? request.getPhone().trim() : null,
                request.getAddress() != null ? request.getAddress().trim() : null
        );

        Customer saved = customerRepository.save(customer);
        String token = "snx_tk_" + UUID.randomUUID().toString().replace("-", "");

        return new AuthResponseDto(
                token,
                mapToDto(saved),
                "Account registered successfully."
        );
    }

    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Customer customer = customerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        String inputHash = hashPassword(request.getPassword());
        if (!inputHash.equalsIgnoreCase(customer.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String token = "snx_tk_" + UUID.randomUUID().toString().replace("-", "");

        return new AuthResponseDto(
                token,
                mapToDto(customer),
                "Authentication successful."
        );
    }

    @Transactional(readOnly = true)
    public CustomerDto getProfile(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        return mapToDto(customer);
    }

    private CustomerDto mapToDto(Customer customer) {
        return new CustomerDto(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getCreatedAt()
        );
    }
}
