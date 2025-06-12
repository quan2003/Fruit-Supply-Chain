-- Khởi tạo cơ sở dữ liệu
SELECT 'CREATE DATABASE fruit_supply_chain' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fruit_supply_chain')\gexec

-- Kết nối đến cơ sở dữ liệu vừa tạo
\c fruit_supply_chain

-- Bảng users: Lưu thông tin người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Producer', 'Government', 'DeliveryHub', 'Customer', 'Admin')),
    wallet_address VARCHAR(42),
    is_logged_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng farms: Lưu thông tin nông trại
CREATE TABLE farms (
    id SERIAL PRIMARY KEY,
    producer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    farm_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    weather_condition VARCHAR(50),
    yield INTEGER DEFAULT 0,
    quality VARCHAR(50),
    current_conditions TEXT
);

-- Bảng fruits: Lưu thông tin trái cây
CREATE TABLE fruits (
    id SERIAL PRIMARY KEY,
    fruit_type VARCHAR(100),
    origin VARCHAR(255),
    farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
    quality VARCHAR(50),
    harvest_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng fruit_history: Lưu lịch sử bước xử lý trái cây
CREATE TABLE fruit_history (
    id SERIAL PRIMARY KEY,
    fruit_id INTEGER REFERENCES fruits(id) ON DELETE CASCADE,
    step VARCHAR(100),
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng fruit_recommendations: Lưu khuyến nghị cho trái cây
CREATE TABLE fruit_recommendations (
    id SERIAL PRIMARY KEY,
    fruit_id INTEGER REFERENCES fruits(id) ON DELETE CASCADE,
    recommendation TEXT
);

-- Bảng products: Lưu thông tin sản phẩm
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    productcode VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10, 2),
    quantity INTEGER NOT NULL,
    imageurl VARCHAR(255),
    productdate TIMESTAMP,
    expirydate TIMESTAMP,
    farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
    hash VARCHAR(100),
    fruit_id INTEGER
);

-- Bảng outgoing_products: Lưu sản phẩm đang bán
CREATE TABLE outgoing_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    delivery_hub_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    original_quantity INTEGER NOT NULL,
    price DECIMAL(10, 2),
    listed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Sold')),
    transaction_hash VARCHAR(66),
    listing_id VARCHAR(50) UNIQUE, -- Thêm UNIQUE để tránh lỗi khóa ngoại
    fruit_id INTEGER
);

-- Bảng inventory: Lưu kho của trung tâm phân phối
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    delivery_hub_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2),
    productdate TIMESTAMP,
    expirydate TIMESTAMP,
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_hash VARCHAR(66),
    fruit_id INTEGER
);

-- Bảng shipments: Lưu thông tin lô hàng
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(50),
    recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'In Transit' CHECK (status IN ('In Transit', 'Delivered')),
    shipment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_date TIMESTAMP
);

-- Bảng shipment_products: Lưu sản phẩm trong lô hàng
CREATE TABLE shipment_products (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2)
);

-- Bảng orders: Lưu thông tin đơn hàng
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Shipped', 'Delivered')),
    shipping_address TEXT,
    transaction_hash VARCHAR(66)
);

-- Bảng triparty_contracts: Lưu thông tin hợp đồng ba bên
CREATE TABLE triparty_contracts (
    contract_id SERIAL PRIMARY KEY,
    farm_id VARCHAR(255),
    delivery_hub_wallet_address VARCHAR(42),
    creation_date TIMESTAMP,
    expiry_date TIMESTAMP,
    total_quantity INTEGER,
    price_per_unit DECIMAL(10, 2),
    terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    farm_signature TEXT,
    agent_signature TEXT,
    government_signature TEXT,
    is_farm_signed BOOLEAN DEFAULT FALSE,
    is_agent_signed BOOLEAN DEFAULT FALSE,
    is_government_signed BOOLEAN DEFAULT FALSE
);

-- Bảng farm_statistics: Lưu thống kê nông trại
CREATE TABLE farm_statistics (
    farm_id VARCHAR(255) PRIMARY KEY,
    total_fruit_harvested INTEGER,
    total_contracts_created INTEGER,
    total_contracts_completed INTEGER,
    last_update BIGINT
);

-- Bảng province_statistics: Lưu thống kê tỉnh
CREATE TABLE province_statistics (
    province VARCHAR(255) PRIMARY KEY,
    total_fruit_harvested INTEGER,
    total_contracts_created INTEGER,
    total_contracts_completed INTEGER,
    farm_count INTEGER,
    last_update BIGINT
);

-- Bảng product_ratings: Lưu đánh giá sản phẩm
CREATE TABLE product_ratings (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(50) REFERENCES outgoing_products(listing_id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Bảng catalogs: Lưu danh mục trái cây
CREATE TABLE catalogs (
    id SERIAL PRIMARY KEY,
    fruit_type VARCHAR(100),
    description TEXT,
    growing_season VARCHAR(100),
    nutritional_value TEXT,
    storage_conditions TEXT,
    common_varieties TEXT
);