/* =========================================================
   Delivery System - PostgreSQL (P0, single route per order)
   - route 独立表（1:1 order）
   - 无 route_option
   - users 无 created_at
   - item 字段在 delivery_order
   ========================================================= */


-- 清表（注意：会删数据）
DROP TABLE IF EXISTS route CASCADE;
DROP TABLE IF EXISTS delivery_order CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;
DROP TABLE IF EXISTS station CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS address CASCADE;

-- 地址
CREATE TABLE address (
  id                 BIGSERIAL PRIMARY KEY,
  place_id           VARCHAR(255) NOT NULL,
  latitude           DECIMAL(9,6) NOT NULL,
  longitude          DECIMAL(9,6) NOT NULL,
  formatted_address  TEXT NOT NULL,
  zip_code           VARCHAR(10) NOT NULL
);

CREATE INDEX idx_zip ON address(zip_code);

-- 用户（无 created_at）
CREATE TABLE users (
  id                  BIGSERIAL PRIMARY KEY,
  full_name           VARCHAR(100),
  email               VARCHAR(100) UNIQUE,
  phone               VARCHAR(20),
  default_address_id  BIGINT,
  CONSTRAINT fk_users_default_addr
    FOREIGN KEY (default_address_id) REFERENCES address(id)
);

-- 配送中心
CREATE TABLE station (
  id                BIGSERIAL PRIMARY KEY,
  name              VARCHAR(50),
  address_id        BIGINT,
  available_robots  INTEGER DEFAULT 0,
  available_drones  INTEGER DEFAULT 0,
  CONSTRAINT fk_station_address
    FOREIGN KEY (address_id) REFERENCES address(id)
);

-- 车辆（机器人 / 无人机）
CREATE TABLE vehicle (
  id              BIGSERIAL PRIMARY KEY,
  vehicle_type    VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('ROBOT','DRONE')),
  max_payload_kg  DECIMAL(4,1),
  status          VARCHAR(20) NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE','IN_SERVICE','MAINTENANCE')),
  station_id      BIGINT,
  CONSTRAINT fk_vehicle_station
    FOREIGN KEY (station_id) REFERENCES station(id)
);

-- 订单（单件物品 + 基本元信息）
CREATE TABLE delivery_order (
  id                   BIGSERIAL PRIMARY KEY,
  user_id              BIGINT,
  pickup_address_id    BIGINT,
  dropoff_address_id   BIGINT,
  station_id           BIGINT,
  vehicle_id           BIGINT,

  -- Item（单件）
  item_description     TEXT,
  item_weight_kg       DECIMAL(4,2),
  item_length_cm       DECIMAL(5,1),
  item_width_cm        DECIMAL(5,1),
  item_height_cm       DECIMAL(5,1),

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
    'PENDING_PAYMENT','PAID','DISPATCHED','AT_PICKUP',
    'IN_TRANSIT','DELIVERED','COMPLETED','CANCELLED','FAILED'
  )),

  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_user       FOREIGN KEY (user_id)            REFERENCES users(id),
  CONSTRAINT fk_order_pickup     FOREIGN KEY (pickup_address_id)  REFERENCES address(id),
  CONSTRAINT fk_order_dropoff    FOREIGN KEY (dropoff_address_id) REFERENCES address(id),
  CONSTRAINT fk_order_station    FOREIGN KEY (station_id)         REFERENCES station(id),
  CONSTRAINT fk_order_vehicle    FOREIGN KEY (vehicle_id)         REFERENCES vehicle(id)
);

CREATE INDEX idx_order_status ON delivery_order(status);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_delivery_order_updated_at
    BEFORE UPDATE ON delivery_order
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 路线（每单仅一条，1:1）
CREATE TABLE route (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL,
  vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('ROBOT','DRONE')),
  distance_m   INTEGER NOT NULL,
  duration_s   INTEGER NOT NULL,
  price_cents  INTEGER NOT NULL,
  CONSTRAINT fk_route_order
    FOREIGN KEY (order_id) REFERENCES delivery_order(id) ON DELETE CASCADE,
  CONSTRAINT uq_route_order UNIQUE (order_id)   -- 保证一单只有一条路线
);