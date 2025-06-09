// fan666rog&Gemini編寫 (V2.5.1_Special Edition)
const wheelCanvas = document.getElementById('wheel');
const spinButton = document.getElementById('spin-button');
const resultDiv = document.getElementById('result');
const ctx = wheelCanvas.getContext('2d');

const prizeInputsWrapper = document.getElementById('prize-inputs-wrapper');
const addPrizeInputBtn = document.getElementById('add-prize-input-btn');
const updatePrizesBtn = document.getElementById('update-prizes-btn');
const removeAfterHitCheckbox = document.getElementById('remove-after-hit');

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
let prizeHistory = [];
let totalDrawsMade = 0; 

let prizes = [
    { name: "頭獎", color: "#f39c12", weight: 5 },
    { name: "二獎", color: "#e74c3c", weight: 10 },
    { name: "三獎", color: "#9b59b6", weight: 15 },
    { name: "四獎", color: "#3498db", weight: 20 },
    { name: "銘謝惠顧", color: "#1abc9c", weight: 50 },
    { name: "再來一次", color: "#2ecc71", weight: 25 }
];
let currentPrizesOnWheel = JSON.parse(JSON.stringify(prizes)); 

let isSpinning = false;
let currentRotation = 0; 
let wheelRadius;

const fallbackColorCycle = ['#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#2ecc71', '#f1c40f', '#d35400', '#34495e', '#c0392b'];
let fallbackColorIndex = 0;

function getNextFallbackColor() {
    const color = fallbackColorCycle[fallbackColorIndex % fallbackColorCycle.length];
    fallbackColorIndex++;
    return color;
}

function createPrizeInputItem(prizeObject = { name: "", color: "", weight: 10 }) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('prize-input-item');

    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.placeholder = `獎品 ${prizeInputsWrapper.children.length + 1}`;
    inputName.value = prizeObject.name || "";
    inputName.classList.add('prize-name-input');

    const inputWeight = document.createElement('input');
    inputWeight.type = 'number';
    inputWeight.min = '1';
    inputWeight.max = '99';
    inputWeight.value = prizeObject.weight || 10;
    inputWeight.title = "設定權重 (1-99)，數字越大機率越高";
    inputWeight.classList.add('prize-weight-input');

    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    inputColor.value = prizeObject.color || getNextFallbackColor();
    inputColor.classList.add('prize-color-input');
    inputColor.title = "選擇獎項顏色";
    
    inputWeight.addEventListener('blur', () => {
        const weightValue = parseInt(inputWeight.value, 10);
        if (isNaN(weightValue) || weightValue < 1) {
            inputWeight.value = '1'; 
        }
        if (weightValue > 99) {
            inputWeight.value = '99';
        }
    });

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-prize-btn');
    removeBtn.textContent = '刪除';
    removeBtn.onclick = () => {
        itemDiv.remove();
        updatePrizePlaceholders();
    };

    itemDiv.appendChild(inputName);
    itemDiv.appendChild(inputWeight);
    itemDiv.appendChild(inputColor);
    itemDiv.appendChild(removeBtn);
    prizeInputsWrapper.appendChild(itemDiv);
}

function updatePrizePlaceholders() {
    Array.from(prizeInputsWrapper.children).forEach((item, index) => {
        const nameInput = item.querySelector('.prize-name-input');
        if (nameInput) {
            nameInput.placeholder = `獎品 ${index + 1}`;
        }
    });
}

if (addPrizeInputBtn) {
    addPrizeInputBtn.addEventListener('click', () => {
        if (prizeInputsWrapper.children.length < 15) { 
            createPrizeInputItem({ name: "", color: getNextFallbackColor(), weight: 10 });
        } else {
            alert("最多設定15個獎項！"); 
        }
    });
}

if (updatePrizesBtn) {
    updatePrizesBtn.addEventListener('click', () => {
        const newPrizes = [];
        fallbackColorIndex = 0;
        Array.from(prizeInputsWrapper.children).forEach(item => {
            const prizeNameInput = item.querySelector('.prize-name-input');
            const prizeWeightInput = item.querySelector('.prize-weight-input');
            const prizeColorInput = item.querySelector('.prize-color-input');
            if (prizeNameInput && prizeColorInput && prizeWeightInput) {
                const prizeName = prizeNameInput.value.trim();
                const prizeWeight = parseInt(prizeWeightInput.value, 10);
                const prizeColor = prizeColorInput.value;
                if (prizeName) {
                    newPrizes.push({ name: prizeName, color: prizeColor || getNextFallbackColor(), weight: Math.max(1, prizeWeight || 1) });
                }
            }
        });

        if (newPrizes.length < 2) {
            alert("請至少設定兩個獎項！");
            return;
        }
        prizes = newPrizes;
        currentPrizesOnWheel = JSON.parse(JSON.stringify(prizes));
        currentRotation = 0;
        if (wheelCanvas) {
          wheelCanvas.style.transform = `rotate(0deg)`;
        }
        drawWheel();
        if (spinButton) {
            spinButton.disabled = false;
        }
        if (resultDiv) {
            resultDiv.textContent = "";
        }
    });
}

