package com.shopnex.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getProductsReturnsPaginatedList() throws Exception {
        mockMvc.perform(get("/api/products")
                .param("page", "0")
                .param("size", "10")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(8)));
    }

    @Test
    void getProductByIdReturnsExistingProduct() throws Exception {
        mockMvc.perform(get("/api/products/1")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Ergonomic Mechanical Keyboard"))
                .andExpect(jsonPath("$.price").value(129.99))
                .andExpect(jsonPath("$.category").value("Electronics"));
    }

    @Test
    void getProductByIdReturnsNotFoundForMissingId() throws Exception {
        mockMvc.perform(get("/api/products/99999")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void createProductSucceedsWithValidData() throws Exception {
        String payload = """
            {
              "name": "Wireless Charging Pad",
              "description": "Fast 15W Qi wireless charger with LED indicator",
              "price": 24.99,
              "stockQuantity": 75,
              "category": "Accessories"
            }
            """;

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Wireless Charging Pad"))
                .andExpect(jsonPath("$.price").value(24.99))
                .andExpect(jsonPath("$.stockQuantity").value(75));
    }

    @Test
    void createProductFailsWithValidationErrors() throws Exception {
        String invalidPayload = """
            {
              "name": "",
              "description": "Invalid product missing price and category",
              "price": -5.00,
              "stockQuantity": -1,
              "category": ""
            }
            """;

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.name").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.price").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.stockQuantity").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.category").isNotEmpty());
    }

    @Test
    void updateProductSucceeds() throws Exception {
        String updatePayload = """
            {
              "name": "Updated Keyboard Pro",
              "description": "Updated description with hot-swappable switches",
              "price": 149.99,
              "stockQuantity": 45,
              "category": "Electronics"
            }
            """;

        mockMvc.perform(put("/api/products/2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Updated Keyboard Pro"))
                .andExpect(jsonPath("$.price").value(149.99));
    }

    @Test
    void deleteProductSucceedsAndSubsequentGetFails() throws Exception {
        // First create a temporary product to delete
        String tempProduct = """
            {
              "name": "Disposable Test Item",
              "description": "To be deleted",
              "price": 9.99,
              "stockQuantity": 10,
              "category": "Test"
            }
            """;

        String response = mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(tempProduct))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // Extract ID
        String idStr = response.replaceAll(".*\"id\":(\\d+).*", "$1");
        long tempId = Long.parseLong(idStr);

        // Delete it
        mockMvc.perform(delete("/api/products/" + tempId))
                .andExpect(status().isNoContent());

        // Verify it is gone
        mockMvc.perform(get("/api/products/" + tempId))
                .andExpect(status().isNotFound());
    }
}
