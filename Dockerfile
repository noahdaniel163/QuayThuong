# Sử dụng Node.js base image
FROM node:18-alpine

# Cài đặt các dependencies cần thiết cho sharp và su-exec
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    python3 \
    make \
    g++ \
    su-exec

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies với cấu hình tối ưu cho sharp
RUN npm ci --production --no-audit

# Copy source code
COPY . .

# Tạo user non-root để chạy ứng dụng với UID/GID cố định
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Tạo thư mục cần thiết và set ownership
RUN mkdir -p uploads temp uploads/backgrounds public/uploads/backgrounds uploads/temp && \
    chown -R nodeuser:nodejs /app && \
    chmod -R 755 uploads temp public/uploads

# Tạo script để fix permissions khi container start
RUN echo '#!/bin/sh' > /app/fix-permissions.sh && \
    echo 'chown -R nodeuser:nodejs /app/uploads /app/temp /app/public/uploads 2>/dev/null || true' >> /app/fix-permissions.sh && \
    echo 'chmod -R 755 /app/uploads /app/temp /app/public/uploads 2>/dev/null || true' >> /app/fix-permissions.sh && \
    chmod +x /app/fix-permissions.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, timeout: 2000 }; const request = http.request(options, (res) => { console.log('STATUS: ' + res.statusCode); process.exitCode = (res.statusCode == 200) ? 0 : 1; process.exit(); }); request.on('error', function(err) { console.log('ERROR'); process.exit(1); }); request.end();"

# Lệnh chạy ứng dụng với fix permissions
CMD ["/bin/sh", "-c", "/app/fix-permissions.sh && su-exec nodeuser npm start"]