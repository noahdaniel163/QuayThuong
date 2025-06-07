const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'quay_thuong'
};

// Cấu hình Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cấu hình multer cho upload file
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Kiểm tra MIME type và extension
        const allowedMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                             'application/vnd.ms-excel'];
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});

// Cấu hình multer riêng cho upload ảnh nền
const backgroundUpload = multer({
    dest: 'uploads/temp/',
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận file ảnh
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
    }
});

// Kết nối database và tạo bảng
async function initDatabase() {
    try {
        // Kết nối không chỉ định database trước
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        
        // Tạo database nếu chưa có
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.end();
        
        // Kết nối lại với database đã tạo
        const dbConnection = await mysql.createConnection(dbConfig);
        
        // Tạo bảng nhân viên
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS nhan_vien (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ma_so_nhan_vien VARCHAR(50) UNIQUE NOT NULL,
                ten_nhan_vien VARCHAR(255) NOT NULL,
                phong_ban VARCHAR(255) NOT NULL,
                da_trung BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Tạo bảng cấu hình sự kiện
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS event_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Tạo dữ liệu mặc định cho cấu hình
        await dbConnection.execute(`
            INSERT IGNORE INTO event_config (config_key, config_value) VALUES
            ('event_title', 'QUAY THƯỞNG NỘI BỘ'),
            ('event_subtitle', 'Chúc mừng những người may mắn!'),
            ('primary_color', '#4CAF50'),
            ('secondary_color', '#FFC107'),
            ('background_color', '#1a1a1a'),
            ('text_color', '#ffffff'),
            ('logo_url', ''),
            ('background_image', ''),
            ('show_winner_list', 'true'),
            ('animation_speed', 'normal'),
            ('sound_enabled', 'true')
        `);
        
        await dbConnection.end();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Trang chủ - Giao diện quay thưởng
app.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [totalEmployees] = await connection.execute('SELECT COUNT(*) as total FROM nhan_vien');
        const [wonEmployees] = await connection.execute('SELECT COUNT(*) as won FROM nhan_vien WHERE da_trung = TRUE');
        const [winners] = await connection.execute('SELECT * FROM nhan_vien WHERE da_trung = TRUE ORDER BY updated_at DESC');
        const [eventConfig] = await connection.execute('SELECT * FROM event_config');
        
        // Chuyển đổi config thành object
        const config = {};
        eventConfig.forEach(item => {
            config[item.config_key] = item.config_value;
        });
        
        await connection.end();
        
        res.render('index', {
            totalEmployees: totalEmployees[0].total,
            wonEmployees: wonEmployees[0].won,
            remainingEmployees: totalEmployees[0].total - wonEmployees[0].won,
            winners: winners,
            config: config
        });
    } catch (error) {
        console.error('Error:', error);
        res.render('index', { 
            totalEmployees: 0, 
            wonEmployees: 0, 
            remainingEmployees: 0,
            winners: [],
            config: {}
        });
    }
});

// Trang quản trị
app.get('/admin', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [employees] = await connection.execute('SELECT * FROM nhan_vien ORDER BY ma_so_nhan_vien');
        const [eventConfig] = await connection.execute('SELECT * FROM event_config');
        
        // Chuyển đổi config thành object
        const config = {};
        eventConfig.forEach(item => {
            config[item.config_key] = item.config_value;
        });
        
        await connection.end();
        
        res.render('admin', { employees, config });
    } catch (error) {
        console.error('Error:', error);
        res.render('admin', { employees: [], config: {} });
    }
});

// API cập nhật cấu hình sự kiện
app.post('/admin/config', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Cập nhật từng cấu hình
        for (const [key, value] of Object.entries(req.body)) {
            await connection.execute(
                'INSERT INTO event_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
                [key, value]
            );
        }
        
        await connection.end();
        res.redirect('/admin?success=config');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin?error=config');
    }
});

