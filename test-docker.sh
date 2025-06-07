#!/bin/bash

echo "🔧 Kiểm tra Docker và Docker Compose..."
docker --version
docker-compose --version

echo "🧹 Dọn dẹp containers cũ..."
docker-compose down -v

echo "🏗️ Build lại Docker image..."
docker-compose build --no-cache

echo "🚀 Khởi động services..."
docker-compose up -d

echo "⏳ Đợi services khởi động..."
sleep 45

echo "🔍 Kiểm tra trạng thái containers..."
docker-compose ps

echo "📊 Kiểm tra logs của app container..."
docker-compose logs app | tail -20

echo "🌐 Kiểm tra kết nối..."
curl -I http://localhost:3000 2>/dev/null | head -1

echo "✅ Hoàn tất! Ứng dụng đang chạy tại http://localhost:3000"
echo "📋 Để xem logs realtime: docker-compose logs -f app"
echo "🛑 Để dừng: docker-compose down"