-- 正确的表结构，匹配Entity定义
-- 运行这个脚本来手动创建表，或者使用ddl-auto: create-drop

\c delivery_app;

-- 删除所有表（小心：会删除数据）
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS delivery_order CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS payment_method CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS address CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS route CASCADE;
DROP TABLE IF EXISTS station CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;

-- 用户枚举类型
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'DRIVER');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE delivery_order_status AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE delivery_type AS ENUM ('ROBOT', 'DRONE', 'STANDARD');
CREATE TYPE vehicle_status AS ENUM ('AVAILABLE', 'BUSY', 'MAINTENANCE', 'OFFLINE');
CREATE TYPE vehicle_type AS ENUM ('ROBOT', 'DRONE', 'TRUCK');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method_type AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY');

-- 用户表（匹配User.java Entity）
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'USER',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地址表（匹配Address.java Entity）
CREATE TABLE address (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 订单表（匹配Order.java Entity）
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    pickup_address VARCHAR(500) NOT NULL,
    pickup_contact_name VARCHAR(100) NOT NULL,
    pickup_contact_phone VARCHAR(20) NOT NULL,
    delivery_address VARCHAR(500) NOT NULL,
    delivery_contact_name VARCHAR(100) NOT NULL,
    delivery_contact_phone VARCHAR(20) NOT NULL,
    package_weight DECIMAL(5,2),
    package_type VARCHAR(100),
    package_value DECIMAL(10,2),
    package_description TEXT,
    status order_status DEFAULT 'PENDING',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 订单状态历史表
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status order_status NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 支付方式表
CREATE TABLE payment_method (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type payment_method_type NOT NULL,
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_method_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 支付表
CREATE TABLE payment (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_method_id BIGINT,
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
);

-- 配送站点表
CREATE TABLE station (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    capacity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 车辆表
CREATE TABLE vehicle (
    id BIGSERIAL PRIMARY KEY,
    vehicle_code VARCHAR(50) UNIQUE NOT NULL,
    type vehicle_type NOT NULL,
    status vehicle_status DEFAULT 'AVAILABLE',
    station_id BIGINT,
    max_weight DECIMAL(5,2),
    max_distance INTEGER,
    battery_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_station FOREIGN KEY (station_id) REFERENCES station(id)
);

-- 路线表
CREATE TABLE route (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    vehicle_id BIGINT,
    start_latitude DECIMAL(10,8),
    start_longitude DECIMAL(11,8),
    end_latitude DECIMAL(10,8),
    end_longitude DECIMAL(11,8),
    distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_route_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_route_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

-- 配送订单表
CREATE TABLE delivery_order (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    vehicle_id BIGINT,
    delivery_type delivery_type NOT NULL,
    status delivery_order_status DEFAULT 'PENDING',
    estimated_pickup_time TIMESTAMP,
    actual_pickup_time TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_address_user_id ON address(user_id);
CREATE INDEX idx_payment_order_id ON payment(order_id);
CREATE INDEX idx_delivery_order_order_id ON delivery_order(order_id);

-- 插入一些测试数据
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@delivery.com', '$2a$10$dummy.hash.here', 'Admin', 'User', '+1234567890', 'ADMIN'),
('test@example.com', '$2a$10$dummy.hash.here', 'Test', 'User', '+1234567891', 'USER');

INSERT INTO station (name, address, latitude, longitude, capacity) VALUES
('Central Station', '123 Main St, City, State 12345', 40.7128, -74.0060, 100),
('North Station', '456 North Ave, City, State 12345', 40.7589, -73.9851, 80);

INSERT INTO vehicle (vehicle_code, type, status, station_id, max_weight, max_distance, battery_level) VALUES
('ROBOT001', 'ROBOT', 'AVAILABLE', 1, 10.0, 50, 100),
('DRONE001', 'DRONE', 'AVAILABLE', 1, 5.0, 100, 95),
('TRUCK001', 'TRUCK', 'AVAILABLE', 2, 1000.0, 500, NULL);

COMMIT;