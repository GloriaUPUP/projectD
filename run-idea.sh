#!/bin/bash

# 设置Java环境
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# 设置Spring Profile
export SPRING_PROFILES_ACTIVE=dev

# 检查数据库连接
echo "检查数据库连接..."
psql -h localhost -U gloriaupup -d delivery_app -c "SELECT 1;" || {
    echo "数据库连接失败！请确保PostgreSQL正在运行且数据库已创建。"
    exit 1
}

echo "数据库连接成功！"
echo "Java版本: $(java -version 2>&1 | head -n 1)"
echo "启动Spring Boot应用..."

# 使用Gradle运行
./gradlew bootRun --args='--spring.profiles.active=dev'