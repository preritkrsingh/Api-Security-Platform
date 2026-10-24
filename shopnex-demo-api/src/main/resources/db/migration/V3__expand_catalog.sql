-- ==============================================================================
-- Flyway Migration V3: Large Enterprise Product Catalog Expansion
-- Expands ShopNex into a full-scale hardware & technology storefront
-- ==============================================================================

INSERT INTO products (name, description, price, stock_quantity, category) VALUES
-- Computing & Workstations
('Titanium Studio Workstation Pro', 'Octa-core Xeon architecture with 64GB DDR5 ECC memory, 2TB NVMe PCIe 5.0 SSD, and liquid cooling.', 2299.00, 12, 'Computing'),
('Ultra-Slim Developer Laptop 16-inch', 'Lightweight magnesium chassis, 16-core CPU, 32GB RAM, 120Hz 3.2K OLED display, and 18-hour battery.', 1699.50, 25, 'Computing'),
('Compact Linux Edge Micro-Server', 'Quad-core ARM64 edge node with dual 2.5GbE LAN, 16GB LPDDR4, NVMe slot, and passive aluminum heat sink.', 289.00, 45, 'Computing'),
('Mini ITX Developer Desktop Rig', 'Modular compact rig with PCIe Gen5 GPU support, 32GB DDR5, 1TB NVMe, and whisper-quiet fans.', 1149.00, 18, 'Computing'),

-- Displays & Vision
('34-inch Curved QD-OLED Gaming Monitor', 'UltraWide 3440x1440 resolution, 175Hz refresh rate, 0.03ms response time, and HDR True Black 400.', 899.99, 15, 'Displays'),
('Portable USB-C Field Display 15.6-inch', 'FHD 1080p IPS matte screen with 10-point multi-touch, magnetic folio stand, and dual stereo speakers.', 189.00, 60, 'Displays'),
('27-inch 5K Color Reference Studio Display', '5120x2880 resolution, 99% DCI-P3 color gamut, 600 nits brightness, Thunderbolt 4 Daisy-Chaining.', 1249.00, 10, 'Displays'),
('24-inch 240Hz eSports Fast-IPS Monitor', 'Ultra-fast 240Hz refresh rate, 1ms GtG, AMD FreeSync Premium, height-adjustable ergonomic pivot stand.', 279.50, 30, 'Displays'),

-- Keyboards & Input
('Split Ergonomic Mechanical Keyboard', 'Ortholinear split design with hot-swappable tactile switches, per-key RGB, and custom QMK/VIA firmware.', 249.00, 28, 'Keyboards'),
('Low-Profile Wireless Mechanical Keyboard', 'Ultra-thin aluminum frame, Bluetooth 5.2 / 2.4GHz / USB-C tri-mode connectivity, and PBT keycaps.', 139.99, 45, 'Keyboards'),
('Vertical Ergonomic Wireless Mouse', 'Scientifically designed 57-degree vertical grip angle, optical 4000 DPI sensor, and silent click switches.', 59.95, 70, 'Accessories'),
('Precision CNC Machined Control Dial', 'Customizable aluminum rotary knob with haptic detents for timeline scrubbing, volume, and zoom control.', 79.00, 50, 'Accessories'),

-- Audio & Studio
('Studio Reference Dynamic Broadcast Mic', 'Cardioid broadcast-grade XLR/USB hybrid microphone with built-in DSP, pop filter, and headphone monitor.', 249.00, 32, 'Audio'),
('Active Noise-Cancelling Wireless Earbuds', 'Custom 11mm dynamic drivers, multi-mode hybrid ANC, transparency mode, wireless Qi charging case.', 149.00, 85, 'Audio'),
('Multi-Channel USB-C Audio Interface', '24-bit/192kHz audio interface with dual crystal preamps, +48V phantom power, and MIDI I/O.', 169.99, 22, 'Audio'),
('Open-Back Audiophile Planar Headphones', 'Planar magnetic transducers, ultra-wide frequency response (6Hz-75kHz), and memory foam ear cushions.', 399.00, 16, 'Audio'),

-- Smart Wearables
('Smart Titanium Biometric Health Ring', 'Ultra-lightweight titanium ring with continuous sleep, HRV, blood oxygen tracking, and 7-day battery.', 299.00, 40, 'Wearables'),
('Rugged Multi-Sport GPS Adventure Watch', 'Sapphire crystal glass, dual-frequency GNSS navigation, 100m water resistance, and solar charging.', 499.00, 20, 'Wearables'),
('Smart Fitness Band with Heart Rate Monitor', 'Curved AMOLED touch display, 50+ workout modes, stress monitoring, and swim-proof IP68 rating.', 49.99, 110, 'Wearables'),

-- Connectivity & Hubs
('Thunderbolt 4 Triple-Display Dock 16-in-1', 'Universal dual 4K/single 8K dock with 96W host charging, 2.5GbE Ethernet, UHS-II SD reader, 4x USB-A.', 269.00, 35, 'Accessories'),
('140W Multi-Port GaN Fast Charger', 'Gallium Nitride charging brick with 3x USB-C and 1x USB-A ports, PD 3.1 protocol, and foldable prongs.', 79.99, 90, 'Accessories'),
('Magnetic 3-in-1 Wireless Charging Stand', 'Simultaneous fast wireless charging for smartphone, smartwatch, and earbuds with floating aluminum base.', 89.50, 65, 'Accessories'),

-- Developer Tools & Hardware
('Hardware Debugger & JTAG/SWD Probe', 'High-speed USB probe for ARM Cortex development, hardware breakpoints, and real-time trace capture.', 119.00, 40, 'Developer Gear'),
('High-Speed 16-Channel Logic Analyzer', 'USB logic analyzer with 100MHz digital sampling rate, protocol decoders for I2C, SPI, UART, CAN, USB.', 159.00, 30, 'Developer Gear');
