// Admin page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality cho config
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Remove active từ tất cả tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');
            
            // Add active cho tab được chọn
            btn.classList.add('active');
            document.getElementById(targetTab).style.display = 'block';
        });
    });

    // Color picker functionality
    const colorInputGroups = document.querySelectorAll('.color-input-group');
    colorInputGroups.forEach(group => {
        const colorInput = group.querySelector('input[type="color"]');
        const textInput = group.querySelector('.color-text');
        
        colorInput.addEventListener('change', () => {
            textInput.value = colorInput.value.toUpperCase();
            updatePreview();
        });
        
        textInput.addEventListener('input', () => {
            if (isValidHexColor(textInput.value)) {
                colorInput.value = textInput.value;
                updatePreview();
            }
        });
    });

    // Enhanced file input handling with validation
    const fileInput = document.getElementById('excelFile');
    const fileLabel = document.querySelector('.file-input-label');
    const uploadForm = document.querySelector('form[action="/admin/upload-excel"]');
    
    if (fileInput && fileLabel) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                const validTypes = [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                    'application/vnd.ms-excel', // .xls
                    'text/csv' // .csv
                ];
                
                // Validate file type
                if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
                    showError('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV');
                    this.value = '';
                    resetFileLabel();
                    return;
                }
                
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    showError('File quá lớn! Vui lòng chọn file nhỏ hơn 10MB');
                    this.value = '';
                    resetFileLabel();
                    return;
                }
                
                // Update label with success state
                fileLabel.textContent = `✓ ${file.name} (${formatFileSize(file.size)})`;
                fileLabel.style.background = '#d4edda';
                fileLabel.style.borderColor = '#27ae60';
                fileLabel.style.color = '#155724';
                
                // Clear any previous errors
                clearErrors();
            } else {
                resetFileLabel();
            }
        });
    }
    
    // Enhanced form submission with loading state
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            const fileInput = this.querySelector('#excelFile');
            
            if (!fileInput || !fileInput.files.length) {
                e.preventDefault();
                showError('Vui lòng chọn file Excel để upload');
                return;
            }
            
            // Show loading state
            showLoading('Đang xử lý file Excel...');
            
            // Disable submit button to prevent double submission
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
            }
        });
    }
    
    // Helper functions for file handling
    function resetFileLabel() {
        if (fileLabel) {
            fileLabel.textContent = 'Chọn file Excel (.xlsx, .xls, .csv)';
            fileLabel.style.background = '';
            fileLabel.style.borderColor = '';
            fileLabel.style.color = '';
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showError(message) {
        // Remove existing error messages
        clearErrors();
        
        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger upload-error';
        errorDiv.style.cssText = 'margin-top: 10px; padding: 10px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        // Insert after file input
        if (fileInput && fileInput.parentNode) {
            fileInput.parentNode.insertBefore(errorDiv, fileInput.nextSibling);
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    function clearErrors() {
        const errors = document.querySelectorAll('.upload-error');
        errors.forEach(error => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        });
    }
    
    function showLoading(message) {
        // Create loading overlay
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'upload-loading';
        loadingDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.5); z-index: 9999; 
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 18px;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center; background: #333; padding: 30px; border-radius: 10px;">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <div style="margin-top: 15px;">${message}</div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                    Vui lòng không đóng trình duyệt...
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
    }
    
    // Remove loading on page unload (in case of redirect)
    window.addEventListener('beforeunload', function() {
        const loading = document.getElementById('upload-loading');
        if (loading) {
            loading.remove();
        }
    });

    // Auto-save config on input change
    const configInputs = document.querySelectorAll('.config-form input, .config-form select');
    configInputs.forEach(input => {
        input.addEventListener('change', () => {
            updatePreview();
        });
    });

    // Live preview functionality
    function updatePreview() {
        const eventTitle = document.getElementById('event_title').value;
        const eventSubtitle = document.getElementById('event_subtitle').value;
        const primaryColor = document.getElementById('primary_color').value;
        const secondaryColor = document.getElementById('secondary_color').value;
        const backgroundColor = document.getElementById('background_color').value;
        const textColor = document.getElementById('text_color').value;

        // Create or update preview
        let preview = document.querySelector('.config-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'config-preview';
            document.querySelector('.config-form').appendChild(preview);
        }

        preview.innerHTML = `
            <div class="preview-title" style="color: ${primaryColor}; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                🎁 ${eventTitle} 🎁
            </div>
            <div class="preview-subtitle" style="color: ${textColor};">
                ${eventSubtitle}
            </div>
            <div style="margin-top: 15px; padding: 10px 20px; background: linear-gradient(45deg, ${primaryColor}, ${secondaryColor}); color: white; border-radius: 25px; display: inline-block;">
                Nút Quay Thưởng
            </div>
        `;
        preview.style.background = backgroundColor;
        preview.style.color = textColor;
    }

    // Initialize preview
    updatePreview();

    // Employee management functions
    window.editEmployee = function(id) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        const editables = row.querySelectorAll('.editable');
        
        editables.forEach(cell => {
            const field = cell.dataset.field;
            const currentValue = cell.textContent.trim();
            cell.innerHTML = `<input type="text" value="${currentValue}" data-field="${field}">`;
        });
        
        // Toggle buttons
        row.querySelector('.btn-edit').style.display = 'none';
        row.querySelector('.btn-save').style.display = 'inline-block';
        row.querySelector('.btn-cancel').style.display = 'inline-block';
    };

    window.saveEmployee = function(id) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        const inputs = row.querySelectorAll('.editable input');
        
        const formData = new FormData();
        formData.append('id', id);
        
        inputs.forEach(input => {
            const field = input.dataset.field;
            const value = input.value.trim();
            formData.append(field, value);
        });
        
        fetch('/admin/employee', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                location.reload();
            } else {
                alert('Có lỗi xảy ra khi lưu!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi lưu!');
        });
    };

    window.cancelEdit = function(id) {
        location.reload();
    };

    // Reset config function
    window.resetConfig = function() {
        if (confirm('Bạn có chắc muốn reset tất cả cấu hình về mặc định?')) {
            // Reset form values
            document.getElementById('event_title').value = 'QUAY THƯỞNG NỘI BỘ';
            document.getElementById('event_subtitle').value = 'Chúc mừng những người may mắn!';
            document.getElementById('logo_url').value = '';
            document.getElementById('primary_color').value = '#4CAF50';
            document.getElementById('secondary_color').value = '#FFC107';
            document.getElementById('background_color').value = '#1a1a1a';
            document.getElementById('text_color').value = '#ffffff';
            document.querySelector('input[name="show_winner_list"]').checked = true;
            document.getElementById('animation_speed').value = 'normal';
            document.querySelector('input[name="sound_enabled"]').checked = true;
            
            // Update color text inputs
            document.querySelector('#primary_color + .color-text').value = '#4CAF50';
            document.querySelector('#secondary_color + .color-text').value = '#FFC107';
            document.querySelector('#background_color + .color-text').value = '#1a1a1a';
            document.querySelector('#text_color + .color-text').value = '#FFFFFF';
            
            updatePreview();
        }
    };

    // Helper functions
    function isValidHexColor(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                const activeForm = document.querySelector('.config-form');
                if (activeForm) {
                    activeForm.submit();
                }
            }
        }
    });

    // Auto-save draft (localStorage)
    function saveDraft() {
        const configData = {};
        const inputs = document.querySelectorAll('.config-form input, .config-form select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                configData[input.name] = input.checked;
            } else {
                configData[input.name] = input.value;
            }
        });
        localStorage.setItem('eventConfigDraft', JSON.stringify(configData));
    }

    function loadDraft() {
        const draft = localStorage.getItem('eventConfigDraft');
        if (draft && confirm('Bạn có muốn khôi phục bản nháp đã lưu?')) {
            const configData = JSON.parse(draft);
            Object.keys(configData).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = configData[key];
                    } else {
                        input.value = configData[key];
                        if (input.type === 'color') {
                            const textInput = input.parentElement.querySelector('.color-text');
                            if (textInput) textInput.value = configData[key].toUpperCase();
                        }
                    }
                }
            });
            updatePreview();
        }
    }

    // Auto-save every 30 seconds
    setInterval(saveDraft, 30000);
    
    // Load draft on page load (if available)
    setTimeout(loadDraft, 1000);

    // Clear draft when form is submitted successfully
    const configForm = document.querySelector('.config-form');
    if (configForm) {
        configForm.addEventListener('submit', () => {
            localStorage.removeItem('eventConfigDraft');
        });
    }

    // Initialize background preview
    setTimeout(() => {
        updateMainPreview();
    }, 500);
    
    // Add event listeners for background settings
    const backgroundSettings = ['background_position', 'background_size', 'background_opacity'];
    backgroundSettings.forEach(settingId => {
        const element = document.getElementById(settingId);
        if (element) {
            element.addEventListener('change', updateMainPreview);
            element.addEventListener('input', updateMainPreview);
        }
    });
});

