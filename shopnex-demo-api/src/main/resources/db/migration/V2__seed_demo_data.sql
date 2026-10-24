-- ==============================================================================
-- Flyway Migration V2: Deterministic Demonstration Data
-- Fictional customers and products for testing and integration
-- ==============================================================================

-- Seed Fictional Customers
INSERT INTO customers (name, email, phone, address) VALUES
('Alice Vance', 'alice.vance@example.com', '+1-555-0101', '124 Market Street, Suite 400, Austin, TX 78701'),
('Bob Martin', 'bob.martin@example.com', '+1-555-0102', '742 Evergreen Terrace, Springfield, OR 97477'),
('Charlie Davis', 'charlie.davis@example.com', '+1-555-0103', '88 Innovation Way, Silicon Valley, CA 94025');

-- Seed Fictional Products
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
('Ergonomic Mechanical Keyboard', 'Tactile switch keyboard with RGB backlighting, wrist rest, and programmable macro keys.', 129.99, 50, 'Electronics'),
('Wireless Noise-Cancelling Headphones', 'Over-ear premium headphones with active noise cancellation, 40h battery, and multipoint Bluetooth.', 199.50, 35, 'Audio'),
('Ultra-HD 4K IPS Monitor 27-inch', 'Color-accurate 4K display with USB-C 65W power delivery, HDR400, and ultra-thin bezels.', 349.00, 20, 'Electronics'),
('Smart Health & Fitness Watch', 'Waterproof fitness tracker with heart rate monitor, GPS, sleep analysis, and 7-day battery life.', 159.00, 40, 'Wearables'),
('USB-C Multiport Hub Adapter 7-in-1', 'Aluminum hub with 4K HDMI, 100W PD charging, 3x USB 3.0, and SD/TF card reader.', 39.99, 100, 'Accessories'),
('Precision Optical Gaming Mouse', 'Lightweight 16,000 DPI sensor mouse with braided paracord cable and onboard memory.', 49.99, 65, 'Electronics'),
('High-Fidelity Studio Desk Speakers', 'Compact bi-amplified studio monitors with balanced TRS inputs and Bluetooth 5.0 aptX.', 219.00, 15, 'Audio'),
('Aluminum Laptop Cooling Stand', 'Ergonomic elevation stand with silicone anti-slip padding for laptops up to 17 inches.', 29.95, 80, 'Accessories');