// API quay thưởng
app.post('/api/spin', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Lấy danh sách nhân viên chưa trúng
        const [availableEmployees] = await connection.execute(
            'SELECT * FROM nhan_vien WHERE da_trung = FALSE'
        );
        
        if (availableEmployees.length === 0) {
            await connection.end();
            return res.json({ success: false, message: 'Không còn nhân viên nào để quay thưởng!' });
        }
        
        // Chọn ngẫu nhiên một nhân viên
        const randomIndex = Math.floor(Math.random() * availableEmployees.length);
        const winner = availableEmployees[randomIndex];
        
        // Cập nhật trạng thái đã trúng
        await connection.execute(
            'UPDATE nhan_vien SET da_trung = TRUE WHERE id = ?',
            [winner.id]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            winner: {
                ma_so_nhan_vien: winner.ma_so_nhan_vien,
                ten_nhan_vien: winner.ten_nhan_vien,
                phong_ban: winner.phong_ban
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Có lỗi xảy ra khi quay thưởng!' });
    }
});

// Upload file Excel
app.post('/admin/upload', upload.single('excelFile'), async (req, res) => {
    try {
        // Kiểm tra file có tồn tại không
        if (!req.file) {
            return res.redirect('/admin?error=upload&message=' + encodeURIComponent('Không có file nào được chọn'));
        }

        // Kiểm tra file có tồn tại trên disk không
        if (!fs.existsSync(req.file.path)) {
            return res.redirect('/admin?error=upload&message=' + encodeURIComponent('File upload không tồn tại'));
        }

        let workbook, data;
        
        try {
            workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            
            if (!sheetName) {
                throw new Error('File Excel không có sheet nào');
            }
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Kiểm tra sheet có dữ liệu không
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
            if (range.e.r < 1) { // Ít nhất 2 dòng (header + 1 dòng dữ liệu)
                throw new Error('File Excel không có dữ liệu hoặc chỉ có header');
            }
            
            data = XLSX.utils.sheet_to_json(worksheet, { 
                defval: '',
                raw: false, // Đảm bảo tất cả giá trị được convert thành string
                dateNF: 'yyyy-mm-dd' // Format ngày tháng nếu có
            });
            
            // Kiểm tra file có dữ liệu không
            if (!data || data.length === 0) {
                throw new Error('File Excel không có dữ liệu sau header');
            }
            
            // Giới hạn số lượng dòng để tránh quá tải server
            if (data.length > 10000) {
                throw new Error('File Excel quá lớn. Tối đa 10,000 dòng dữ liệu.');
            }
            
        } catch (xlsxError) {
            // Xóa file tạm
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            throw new Error('Lỗi đọc file Excel: ' + xlsxError.message);
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        let successCount = 0;
        let errorCount = 0;
        let updateCount = 0;
        const errors = [];
        
        // Kiểm tra headers có đúng không - linh hoạt hơn
        const sampleRow = data[0];
        const allKeys = Object.keys(sampleRow);
        
        // Tìm các cột cần thiết với nhiều tên khác nhau
        const findColumn = (possibleNames) => {
            for (const name of possibleNames) {
                const found = allKeys.find(key => 
                    key.toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes(key.toLowerCase())
                );
                if (found) return found;
            }
            return null;
        };
        
        const maSoColumn = findColumn(['mã số', 'ma so', 'msnv', 'id', 'employee id', 'emp id']);
        const tenNVColumn = findColumn(['tên', 'ten', 'họ tên', 'ho ten', 'name', 'full name']);
        const phongBanColumn = findColumn(['phòng ban', 'phong ban', 'department', 'dept', 'bộ phận', 'bo phan']);
        
        if (!maSoColumn || !tenNVColumn || !phongBanColumn) {
            errors.push(`Không tìm thấy đủ cột bắt buộc. Cần có: Mã số nhân viên, Tên nhân viên, Phòng ban`);
            errors.push(`Các cột hiện có: ${allKeys.join(', ')}`);
        }
        
        if (errors.length === 0) {
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 2; // +2 vì bắt đầu từ dòng 2 (dòng 1 là header)
                
                // Lấy dữ liệu từ các cột đã xác định
                let maSo = row[maSoColumn] || '';
                let tenNV = row[tenNVColumn] || '';
                let phongBan = row[phongBanColumn] || '';
                
                // Chuẩn hóa dữ liệu - xử lý cả số và chuỗi
                maSo = String(maSo).trim().replace(/\s+/g, ' ');
                tenNV = String(tenNV).trim().replace(/\s+/g, ' ');
                phongBan = String(phongBan).trim().replace(/\s+/g, ' ');
                
                // Skip dòng trống hoàn toàn
                if (!maSo && !tenNV && !phongBan) {
                    continue;
                }
                
                // Validation
                let rowErrors = [];
                
                // Kiểm tra trường bắt buộc
                if (!maSo || maSo === '' || maSo === 'undefined' || maSo === 'null') {
                    rowErrors.push('Mã số nhân viên không được để trống');
                }
                if (!tenNV || tenNV === '' || tenNV === 'undefined' || tenNV === 'null') {
                    rowErrors.push('Tên nhân viên không được để trống');
                }
                if (!phongBan || phongBan === '' || phongBan === 'undefined' || phongBan === 'null') {
                    rowErrors.push('Phòng ban không được để trống');
                }
                
                // Kiểm tra độ dài
                if (maSo && maSo.length > 50) rowErrors.push('Mã số nhân viên không được vượt quá 50 ký tự');
                if (tenNV && tenNV.length > 255) rowErrors.push('Tên nhân viên không được vượt quá 255 ký tự');
                if (phongBan && phongBan.length > 255) rowErrors.push('Phòng ban không được vượt quá 255 ký tự');
                
                // Kiểm tra định dạng mã số nhân viên - cho phép nhiều format hơn
                if (maSo && !/^[a-zA-Z0-9_.\-\/\s]+$/u.test(maSo)) {
                    rowErrors.push('Mã số nhân viên chứa ký tự không hợp lệ');
                }
                
                // Kiểm tra tên nhân viên - hỗ trợ đầy đủ Unicode Vietnamese
                if (tenNV && !/^[\p{L}\p{M}\s\.,'\-()]+$/u.test(tenNV)) {
                    rowErrors.push('Tên nhân viên chứa ký tự không hợp lệ');
                }
                
                // Kiểm tra độ dài tối thiểu
                if (maSo && maSo.length < 1) rowErrors.push('Mã số nhân viên quá ngắn');
                if (tenNV && tenNV.length < 2) rowErrors.push('Tên nhân viên quá ngắn');
                if (phongBan && phongBan.length < 1) rowErrors.push('Phòng ban quá ngắn');
                
                if (rowErrors.length > 0) {
                    errors.push(`Dòng ${rowNumber}: ${rowErrors.join(', ')}`);
                    errorCount++;
                    continue;
                }
                
                try {
                    // Kiểm tra xem nhân viên đã tồn tại chưa
                    const [existing] = await connection.execute(
                        'SELECT id, ten_nhan_vien, phong_ban FROM nhan_vien WHERE ma_so_nhan_vien = ?',
                        [maSo]
                    );
                    
                    if (existing.length > 0) {
                        // Cập nhật thông tin nếu có thay đổi
                        const existingEmployee = existing[0];
                        if (existingEmployee.ten_nhan_vien !== tenNV || existingEmployee.phong_ban !== phongBan) {
                            await connection.execute(
                                'UPDATE nhan_vien SET ten_nhan_vien = ?, phong_ban = ?, updated_at = CURRENT_TIMESTAMP WHERE ma_so_nhan_vien = ?',
                                [tenNV, phongBan, maSo]
                            );
                            updateCount++;
                        }
                        // Nếu không có thay đổi thì bỏ qua (không tính vào successCount)
                    } else {
                        // Thêm mới
                        await connection.execute(
                            'INSERT INTO nhan_vien (ma_so_nhan_vien, ten_nhan_vien, phong_ban) VALUES (?, ?, ?)',
                            [maSo, tenNV, phongBan]
                        );
                        successCount++;
                    }
                } catch (dbError) {
                    console.error('Database error at row', rowNumber, ':', dbError);
                    if (dbError.code === 'ER_DUP_ENTRY') {
                        errors.push(`Dòng ${rowNumber}: Mã số nhân viên "${maSo}" bị trùng lặp`);
                    } else if (dbError.code === 'ER_DATA_TOO_LONG') {
                        errors.push(`Dòng ${rowNumber}: Dữ liệu quá dài cho một trong các trường`);
                    } else {
                        errors.push(`Dòng ${rowNumber}: Lỗi database - ${dbError.sqlMessage || dbError.message}`);
                    }
                    errorCount++;
                }
            }
        }
        
        await connection.end();
        
        // Xóa file tạm
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        // Tạo thông báo kết quả chi tiết
        let message = `Đã xử lý ${data.length} dòng dữ liệu từ file Excel.\n`;
        message += `✅ Thêm mới: ${successCount} nhân viên\n`;
        message += `🔄 Cập nhật: ${updateCount} nhân viên\n`;
        message += `❌ Lỗi: ${errorCount} dòng`;
        
        if (errors.length > 0) {
            message += '\n\n📋 Chi tiết lỗi:\n' + errors.slice(0, 10).join('\n'); // Hiển thị tối đa 10 lỗi
            if (errors.length > 10) {
                message += `\n... và ${errors.length - 10} lỗi khác nữa`;
            }
        }
        
        if (errorCount > 0) {
            res.redirect(`/admin?error=upload&message=${encodeURIComponent(message)}`);
        } else {
            res.redirect(`/admin?success=upload&message=${encodeURIComponent(message)}`);
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Xóa file tạm nếu có lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        let errorMessage = 'Có lỗi xảy ra khi xử lý file Excel.';
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            errorMessage = 'File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.';
        } else if (error.message.includes('File Excel') || error.message.includes('Lỗi đọc file Excel')) {
            errorMessage = error.message;
        } else if (error.message.includes('Chỉ chấp nhận file Excel')) {
            errorMessage = error.message;
        } else {
            errorMessage += ' Chi tiết: ' + error.message;
        }
        
        res.redirect('/admin?error=upload&message=' + encodeURIComponent(errorMessage));
    }
});

// Thêm/sửa nhân viên
app.post('/admin/employee', async (req, res) => {
    try {
        const { id, ma_so_nhan_vien, ten_nhan_vien, phong_ban } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        
        if (id) {
            // Cập nhật
            await connection.execute(
                'UPDATE nhan_vien SET ma_so_nhan_vien = ?, ten_nhan_vien = ?, phong_ban = ? WHERE id = ?',
                [ma_so_nhan_vien, ten_nhan_vien, phong_ban, id]
            );
        } else {
            // Thêm mới
            await connection.execute(
                'INSERT INTO nhan_vien (ma_so_nhan_vien, ten_nhan_vien, phong_ban) VALUES (?, ?, ?)',
                [ma_so_nhan_vien, ten_nhan_vien, phong_ban]
            );
        }
        
        await connection.end();
        res.redirect('/admin?success=save');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin?error=save');
    }
});

// Xóa nhân viên
app.post('/admin/employee/delete', async (req, res) => {
    try {
        const { id } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM nhan_vien WHERE id = ?', [id]);
        await connection.end();
        res.redirect('/admin?success=delete');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin?error=delete');
    }
});

// Reset trạng thái quay thưởng
app.post('/admin/reset', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE nhan_vien SET da_trung = FALSE');
        await connection.end();
        res.redirect('/admin?success=reset');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin?error=reset');
    }
});