// Background Upload Management
class BackgroundUpload {
    constructor() {
        this.uploadArea = null;
        this.fileInput = null;
        this.progressBar = null;
        this.progressText = null;
        this.previewImage = null;
        this.previewScreen = null;
        this.currentBackground = null;
        
        this.init();
    }
    
    init() {
        this.createUploadInterface();
        this.setupEventListeners();
        this.loadCurrentBackground();
    }
    
    createUploadInterface() {
        const uploadHTML = `
            <div class="background-upload">
                <h3>🎨 Upload Ảnh Nền Trình Chiếu</h3>
                
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">📸</div>
                    <div class="upload-text">Kéo thả hoặc click để chọn ảnh nền</div>
                    <div class="upload-hint">Khuyến nghị: 1920x1080px (16:9) - JPG, PNG (tối đa 5MB)</div>
                    <input type="file" id="backgroundInput" class="upload-input" accept="image/*">
                </div>
                
                <div class="upload-progress" id="uploadProgress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Đang tải lên...</div>
                </div>
                
                <div class="background-preview" id="backgroundPreview">
                    <div class="no-background">Chưa có ảnh nền</div>
                </div>
            </div>
            
            <div class="background-settings">
                <h4>⚙️ Cài Đặt Hiển Thị</h4>
                
                <div class="setting-group">
                    <label>Chế độ hiển thị:</label>
                    <select id="backgroundMode">
                        <option value="cover">Cover (Phủ toàn màn hình)</option>
                        <option value="contain">Contain (Vừa khít)</option>
                        <option value="stretch">Stretch (Kéo giãn)</option>
                        <option value="center">Center (Canh giữa)</option>
                    </select>
                </div>
                
                <div class="setting-group">
                    <label>Độ mờ nền: <span class="range-value" id="opacityValue">0.8</span></label>
                    <input type="range" id="backgroundOpacity" min="0.1" max="1" step="0.1" value="0.8">
                </div>
                
                <div class="setting-group">
                    <label>Hiệu ứng blur: <span class="range-value" id="blurValue">0px</span></label>
                    <input type="range" id="backgroundBlur" min="0" max="10" step="1" value="0">
                </div>
            </div>
            
            <div class="main-preview">
                <h4>🖥️ Preview Màn Hình Trình Chiếu (16:9)</h4>
                <div class="preview-screen" id="previewScreen">
                    <div class="preview-content">
                        <h2>QUAY THƯỞNG</h2>
                        <p>Preview màn hình trình chiếu</p>
                    </div>
                </div>
            </div>
            
            <div class="resolution-guide">
                <h5>📐 Hướng Dẫn Kích Thước Ảnh Nền</h5>
                <div class="resolution-list">
                    <div class="resolution-item recommended">
                        <strong>1920x1080</strong>
                        <small>Full HD (Khuyến nghị)</small>
                    </div>
                    <div class="resolution-item">
                        <strong>1366x768</strong>
                        <small>HD Ready</small>
                    </div>
                    <div class="resolution-item">
                        <strong>2560x1440</strong>
                        <small>2K QHD</small>
                    </div>
                    <div class="resolution-item">
                        <strong>3840x2160</strong>
                        <small>4K UHD</small>
                    </div>
                </div>
            </div>
            
            <div class="optimization-tips">
                <h4>💡 Mẹo Tối Ưu Hiển Thị</h4>
                <ul>
                    <li>Sử dụng ảnh có tỷ lệ 16:9 để tránh méo hình</li>
                    <li>Kích thước khuyến nghị: 1920x1080px cho màn hình FullHD</li>
                    <li>Định dạng JPG cho ảnh có nhiều màu, PNG cho ảnh có trong suốt</li>
                    <li>Kích thước file nên dưới 2MB để tải nhanh</li>
                    <li>Tránh ảnh quá sáng hoặc quá tối để text hiển thị rõ ràng</li>
                </ul>
            </div>
        `;
        
        // Thêm vào phần admin interface
        const adminContainer = document.querySelector('.admin-container') || document.body;
        const uploadContainer = document.createElement('div');
        uploadContainer.innerHTML = uploadHTML;
        adminContainer.appendChild(uploadContainer);
        
        // Lưu references
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('backgroundInput');
        this.progressBar = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.previewImage = document.getElementById('backgroundPreview');
        this.previewScreen = document.getElementById('previewScreen');
    }
    
