document.addEventListener('DOMContentLoaded', () => {
    const THEME_KEY = 'bazi_retro_theme_v1';

    // DOM 參照
    const rootEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const mobileThemeBtn = document.getElementById('mobileThemeBtn');
    const mobileQueryBtn = document.getElementById('mobileQueryBtn');
    const mobileTopBtn = document.getElementById('mobileTopBtn');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    const navMainQueryBtn = document.getElementById('navMainQueryBtn');
    const backToMainQueryBtn = document.getElementById('backToMainQueryBtn');
    const fullDataViewSection = document.getElementById('fullDataViewSection');
    const fullDataViewTitle = document.getElementById('fullDataViewTitle');
    const fullDataViewOutput = document.getElementById('fullDataViewOutput');
    const quickIndexBar = document.getElementById('quickIndexBar');

    const resultSection = document.getElementById('resultSection');
    const resultOutput = document.getElementById('resultOutput');

    const shengxiaoSelect = document.getElementById('shengxiaoSelect');
    const ganzhiSelect = document.getElementById('ganzhiSelect');
    const monthSelect = document.getElementById('monthSelect');
    const daySelect = document.getElementById('daySelect');
    const hourMainSelect = document.getElementById('hourMainSelect');
    const hourDetailSelect = document.getElementById('hourDetailSelect');
    const resetButton = document.getElementById('resetButton');
    const detailPills = Array.from(document.querySelectorAll('#hourDetailPills .detail-pill'));

    const pillarStatusBar = document.getElementById('pillarStatusBar');
    const pillarStatusText = document.getElementById('pillarStatusText');
    const pillarStamps = {
        year: document.querySelector('.mini-stamp[data-pillar="year"]'),
        month: document.querySelector('.mini-stamp[data-pillar="month"]'),
        day: document.querySelector('.mini-stamp[data-pillar="day"]'),
        hour: document.querySelector('.mini-stamp[data-pillar="hour"]')
    };

    const navTabIds = [
        'navMainQueryBtn',
        'viewAllYearBtn',
        'viewAllMonthBtn',
        'viewAllDayBtn',
        'viewAllHourBtn',
        'viewAllBoneFortuneBtn'
    ];
    const navTabs = navTabIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    // =========================================================
    // 1. 雙復古主題切換（安全相容 file:// 離線環境）
    // =========================================================
    function readSavedTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            return saved === 'ink' || saved === 'paper' ? saved : 'paper';
        } catch (e) {
            return 'paper';
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            // 某些瀏覽器離線模式禁用 localStorage，安全略過
        }
    }

    function applyTheme(theme) {
        rootEl.setAttribute('data-theme', theme);
        const isInk = theme === 'ink';
        const iconText = isInk ? '☀' : '☾';
        const labelText = isInk ? '切換宣紙' : '切換玄墨';

        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('.theme-icon');
            const label = themeToggleBtn.querySelector('.theme-label');
            if (icon) icon.textContent = iconText;
            if (label) label.textContent = labelText;
        }
        if (mobileThemeBtn) {
            const icon = mobileThemeBtn.querySelector('.hud-icon');
            const label = mobileThemeBtn.querySelector('.mobile-theme-label');
            if (icon) icon.textContent = iconText;
            if (label) label.textContent = labelText;
        }
    }

    function toggleTheme() {
        const current = rootEl.getAttribute('data-theme') === 'ink' ? 'ink' : 'paper';
        const next = current === 'ink' ? 'paper' : 'ink';
        applyTheme(next);
        saveTheme(next);
    }

    applyTheme(readSavedTheme());
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (mobileThemeBtn) mobileThemeBtn.addEventListener('click', toggleTheme);

    // =========================================================
    // 2. 書冊目錄分頁狀態同步
    // =========================================================
    function setActiveTab(activeBtn) {
        navTabs.forEach(btn => btn.classList.toggle('active', btn === activeBtn));
    }

    function goToMainQuery() {
        const isInFullView = fullDataViewSection && !fullDataViewSection.classList.contains('hidden');
        if (isInFullView && backToMainQueryBtn) {
            backToMainQueryBtn.click();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (navMainQueryBtn) setActiveTab(navMainQueryBtn);
    }

    navTabs.forEach(btn => {
        if (btn === navMainQueryBtn) {
            btn.addEventListener('click', goToMainQuery);
        } else {
            btn.addEventListener('click', () => setActiveTab(btn));
        }
    });

    if (backToMainQueryBtn) {
        backToMainQueryBtn.addEventListener('click', () => {
            if (navMainQueryBtn) setActiveTab(navMainQueryBtn);
            if (quickIndexBar) {
                quickIndexBar.innerHTML = '';
                quickIndexBar.classList.add('hidden');
            }
        });
    }

    if (mobileQueryBtn) mobileQueryBtn.addEventListener('click', goToMainQuery);
    if (mobileTopBtn) mobileTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    window.addEventListener('scroll', () => {
        if (!scrollTopBtn) return;
        scrollTopBtn.classList.toggle('hidden', window.scrollY < 300);
    }, { passive: true });

    // =========================================================
    // 3. 時辰細分按鈕與原生 select 雙向同步
    // =========================================================
    function syncHourDetailUI() {
        if (!hourDetailSelect) return;
        const isDisabled = hourDetailSelect.disabled;
        const currentVal = hourDetailSelect.value;

        detailPills.forEach(pill => {
            pill.disabled = isDisabled;
            const isActive = !isDisabled && pill.dataset.detail === currentVal;
            pill.classList.toggle('active', isActive);
            pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    detailPills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (pill.disabled || !hourDetailSelect) return;
            hourDetailSelect.value = pill.dataset.detail;
            syncHourDetailUI();
        });
    });

    // =========================================================
    // 4. 四柱進度與「袁天罡秤骨」解鎖即時提示
    // =========================================================
    function updatePillarStatus() {
        const hasYear = Boolean(ganzhiSelect && ganzhiSelect.value);
        const partialYear = Boolean(shengxiaoSelect && shengxiaoSelect.value && !hasYear);
        const hasMonth = Boolean(monthSelect && monthSelect.value);
        const hasDay = Boolean(daySelect && daySelect.value);
        const hasHour = Boolean(hourMainSelect && hourMainSelect.value);

        if (pillarStamps.year) {
            pillarStamps.year.classList.toggle('filled', hasYear);
            pillarStamps.year.classList.toggle('partial', partialYear);
        }
        if (pillarStamps.month) pillarStamps.month.classList.toggle('filled', hasMonth);
        if (pillarStamps.day) pillarStamps.day.classList.toggle('filled', hasDay);
        if (pillarStamps.hour) pillarStamps.hour.classList.toggle('filled', hasHour);

        const count = [hasYear, hasMonth, hasDay, hasHour].filter(Boolean).length;
        const ready = count === 4;

        if (pillarStatusBar) pillarStatusBar.classList.toggle('ready', ready);
        if (!pillarStatusText) return;

        if (ready) {
            pillarStatusText.textContent = '四柱齊備！點擊「查詢所選項目」即可同時檢視生辰命評與袁天罡總骨重。';
        } else if (count === 0 && !partialYear) {
            pillarStatusText.textContent = '可任意組合查詢；選齊「年、月、日、時」四柱將自動合算袁天罡秤骨命評。';
        } else {
            const missing = [];
            if (!hasYear) missing.push(partialYear ? '年柱（請再選天干地支）' : '年柱');
            if (!hasMonth) missing.push('月柱');
            if (!hasDay) missing.push('日柱');
            if (!hasHour) missing.push('時柱');
            pillarStatusText.textContent = `已選 ${count} 柱，尚缺「${missing.join('、')}」即可合算袁天罡總骨重。`;
        }
    }

    [shengxiaoSelect, ganzhiSelect, monthSelect, daySelect, hourMainSelect].forEach(sel => {
        if (!sel) return;
        sel.addEventListener('change', () => {
            syncHourDetailUI();
            updatePillarStatus();
        });
    });

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            syncHourDetailUI();
            updatePillarStatus();
        });
    }

    syncHourDetailUI();
    updatePillarStatus();

    // =========================================================
    // 5. 視覺強化：五行印記 & 批命箋四柱帳簿排版
    // =========================================================
    function decorateYearHeadings(container) {
        const headings = container.querySelectorAll('.result-block h3, .data-item-block h3');
        headings.forEach(h3 => {
            if (h3.dataset.decorated) return;
            const rawText = h3.textContent.trim();
            const match = rawText.match(/^(.+?年生)\s*\(肖(.)，五行屬(.)\)$/);
            if (match) {
                const [, yearLabel, shengxiao, wuxing] = match;
                h3.dataset.decorated = 'true';
                const card = h3.closest('.data-item-block, .result-block');
                if (card) card.dataset.shengxiao = shengxiao;

                h3.textContent = '';
                const mainSpan = document.createElement('span');
                mainSpan.textContent = yearLabel;

                const badgeGroup = document.createElement('span');
                badgeGroup.className = 'badge-group';

                const sxTag = document.createElement('span');
                sxTag.className = 'seal-tag';
                sxTag.textContent = `肖${shengxiao}`;

                const wxTag = document.createElement('span');
                wxTag.className = `seal-tag wuxing-${wuxing}`;
                wxTag.textContent = `五行屬${wuxing}`;

                badgeGroup.appendChild(sxTag);
                badgeGroup.appendChild(wxTag);
                h3.appendChild(mainSpan);
                h3.appendChild(badgeGroup);
            }
        });
    }

    function decorateBoneLedger(container) {
        const rows = container.querySelectorAll('.bone-weight-details p');
        rows.forEach(p => {
            if (p.dataset.decorated) return;
            const strong = p.querySelector('strong');
            if (!strong) return;

            const labelText = strong.textContent.replace(/[：:]\s*$/, '').trim();
            const valueText = p.textContent.replace(strong.textContent, '').trim();
            p.dataset.decorated = 'true';
            p.textContent = '';

            const labelEl = document.createElement('span');
            labelEl.className = 'bw-label';
            labelEl.textContent = labelText;

            const valueEl = document.createElement('span');
            valueEl.className = 'bw-value';
            valueEl.textContent = valueText;

            p.appendChild(labelEl);
            p.appendChild(valueEl);
        });
    }

    if (resultOutput) {
        const resultObserver = new MutationObserver(() => {
            if (!resultOutput.children.length) return;
            resultObserver.disconnect();
            decorateYearHeadings(resultOutput);
            decorateBoneLedger(resultOutput);
            resultObserver.observe(resultOutput, { childList: true });

            if (resultSection && !resultSection.classList.contains('hidden')) {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        resultObserver.observe(resultOutput, { childList: true });
    }

    // =========================================================
    // 6. 完整資料瀏覽：動態生成快速篩選與跳轉索引列
    // =========================================================
    function buildQuickIndexBar() {
        if (!quickIndexBar || !fullDataViewOutput || !fullDataViewTitle) return;
        const blocks = Array.from(fullDataViewOutput.querySelectorAll('.data-item-block'));
        if (!blocks.length) {
            quickIndexBar.innerHTML = '';
            quickIndexBar.classList.add('hidden');
            return;
        }

        const title = fullDataViewTitle.textContent || '';
        quickIndexBar.innerHTML = '';

        // 輔助：建立索引標籤
        function addLabel(text) {
            const span = document.createElement('span');
            span.className = 'quick-index-label';
            span.textContent = text;
            quickIndexBar.appendChild(span);
        }

        // 輔助：篩選模式按鈕
        function buildFilterChips(labelText, items, matchFn) {
            addLabel(labelText);
            const chips = [];

            items.forEach((item, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'index-chip' + (idx === 0 ? ' active' : '');
                btn.textContent = item.label;
                btn.addEventListener('click', () => {
                    chips.forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    blocks.forEach(block => {
                        const visible = item.value === 'ALL' ? true : matchFn(block, item.value);
                        block.classList.toggle('filter-hidden', !visible);
                    });
                });
                chips.push(btn);
                quickIndexBar.appendChild(btn);
            });
            quickIndexBar.classList.remove('hidden');
        }

        // 輔助：平滑跳轉模式按鈕
        function buildJumpChips(labelText, targets) {
            addLabel(labelText);
            targets.forEach(({ label, element }) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'index-chip';
                btn.textContent = label;
                btn.addEventListener('click', () => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                quickIndexBar.appendChild(btn);
            });
            quickIndexBar.classList.remove('hidden');
        }

        if (title.includes('「年」')) {
            const zodiacs = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
            const items = [{ label: `全部 (${blocks.length})`, value: 'ALL' }]
                .concat(zodiacs.map(z => ({ label: `肖${z}`, value: z })));
            buildFilterChips('依生肖篩選：', items, (block, val) => block.dataset.shengxiao === val);
        } else if (title.includes('稱骨') || title.includes('秤骨')) {
            const liangs = ['二', '三', '四', '五', '六', '七'];
            const items = [{ label: `全部 (${blocks.length})`, value: 'ALL' }]
                .concat(liangs.map(l => ({ label: `${l}兩`, value: l })));
            buildFilterChips('依骨重篩選：', items, (block, val) => {
                const h3 = block.querySelector('h3');
                return h3 ? h3.textContent.trim().startsWith(val) : false;
            });
        } else if (title.includes('「月」')) {
            const targets = blocks.map(block => {
                const h3 = block.querySelector('h3');
                const label = h3 ? h3.textContent.replace('生人', '').trim() : '';
                return { label, element: block };
            }).filter(t => t.label);
            buildJumpChips('快速跳轉：', targets);
        } else if (title.includes('「日」')) {
            const milestones = ['初一日', '初六日', '十一日', '十六日', '二十一日', '二十六日'];
            const targets = [];
            blocks.forEach(block => {
                const h3 = block.querySelector('h3');
                if (!h3) return;
                const found = milestones.find(m => h3.textContent.includes(m));
                if (found) targets.push({ label: found, element: block });
            });
            buildJumpChips('跳至區段：', targets);
        } else if (title.includes('「時辰」')) {
            const targets = blocks.map(block => {
                const h3 = block.querySelector('h3');
                const label = h3 ? h3.textContent.trim().slice(0, 2) : '';
                return { label, element: block };
            }).filter(t => t.label);
            buildJumpChips('快速跳轉：', targets);
        } else {
            quickIndexBar.classList.add('hidden');
        }
    }

    if (fullDataViewOutput) {
        const fullObserver = new MutationObserver(() => {
            if (!fullDataViewOutput.children.length) {
                if (quickIndexBar) {
                    quickIndexBar.innerHTML = '';
                    quickIndexBar.classList.add('hidden');
                }
                return;
            }
            fullObserver.disconnect();
            decorateYearHeadings(fullDataViewOutput);
            buildQuickIndexBar();
            fullObserver.observe(fullDataViewOutput, { childList: true });
        });
        fullObserver.observe(fullDataViewOutput, { childList: true });
    }
});