// Xuất danh sách trúng thưởng
app.get('/admin/export', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [winners] = await connection.execute(
            'SELECT ma_so_nhan_vien, ten_nhan_vien, phong_ban FROM nhan_vien WHERE da_trung = TRUE ORDER BY ma_so_nhan_vien'
        );
        await connection.end();
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(winners.map(winner => ({
            'Mã số nhân viên': winner.ma_so_nhan_vien,
            'Tên nhân viên': winner.ten_nhan_vien,
            'Phòng ban': winner.phong_ban
        })));
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách trúng thưởng');
        
        const filename = `danh-sach-trung-thuong-${new Date().toISOString().split('T')[0]}.xlsx`;
        const filepath = path.join(__dirname, 'temp', filename);
        
        // Tạo thư mục temp nếu chưa có
        require('fs').mkdirSync(require('path').dirname(filepath), { recursive: true });
        
        XLSX.writeFile(workbook, filepath);
        
        res.download(filepath, filename, (err) => {
            if (!err) {
                require('fs').unlinkSync(filepath);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin?error=export');
    }
});

// API lấy danh sách người đã trúng (real-time)
app.get('/api/winners', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [winners] = await connection.execute('SELECT * FROM nhan_vien WHERE da_trung = TRUE ORDER BY updated_at DESC');
        await connection.end();
        
        res.json({ success: true, winners });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, winners: [] });
    }
});