    setupEventListeners() {
        // Click to upload
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
        
        // Settings controls
        document.getElementById('backgroundMode').addEventListener('change', (e) => {
            this.updatePreview();
            this.saveSettings();
        });
        
        document.getElementById('backgroundOpacity').addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = e.target.value;
            this.updatePreview();
            this.saveSettings();
        });
        
        document.getElementById('backgroundBlur').addEventListener('input', (e) => {
            document.getElementById('blurValue').textContent = e.target.value + 'px';
            this.updatePreview();
            this.saveSettings();
        });
    }
    
    handleFileUpload(file) {
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }
        
        // Show progress
        this.showProgress();
        
        // Create FormData
        const formData = new FormData();
        formData.append('background', file);
        
        // Upload file
        fetch('/admin/upload-background', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.currentBackground = data.filename;
                this.updatePreview();
                this.showSuccess('Tải lên thành công!');
                this.saveSettings();
            } else {
                this.showError(data.message || 'Có lỗi xảy ra khi tải lên');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            this.showError('Có lỗi xảy ra khi tải lên');
        })
        .finally(() => {
            this.hideProgress();
        });
    }
    
    validateFile(file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            this.showError('Vui lòng chọn file ảnh');
            return false;
        }
        
        // Check file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('Kích thước file không được vượt quá 5MB');
            return false;
        }
        
        return true;
    }
    
    showProgress() {
        this.progressBar.style.display = 'block';
        this.progressFill.style.width = '0%';
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = `Đang tải lên... ${Math.round(progress)}%`;
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
    }
    
    hideProgress() {
        setTimeout(() => {
            this.progressBar.style.display = 'none';
            this.progressFill.style.width = '100%';
            this.progressText.textContent = 'Hoàn thành!';
        }, 500);
    }
    
    updatePreview() {
        if (!this.currentBackground) return;
        
        const mode = document.getElementById('backgroundMode').value;
        const opacity = document.getElementById('backgroundOpacity').value;
        const blur = document.getElementById('backgroundBlur').value;
        
        const backgroundUrl = `/uploads/backgrounds/${this.currentBackground}`;
        
        // Update preview image
        this.previewImage.innerHTML = `
            <img src="${backgroundUrl}" alt="Background Preview" class="preview-image">
            <p style="text-align: center; color: #666; margin: 10px 0;">
                <strong>File:</strong> ${this.currentBackground}
            </p>
        `;
        
        // Update preview screen
        const previewStyle = `
            background-image: url('${backgroundUrl}');
            background-size: ${mode};
            background-position: center;
            background-repeat: no-repeat;
            opacity: ${opacity};
            filter: blur(${blur}px);
        `;
        
        this.previewScreen.style.cssText = previewStyle;
        
        // Update main lottery screen if exists
        const lotteryScreen = document.querySelector('.lottery-container');
        if (lotteryScreen) {
            lotteryScreen.style.cssText = previewStyle;
        }
    }
    
    loadCurrentBackground() {
        // Load current background from server
        fetch('/admin/current-background')
        .then(response => response.json())
        .then(data => {
            if (data.background) {
                this.currentBackground = data.background;
                this.updatePreview();
                
                // Load settings
                if (data.settings) {
                    document.getElementById('backgroundMode').value = data.settings.mode || 'cover';
                    document.getElementById('backgroundOpacity').value = data.settings.opacity || 0.8;
                    document.getElementById('backgroundBlur').value = data.settings.blur || 0;
                    
                    document.getElementById('opacityValue').textContent = data.settings.opacity || 0.8;
                    document.getElementById('blurValue').textContent = (data.settings.blur || 0) + 'px';
                }
            }
        })
        .catch(error => {
            console.error('Error loading background:', error);
        });
    }
    
    saveSettings() {
        const settings = {
            background: this.currentBackground,
            mode: document.getElementById('backgroundMode').value,
            opacity: document.getElementById('backgroundOpacity').value,
            blur: document.getElementById('backgroundBlur').value
        };
        
        fetch('/admin/save-background-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error saving settings:', data.message);
            }
        })
        .catch(error => {
            console.error('Error saving settings:', error);
        });
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    
    // Initialize background upload
    const backgroundUpload = new BackgroundUpload();
    
    // Apply background to main lottery screen
    function applyBackgroundToLottery() {
        fetch('/admin/current-background')
        .then(response => response.json())
        .then(data => {
            if (data.background && data.settings) {
                const lotteryContainer = document.querySelector('.lottery-container');
                if (lotteryContainer) {
                    const backgroundUrl = `/uploads/backgrounds/${data.background}`;
                    lotteryContainer.style.cssText = `
                        background-image: url('${backgroundUrl}');
                        background-size: ${data.settings.mode || 'cover'};
                        background-position: center;
                        background-repeat: no-repeat;
                        opacity: ${data.settings.opacity || 0.8};
                        filter: blur(${data.settings.blur || 0}px);
                    `;
                }
            }
        });
    }
    
    // Apply background when page loads
    applyBackgroundToLottery();
});

