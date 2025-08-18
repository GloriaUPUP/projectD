#!/bin/bash

echo "🔧 修复数据库表问题..."

# 1. 杀死现有进程
echo "📝 1. 停止现有应用..."
pkill -f "gradle.*bootRun" 2>/dev/null || true
pkill -f "DeliveryAppBackendApplication" 2>/dev/null || true

# 2. 删除并重建数据库
echo "📝 2. 重建数据库..."
psql -h localhost -U gloriaupup -d postgres -c "DROP DATABASE IF EXISTS delivery_app;" 2>/dev/null || true
psql -h localhost -U gloriaupup -d postgres -c "CREATE DATABASE delivery_app;" 2>/dev/null || true

echo "📝 3. 当前数据库状态:"
psql -h localhost -U gloriaupup -d delivery_app -c "\dt" 2>/dev/null || echo "数据库为空 (正常)"

# 4. 启动应用 (带详细日志)
echo "📝 4. 启动应用..."
echo "⚠️  注意观察日志中的CREATE TABLE语句"
echo "⚠️  如果看到'create table users'说明Hibernate正在工作"
echo "⚠️  如果没看到，说明有其他问题"

cd /Users/gloriaupup/documents/laioffer/flagcamp/DeliveryAppBackend
./gradlew bootRun

echo "✅ 完成!"