// Upload ảnh nền với auto-resize về kích thước chuẩn 16:9 (1920x1080)
app.post('/admin/upload-background', backgroundUpload.single('backgroundImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.redirect('/admin?error=no-file');
        }

        const { path: tempPath, originalname } = req.file;
        const fileExtension = path.extname(originalname).toLowerCase();
        const newFilename = `background-${Date.now()}${fileExtension}`;
        const targetPath = path.join(__dirname, 'public', 'uploads', 'backgrounds', newFilename);
        
        // Đảm bảo thư mục tồn tại
        const backgroundDir = path.join(__dirname, 'public', 'uploads', 'backgrounds');
        if (!fs.existsSync(backgroundDir)) {
            fs.mkdirSync(backgroundDir, { recursive: true });
        }

        // Lấy thông tin ảnh gốc
        const metadata = await sharp(tempPath).metadata();
        console.log(`Original image: ${metadata.width}x${metadata.height}`);

        // Resize ảnh về kích thước chuẩn 16:9 (1920x1080) với chất lượng cao
        await sharp(tempPath)
            .resize(1920, 1080, { 
                fit: 'cover', // Cắt ảnh để phù hợp tỷ lệ 16:9
                position: 'center' // Cắt từ giữa ảnh
            })
            .jpeg({ 
                quality: 85, // Chất lượng cao
                progressive: true 
            })
            .toFile(targetPath);
        
        // Xóa file tạm
        fs.unlinkSync(tempPath);
        
        // Xóa ảnh nền cũ nếu có
        const connection = await mysql.createConnection(dbConfig);
        const [oldConfig] = await connection.execute('SELECT config_value FROM event_config WHERE config_key = ?', ['background_image']);
        
        if (oldConfig.length > 0 && oldConfig[0].config_value) {
            const oldImagePath = path.join(__dirname, 'public', oldConfig[0].config_value);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        // Cập nhật đường dẫn ảnh nền mới trong cấu hình
        await connection.execute(
            'INSERT INTO event_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
            ['background_image', `/uploads/backgrounds/${newFilename}`]
        );
        await connection.end();
        
        res.redirect('/admin?success=upload-background');
    } catch (error) {
        console.error('Error uploading background:', error);
        // Xóa file tạm nếu có lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.redirect('/admin?error=upload-background');
    }
});

