-- 快速创建User表测试
-- 连接到数据库
\c delivery_app;

-- 删除现有表
DROP TABLE IF EXISTS users CASCADE;

-- 创建用户枚举类型
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- 创建users表 (匹配User.java Entity)
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

-- 创建索引
CREATE INDEX idx_users_email ON users(email);

-- 插入测试数据
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@delivery.com', '$2a$10$dummy.hash.here', 'Admin', 'User', '+1234567890', 'ADMIN'),
('test@example.com', '$2a$10$dummy.hash.here', 'Test', 'User', '+1234567891', 'USER');

-- 验证表创建
\dt
SELECT * FROM users;

COMMIT;