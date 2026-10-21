document.addEventListener('DOMContentLoaded', () => {
    const layoutSelect = document.getElementById('layout-select');
    const numpadKeys = document.querySelectorAll('.numpad-section .key, .numpad-side-section .key');
    const toggleNoticeBtn = document.getElementById('toggle-notice-btn');
    const noticeContent = document.getElementById('notice-content');
    const resetBtn = document.getElementById('reset-btn');
    const fullscreenLockBtn = document.getElementById('fullscreen-lock-btn');
    const copyrightYearSpan = document.getElementById('copyright-year');

    // 狀態列元素
    const infoCode = document.getElementById('info-code');
    const infoKey = document.getElementById('info-key');
    const infoCount = document.getElementById('info-count');
    const imeWarning = document.getElementById('ime-warning');

    // 切換 104 / 87 鍵佈局
    function toggleLayout() {
        const is87KeyMode = layoutSelect.value === '87';
        numpadKeys.forEach(key => {
            if (is87KeyMode) {
                key.classList.add('disabled');
                key.classList.remove('pressed', 'tested');
            } else {
                key.classList.remove('disabled');
            }
        });
        updateTestedCount();
        // 切換後立即移除下拉選單焦點，避免接下來按方向鍵或空白鍵又誤觸選單
        layoutSelect.blur();
    }

    // 更新已測試按鍵數量
    function updateTestedCount() {
        const testedKeys = document.querySelectorAll('.key.tested:not(.disabled)');
        infoCount.textContent = testedKeys.length;
    }

    // 清除所有測試紀錄
    function resetAllKeys() {
        document.querySelectorAll('.key').forEach(k => {
            k.classList.remove('pressed', 'tested');
        });
        infoCode.textContent = '-';
        infoKey.textContent = '-';
        imeWarning.classList.add('hidden');
        updateTestedCount();
        resetBtn.blur();
    }

    // 根據 event 解析對應的按鍵 DOM 元素（包含 IME 退化時的 location 補償）
    function resolveKeyElement(event) {
        let code = event.code;

        // 補償機制：部分舊瀏覽器或特殊輸入法未回傳標準 event.code 時，依賴 key + location 判斷左右修飾鍵
        if (!code || code === 'Unidentified') {
            if (event.key === 'Shift') {
                code = event.location === 2 ? 'ShiftRight' : 'ShiftLeft';
            } else if (event.key === 'Control') {
                code = event.location === 2 ? 'ControlRight' : 'ControlLeft';
            } else if (event.key === 'Alt') {
                code = event.location === 2 ? 'AltRight' : 'AltLeft';
            } else if (event.key === 'Meta' || event.key === 'OS') {
                code = event.location === 2 ? 'MetaRight' : 'MetaLeft';
            }
        }

        return {
            code: code || 'Unknown',
            element: document.querySelector(`.key[data-key="${code}"]`)
        };
    }

    // 更新頂部狀態面板與輸入法攔截警告
    function updateStatusPanel(event, resolvedCode) {
        infoCode.textContent = resolvedCode;
        infoKey.textContent = event.key === ' ' ? 'Space' : event.key;

        // 偵測是否被中文輸入法 (IME) 攔截 (keyCode 229 或 key 為 Process)
        if (event.isComposing || event.keyCode === 229 || event.key === 'Process') {
            imeWarning.classList.remove('hidden');
        } else {
            imeWarning.classList.add('hidden');
        }
    }

    // 監聽按鍵按下 (keydown)
    window.addEventListener('keydown', (event) => {
        // 關鍵修復：阻擋 F1~F12、Tab、Alt、空白鍵捲動等瀏覽器預設行為
        event.preventDefault();
        event.stopPropagation();

        // 若焦點不小心停在按鈕或選單上，強制移開焦點
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }

        const { code, element } = resolveKeyElement(event);
        updateStatusPanel(event, code);

        if (element && !element.classList.contains('disabled')) {
            element.classList.add('pressed', 'tested');
            updateTestedCount();
        }
    }, { capture: true });

    // 監聽按鍵釋放 (keyup)
    window.addEventListener('keyup', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const { code, element } = resolveKeyElement(event);
        updateStatusPanel(event, code);

        if (element && !element.classList.contains('disabled')) {
            // 針對 PrintScreen 或被新注音扣留的右 Shift（只有 keyup 沒有 keydown）：
            // 如果放開時發現它還沒被標記為 tested，補上短暫的視覺按壓效果並標記為已測試
            if (!element.classList.contains('pressed')) {
                element.classList.add('pressed', 'tested');
                setTimeout(() => {
                    element.classList.remove('pressed');
                }, 150);
            } else {
                element.classList.remove('pressed');
                element.classList.add('tested');
            }
            updateTestedCount();
        }
    }, { capture: true });

    // 關鍵修復：當按下 Win 鍵或 Alt+Tab 導致視窗失去焦點時，自動清除所有卡住的 pressed 狀態
    window.addEventListener('blur', () => {
        document.querySelectorAll('.key.pressed').forEach(k => {
            k.classList.remove('pressed');
        });
    });

    // 阻擋按下 Alt 或 Menu 鍵時彈出瀏覽器右鍵選單
    window.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // 全螢幕與系統按鍵鎖定 (Keyboard Lock API - 專治 Win 鍵與系統快捷鍵)
    if (fullscreenLockBtn) {
        fullscreenLockBtn.addEventListener('click', async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    if (navigator.keyboard && navigator.keyboard.lock) {
                        await navigator.keyboard.lock();
                    }
                    fullscreenLockBtn.textContent = '退出全螢幕鎖定 (長按 Esc)';
                } else {
                    if (navigator.keyboard && navigator.keyboard.unlock) {
                        navigator.keyboard.unlock();
                    }
                    await document.exitFullscreen();
                    fullscreenLockBtn.textContent = '全螢幕鎖定測試 (測 Win 鍵)';
                }
            } catch (err) {
                alert('您的瀏覽器不支援全螢幕按鍵鎖定 API，建議使用 Chrome 或 Edge 瀏覽器。');
            }
            fullscreenLockBtn.blur();
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                fullscreenLockBtn.textContent = '全螢幕鎖定測試 (測 Win 鍵)';
            }
        });
    }

    // 綁定介面按鈕事件
    layoutSelect.addEventListener('change', toggleLayout);
    resetBtn.addEventListener('click', resetAllKeys);

    if (toggleNoticeBtn && noticeContent) {
        toggleNoticeBtn.addEventListener('click', () => {
            const isHidden = noticeContent.classList.toggle('hidden');
            toggleNoticeBtn.textContent = isHidden ? '顯示注意事項' : '隱藏注意事項';
            toggleNoticeBtn.blur();
        });
    }

    // 初始化
    toggleLayout();
    if (copyrightYearSpan) {
        copyrightYearSpan.textContent = new Date().getFullYear();
    }
});
