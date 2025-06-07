// Lottery functionality for main page
document.addEventListener('DOMContentLoaded', function() {
    const spinButton = document.getElementById('spinButton');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const spinner = document.getElementById('spinner');
    
    // Lấy cấu hình từ window object
    const config = window.eventConfig || {};
    
    let isSpinning = false;
    
    spinButton.addEventListener('click', async () => {
        if (isSpinning) return;
        
        isSpinning = true;
        spinButton.classList.add('spinning');
        spinButton.disabled = true;
        
        // Phát âm thanh quay nếu được bật
        if (config.soundEnabled) {
            const spinSound = document.getElementById('spinSound');
            if (spinSound) spinSound.play().catch(() => {});
        }
        
        // Hiệu ứng quay với tốc độ theo cấu hình
        const spinDuration = config.animationSpeed === 'fast' ? 2000 : 
                            config.animationSpeed === 'slow' ? 5000 : 3000;
        
        // Animation quay
        showSpinningAnimation(spinDuration);
        
        try {
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            setTimeout(() => {
                if (result.success) {
                    showWinner(result.winner);
                    updateWinnersList();
                    
                    // Phát âm thanh thắng nếu được bật
                    if (config.soundEnabled) {
                        const winSound = document.getElementById('winSound');
                        if (winSound) winSound.play().catch(() => {});
                    }
                } else {
                    showMessage(result.message);
                }
                
                isSpinning = false;
                spinButton.classList.remove('spinning');
                spinButton.disabled = false;
            }, spinDuration);
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('Có lỗi xảy ra khi quay thưởng!');
            isSpinning = false;
            spinButton.classList.remove('spinning');
            spinButton.disabled = false;
        }
    });
    
    function showSpinningAnimation(duration) {
        const placeholder = winnerDisplay.querySelector('.winner-placeholder');
        if (placeholder) {
            placeholder.innerHTML = '<h2>🎲 Đang quay... 🎲</h2>';
        }
        
        // Tạo hiệu ứng nhấp nháy
        let interval = setInterval(() => {
            const emojis = ['🎲', '🎯', '🎪', '🎊', '🎁', '🏆'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            if (placeholder) {
                placeholder.innerHTML = `<h2>${randomEmoji} Đang quay... ${randomEmoji}</h2>`;
            }
        }, 200);
        
        setTimeout(() => {
            clearInterval(interval);
        }, duration);
    }
    
    function showWinner(winner) {
        winnerDisplay.innerHTML = `
            <div class="winner-result">
                <h2>🎉 CHÚC MỪNG! 🎉</h2>
                <div class="winner-name">${winner.ten_nhan_vien}</div>
                <div class="winner-details">Mã NV: ${winner.ma_so_nhan_vien}</div>
                <div class="winner-details">Phòng ban: ${winner.phong_ban}</div>
                <div class="winner-celebration"></div>
            </div>
        `;
        
        // Tạo hiệu ứng pháo hoa
        createFireworks();
    }
    
    function showMessage(message) {
        winnerDisplay.innerHTML = `
            <div class="winner-placeholder">
                <h2>📢 ${message} 📢</h2>
            </div>
        `;
    }
    
    // Cập nhật danh sách người trúng thưởng
    async function updateWinnersList() {
        if (!config.showWinnerList) return;

        try {
            // Thêm một tham số ngẫu nhiên để tránh cache của trình duyệt
            const response = await fetch(`/api/winners?t=${new Date().getTime()}`);
            const result = await response.json();

            if (result.success) {
                const winnersList = document.getElementById('winnersList');
                if (winnersList) {
                    const winners = result.winners;

                    winnersList.innerHTML = winners.map((winner, index) => `
                        <div class="winner-card ${index === 0 ? 'latest' : ''}" data-index="${index}">
                            <div class="winner-info">
                                <div class="winner-name">${winner.ten_nhan_vien}</div>
                                <div class="winner-id">${winner.ma_so_nhan_vien}</div>
                                <div class="winner-department">${winner.phong_ban}</div>
                            </div>
                            <div class="winner-number">#${index + 1}</div>
                        </div>
                    `).join('');

                    // Cập nhật số lượng
                    const winnerCountDisplay = document.querySelector('.winner-count');
                    if (winnerCountDisplay) {
                        winnerCountDisplay.textContent = `(${winners.length} người)`;
                    }

                    // Cập nhật thống kê "Đã trúng" và "Còn lại"
                    const wonEmployeesStat = document.getElementById('wonEmployeesStat');
                    const remainingEmployeesStat = document.getElementById('remainingEmployeesStat');
                    const totalEmployees = window.eventConfig.totalEmployees;

                    if (wonEmployeesStat) {
                        wonEmployeesStat.textContent = winners.length;
                    }
                    if (remainingEmployeesStat) {
                        remainingEmployeesStat.textContent = totalEmployees - winners.length;
                    }

                    // Vô hiệu hóa nút quay thưởng nếu không còn ai để quay
                    const spinButton = document.getElementById('spinButton');
                    const noMoreWinnersMessage = document.querySelector('.no-more-winners');
                    if (totalEmployees - winners.length <= 0) {
                        spinButton.disabled = true;
                        if (noMoreWinnersMessage) noMoreWinnersMessage.style.display = 'block';
                    } else {
                        spinButton.disabled = false;
                        if (noMoreWinnersMessage) noMoreWinnersMessage.style.display = 'none';
                    }

                    // Scroll để hiển thị người mới trúng
                    if (winners.length > 0) {
                        winnersList.scrollTop = 0;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating winners list:', error);
        }
    }
    
    // Tạo hiệu ứng pháo hoa
    function createFireworks() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.style.position = 'fixed';
                firework.style.left = Math.random() * window.innerWidth + 'px';
                firework.style.top = Math.random() * window.innerHeight + 'px';
                firework.style.width = '4px';
                firework.style.height = '4px';
                firework.style.background = colors[Math.floor(Math.random() * colors.length)];
                firework.style.borderRadius = '50%';
                firework.style.pointerEvents = 'none';
                firework.style.zIndex = '10000';
                firework.style.animation = 'firework 2s ease-out forwards';
                
                document.body.appendChild(firework);
                
                setTimeout(() => {
                    document.body.removeChild(firework);
                }, 2000);
            }, i * 30);
        }
    }
    
    // Thêm CSS cho hiệu ứng pháo hoa
    const style = document.createElement('style');
    style.textContent = `
        @keyframes firework {
            0% {
                opacity: 1;
                transform: scale(0);
            }
            15% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                opacity: 0;
                transform: scale(0) translateY(-100px);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Keyboard shortcuts cho presentation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!isSpinning) {
                spinButton.click();
            }
        }
    });
    
    // Toggle fullscreen
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
    
    // Tự động cập nhật danh sách người trúng mỗi 5 phút
    if (config.showWinnerList) {
        // setInterval(updateWinnersList, 300000); // Đã vô hiệu hóa cập nhật định kỳ
    }
});