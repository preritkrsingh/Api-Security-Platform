package com.shopnex.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ShopnexDemoApiApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring ApplicationContext and Flyway migrations initialize cleanly
    }
}
