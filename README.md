# Chương trình Quay Thưởng Nội Bộ

**Ngày tạo:** 07/06/2025

## 1. Tổng Quan

Chương trình "Quay Thưởng Nội Bộ" là một ứng dụng web được thiết kế để tổ chức các sự kiện quay số trúng thưởng một cách công bằng và minh bạch. Ứng dụng cho phép quản trị viên cấu hình sự kiện, quản lý danh sách nhân viên, và theo dõi kết quả quay thưởng. Người dùng có thể xem giao diện quay thưởng trực quan và danh sách người trúng thưởng.

Ứng dụng được xây dựng bằng Node.js cho backend, EJS làm template engine, và sử dụng HTML, CSS, JavaScript cho frontend. Dữ liệu được lưu trữ trong cơ sở dữ liệu MySQL.

## 2. Cấu Trúc Thư Mục

```
quaythuong/
├── app.js                     # File chính của ứng dụng backend (Node.js/Express)
├── DEBUG_GUIDE.md             # Hướng dẫn debug (nếu có)
├── debug.sh                   # Script hỗ trợ debug
├── docker-compose.yaml        # Cấu hình Docker Compose để chạy ứng dụng và database
├── Dockerfile                 # Cấu hình Docker cho ứng dụng quaythuong
├── package.json               # Thông tin dự án và các dependencies (Node.js)
├── README.md                  # Tài liệu tổng quan về dự án (file này)
├── test-docker.sh             # Script kiểm thử Docker
├── mysql-init/                # Chứa các script khởi tạo cho MySQL (ví dụ: schema, data ban đầu)
│   └── ...
├── public/                    # Chứa các tài nguyên tĩnh phục vụ cho client
│   ├── css/                   # Các file CSS
│   │   ├── admin.css          # CSS cho trang quản trị
│   │   └── style.css          # CSS cho trang quay thưởng chính
│   ├── js/                    # Các file JavaScript phía client
│   │   ├── admin.js           # JavaScript cho trang quản trị
│   │   └── lottery.js         # JavaScript cho trang quay thưởng chính
│   └── uploads/               # Thư mục chứa các file được tải lên (ví dụ: logo, ảnh nền)
│       └── backgrounds/       # Chứa ảnh nền
├── temp/                      # Thư mục tạm thời (có thể dùng cho uploads hoặc các mục đích khác)
├── uploads/                   # Thư mục chứa các file tải lên (có thể là cấu hình khác của temp)
│   └── temp/
└── views/                     # Chứa các file template (EJS)
    ├── admin.ejs              # Template cho trang quản trị
    └── index.ejs              # Template cho trang quay thưởng chính

webproxy/ # (Thư mục này có thể liên quan hoặc là một dự án riêng biệt)
├── index.js
├── package.json
└── public/
    └── index.html
```

## 3. Thành Phần Chính

### 3.1. Backend (`quaythuong/app.js`)

*   **Ngôn ngữ/Framework:** Node.js, Express.js.
*   **Chức năng:**
    *   Xử lý các request HTTP từ client.
    *   Kết nối và tương tác với cơ sở dữ liệu MySQL.
    *   Cung cấp các API endpoints cho frontend.
    *   Render các trang EJS (`index.ejs`, `admin.ejs`).
    *   Xử lý việc tải lên file.
    *   Xác thực và quản lý phiên làm việc của quản trị viên.

### 3.2. Frontend (`quaythuong/public/` và `quaythuong/views/`)

*   **Công nghệ:** HTML, CSS, JavaScript, EJS.
*   **`quaythuong/views/index.ejs`:** Giao diện chính cho người dùng xem và tham gia quay thưởng.
*   **`quaythuong/views/admin.ejs`:** Giao diện cho quản trị viên cấu hình và quản lý.
*   **`quaythuong/public/js/lottery.js`:** Logic phía client cho trang quay thưởng.
*   **`quaythuong/public/js/admin.js`:** Logic phía client cho trang quản trị.
*   **`quaythuong/public/css/style.css` & `admin.css`:** Định dạng giao diện.

### 3.3. Cơ Sở Dữ Liệu (`quaythuong/mysql-init/`)

*   **Hệ quản trị CSDL:** MySQL.
*   **Chức năng:** Lưu trữ danh sách nhân viên, người trúng thưởng, cấu hình sự kiện.

### 3.4. Docker (`quaythuong/Dockerfile`, `quaythuong/docker-compose.yaml`)

*   **`Dockerfile`:** Định nghĩa image Docker cho ứng dụng `quaythuong`.
*   **`docker-compose.yaml`:** Định nghĩa các services để chạy ứng dụng (app và database).

## 4. Luồng Hoạt Động Chính

1.  **Quản trị viên:** Truy cập `/admin`, đăng nhập, cấu hình sự kiện, quản lý nhân viên.
2.  **Người dùng:** Truy cập `/`, nhấn "QUAY THƯỞNG".
3.  Frontend gọi `POST /api/spin`.
4.  Backend xử lý, chọn người trúng, lưu vào DB, trả kết quả.
5.  Frontend hiển thị người trúng, cập nhật danh sách/thống kê.

## 5. Hướng Dẫn Cài Đặt và Chạy

### Sử dụng Docker (Khuyến nghị)

1.  Đảm bảo Docker và Docker Compose đã được cài đặt.
2.  Clone repository.
3.  Chạy `docker-compose up -d` (hoặc `docker-compose up --build` cho lần đầu) từ thư mục `quaythuong`.
4.  Ứng dụng `quaythuong` sẽ có thể truy cập được qua một port nhất định (ví dụ: `http://localhost:3000`).

