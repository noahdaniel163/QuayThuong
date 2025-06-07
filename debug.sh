#!/bin/bash

# Script tiện ích cho debug và quản lý Docker containers
# Sử dụng: ./debug.sh [command]

PROJECT_DIR="/home/nodeapp/quaythuong"
cd $PROJECT_DIR

case "$1" in
    "status"|"s")
        echo "🔍 Kiểm tra trạng thái containers..."
        docker-compose ps
        ;;
    
    "logs"|"l")
        echo "📋 Xem logs ứng dụng (Ctrl+C để thoát)..."
        docker-compose logs -f app
        ;;
    
    "logs-db")
        echo "📋 Xem logs database (Ctrl+C để thoát)..."
        docker-compose logs -f mysql
        ;;
    
    "logs-all")
        echo "📋 Xem tất cả logs (Ctrl+C để thoát)..."
        docker-compose logs -f
        ;;
    
    "rebuild"|"r")
        echo "🔨 Rebuild và restart ứng dụng..."
        docker-compose down
        docker-compose up -d --build
        echo "✅ Hoàn thành! Kiểm tra logs:"
        docker-compose logs -f app
        ;;
    
    "restart")
        echo "🔄 Restart ứng dụng..."
        docker-compose restart app
        echo "✅ Hoàn thành! Kiểm tra logs:"
        docker-compose logs -f app
        ;;
    
    "shell"|"sh")
        echo "🐚 Truy cập shell container app..."
        docker-compose exec app sh
        ;;
    
    "mysql"|"db")
        echo "🗄️ Truy cập MySQL..."
        docker-compose exec mysql mysql -u root -ppassword quay_thuong
        ;;
    
    "backup")
        echo "💾 Backup database..."
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose exec mysql mysqldump -u root -ppassword quay_thuong > $BACKUP_FILE
        echo "✅ Backup tạo thành công: $BACKUP_FILE"
        ;;
    
    "clean")
        echo "🧹 Dọn dẹp Docker..."
        docker system prune -f
        echo "✅ Dọn dẹp hoàn thành!"
        ;;
    
    "stop")
        echo "⏹️ Dừng tất cả containers..."
        docker-compose down
        echo "✅ Đã dừng tất cả containers!"
        ;;
    
    "start")
        echo "▶️ Khởi động containers..."
        docker-compose up -d
        echo "✅ Containers đã khởi động!"
        ;;
    
    "test")
        echo "🧪 Test kết nối ứng dụng..."
        echo "Kiểm tra port 3000..."
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Ứng dụng đang chạy tốt!"
        else
            echo "❌ Ứng dụng không phản hồi!"
        fi
        ;;
    
    "stats")
        echo "📊 Thống kê resource usage..."
        docker stats --no-stream
        ;;
    
    "help"|"h"|"")
        echo "🚀 Script Debug cho Quay Thưởng App"
        echo ""
        echo "Cách sử dụng: ./debug.sh [command]"
        echo ""
        echo "Commands có sẵn:"
        echo "  status, s      - Kiểm tra trạng thái containers"
        echo "  logs, l        - Xem logs ứng dụng"
        echo "  logs-db        - Xem logs database"
        echo "  logs-all       - Xem tất cả logs"
        echo "  rebuild, r     - Rebuild và restart ứng dụng"
        echo "  restart        - Restart ứng dụng"
        echo "  shell, sh      - Truy cập shell container"
        echo "  mysql, db      - Truy cập MySQL"
        echo "  backup         - Backup database"
        echo "  clean          - Dọn dẹp Docker"
        echo "  stop           - Dừng containers"
        echo "  start          - Khởi động containers"
        echo "  test           - Test kết nối ứng dụng"
        echo "  stats          - Xem resource usage"
        echo "  help, h        - Hiển thị help này"
        echo ""
        echo "Ví dụ:"
        echo "  ./debug.sh rebuild    # Rebuild khi có thay đổi code"
        echo "  ./debug.sh logs       # Xem logs real-time"
        echo "  ./debug.sh test       # Kiểm tra app có chạy không"
        ;;
    
    *)
        echo "❌ Command không hợp lệ: $1"
        echo "Sử dụng './debug.sh help' để xem danh sách commands"
        exit 1
        ;;
esac