// Xóa ảnh nền hiện tại
app.post('/admin/remove-background', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [config] = await connection.execute('SELECT config_value FROM event_config WHERE config_key = ?', ['background_image']);
        
        if (config.length > 0 && config[0].config_value) {
            const imagePath = path.join(__dirname, 'public', config[0].config_value);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Reset ảnh nền về rỗng
        await connection.execute(
            'INSERT INTO event_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
            ['background_image', '']
        );
        await connection.end();
        
        res.redirect('/admin?success=remove-background');
    } catch (error) {
        console.error('Error removing background:', error);
        res.redirect('/admin?error=remove-background');
    }
});

// API xóa toàn bộ danh sách nhân viên
app.post('/admin/clear-employees', async (req, res) => {
    try {
        const { confirm } = req.body;
        
        if (confirm !== 'DELETE_ALL_EMPLOYEES') {
            return res.redirect('/admin?error=invalid-confirm');
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Xóa toàn bộ dữ liệu trong bảng nhân viên
        await connection.execute('DELETE FROM nhan_vien');
        
        // Reset AUTO_INCREMENT về 1
        await connection.execute('ALTER TABLE nhan_vien AUTO_INCREMENT = 1');
        
        await connection.end();
        
        res.redirect('/admin?success=clear-employees');
    } catch (error) {
        console.error('Error clearing employees:', error);
        res.redirect('/admin?error=clear-employees');
    }
});

// API lấy thống kê tổng quan
app.get('/api/stats', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [totalEmployees] = await connection.execute('SELECT COUNT(*) as total FROM nhan_vien');
        const [wonEmployees] = await connection.execute('SELECT COUNT(*) as won FROM nhan_vien WHERE da_trung = TRUE');
        const [departmentStats] = await connection.execute(`
            SELECT phong_ban, 
                   COUNT(*) as total,
                   SUM(CASE WHEN da_trung = TRUE THEN 1 ELSE 0 END) as won
            FROM nhan_vien 
            GROUP BY phong_ban 
            ORDER BY total DESC
        `);
        
        await connection.end();
        
        res.json({
            success: true,
            stats: {
                total: totalEmployees[0].total,
                won: wonEmployees[0].won,
                remaining: totalEmployees[0].total - wonEmployees[0].won,
                departments: departmentStats
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.json({ success: false, stats: null });
    }
});

// Khởi tạo server
app.listen(PORT, async () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    await initDatabase();
});

module.exports = app;