// Modal functions for clearing employees
function showClearEmployeesModal() {
    const modal = document.getElementById('clearEmployeesModal');
    const confirmInput = document.getElementById('confirmInput');
    const confirmBtn = document.getElementById('confirmClearBtn');
    
    modal.style.display = 'block';
    confirmInput.value = '';
    confirmBtn.disabled = true;
    
    // Focus on input
    setTimeout(() => confirmInput.focus(), 100);
}

function hideClearEmployeesModal() {
    const modal = document.getElementById('clearEmployeesModal');
    modal.style.display = 'none';
}

// Handle confirm input validation
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    
    const confirmInput = document.getElementById('confirmInput');
    const confirmBtn = document.getElementById('confirmClearBtn');
    
    if (confirmInput && confirmBtn) {
        confirmInput.addEventListener('input', function() {
            if (this.value === 'DELETE_ALL_EMPLOYEES') {
                confirmBtn.disabled = false;
                confirmBtn.style.background = '#dc3545';
            } else {
                confirmBtn.disabled = true;
                confirmBtn.style.background = '#6c757d';
            }
        });
        
        // Handle form submission
        document.getElementById('clearEmployeesForm').addEventListener('submit', function(e) {
            if (confirmInput.value !== 'DELETE_ALL_EMPLOYEES') {
                e.preventDefault();
                alert('Vui lòng nhập đúng mã xác nhận!');
                return false;
            }
            
            if (!confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ DANH SÁCH NHÂN VIÊN?\n\nThao tác này không thể hoàn tác!')) {
                e.preventDefault();
                return false;
            }
            
            // Show loading
            confirmBtn.innerHTML = '🔄 Đang xóa...';
            confirmBtn.disabled = true;
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('clearEmployeesModal');
        if (e.target === modal) {
            hideClearEmployeesModal();
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideClearEmployeesModal();
        }
    });
});

