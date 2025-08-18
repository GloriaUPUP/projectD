# IntelliJ IDEA 运行问题解决方案

## 问题描述
IntelliJ IDEA 直接运行 Java 主类时报错 `NoClassDefFoundError: org/springframework/boot/SpringApplication`，但使用 `./gradlew bootRun` 可以正常运行。

## 问题原因
IDEA 没有正确识别项目为 Gradle 项目，导致运行时缺少依赖的 JAR 包。

## 解决方案

### 方法 1: 重新导入 Gradle 项目（推荐）
1. 在 IntelliJ IDEA 中关闭当前项目
2. 选择 "Open" 而不是 "Import"
3. 选择项目根目录 `/Users/gloriaupup/documents/laioffer/flagcampwen/deliveryappbackend`
4. 选择 `build.gradle` 文件
5. 选择 "Open as Project"
6. 等待 IDEA 自动导入 Gradle 依赖

### 方法 2: 刷新 Gradle 依赖
1. 打开 IDEA 右侧的 Gradle 工具窗口
2. 点击刷新按钮（🔄）
3. 或者执行：View -> Tool Windows -> Gradle
4. 右键项目名称，选择 "Reload Gradle Project"

### 方法 3: 配置正确的运行配置
1. 点击 Run -> Edit Configurations
2. 点击 + 号，选择 "Spring Boot"
3. 配置如下：
   - Name: DeliveryAppBackend
   - Main class: com.flagcamp.delivery.DeliveryAppBackendApplication
   - Use classpath of module: DeliveryAppBackend.main
   - JDK: temurin-21
4. 点击 Apply 和 OK

### 方法 4: 使用 Gradle 运行配置
1. 点击 Run -> Edit Configurations
2. 点击 + 号，选择 "Gradle"
3. 配置如下：
   - Name: bootRun
   - Gradle project: DeliveryAppBackend
   - Tasks: bootRun
4. 点击 Apply 和 OK

### 方法 5: 清理并重建项目
在 IDEA 终端中执行：
```bash
./gradlew clean build
```

然后在 IDEA 中：
1. File -> Invalidate Caches and Restart
2. 选择 "Invalidate and Restart"

## 验证方法
1. 在 Project Structure (Cmd+;) 中检查：
   - Project SDK 应该是 temurin-21
   - Modules 中应该有 DeliveryAppBackend.main 和 DeliveryAppBackend.test
   - Dependencies 中应该包含所有 Spring Boot 依赖

2. 检查 Gradle 设置：
   - Preferences -> Build, Execution, Deployment -> Build Tools -> Gradle
   - Gradle JVM 应该选择 temurin-21
   - Build and run using: Gradle
   - Run tests using: Gradle

## 临时解决方案
如果以上方法都不行，可以继续使用命令行运行：
```bash
./gradlew bootRun
```

或使用 IDEA 终端运行：
```bash
./run-idea.sh
```