### Chạy thủ công (Development)

1.  Cài đặt Node.js và npm.
2.  Cài đặt MySQL server, tạo database và user.
3.  Chạy các script trong `mysql-init/` để khởi tạo schema.
4.  Trong thư mục `quaythuong`:
    *   `npm install`
    *   Cấu hình biến môi trường (database connection, port).
    *   `npm start` (hoặc `node app.js`)

## 6. Các API Endpoints Chính (Dự kiến)

*   **`GET /`**: Trang quay thưởng chính.
*   **`GET /admin`**: Trang quản trị.
*   **`POST /admin/login`**: Đăng nhập quản trị.
*   **`POST /admin/config`**: Lưu cấu hình.
*   **`GET /admin/config`**: Lấy cấu hình.
*   **`POST /admin/employees`**: Thêm nhân viên.
*   **`POST /admin/employees/import`**: Import danh sách nhân viên.
*   **`POST /api/spin`**: Thực hiện lượt quay.
*   **`GET /api/winners`**: Lấy danh sách người trúng.
*   **`POST /api/reset`**: Reset dữ liệu quay thưởng.

## 7. Các Điểm Cần Lưu Ý và Cải Thiện Tiềm Năng

*   **Bảo mật:** Input validation, quản lý session an toàn.
*   **Hiệu năng:** Tối ưu hóa truy vấn DB, caching.
*   **Real-time Update:** Cân nhắc WebSockets cho cập nhật danh sách người trúng.
*   **Xử lý lỗi:** Cải thiện xử lý lỗi ở cả frontend và backend.

## 8. Sử dụng Script Debug (`debug.sh`)

Script `debug.sh` cung cấp các lệnh tiện ích để quản lý và debug ứng dụng khi chạy với Docker. Đảm bảo bạn đã cấp quyền thực thi cho file này (`chmod +x debug.sh`).

**Cách sử dụng:**

```bash
./debug.sh [command]
```

**Các lệnh (commands) có sẵn:**

*   `status` hoặc `s`: Kiểm tra trạng thái của các Docker containers.
*   `logs` hoặc `l`: Xem logs của container ứng dụng (`app`) theo thời gian thực.
*   `logs-db`: Xem logs của container cơ sở dữ liệu (`mysql`) theo thời gian thực.
*   `logs-all`: Xem logs của tất cả các containers theo thời gian thực.
*   `rebuild` hoặc `r`: Dừng, rebuild lại image và khởi động lại tất cả các containers. Hữu ích khi có thay đổi code.
*   `restart`: Khởi động lại container ứng dụng (`app`).
*   `shell` hoặc `sh`: Truy cập vào shell (terminal) bên trong container ứng dụng (`app`).
*   `mysql` hoặc `db`: Truy cập vào MySQL client bên trong container cơ sở dữ liệu, kết nối tới database `quay_thuong`.
*   `backup`: Tạo một file backup (dump) cho cơ sở dữ liệu `quay_thuong`.
*   `clean`: Dọn dẹp các tài nguyên Docker không sử dụng (containers, networks, images).
*   `stop`: Dừng tất cả các containers đang chạy (tương đương `docker-compose down`).
*   `start`: Khởi động các containers đã được định nghĩa trong `docker-compose.yaml` (tương đương `docker-compose up -d`).
*   `test`: Kiểm tra kết nối tới ứng dụng trên `http://localhost:3000`.
*   `stats`: Hiển thị thống kê sử dụng tài nguyên của các containers (CPU, Memory).
*   `help` hoặc `h` (hoặc không có lệnh nào): Hiển thị thông tin hướng dẫn này.

**Ví dụ:**

```bash
# Rebuild và khởi động lại ứng dụng sau khi thay đổi code
./debug.sh rebuild

# Xem logs của ứng dụng
./debug.sh logs

# Truy cập vào MySQL
./debug.sh mysql
```

## 9. Chuẩn Bị File Excel Để Import Danh Sách Nhân Viên

Để sử dụng tính năng import danh sách nhân viên từ file Excel, bạn cần chuẩn bị file theo đúng định dạng sau:

*   File phải là định dạng `.xlsx` hoặc `.xls`.
*   Dữ liệu nhân viên phải nằm ở sheet đầu tiên của file Excel.
*   Dòng đầu tiên của sheet sẽ được coi là dòng tiêu đề và sẽ được bỏ qua khi import.
*   Dữ liệu nhân viên bắt đầu từ dòng thứ hai.
*   File Excel phải có đúng 3 cột với tiêu đề (hoặc thứ tự) như sau:
    1.  **Mã số nhân viên**: Mã định danh duy nhất cho mỗi nhân viên.
    2.  **Tên nhân viên**: Họ và tên đầy đủ của nhân viên.
    3.  **Phòng ban**: Tên phòng ban hoặc bộ phận mà nhân viên đó thuộc về.

**Ví dụ cấu trúc file Excel:**

| Mã số nhân viên | Tên nhân viên     | Phòng ban     |
|-----------------|-------------------|---------------|
| NV001           | Nguyễn Văn A      | Kỹ thuật      |
| NV002           | Trần Thị B        | Kinh doanh    |
| NV003           | Lê Văn C          | Nhân sự       |
| ...             | ...               | ...           |

Đảm bảo rằng không có các ô bị merge (trộn ô) trong vùng dữ liệu nhân viên. Dữ liệu ở các cột khác (nếu có) sẽ bị bỏ qua.