-- ==============================================================================
-- Flyway Migration V4: Authentication, Discounts, M.R.P. & Amazon/Flipkart Badges
-- ==============================================================================

-- 1. Add password_hash to customers (Default hash corresponds to 'password123')
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f' NOT NULL;

-- 2. Add Amazon/Flipkart e-commerce attributes to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.8;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 120;

-- 3. Populate realistic M.R.P., discount percentages, ratings, and badges
UPDATE products 
SET original_price = ROUND(price * 1.25, 2), 
    discount_percent = 20, 
    rating = 4.8, 
    review_count = 142,
    badge = 'SHOPNEX ASSURED'
WHERE original_price IS NULL;

-- Highlight specific flagship items with Amazon/Flipkart badges
UPDATE products SET original_price = 2799.00, discount_percent = 18, badge = 'BEST SELLER', rating = 4.9, review_count = 842 WHERE name LIKE '%Titanium Studio Workstation%';
UPDATE products SET original_price = 2199.00, discount_percent = 18, badge = 'DEAL OF THE DAY', rating = 4.8, review_count = 523 WHERE name LIKE '%Ultra-Slim Developer Laptop%';
UPDATE products SET original_price = 1599.00, discount_percent = 25, badge = 'AMAZON CHOICE', rating = 4.9, review_count = 312 WHERE name LIKE '%5K UltraFine Studio Display%';
UPDATE products SET original_price = 1199.00, discount_percent = 25, badge = 'HOT DEAL', rating = 4.7, review_count = 419 WHERE name LIKE '%34-inch Curved QD-OLED%';
UPDATE products SET original_price = 189.99, discount_percent = 32, badge = 'BEST SELLER', rating = 4.8, review_count = 1205 WHERE name LIKE '%Ergonomic Mechanical Keyboard%';
UPDATE products SET original_price = 269.99, discount_percent = 26, badge = 'AMAZON CHOICE', rating = 4.8, review_count = 940 WHERE name LIKE '%Wireless Noise-Cancelling%';
UPDATE products SET original_price = 459.00, discount_percent = 24, badge = 'HOT DEAL', rating = 4.7, review_count = 680 WHERE name LIKE '%Ultra-HD 4K IPS Monitor%';
UPDATE products SET original_price = 199.99, discount_percent = 20, badge = 'SHOPNEX ASSURED', rating = 4.6, review_count = 432 WHERE name LIKE '%Smart Health & Fitness%';
UPDATE products SET original_price = 59.99, discount_percent = 33, badge = 'BEST SELLER', rating = 4.9, review_count = 2140 WHERE name LIKE '%USB-C Multiport Hub%';
UPDATE products SET original_price = 179.99, discount_percent = 28, badge = 'DEAL OF THE DAY', rating = 4.9, review_count = 388 WHERE name LIKE '%140W GaN Fast Charging%';
UPDATE products SET original_price = 289.00, discount_percent = 21, badge = 'HOT DEAL', rating = 4.8, review_count = 245 WHERE name LIKE '%16-Channel 500MHz USB Logic%';