// Background upload functions
function uploadBackground(input) {
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Validate file
    if (!allowedTypes.includes(file.type)) {
        alert('Chỉ hỗ trợ file ảnh JPG, PNG, WEBP!');
        input.value = '';
        return;
    }
    
    if (file.size > maxSize) {
        alert('File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
        input.value = '';
        return;
    }
    
    // Show loading indicator
    const uploadArea = input.closest('.upload-area');
    const originalContent = uploadArea.innerHTML;
    uploadArea.innerHTML = `
        <div class="upload-loading">
            <div class="spinner"></div>
            <div>Đang xử lý và tối ưu hóa ảnh...</div>
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
        </div>
    `;
    
    // Create FormData
    const formData = new FormData();
    formData.append('backgroundImage', file);
    
    // Upload with progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            const progressFill = uploadArea.querySelector('.progress-fill');
            const progressText = uploadArea.querySelector('.progress-text');
            
            if (progressFill && progressText) {
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = percentComplete + '%';
            }
        }
    });
    
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // Success - show preview
                    updateBackgroundPreview(response.imageUrl, response.filename);
                    showNotification('✅ Upload và tối ưu hóa ảnh thành công!', 'success');
                    
                    // Restore upload area after delay
                    setTimeout(() => {
                        uploadArea.innerHTML = originalContent;
                        // Re-attach event listener
                        const newInput = uploadArea.querySelector('input[type="file"]');
                        if (newInput) {
                            newInput.addEventListener('change', function() {
                                uploadBackground(this);
                            });
                        }
                    }, 2000);
                } else {
                    throw new Error(response.message || 'Upload failed');
                }
            } catch (error) {
                showNotification('❌ Lỗi xử lý phản hồi từ server', 'error');
                uploadArea.innerHTML = originalContent;
            }
        } else {
            showNotification('❌ Lỗi upload ảnh (HTTP ' + xhr.status + ')', 'error');
            uploadArea.innerHTML = originalContent;
        }
    });
    
    xhr.addEventListener('error', () => {
        showNotification('❌ Lỗi kết nối khi upload', 'error');
        uploadArea.innerHTML = originalContent;
    });
    
    xhr.open('POST', '/admin/upload-background');
    xhr.send(formData);
}

