document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const winDisplay = document.getElementById('win-display');
    const creditDisplay = document.getElementById('credit-display');
    const mainBoard = document.getElementById('main-board');
    const bettingArea = document.getElementById('betting-area');
    const messageBar = document.getElementById('message-bar');
    const startButton = document.getElementById('start-button');
    const collectButton = document.getElementById('collect-button');
    const clearButton = document.getElementById('clear-button');
    const doubleBigButton = document.getElementById('double-big-button');
    const doubleSmallButton = document.getElementById('double-small-button');
    const doubleUpDigit = document.getElementById('double-up-digit');
    const jpDigit = document.getElementById('jp-digit');
    const bonusLamp = document.getElementById('bonus-lamp');
    const soundToggleBtn = document.getElementById('sound-toggle');
    const momMoneyBtn = document.getElementById('mom-money-btn');
    const helpButton = document.getElementById('help-button');
    const helpModal = document.getElementById('help-modal');
    const closeHelpButton = document.getElementById('close-help-button');

    // --- 8-bit 復古電子音效合成器 (Web Audio API) ---
    let soundEnabled = true;
    let audioCtx = null;

    function playTone(freq, duration = 0.06, type = 'square', volume = 0.08) {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }

    function playWinFanfare() {
        const notes = [523, 659, 784, 1046];
        notes.forEach((n, idx) => setTimeout(() => playTone(n, 0.14, 'square', 0.1), idx * 90));
    }

    function playTrainSiren() {
        const notes = [440, 880, 440, 880, 660, 1320];
        notes.forEach((n, idx) => setTimeout(() => playTone(n, 0.12, 'sawtooth', 0.1), idx * 80));
    }

    // --- 遊戲狀態與存檔讀取 ---
    let credits = parseInt(localStorage.getItem('littleMary_credits'), 10);
    if (isNaN(credits)) credits = 100; // 預設 100 枚代幣（符合真實 1 分 1 幣手感）
    let jpCount = parseInt(localStorage.getItem('littleMary_jp'), 10) || 0;

    let currentWin = 0;
    let isSpinning = false;
    let bets = {};
    let lastBets = {}; // 記憶上一局押分，支援懶人直接按開始續押
    let lastWinIndex = 0;

    // 24 格經典跑道配置 (附帶權重與小賠率標示)
    const trackConfig = [
        { icon: '🍎', name: 'Apple', payout: 5, weight: 16 },
        { icon: '🍉', name: 'Watermelon', payout: 20, weight: 6 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 },
        { icon: 'BAR', name: 'BAR', payout: 50, weight: 2 },
        { icon: '⭐', name: 'Star', payout: 30, weight: 4 },
        { icon: '🔔', name: 'Bell', payout: 15, weight: 8 },
        { icon: '🍉', name: 'Watermelon', payout: 20, weight: 6 },
        { icon: '🍋', name: 'Lemon', payout: 2, weight: 22 },
        { icon: '🍎', name: 'Apple', payout: 5, weight: 16 },
        { icon: '🔄', name: 'Once More', type: 'bonus', weight: 7 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 },
        { icon: '🍋', name: 'Lemon', payout: 2, weight: 22 },
        { icon: '🍉', name: 'Watermelon', payout: 20, weight: 6 },
        { icon: '🔔', name: 'Bell', payout: 15, weight: 8 },
        { icon: '🍎', name: 'Apple', payout: 5, weight: 16 },
        { icon: '❼❼', name: '77', payout: 40, weight: 3 },
        { icon: '⭐', name: 'Star', payout: 30, weight: 4 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 },
        { icon: '🍎', name: 'Apple', payout: 5, weight: 16 },
        { icon: '🍋', name: 'Lemon', payout: 2, weight: 22 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 },
        { icon: '🔄', name: 'Once More', type: 'bonus', weight: 7 },
        { icon: '🔔', name: 'Bell', payout: 15, weight: 8 },
        { icon: '🍋', name: 'Lemon', payout: 2, weight: 22 },
    ];

    // 8 個押注項目 (由高賠率至低賠率或依經典排列)
    const bettingSymbols = [
        { icon: 'BAR', name: 'BAR', payout: 50 },
        { icon: '❼❼', name: '77', payout: 40 },
        { icon: '⭐', name: 'Star', payout: 30 },
        { icon: '🍉', name: 'Watermelon', payout: 20 },
        { icon: '🔔', name: 'Bell', payout: 15 },
        { icon: '🍊', name: 'Orange', payout: 10 },
        { icon: '🍎', name: 'Apple', payout: 5 },
        { icon: '🍋', name: 'Lemon', payout: 2 },
    ];

    let trackItems = [];

    function saveState() {
        localStorage.setItem('littleMary_credits', credits);
        localStorage.setItem('littleMary_jp', jpCount);
    }

    function initGame() {
        createBoard();
        createBettingArea();
        updateDisplays();
        setButtonsState(false, false);

        // 事件綁定
        startButton.addEventListener('click', handleStart);
        collectButton.addEventListener('click', handleCollect);
        clearButton.addEventListener('click', handleClearBets);
        doubleBigButton.addEventListener('click', () => handleDoubleUp('big'));
        doubleSmallButton.addEventListener('click', () => handleDoubleUp('small'));

        soundToggleBtn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundToggleBtn.textContent = soundEnabled ? '🔊 音效: 開' : '🔇 音效: 關';
            if (soundEnabled) playTone(660, 0.08);
        });

        momMoneyBtn.addEventListener('click', () => {
            if (isSpinning) return;
            if (credits >= 50) {
                messageBar.textContent = '媽媽說：你口袋明明還有錢，不准亂要！';
                playTone(200, 0.15, 'sawtooth');
                return;
            }
            credits += 100;
            saveState();
            updateDisplays();
            playWinFanfare();
            messageBar.textContent = '獲得媽媽贊助的 100 枚零用錢代幣！';
        });

        helpButton.addEventListener('click', () => { helpModal.style.display = 'flex'; });
        closeHelpButton.addEventListener('click', () => { helpModal.style.display = 'none'; });
        helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; });
    }

    function createBoard() {
        mainBoard.querySelectorAll('.track-item').forEach(item => item.remove());
        trackItems = [];
        const gridPositions = [
            '1/1','1/2','1/3','1/4','1/5','1/6','1/7',
            '2/7','3/7','4/7','5/7','6/7',
            '7/7','7/6','7/5','7/4','7/3','7/2','7/1',
            '6/1','5/1','4/1','3/1','2/1'
        ];
        trackConfig.forEach((config, index) => {
            const item = document.createElement('div');
            item.classList.add('track-item');
            item.style.gridArea = gridPositions[index];
            const oddsLabel = config.payout ? `<span class="mini-odds">x${config.payout}</span>` : `<span class="mini-odds">送燈</span>`;
            item.innerHTML = `<div>${config.icon}</div>${oddsLabel}`;
            mainBoard.appendChild(item);
            trackItems.push({ ...config, element: item, index });
        });
        trackItems[0].element.classList.add('active');
    }

    function createBettingArea() {
        bettingArea.innerHTML = '';
        bettingSymbols.forEach(symbol => {
            bets[symbol.name] = 0;
            lastBets[symbol.name] = 0;
            const betItem = document.createElement('div');
            betItem.classList.add('bet-item');
            betItem.dataset.symbol = symbol.name;
            betItem.innerHTML = `
                <div class="bet-header">
                    <span class="bet-icon">${symbol.icon}</span>
                    <span class="bet-payout">x${symbol.payout}</span>
                </div>
                <div class="bet-amount" data-symbol-display="${symbol.name}">00</div>
            `;
            // 點擊直接加注 1 分
            betItem.addEventListener('click', () => addBet(symbol.name));
            bettingArea.appendChild(betItem);
        });
    }

    function addBet(symbolName) {
        if (isSpinning) return;
        // 若 WIN 區還有未領取的贏分，先自動幫玩家收進口袋
        if (currentWin > 0) {
            credits += currentWin;
            currentWin = 0;
            setButtonsState(false, false);
        }
        if (bets[symbolName] >= 99) {
            messageBar.textContent = '單項押分上限為 99 分！';
            return;
        }
        if (credits < 1) {
            messageBar.textContent = '代幣不足！請按右上角「🪙 領零用錢」補幣！';
            playTone(180, 0.15, 'sawtooth');
            return;
        }
        credits -= 1;
        bets[symbolName] += 1;
        playTone(520 + bets[symbolName] * 15, 0.04);
        updateBetDisplay(symbolName);
        updateDisplays();
    }

    function handleClearBets() {
        if (isSpinning) return;
        let refunded = 0;
        Object.keys(bets).forEach(name => {
            refunded += bets[name];
            bets[name] = 0;
            updateBetDisplay(name);
        });
        if (refunded > 0) {
            credits += refunded;
            playTone(300, 0.08);
            messageBar.textContent = `已退還押注 ${refunded} 分，請重新押分。`;
            updateDisplays();
        } else {
            messageBar.textContent = '目前沒有押注可清除。';
        }
    }

    function updateBetDisplay(symbolName) {
        const amountDisplay = bettingArea.querySelector(`.bet-amount[data-symbol-display="${symbolName}"]`);
        const itemBox = bettingArea.querySelector(`.bet-item[data-symbol="${symbolName}"]`);
        if (amountDisplay) {
            amountDisplay.textContent = String(bets[symbolName]).padStart(2, '0');
        }
        if (itemBox) {
            itemBox.classList.toggle('has-bet', bets[symbolName] > 0);
        }
    }

    function updateDisplays() {
        winDisplay.textContent = String(currentWin).padStart(4, '0');
        creditDisplay.textContent = String(credits).padStart(4, '0');
        if (jpDigit) jpDigit.textContent = jpCount;
        if (bonusLamp) {
            if (jpCount >= 6) {
                bonusLamp.textContent = `🔥 差 1 點觸發火車連莊！`;
                bonusLamp.classList.add('active');
            } else {
                bonusLamp.textContent = `🚂 火車集氣: ${jpCount} / 7`;
                bonusLamp.classList.remove('active');
            }
        }
        saveState();
    }

    function setButtonsState(spinning, inDoubleUp = false) {
        isSpinning = spinning;
        startButton.disabled = spinning;
        collectButton.disabled = spinning || !inDoubleUp;
        doubleBigButton.disabled = spinning || !inDoubleUp;
        doubleSmallButton.disabled = spinning || !inDoubleUp;
        clearButton.disabled = spinning || inDoubleUp;
        bettingArea.style.pointerEvents = spinning ? 'none' : 'auto';
    }

    function weightedPick() {
        const pool = trackItems.flatMap(item => Array(item.weight || 1).fill(item));
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // --- 開始轉動 (支援自動收取贏分與自動續押上一局) ---
    async function handleStart() {
        if (isSpinning) return;

        // 1. 如果剛贏錢還沒收，按開始直接幫收進 CREDIT
        if (currentWin > 0) {
            credits += currentWin;
            currentWin = 0;
            updateDisplays();
        }

        // 2. 檢查是否有押分；若為 0，嘗試自動續押上一局配置
        let totalBet = Object.values(bets).reduce((sum, v) => sum + v, 0);
        if (totalBet === 0) {
            const lastTotal = Object.values(lastBets).reduce((sum, v) => sum + v, 0);
            if (lastTotal > 0) {
                if (credits >= lastTotal) {
                    credits -= lastTotal;
                    Object.keys(lastBets).forEach(k => {
                        bets[k] = lastBets[k];
                        updateBetDisplay(k);
                    });
                    totalBet = lastTotal;
                    updateDisplays();
                } else {
                    messageBar.textContent = '代幣不足以自動續押，請手動押分或領零用錢！';
                    playTone(180, 0.15, 'sawtooth');
                    return;
                }
            } else {
                messageBar.textContent = '請先點擊下方水果圖示押分！';
                playTone(220, 0.1, 'sawtooth');
                return;
            }
        }

        // 紀錄本局押分作為下一局續押依據
        Object.keys(bets).forEach(k => { lastBets[k] = bets[k]; });

        // 清除盤面殘留的多燈特效
        trackItems.forEach(item => item.element.classList.remove('bonus-hit'));

        setButtonsState(true, false);

        // 累積 JP 火車氣條（總押分達 5 分以上或隨機集氣）
        if (totalBet >= 5 || Math.random() < 0.45) {
            jpCount = Math.min(7, jpCount + 1);
            updateDisplays();
        }

        // 判斷是否觸發「火車連莊大送燈 (JP 集滿 7)」
        if (jpCount >= 7) {
            jpCount = 0;
            updateDisplays();
            playTrainSiren();
            bonusLamp.textContent = '🚂 火車大連莊出動！！';
            bonusLamp.classList.add('active');
            messageBar.textContent = '⚡ 觸發【火車連莊送燈】！一次噴出 3 顆獎燈！';
            await runMultiSpin(3);
            bonusLamp.classList.remove('active');
            updateDisplays();
            return;
        }

        // 一般單燈轉動
        messageBar.textContent = '跑燈轉動中...';
        const result = weightedPick();
        await animateSpinTo(result.index);
        await evaluateSingleResult(result);
    }

    // 跑道單燈轉動動畫
    function animateSpinTo(targetIndex) {
        return new Promise(resolve => {
            let currentIndex = lastWinIndex;
            const laps = 2;
            const stepsToTarget = (targetIndex - currentIndex + trackItems.length) % trackItems.length;
            const totalSteps = laps * trackItems.length + stepsToTarget;
            let stepCount = 0;
            let speed = 38;

            function step() {
                trackItems.forEach(item => item.element.classList.remove('active'));
                trackItems[currentIndex].element.classList.add('active');
                playTone(320 + (currentIndex % 8) * 35, 0.03, 'square', 0.05);

                lastWinIndex = currentIndex;
                if (stepCount >= totalSteps) {
                    resolve();
                    return;
                }
                stepCount++;
                // 最後 10 步逐漸減速營造緊張感
                if ( totalSteps - stepCount < 10 ) {
                    speed += 24;
                }
                currentIndex = (currentIndex + 1) % trackItems.length;
                setTimeout(step, speed);
            }
            step();
        });
    }

    // 處理單燈結果
    async function evaluateSingleResult(result) {
        if (result.type === 'bonus') {
            // 中了 ONCE MORE：不扣押分，並隨機送出 1~2 顆「天女散花」免費燈
            playTrainSiren();
            const extraLights = Math.random() < 0.5 ? 2 : 1;
            messageBar.textContent = `🔄 中了 ONCE MORE！免費加送 ${extraLights} 顆燈！`;
            await new Promise(r => setTimeout(r, 700));
            await runMultiSpin(extraLights);
            return;
        }

        const betUnits = bets[result.name] || 0;
        const winAmount = betUnits * result.payout;

        // 清空檯面押分（但 lastBets 已記住，按開始可直接續押）
        Object.keys(bets).forEach(k => { bets[k] = 0; updateBetDisplay(k); });

        if (winAmount > 0) {
            currentWin = winAmount;
            playWinFanfare();
            messageBar.textContent = `🎉 擊中 ${result.icon} (x${result.payout})！贏得 ${currentWin} 分！可比大小或直接開始`;
            setButtonsState(false, true);
        } else {
            playTone(160, 0.2, 'sawtooth', 0.07);
            messageBar.textContent = `停在 ${result.icon}，沒押中！按「開始」自動續押再戰！`;
            setButtonsState(false, false);
        }
        updateDisplays();
    }

    // 火車連莊 / 天女散花多燈開獎邏輯
    async function runMultiSpin(lightCount) {
        let totalMultiWin = 0;
        let hitIcons = [];

        // 選出不重複的獎項格（排除 Once More 避免無限迴圈）
        const normalPool = trackItems.filter(i => i.type !== 'bonus');
        const chosenTargets = [];
        for (let i = 0; i < lightCount; i++) {
            const pick = normalPool[Math.floor(Math.random() * normalPool.length)];
            chosenTargets.push(pick);
        }

        for (let i = 0; i < chosenTargets.length; i++) {
            const target = chosenTargets[i];
            await animateSpinTo(target.index);
            target.element.classList.add('bonus-hit');
            playTone(880, 0.15, 'square', 0.12);

            const betUnits = bets[target.name] || 0;
            if (betUnits > 0) {
                const w = betUnits * target.payout;
                totalMultiWin += w;
                hitIcons.push(`${target.icon}+${w}`);
            }
            await new Promise(r => setTimeout(r, 350));
        }

        // 結算本局押分
        Object.keys(bets).forEach(k => { bets[k] = 0; updateBetDisplay(k); });

        if (totalMultiWin > 0) {
            currentWin = totalMultiWin;
            playWinFanfare();
            messageBar.textContent = `🎊 送燈大豐收 (${hitIcons.join(', ')}) 共贏 ${currentWin} 分！`;
            setButtonsState(false, true);
        } else {
            messageBar.textContent = `送出 ${lightCount} 顆燈但都完美閃過你的押注... 按開始續押！`;
            setButtonsState(false, false);
        }
        updateDisplays();
    }

    // 比大小 (1-4 小, 6-9 大, 5 莊家通殺)
    async function handleDoubleUp(choice) {
        if (isSpinning || currentWin <= 0) return;
        setButtonsState(true, true);
        messageBar.textContent = '🎲 比大小搖號中...';

        const roll = Math.floor(Math.random() * 9) + 1;
        await runDigitAnimation(roll);

        let won = false;
        if (choice === 'big' && roll >= 6) won = true;
        if (choice === 'small' && roll <= 4) won = true;

        if (won) {
            currentWin *= 2;
            playWinFanfare();
            messageBar.textContent = `🎲 開出 ${roll}！彩金翻倍為 ${currentWin} 分！繼續比或按得分！`;
            setButtonsState(false, true);
        } else {
            currentWin = 0;
            playTone(130, 0.35, 'sawtooth', 0.12);
            messageBar.textContent = roll === 5
                ? `🎲 開出 5 點莊家通殺！彩金歸零...`
                : `🎲 開出 ${roll} 點猜錯了！彩金歸零...`;
            setButtonsState(false, false);
        }
        updateDisplays();
    }

    function runDigitAnimation(finalRoll) {
        return new Promise(resolve => {
            let elapsed = 0;
            const duration = 1100;
            const stepTime = 60;
            const timer = setInterval(() => {
                const r = Math.floor(Math.random() * 9) + 1;
                if (doubleUpDigit) doubleUpDigit.textContent = r;
                playTone(400 + r * 60, 0.03, 'triangle', 0.06);
                elapsed += stepTime;
                if (elapsed >= duration) {
                    clearInterval(timer);
                    if (doubleUpDigit) doubleUpDigit.textContent = finalRoll;
                    setTimeout(resolve, 250);
                }
            }, stepTime);
        });
    }

    function handleCollect() {
        if (isSpinning || currentWin <= 0) return;
        credits += currentWin;
        playWinFanfare();
        messageBar.textContent = `💰 已將 ${currentWin} 分收進代幣！按「開始」可直接續押。`;
        currentWin = 0;
        updateDisplays();
        setButtonsState(false, false);
    }

    initGame();
});
