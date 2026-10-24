package com.shopnex.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getCustomerByIdReturnsExistingCustomer() throws Exception {
        mockMvc.perform(get("/api/customers/1")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice Vance"))
                .andExpect(jsonPath("$.email").value("alice.vance@example.com"));
    }

    @Test
    void getCustomerByIdReturnsNotFoundForMissingCustomer() throws Exception {
        mockMvc.perform(get("/api/customers/99999")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void createCustomerSucceedsWithValidData() throws Exception {
        String payload = """
            {
              "name": "Diana Prince",
              "email": "diana.prince@example.com",
              "phone": "+1-555-0199",
              "address": "400 Themyscira Blvd, Gateway City"
            }
            """;

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Diana Prince"))
                .andExpect(jsonPath("$.email").value("diana.prince@example.com"));
    }

    @Test
    void createCustomerFailsWhenEmailAlreadyExists() throws Exception {
        String duplicatePayload = """
            {
              "name": "Duplicate Alice",
              "email": "alice.vance@example.com",
              "phone": "+1-555-9999",
              "address": "Somewhere"
            }
            """;

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(duplicatePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Customer with email 'alice.vance@example.com' already exists."));
    }

    @Test
    void createCustomerFailsWithInvalidEmail() throws Exception {
        String invalidPayload = """
            {
              "name": "Invalid Email User",
              "email": "not-an-email",
              "phone": "+1-555-9999"
            }
            """;

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").isNotEmpty());
    }
}
