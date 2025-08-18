# 数据库表结构问题修复

## 🔍 **问题分析**

### **spatial_ref_sys 表的来源**
- 这是 **PostGIS扩展** 的系统表，不是你的业务表
- 用于存储空间参考系统信息（地理坐标系统）
- 说明你的PostgreSQL启用了PostGIS扩展

### **为什么没有user表？**
1. **Hibernate DDL设置**: `ddl-auto: none` - 不会根据Entity自动创建表
2. **SQL脚本不匹配**: `db_postgresql_exact.sql` 的表结构与Entity定义不一致
3. **表结构冲突**: 
   - Entity定义: `email`, `password`, `firstName`, `lastName`
   - SQL脚本定义: `full_name`, `default_address_id` (缺少认证字段)

## 🛠️ **三种解决方案**

### **方案1: 自动创建表（推荐开发环境）**
```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: create-drop  # 每次启动重新创建表
```

**优点**: 
- ✅ 自动根据Entity创建正确的表结构
- ✅ 保证Entity与数据库一致
- ✅ 开发阶段快速迭代

**缺点**: 
- ❌ 每次重启会清空数据
- ❌ 生产环境不推荐

### **方案2: 运行正确的SQL脚本**
```bash
psql -h localhost -U gloriaupup -d delivery_app -f create_tables_from_entities.sql
```

**优点**: 
- ✅ 完全控制表结构
- ✅ 包含测试数据
- ✅ 适合生产环境

### **方案3: 使用validate模式（生产环境）**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # 验证Entity与数据库是否匹配
```

## 📊 **Entity vs SQL脚本对比**

### **User Entity (正确)**
```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Email @Column(unique = true)
    private String email;           // ✅ 认证必需
    
    @NotBlank @Size(min = 6, max = 100)
    private String password;        // ✅ 认证必需
    
    @NotBlank @Size(max = 50)
    private String firstName;       // ✅ 分离姓名
    
    @NotBlank @Size(max = 50)
    private String lastName;        // ✅ 分离姓名
    
    private String phone;
    private UserRole role;
    private boolean enabled;
    
    @CreatedDate
    private LocalDateTime createdAt; // ✅ 审计字段
}
```

### **旧SQL脚本 (不匹配)**
```sql
CREATE TABLE users (
  id                  BIGSERIAL PRIMARY KEY,
  full_name           VARCHAR(100),     -- ❌ 应该是firstName + lastName
  email               VARCHAR(100) UNIQUE,
  phone               VARCHAR(20),
  default_address_id  BIGINT           -- ❌ 缺少password, role等字段
);
```

### **新SQL脚本 (匹配Entity)**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,      -- ✅ 匹配Entity
    password VARCHAR(100) NOT NULL,          -- ✅ 认证字段
    first_name VARCHAR(50) NOT NULL,         -- ✅ 匹配firstName
    last_name VARCHAR(50) NOT NULL,          -- ✅ 匹配lastName
    phone VARCHAR(20),
    role user_role DEFAULT 'USER',           -- ✅ 枚举类型
    enabled BOOLEAN DEFAULT true,            -- ✅ 匹配Entity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- ✅ 审计字段
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 **立即修复步骤**

### **开发环境（推荐）**
1. 我已经修改了配置: `ddl-auto: create-drop`
2. 重启应用:
   ```bash
   cd /Users/gloriaupup/documents/laioffer/flagcamp/DeliveryAppBackend
   ./gradlew bootRun
   ```
3. Hibernate会自动创建正确的表结构

### **手动创建表**
```bash
psql -h localhost -U gloriaupup -d delivery_app -f create_tables_from_entities.sql
```

### **验证修复**
```sql
-- 检查表是否正确创建
\dt
-- 查看users表结构
\d users
-- 验证数据
SELECT * FROM users;
```

## 📝 **总结**

- ✅ **Entity正确** - 你的Java Entity定义是对的
- ❌ **SQL脚本过时** - `db_postgresql_exact.sql`不匹配Entity
- ✅ **已修复配置** - 改为`create-drop`模式
- ✅ **创建了正确的SQL脚本** - `create_tables_from_entities.sql`

现在重启应用，你就会看到正确的表结构了！