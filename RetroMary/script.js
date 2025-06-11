document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const winDisplay = document.getElementById('win-display');
    const creditDisplay = document.getElementById('credit-display');
    const mainBoard = document.getElementById('main-board');
    const bettingArea = document.getElementById('betting-area');
    const messageBar = document.getElementById('message-bar');
    const startButton = document.getElementById('start-button');
    const collectButton = document.getElementById('collect-button');
    const doubleBigButton = document.getElementById('double-big-button');
    const doubleSmallButton = document.getElementById('double-small-button');
    const leaveButton = document.getElementById('leave-button');
    const doubleUpDigit = document.getElementById('double-up-digit');
    const helpButton = document.getElementById('help-button');
    const helpModal = document.getElementById('help-modal');
    const closeHelpButton = document.getElementById('close-help-button');

    // 遊戲狀態
    let credits = 1000;
    let currentWin = 0;
    let isSpinning = false;
    let bets = {};
    let lastWinIndex = 0;
    let jpCount = 0;
    let jpDigit;

    const trackConfig = [
        { icon: '🍎', name: 'Apple', payout: 5, weight: 15 }, { icon: '🍉', name: 'Watermelon', payout: 20, weight: 6 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 }, { icon: 'BAR', name: 'BAR', payout: 50, weight: 2 }, 
        { icon: '⭐', name: 'Star', payout: 30, weight: 5 }, { icon: '🔔', name: 'Bell', payout: 15, weight: 8 },
        { icon: '🍉', name: 'Watermelon', payout: 20, weight: 6 }, { icon: '🍋', name: 'Lemon', payout: 2, weight: 20 },
        { icon: '🍎', name: 'Apple', payout: 5, weight: 15 }, { icon: '🔄', name: 'Once More', type: 'bonus', weight: 8 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 }, { icon: '🍋', name: 'Lemon', payout: 2, weight: 20 },
        { icon: '🍉', name: 'Watermelon', payout: 20, weight: 6 }, { icon: '🔔', name: 'Bell', payout: 15, weight: 8 },
        { icon: '🍎', name: 'Apple', payout: 5, weight: 15 }, { icon: '❼❼', name: '77', payout: 40, weight: 3 },
        { icon: '⭐', name: 'Star', payout: 30, weight: 5 }, { icon: '🍊', name: 'Orange', payout: 10, weight: 12 },
        { icon: '🍎', name: 'Apple', payout: 5, weight: 15 }, { icon: '🍋', name: 'Lemon', payout: 2, weight: 20 },
        { icon: '🍊', name: 'Orange', payout: 10, weight: 12 }, { icon: '🔄', name: 'Once More', type: 'bonus', weight: 8 },
        { icon: '🔔', name: 'Bell', payout: 15, weight: 8 }, { icon: '🍋', name: 'Lemon', payout: 2, weight: 20 },
    ];
    
    const bettingSymbols = [
        { icon: '🍎', name: 'Apple', payout: 5 }, { icon: '🍊', name: 'Orange', payout: 10 },
        { icon: '🍋', name: 'Lemon', payout: 2 }, { icon: '🔔', name: 'Bell', payout: 15 },
        { icon: '🍉', name: 'Watermelon', payout: 20 }, { icon: '⭐', name: 'Star', payout: 30 },
        { icon: '❼❼', name: '77', payout: 40 }, { icon: 'BAR', name: 'BAR', payout: 50 },
    ];
    
    let trackItems = [];

    function initGame() {
        createBoard();
        createBettingArea();
        updateDisplays();
        setButtonsState(false);
        bettingArea.addEventListener('click', handleBettingAreaClick);
        startButton.addEventListener('click', handleStart);
        collectButton.addEventListener('click', handleCollect);
        doubleBigButton.addEventListener('click', () => handleDoubleUp('big'));
        doubleSmallButton.addEventListener('click', () => handleDoubleUp('small'));
        leaveButton.addEventListener('click', () => { window.close(); alert("掰掰！"); });
        helpButton.addEventListener('click', () => { helpModal.style.display = 'flex'; });
        closeHelpButton.addEventListener('click', () => { helpModal.style.display = 'none'; });
        helpModal.addEventListener('click', (event) => { if (event.target === helpModal) { helpModal.style.display = 'none'; } });
    }
    
    function createBoard() {
        const existingItems = mainBoard.querySelectorAll('.track-item');
        existingItems.forEach(item => item.remove());
        const gridPositions = ['1/1','1/2','1/3','1/4','1/5','1/6','1/7','2/7','3/7','4/7','5/7','6/7','7/7','7/6','7/5','7/4','7/3','7/2','7/1','6/1','5/1','4/1','3/1','2/1'];
        trackConfig.forEach((config, index) => {
            const item = document.createElement('div');
            item.classList.add('track-item');
            item.style.gridArea = gridPositions[index];
            item.innerHTML = config.icon;
            mainBoard.appendChild(item);
            trackItems.push({ ...config, element: item, index: index });
        });
        jpDigit = document.getElementById('jp-digit');
    }

    // --- 修改重點：重構 processResult 函式 ---
    function processResult(result) {
        lastWinIndex = result.index;
        const betUnits = bets[result.name] || 0;
        let winOnThisSymbol = 0;
        
        // 累積JP邏輯
        if (result.name === 'BAR' || result.name === '77') {
            jpCount++;
            if (jpCount >= 7) {
                jpCount = 0; 
                credits += 5000;
                messageBar.textContent = "恭喜！觸發JP大獎！贏得5000分！";
            }
            if(jpDigit) jpDigit.textContent = jpCount;
        }

        // 計算得分
        if (betUnits > 0 && result.payout) {
            const totalCreditsBetOnSymbol = betUnits * result.payout;
            winOnThisSymbol = result.payout * totalCreditsBetOnSymbol;
        }
        currentWin = winOnThisSymbol;

        // 根據結果類型決定下一步
        if (result.type === 'bonus') {
            // 中了「再來一次」，不清除押分，直接返回控制權給玩家
            messageBar.textContent = "中了 ONCE MORE！押分保留，請直接按 [開始]！";
            setButtonsState(false, false); // 解鎖所有按鈕
        } else {
            // 正常的輸贏回合，清除押分
            clearBets();
            if (currentWin > 0) {
                if(!messageBar.textContent.includes("JP")){
                    messageBar.textContent = `中了 ${result.icon}！贏得 ${currentWin} 分！`;
                }
                setButtonsState(false, true); // 進入比大小狀態
            } else if (!messageBar.textContent.includes("JP")) {
                 messageBar.textContent = `可惜，再接再厲！`;
                 setButtonsState(false, false); // 返回押分狀態
            }
        }
        updateDisplays();
    }


    // --- 以下是其他函式，為求程式完整性而保留 ---
    async function handleDoubleUp(choice){setButtonsState(true,true);messageBar.textContent="比大小中...";const roll=Math.floor(Math.random()*9)+1;let won=false;if(choice==='big'&&roll>=6)won=true;if(choice==='small'&&roll<=4)won=true;await Promise.all([runTrackAnimation(),runDigitAnimation(roll)]);if(won){currentWin*=2;messageBar.textContent=`開出 ${roll}！恭喜！彩金加倍為 ${currentWin}！`;updateDisplays();setButtonsState(false,true)}else{currentWin=0;messageBar.textContent=`開出 ${roll}！可惜，您輸了...`;updateDisplays();setButtonsState(false,false)}}
    function runTrackAnimation(){return new Promise(resolve=>{let currentIndex=lastWinIndex;const totalSteps=trackItems.length;let stepCount=0;let speed=40;function animate(){trackItems.forEach(item=>item.element.classList.remove('active'));trackItems[currentIndex].element.classList.add('active');stepCount++;if(stepCount>totalSteps){resolve();return}if(stepCount>totalSteps-5)speed+=30;currentIndex=(currentIndex+1)%trackItems.length;setTimeout(animate,speed)}animate()})}
    function runDigitAnimation(finalRoll){return new Promise(resolve=>{const animationDuration=1500;const intervalTime=50;let elapsed=0;const interval=setInterval(()=>{const randomDigit=Math.floor(Math.random()*9)+1;if(doubleUpDigit)doubleUpDigit.textContent=randomDigit;elapsed+=intervalTime;if(elapsed>=animationDuration){clearInterval(interval);if(doubleUpDigit)doubleUpDigit.textContent=finalRoll;setTimeout(resolve,500)}},intervalTime)})}
    function handleCollect(){credits+=currentWin;currentWin=0;messageBar.textContent="分數已存入！請繼續押分。";updateDisplays();setButtonsState(false,false)}
    function createBettingArea(){bettingArea.innerHTML='';bettingSymbols.forEach(symbol=>{bets[symbol.name]=0;const betItem=document.createElement('div');betItem.classList.add('bet-item');betItem.innerHTML=`<button class="bet-button bet-up-btn" data-symbol="${symbol.name}" data-action="up">▲</button><div class="bet-icon">${symbol.icon}</div><div class="bet-payout">${symbol.payout}</div><div class="bet-amount" data-symbol-display="${symbol.name}">0</div><button class="bet-button bet-down-btn" data-symbol="${symbol.name}" data-action="down">▼</button>`;bettingArea.appendChild(betItem)})}
    function handleBettingAreaClick(event){if(isSpinning)return;const target=event.target;if(!target.matches('.bet-button'))return;const symbolName=target.dataset.symbol;const action=target.dataset.action;if(action==='up')handleBetUp(symbolName);if(action==='down')handleBetDown(symbolName)}
    function handleBetUp(symbolName){const symbolInfo=bettingSymbols.find(s=>s.name===symbolName);const currentUnits=bets[symbolName];if(currentUnits>=9){messageBar.textContent="單項押分已達上限9次！";return}if(credits<symbolInfo.payout){messageBar.textContent="分數不足！";return}credits-=symbolInfo.payout;bets[symbolName]++;updateBetDisplay(symbolName);updateDisplays()}
    function handleBetDown(symbolName){const symbolInfo=bettingSymbols.find(s=>s.name===symbolName);const currentUnits=bets[symbolName];if(currentUnits<=0)return;credits+=symbolInfo.payout;bets[symbolName]--;updateBetDisplay(symbolName);updateDisplays()}
    function updateBetDisplay(symbolName){const amountDisplay=bettingArea.querySelector(`.bet-amount[data-symbol-display="${symbolName}"]`);if(amountDisplay)amountDisplay.textContent=bets[symbolName]}
    function clearBets(){Object.keys(bets).forEach(symbolName=>{bets[symbolName]=0;updateBetDisplay(symbolName)})}
    function setButtonsState(spinning,inDoubleUp=false){isSpinning=spinning;startButton.disabled=spinning||inDoubleUp;collectButton.disabled=spinning||!inDoubleUp;doubleBigButton.disabled=spinning||!inDoubleUp;doubleSmallButton.disabled=spinning||!inDoubleUp;bettingArea.style.pointerEvents=spinning?'none':'auto'}
    function updateDisplays(){winDisplay.textContent=String(currentWin).padStart(4,'0');creditDisplay.textContent=String(credits).padStart(4,'0')}
    function handleStart(){const totalBetUnits=Object.values(bets).reduce((sum,current)=>sum+current,0);if(isSpinning)return;if(totalBetUnits===0){messageBar.textContent="請先押分！";return}setButtonsState(true);messageBar.textContent="轉動中...";const outcomePool=trackItems.flatMap(item=>Array(item.weight||1).fill(item));const result=outcomePool[Math.floor(Math.random()*outcomePool.length)];const targetIndex=result.index;let lastActiveIndex=trackItems.findIndex(item=>item.element.classList.contains('active'));if(lastActiveIndex===-1){lastActiveIndex=0}let currentIndex=lastActiveIndex;const laps=3;const stepsToTarget=(targetIndex-currentIndex+trackItems.length)%trackItems.length;const totalSteps=laps*trackItems.length+stepsToTarget;let stepCount=0;let speed=60;function runAnimation(){trackItems[lastActiveIndex].element.classList.remove('active');trackItems[currentIndex].element.classList.add('active');lastActiveIndex=currentIndex;stepCount++;if(stepCount>totalSteps){processResult(result);return}if(stepCount>totalSteps-12){speed+=20}currentIndex=(currentIndex+1)%trackItems.length;setTimeout(runAnimation,speed)}runAnimation()}
    
    // 啟動遊戲
    initGame();
});