function updateBackgroundPreview(imageUrl, filename) {
    const previewDiv = document.getElementById('backgroundPreview');
    if (previewDiv) {
        previewDiv.innerHTML = `
            <div class="background-preview-image">
                <img src="${imageUrl}" alt="Background Preview" class="preview-image">
                <div class="image-info">
                    <div class="filename">📄 ${filename}</div>
                    <div class="image-actions">
                        <button type="button" class="btn btn-sm btn-success" onclick="applyBackground('${imageUrl}')">
                            ✅ Áp dụng ảnh nền
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeBackground('${filename}')">
                            🗑️ Xóa ảnh
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

function applyBackground(imageUrl) {
    fetch('/admin/apply-background', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: imageUrl })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('✅ Đã áp dụng ảnh nền cho màn hình quay thưởng!', 'success');
            // Update preview screens
            updateAllPreviews();
        } else {
            showNotification('❌ Lỗi khi áp dụng ảnh nền', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('❌ Lỗi kết nối', 'error');
    });
}

function removeBackground(filename) {
    if (!confirm('Bạn có chắc muốn xóa ảnh nền này?')) return;
    
    fetch('/admin/remove-background', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: filename })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reset preview
            const previewDiv = document.getElementById('backgroundPreview');
            if (previewDiv) {
                previewDiv.innerHTML = `
                    <div class="no-background">
                        <p>Chưa có ảnh nền. Hãy upload một ảnh.</p>
                    </div>
                `;
            }
            showNotification('✅ Đã xóa ảnh nền', 'success');
            updateAllPreviews();
        } else {
            showNotification('❌ Lỗi khi xóa ảnh nền', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('❌ Lỗi kết nối', 'error');
    });
}

function updateAllPreviews() {
    // Update all preview screens with current background
    fetch('/admin/current-background')
    .then(response => response.json())
    .then(data => {
        const previewScreens = document.querySelectorAll('.preview-screen');
        previewScreens.forEach(screen => {
            if (data.backgroundUrl) {
                screen.style.backgroundImage = `url('${data.backgroundUrl}')`;
                screen.style.backgroundSize = 'cover';
                screen.style.backgroundPosition = 'center';
                screen.style.backgroundRepeat = 'no-repeat';
            } else {
                screen.style.backgroundImage = 'none';
            }
        });
    })
    .catch(error => {
        console.error('Error updating previews:', error);
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
    `;
    
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Employee editing functionality
let editingEmployees = new Set();

function editEmployee(id) {
    if (editingEmployees.has(id)) return;
    
    editingEmployees.add(id);
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const editableCells = row.querySelectorAll('.editable');
    const originalValues = {};
    
    // Store original values and convert to input fields
    editableCells.forEach(cell => {
        const field = cell.dataset.field;
        originalValues[field] = cell.textContent;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = cell.textContent;
        input.dataset.field = field;
        cell.innerHTML = '';
        cell.appendChild(input);
    });
    
    // Store original values on the row for cancel functionality
    row.dataset.originalValues = JSON.stringify(originalValues);
    
    // Show/hide buttons
    toggleEditButtons(id, true);
}

function saveEmployee(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const inputs = row.querySelectorAll('.editable input');
    const data = { id: id };
    
    // Collect data from input fields
    inputs.forEach(input => {
        data[input.dataset.field] = input.value.trim();
    });
    
    // Validate required fields
    if (!data.ma_so_nhan_vien || !data.ten_nhan_vien || !data.phong_ban) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    // Show loading state
    const saveBtn = row.querySelector('.btn-save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '💾 Đang lưu...';
    saveBtn.disabled = true;
    
    // Submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin/employee';
    form.style.display = 'none';
    
    Object.keys(data).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
}

function cancelEdit(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const editableCells = row.querySelectorAll('.editable');
    const originalValues = JSON.parse(row.dataset.originalValues);
    
    // Restore original values
    editableCells.forEach(cell => {
        const field = cell.dataset.field;
        cell.textContent = originalValues[field];
    });
    
    // Show/hide buttons
    toggleEditButtons(id, false);
    editingEmployees.delete(id);
}

function toggleEditButtons(id, isEditing) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const editBtn = row.querySelector('.btn-edit');
    const saveBtn = row.querySelector('.btn-save');
    const cancelBtn = row.querySelector('.btn-cancel');
    const deleteBtn = row.querySelector('.btn-delete');
    
    if (isEditing) {
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'none';
    } else {
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        deleteBtn.style.display = 'inline-block';
    }
}

// Utility functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Export confirmation
document.addEventListener('click', function(e) {
    if (e.target.closest('.export-btn')) {
        const wonCount = document.querySelector('.stat-card:nth-child(2) .stat-number').textContent;
        if (parseInt(wonCount) === 0) {
            e.preventDefault();
            alert('Chưa có nhân viên nào trúng thưởng để xuất!');
            return false;
        }
        
        if (!confirm(`Bạn có muốn xuất danh sách ${wonCount} nhân viên đã trúng thưởng?`)) {
            e.preventDefault();
            return false;
        }
    }
});

// Enhanced table interactions
document.addEventListener('click', function(e) {
    // Handle editable cell clicks
    if (e.target.classList.contains('editable') && !e.target.querySelector('input')) {
        const row = e.target.closest('tr');
        const id = row.dataset.id;
        if (!editingEmployees.has(parseInt(id))) {
            e.target.style.background = '#e8f4f8';
            setTimeout(() => {
                if (!editingEmployees.has(parseInt(id))) {
                    e.target.style.background = '';
                }
            }, 200);
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to cancel all edits
    if (e.key === 'Escape') {
        editingEmployees.forEach(id => {
            cancelEdit(id);
        });
    }
    
    // Ctrl+S to save (prevent default browser save)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (editingEmployees.size === 1) {
            const id = Array.from(editingEmployees)[0];
            saveEmployee(id);
        }
    }
});

// Search functionality (if needed in future)
function searchEmployees(query) {
    const rows = document.querySelectorAll('.employee-row');
    const searchTerm = query.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}