function initializePrizeInputs() {
    if (!prizeInputsWrapper) return;
    prizeInputsWrapper.innerHTML = '';
    fallbackColorIndex = 0;
    prizes.forEach(prize => createPrizeInputItem(prize));
     if (prizes.length === 0) {
        createPrizeInputItem({ name: "", color: getNextFallbackColor(), weight: 10 });
        createPrizeInputItem({ name: "", color: getNextFallbackColor(), weight: 10 });
    } else if (prizes.length === 1) {
         createPrizeInputItem({ name: "", color: getNextFallbackColor(), weight: 10 });
    }
}

function drawWheel() {
    if (!wheelCanvas || !ctx) return;

    if (!wheelRadius || wheelRadius <= 0) {
        const container = document.getElementById('wheel-container');
        if(container && container.clientWidth > 0) {
            wheelCanvas.width = container.clientWidth;
            wheelCanvas.height = container.clientWidth;
            wheelRadius = wheelCanvas.width / 2;
        } else {
            setTimeout(drawWheel, 100);
            return;
        }
    }

    if (currentPrizesOnWheel.length === 0) {
        ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.max(12, wheelRadius * 0.1)}px Arial`;
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText("請設定獎項", wheelRadius, wheelRadius);
        ctx.restore();
        if (spinButton) spinButton.disabled = true;
        return;
    }
    if (spinButton) spinButton.disabled = isSpinning;

    const totalWeight = currentPrizesOnWheel.reduce((sum, prize) => sum + (prize.weight || 1), 0);
    if (totalWeight <= 0) return;

    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    
    let currentAngle_rad = 0;

    for (let i = 0; i < currentPrizesOnWheel.length; i++) {
        const prizeData = currentPrizesOnWheel[i];
        const prizeWeight = prizeData.weight || 1;
        const sectorColor = prizeData.color || getNextFallbackColor();

        const sectorAngle_rad = (prizeWeight / totalWeight) * (2 * Math.PI);
        const startAngle_rad = currentAngle_rad;
        const endAngle_rad = startAngle_rad + sectorAngle_rad;

        ctx.beginPath();
        ctx.moveTo(wheelRadius, wheelRadius);
        ctx.arc(wheelRadius, wheelRadius, wheelRadius * 0.98, startAngle_rad, endAngle_rad);
        ctx.closePath();
        ctx.fillStyle = sectorColor;
        ctx.fill();

        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = Math.max(1, wheelRadius * 0.015);
        ctx.beginPath();
        ctx.moveTo(wheelRadius, wheelRadius);
        ctx.arc(wheelRadius, wheelRadius, wheelRadius * 0.98, startAngle_rad, endAngle_rad);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(wheelRadius, wheelRadius);
        ctx.rotate(startAngle_rad + sectorAngle_rad / 2);

        const text = prizeData.name;
        const maxTextWidth = wheelRadius * 0.7; 
        let fontSize = Math.max(10, wheelRadius * 0.07);
        ctx.font = `bold ${fontSize}px Arial`;

        while (ctx.measureText(text).width > maxTextWidth && fontSize > 8) {
            fontSize -=1;
            ctx.font = `bold ${fontSize}px Arial`;
        }

        let displayText = text;
        if (ctx.measureText(text).width > maxTextWidth) {
            let chars = 0;
            for (chars = text.length; chars > 0; chars--) {
                if (ctx.measureText(text.substring(0, chars) + "...").width <= maxTextWidth) {
                    displayText = text.substring(0, chars) + "...";
                    break;
                }
            }
            if (chars === 0) displayText = "...";
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const r = parseInt(sectorColor.substr(1, 2), 16);
        const g = parseInt(sectorColor.substr(3, 2), 16);
        const b = parseInt(sectorColor.substr(5, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        ctx.fillStyle = brightness > 125 ? 'black' : 'white';

        const textX = wheelRadius * 0.85;
        ctx.fillText(displayText, textX, 0);
        ctx.restore();
        
        currentAngle_rad = endAngle_rad;
    }
    
    ctx.beginPath();
    ctx.arc(wheelRadius, wheelRadius, wheelRadius * 0.99, 0, 2 * Math.PI, false); 
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; 
    ctx.lineWidth = wheelRadius * 0.03; 
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wheelRadius, wheelRadius, wheelRadius * 0.97, 0, 2 * Math.PI, false); 
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
    ctx.lineWidth = wheelRadius * 0.015; 
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wheelRadius, wheelRadius, wheelRadius * 0.1, 0, 2 * Math.PI, false); 
    const grad = ctx.createRadialGradient(wheelRadius, wheelRadius, wheelRadius * 0.02, wheelRadius, wheelRadius, wheelRadius * 0.1);
    grad.addColorStop(0, '#aeaebf'); 
    grad.addColorStop(0.7, '#888899');
    grad.addColorStop(1, '#555566'); 
    ctx.fillStyle = grad; 
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wheelRadius - wheelRadius * 0.02, wheelRadius - wheelRadius * 0.02, wheelRadius * 0.03, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
}

function spinWheel() {
    if (isSpinning || currentPrizesOnWheel.length === 0) return;
    if (currentPrizesOnWheel.length === 1 && removeAfterHitCheckbox && removeAfterHitCheckbox.checked) {
        if (resultDiv) resultDiv.textContent = `最後獎項：${currentPrizesOnWheel[0].name}`;
        if (spinButton) spinButton.disabled = true;
        return;
    }

    isSpinning = true;
    if (spinButton) spinButton.disabled = true;
    if (resultDiv) {
        resultDiv.classList.remove('animate-winner');
        resultDiv.textContent = "轉動中...";
    }

    const baseRotation_deg = 360 * (Math.floor(Math.random() * 3) + 7);
    const randomStopAngle_deg = Math.random() * 360;
    const finalTargetRotation_deg = baseRotation_deg + randomStopAngle_deg;

    const animationDuration = Math.max(4000, Math.min(7000, currentPrizesOnWheel.length * 350 + Math.random() * 1500));
    const startTime = performance.now();
    const startRotationForAnimation = currentRotation;

    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        let progress = elapsedTime / animationDuration;
        if (progress >= 1) progress = 1;

        const easedProgress = 1 - Math.pow(1 - progress, 4);
        const rotationThisFrame_deg = startRotationForAnimation + (finalTargetRotation_deg - startRotationForAnimation) * easedProgress;

        if (wheelCanvas) wheelCanvas.style.transform = `rotate(${rotationThisFrame_deg}deg)`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            currentRotation = (finalTargetRotation_deg % 360 + 360) % 360;
            if (wheelCanvas) wheelCanvas.style.transform = `rotate(${currentRotation}deg)`;
            
            const pointerCorrection_deg = 270; 
            const pointerAngle_deg = (360 - currentRotation + pointerCorrection_deg) % 360;
            
            const winningAngle_rad = pointerAngle_deg * (Math.PI / 180);

            const totalWeight = currentPrizesOnWheel.reduce((sum, prize) => sum + (prize.weight || 1), 0);
            let cumulativeAngle_rad = 0;
            let winningPrize = null;
            let prizeIndex = -1;

            for (let i = 0; i < currentPrizesOnWheel.length; i++) {
                const prizeData = currentPrizesOnWheel[i];
                const prizeWeight = prizeData.weight || 1;
                const sectorAngle_rad = (prizeWeight / totalWeight) * (2 * Math.PI);
                
                if (winningAngle_rad >= cumulativeAngle_rad && winningAngle_rad < cumulativeAngle_rad + sectorAngle_rad) {
                    winningPrize = prizeData;
                    prizeIndex = i;
                    break;
                }
                cumulativeAngle_rad += sectorAngle_rad;
            }

            if (winningPrize) {
                if (resultDiv) {
                    resultDiv.textContent = `恭喜抽中：${winningPrize.name}!`;
                    resultDiv.classList.remove('animate-winner');
                    void resultDiv.offsetWidth; 
                    resultDiv.classList.add('animate-winner');
                }
                
                totalDrawsMade++;
                const historyEntry = { 
                    name: winningPrize.name, 
                    color: winningPrize.color, 
                    drawNumber: totalDrawsMade
                };
                prizeHistory.unshift(historyEntry);
                if (prizeHistory.length > 20) prizeHistory.pop();
                saveHistory();
                updateHistoryDisplay();

                isSpinning = false;

                if (removeAfterHitCheckbox && removeAfterHitCheckbox.checked) {
                    if (prizeIndex > -1) {
                        currentPrizesOnWheel.splice(prizeIndex, 1);
                    }

                    if (currentPrizesOnWheel.length > 0) {
                        setTimeout(() => {
                            drawWheel();
                            if (currentPrizesOnWheel.length === 1 && removeAfterHitCheckbox.checked) {
                                if (resultDiv) resultDiv.textContent += ` (剩餘最後獎項：${currentPrizesOnWheel[0].name})`;
                                if (spinButton) spinButton.disabled = true;
                            } else {
                                if (spinButton) spinButton.disabled = false;
                            }
                        }, 1000);
                    } else {
                        if (resultDiv) resultDiv.textContent += " 所有獎項已抽完！";
                        drawWheel();
                        if (spinButton) spinButton.disabled = true;
                    }
                } else {
                    if (spinButton) spinButton.disabled = false;
                }
            } else {
                resultDiv.textContent = "抽獎出錯，請重試！";
                isSpinning = false;
                if (spinButton) spinButton.disabled = false;
            }
        }
    }
    requestAnimationFrame(animate);
}

if (spinButton) {
    spinButton.addEventListener('click', spinWheel);
}

function updateHistoryDisplay() {
    if (!historyList) return;
    historyList.innerHTML = ''; 
    if (prizeHistory.length === 0) {
        const emptyMsg = document.createElement('li');
        emptyMsg.textContent = "(目前沒有中獎紀錄)";
        emptyMsg.classList.add('empty-history-message');
        historyList.appendChild(emptyMsg);
         historyList.style.justifyContent = 'center';
    } else {
        historyList.style.justifyContent = 'flex-start';
        prizeHistory.forEach(entry => { 
            const listItem = document.createElement('li');
            listItem.textContent = `第 ${entry.drawNumber} 次：${entry.name}`;
            historyList.appendChild(listItem);
        });
    }
    if (clearHistoryBtn) {
        clearHistoryBtn.style.display = prizeHistory.length > 0 ? 'block' : 'none';
    }
}

function loadHistory() {
    const savedHistory = localStorage.getItem('wheelPrizeHistoryV2.2'); 
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory)) {
                prizeHistory = parsedHistory;
                if (prizeHistory.length > 0 && prizeHistory[0].drawNumber) {
                    totalDrawsMade = prizeHistory[0].drawNumber;
                } else {
                    totalDrawsMade = 0; 
                }
            } else {
                prizeHistory = [];
                totalDrawsMade = 0;
            }
        } catch (e) {
            prizeHistory = [];
            totalDrawsMade = 0;
        }
    }
    updateHistoryDisplay();
}

function saveHistory() {
    localStorage.setItem('wheelPrizeHistoryV2.2', JSON.stringify(prizeHistory));
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        prizeHistory = [];
        totalDrawsMade = 0; 
        saveHistory();
        updateHistoryDisplay();
    });
}

function resizeCanvas() {
    const container = document.getElementById('wheel-container');
    if (!container) {
        return;
    }
    if (wheelCanvas && container.clientWidth > 0) {
        wheelCanvas.width = container.clientWidth;
        wheelCanvas.height = container.clientWidth;
        wheelRadius = wheelCanvas.width / 2;

        if (wheelRadius > 0) {
            drawWheel();
        }
    }
}

window.addEventListener('resize', resizeCanvas);

document.addEventListener('DOMContentLoaded', () => {
    
    const toggleInstructionsBtn = document.getElementById('toggle-instructions-btn');
    const instructionsContent = document.getElementById('instructions-content');


    const allElementsPresent = wheelCanvas && prizeInputsWrapper && addPrizeInputBtn &&
                             updatePrizesBtn && spinButton && resultDiv && ctx &&
                             historyList && clearHistoryBtn && removeAfterHitCheckbox &&
                             toggleInstructionsBtn && instructionsContent;

    if (allElementsPresent) {
        initializePrizeInputs();
        loadHistory();
        resizeCanvas();

        toggleInstructionsBtn.addEventListener('click', () => {
            const isHidden = instructionsContent.classList.toggle('hidden');
            toggleInstructionsBtn.textContent = isHidden ? '顯示使用說明' : '隱藏使用說明';
        });

    } else {
        console.error("一個或多個必要的DOM元素在DOMContentLoaded時未找到。");
        setTimeout(() => {
             const stillMissingCheck = !document.getElementById('wheel') || !document.getElementById('prize-inputs-wrapper') ||
                                 !document.getElementById('add-prize-input-btn') || !document.getElementById('update-prizes-btn') ||
                                 !document.getElementById('spin-button') || !document.getElementById('result') ||
                                 !document.getElementById('history-list') || !document.getElementById('clear-history-btn') ||
                                 !document.getElementById('remove-after-hit') || !wheelCanvas.getContext('2d') ||
                                 !toggleInstructionsBtn || !instructionsContent;
            if(stillMissingCheck){
                console.error("關鍵DOM元素在重試後仍然缺失。請檢查HTML檔案中的ID是否正確。");
            } else {
               initializePrizeInputs();
               loadHistory();
               resizeCanvas();
               toggleInstructionsBtn.addEventListener('click', () => {
                   const isHidden = instructionsContent.classList.toggle('hidden');
                   toggleInstructionsBtn.textContent = isHidden ? '顯示使用說明' : '隱藏使用說明';
               });
            }
        }, 200);
    }
});