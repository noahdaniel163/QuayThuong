# HƯỚNG DẪN DEBUG VÀ CẬP NHẬT SOURCE CODE TRÊN DOCKER

## 1. KIỂM TRA TRẠNG THÁI HỆ THỐNG

### Kiểm tra containers đang chạy:
```bash
cd /home/nodeapp/quaythuong
docker-compose ps
```

### Xem logs của ứng dụng:
```bash
# Xem logs real-time
docker-compose logs -f app

# Xem logs của database
docker-compose logs -f mysql

# Xem logs của tất cả services
docker-compose logs -f
```

## 2. KHI CÓ THAY ĐỔI SOURCE CODE

### Phương pháp 1: Rebuild và Restart (Khuyến nghị)
```bash
# Dừng containers
docker-compose down

# Rebuild image với source code mới
docker-compose build app

# Khởi động lại
docker-compose up -d

# Hoặc làm tất cả trong 1 lệnh
docker-compose up -d --build
```

### Phương pháp 2: Restart nhanh (chỉ khi thay đổi nhỏ)
```bash
# Restart chỉ container app
docker-compose restart app

# Xem logs để kiểm tra
docker-compose logs -f app
```

### Phương pháp 3: Hot reload với Volume (Development)
Thêm volume mapping vào docker-compose.yaml:
```yaml
services:
  app:
    # ...existing code...
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

## 3. DEBUG TRONG CONTAINER

### Truy cập vào container để debug:
```bash
# Truy cập bash trong container app
docker-compose exec app sh

# Kiểm tra file system
ls -la
cat package.json

# Kiểm tra process
ps aux

# Thoát container
exit
```

### Chạy lệnh trực tiếp trong container:
```bash
# Chạy npm commands
docker-compose exec app npm list
docker-compose exec app npm run test

# Kiểm tra kết nối database
docker-compose exec app node -e "console.log('Testing connection...')"
```

## 4. DEBUG DATABASE

### Truy cập MySQL:
```bash
# Kết nối MySQL từ container
docker-compose exec mysql mysql -u root -p

# Hoặc từ host (nếu có mysql client)
mysql -h localhost -P 3306 -u root -p
```

### Kiểm tra dữ liệu:
```sql
USE quay_thuong;
SHOW TABLES;
SELECT * FROM nhan_vien LIMIT 10;
DESCRIBE nhan_vien;
```

## 5. MONITORING VÀ TROUBLESHOOTING

### Kiểm tra resource usage:
```bash
# Xem resource usage của containers
docker stats

# Kiểm tra disk space
docker system df

# Dọn dẹp images cũ
docker system prune
```

### Debug network issues:
```bash
# Kiểm tra network
docker network ls
docker-compose exec app ping mysql

# Kiểm tra ports
netstat -tulpn | grep 3000
```

## 6. BACKUP VÀ RESTORE

### Backup database:
```bash
# Backup toàn bộ database
docker-compose exec mysql mysqldump -u root -p quay_thuong > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup chỉ structure
docker-compose exec mysql mysqldump -u root -p --no-data quay_thuong > structure.sql
```

### Restore database:
```bash
# Restore từ backup
docker-compose exec -T mysql mysql -u root -p quay_thuong < backup_file.sql
```

## 7. DEVELOPMENT WORKFLOW

### Quy trình phát triển khuyến nghị:
1. **Thay đổi code** trong thư mục local
2. **Test cục bộ** (nếu có môi trường local)
3. **Rebuild và deploy**: `docker-compose up -d --build`
4. **Kiểm tra logs**: `docker-compose logs -f app`
5. **Test chức năng** qua browser: http://localhost:3000
6. **Debug nếu cần**: truy cập container hoặc xem logs

### Quick commands:
```bash
# Alias hữu ích (thêm vào ~/.bashrc)
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dcbuild='docker-compose up -d --build'
alias dclogs='docker-compose logs -f'
alias dcexec='docker-compose exec app sh'

# Sử dụng
dcbuild  # Thay vì docker-compose up -d --build
dclogs   # Thay vì docker-compose logs -f
```

## 8. COMMON ISSUES & SOLUTIONS

### Port đã được sử dụng:
```bash
# Tìm process sử dụng port 3000
sudo lsof -i :3000
# Hoặc
sudo netstat -tulpn | grep 3000

# Kill process
sudo kill -9 <PID>
```

### Database connection failed:
```bash
# Kiểm tra MySQL container
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Reset database (WARNING: mất dữ liệu)
docker-compose down
docker volume rm quaythuong_mysql_data
docker-compose up -d
```

### Out of disk space:
```bash
# Dọn dẹp Docker
docker system prune -a
docker volume prune

# Xóa images cũ
docker image prune
```

## 9. PRODUCTION DEPLOYMENT

### Cho production, thêm vào docker-compose.yaml:
```yaml
services:
  app:
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    # ...existing code...
  
  mysql:
    restart: unless-stopped
    # ...existing code...
```

### Health checks:
```bash
# Kiểm tra health
curl http://localhost:3000
curl http://localhost:3000/admin

# Automated health check script
#!/bin/bash
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "App is healthy"
else
    echo "App is down, restarting..."
    docker-compose restart app
fi
```

## 10. TIPS & BEST PRACTICES

1. **Luôn xem logs** sau khi thay đổi code
2. **Backup database** trước khi update lớn
3. **Test trên staging** trước khi deploy production
4. **Sử dụng .dockerignore** để tránh copy file không cần thiết
5. **Monitor resource usage** định kỳ
6. **Dọn dẹp Docker** thường xuyên để tiết kiệm disk space

---

**LƯU Ý QUAN TRỌNG:**
- Mỗi lần thay đổi source code cần rebuild container
- Database data được lưu trong Docker volume, không mất khi restart
- Logs có thể rất dài, sử dụng `tail` hoặc `head` để xem phần cần thiết
- Trong môi trường production, cân nhắc sử dụng orchestration tools như Kubernetes