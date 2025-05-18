document.addEventListener('DOMContentLoaded', () => { // 確保 DOM 加载完毕
    const layoutSelect = document.getElementById('layout-select');
    const numpadKeys = document.querySelectorAll('.numpad-section .key, .numpad-side-section .key');

    // === 新增：獲取注意事項和版權相關元素 ===
    const toggleNoticeBtn = document.getElementById('toggle-notice-btn');
    const noticeContent = document.getElementById('notice-content');
    const copyrightYearSpan = document.getElementById('copyright-year');
    // === /新增 ===


    // 切换布局的函数 (保持不變)
    function toggleLayout() {
        const is87KeyMode = layoutSelect.value === '87';

        numpadKeys.forEach(key => {
            if (is87KeyMode) {
                key.classList.add('disabled');
            } else {
                key.classList.remove('disabled');
            }
        });
        // Reset any pressed state when layout changes
        document.querySelectorAll('.key.pressed').forEach(k => k.classList.remove('pressed')); // Added reset on layout change
    }

    // 监听布局选择变化 (保持不變)
    layoutSelect.addEventListener('change', toggleLayout);

    // === 新增：注意事項按鈕事件監聽 ===
    if (toggleNoticeBtn && noticeContent) {
        // 初始隱藏內容
        noticeContent.classList.add('hidden');

        toggleNoticeBtn.addEventListener('click', () => {
            const isHidden = noticeContent.classList.toggle('hidden');
            toggleNoticeBtn.textContent = isHidden ? '顯示注意事項' : '隱藏注意事項';
        });
    }
    // === /新增 ===


    // 按鍵按下事件監聽 (保持不變)
    document.addEventListener('keydown', (event) => {
        //console.log("Key pressed:", event.code); // Debugging

        const keyElement = document.querySelector(`.key[data-key="${event.code}"]`);
        if (keyElement) {
            // 检查是否处于禁用状态
            if (!keyElement.classList.contains('disabled')) {
                keyElement.classList.add('pressed');
            }
        }
    });

    // 按鍵釋放事件監聽 (保持不變)
    document.addEventListener('keyup', (event) => {
        const keyElement = document.querySelector(`.key[data-key="${event.code}"]`);
        if (keyElement) {
            // 移除按下状态
            keyElement.classList.remove('pressed');
        }
    });


    // --- 初始設定 ---
    toggleLayout(); // 初始加载时设置一次布局 (保持不變)

    // === 新增：設定版權年份 ===
    if (copyrightYearSpan) {
        copyrightYearSpan.textContent = new Date().getFullYear();
    }
    // === /新增 ===

});