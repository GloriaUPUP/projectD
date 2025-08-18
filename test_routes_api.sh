#!/bin/bash

echo "🚀 开始测试Google Maps路径API..."

# 检查服务是否运行
echo "📝 1. 检查后端服务状态..."
if curl -s -f "http://localhost:8086/api/support/faq" > /dev/null; then
    echo "✅ 后端服务正在运行"
else
    echo "❌ 后端服务未运行，请先启动: ./gradlew bootRun"
    exit 1
fi

echo ""
echo "📝 2. 测试路径计算API..."

# 测试路径计算
echo "测试: Google to Facebook..."
ROUTE_RESPONSE=$(curl -s "http://localhost:8086/api/routes/calculate?origin=1600+Amphitheatre+Parkway,+Mountain+View,+CA&destination=1+Hacker+Way,+Menlo+Park,+CA")

if echo "$ROUTE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 路径计算成功"
    echo "📊 响应预览:"
    echo "$ROUTE_RESPONSE" | head -c 200
    echo "..."
else
    echo "❌ 路径计算失败"
    echo "错误响应: $ROUTE_RESPONSE"
fi

echo ""
echo "📝 3. 测试地理编码API..."

# 测试地理编码
GEOCODE_RESPONSE=$(curl -s "http://localhost:8086/api/routes/geocode?address=San+Francisco,+CA")

if echo "$GEOCODE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 地理编码成功"
else
    echo "❌ 地理编码失败"
    echo "错误响应: $GEOCODE_RESPONSE"
fi

echo ""
echo "📝 4. 测试服务区域验证API..."

# 测试服务区域验证
VALIDATE_RESPONSE=$(curl -s "http://localhost:8086/api/routes/validate?address=San+Francisco,+CA")

if echo "$VALIDATE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 服务区域验证成功"
else
    echo "❌ 服务区域验证失败"
    echo "错误响应: $VALIDATE_RESPONSE"
fi

echo ""
echo "🎉 API测试完成!"
echo ""
echo "💡 如果有失败，请检查:"
echo "   1. Google Maps API Key是否有效"
echo "   2. 是否启用了Directions API和Geocoding API"
echo "   3. 后端服务是否正常运行"