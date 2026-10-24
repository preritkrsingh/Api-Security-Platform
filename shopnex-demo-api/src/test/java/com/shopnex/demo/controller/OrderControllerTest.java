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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createOrderSucceedsAndDeductsStock() throws Exception {
        // Customer 1 buys 2 of Product 3 (Ultra-HD 4K IPS Monitor 27-inch, $349.00, seeded stock 20)
        String orderPayload = """
            {
              "customerId": 1,
              "items": [
                {
                  "productId": 3,
                  "quantity": 2
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.customerId").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.totalAmount").value(698.00))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productName").value("Ultra-HD 4K IPS Monitor 27-inch"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(349.00))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].subtotal").value(698.00));

        // Verify product 3 stock was deducted (20 - 2 = 18)
        mockMvc.perform(get("/api/products/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(18));
    }

    @Test
    void createOrderFailsWhenCustomerNotFound() throws Exception {
        String payload = """
            {
              "customerId": 99999,
              "items": [
                {
                  "productId": 1,
                  "quantity": 1
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void createOrderFailsWhenProductNotFound() throws Exception {
        String payload = """
            {
              "customerId": 1,
              "items": [
                {
                  "productId": 99999,
                  "quantity": 1
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void createOrderFailsWhenStockIsInsufficient() throws Exception {
        // Product 7 (Studio Desk Speakers) seeded stock is 15. Attempting to purchase 999.
        String payload = """
            {
              "customerId": 1,
              "items": [
                {
                  "productId": 7,
                  "quantity": 999
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("INSUFFICIENT_STOCK"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void getOrdersReturnsPagedOrders() throws Exception {
        mockMvc.perform(get("/api/orders")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.pageNumber").value(0));
    }

    @Test
    void getOrdersByCustomerReturnsCustomerOrders() throws Exception {
        // Place an order for customer 1 first
        String orderPayload = """
            {
              "customerId": 1,
              "items": [
                {
                  "productId": 1,
                  "quantity": 1
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderPayload))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/orders/customer/1")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }
}
