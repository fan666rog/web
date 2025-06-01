// fan666rog&Gemini編寫 (V2.5 最終修改版 + V1.1核心旋轉 + 自訂顏色)
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
    { name: "獎品1", color: "#f39c12" },
    { name: "獎品2", color: "#e74c3c" },
    { name: "獎品3", color: "#9b59b6" },
    { name: "獎品4", color: "#3498db" },
    { name: "獎品5", color: "#1abc9c" },
    { name: "獎品6", color: "#2ecc71" }
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

function createPrizeInputItem(prizeObject = { name: "", color: "" }) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('prize-input-item');

    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.placeholder = `獎品 ${prizeInputsWrapper.children.length + 1} 名稱`;
    inputName.value = prizeObject.name || "";
    inputName.classList.add('prize-name-input');

    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    inputColor.value = prizeObject.color || getNextFallbackColor();
    inputColor.classList.add('prize-color-input');
    inputColor.title = "選擇獎項顏色";

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-prize-btn');
    removeBtn.textContent = '刪除';
    removeBtn.onclick = () => {
        itemDiv.remove();
        updatePrizePlaceholders();
    };

    itemDiv.appendChild(inputName);
    itemDiv.appendChild(inputColor);
    itemDiv.appendChild(removeBtn);
    prizeInputsWrapper.appendChild(itemDiv);
}

function updatePrizePlaceholders() {
    Array.from(prizeInputsWrapper.children).forEach((item, index) => {
        const nameInput = item.querySelector('.prize-name-input');
        if (nameInput) {
            nameInput.placeholder = `獎品 ${index + 1} 名稱`;
        }
    });
}

if (addPrizeInputBtn) {
    addPrizeInputBtn.addEventListener('click', () => {
        if (prizeInputsWrapper.children.length < 15) { 
            createPrizeInputItem({ name: "", color: getNextFallbackColor() });
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
            const prizeColorInput = item.querySelector('.prize-color-input');
            if (prizeNameInput && prizeColorInput) {
                const prizeName = prizeNameInput.value.trim();
                const prizeColor = prizeColorInput.value;
                if (prizeName) {
                    newPrizes.push({ name: prizeName, color: prizeColor || getNextFallbackColor() });
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
        createPrizeInputItem({ name: "", color: getNextFallbackColor() });
        createPrizeInputItem({ name: "", color: getNextFallbackColor() });
    } else if (prizes.length === 1) {
         createPrizeInputItem({ name: "", color: getNextFallbackColor() });
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

    const numSectors = currentPrizesOnWheel.length;
    const anglePerSector_rad = (2 * Math.PI) / numSectors;

    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    for (let i = 0; i < numSectors; i++) {
        const prizeData = currentPrizesOnWheel[i];
        const sectorColor = prizeData.color || getNextFallbackColor();

        const startAngle_rad = i * anglePerSector_rad;
        const endAngle_rad = startAngle_rad + anglePerSector_rad;

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
        ctx.rotate(startAngle_rad + anglePerSector_rad / 2);

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

    const numSectors = currentPrizesOnWheel.length;
    const prizeIndex = Math.floor(Math.random() * numSectors);
    const winningPrize = currentPrizesOnWheel[prizeIndex];

    const anglePerSector_deg = 360 / numSectors;

    const baseRotation_deg = 360 * (Math.floor(Math.random() * 3) + 7);
    const v1_targetRotation_deg = baseRotation_deg +
                                (numSectors - prizeIndex) * anglePerSector_deg +
                                90 -
                                (anglePerSector_deg / 2) +
                                180;
    
    const finalTargetRotation_deg = v1_targetRotation_deg;

    const animationDuration = Math.max(4000, Math.min(7000, numSectors * 350 + Math.random() * 1500));
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
            if (wheelCanvas) wheelCanvas.style.transform = `rotate(${finalTargetRotation_deg}deg)`;
            currentRotation = (finalTargetRotation_deg % 360 + 360) % 360;

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
                if (prizeIndex < currentPrizesOnWheel.length ) {
                    if (currentPrizesOnWheel[prizeIndex] && currentPrizesOnWheel[prizeIndex].name === winningPrize.name) {
                        currentPrizesOnWheel.splice(prizeIndex, 1);
                    } else {
                        const idxToRemove = currentPrizesOnWheel.findIndex(p => p.name === winningPrize.name && p.color === winningPrize.color);
                        if (idxToRemove > -1) {
                            currentPrizesOnWheel.splice(idxToRemove, 1);
                        }
                    }
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
        emptyMsg.classList.add('empty-history-message'); // 添加class以便CSS控制
        historyList.appendChild(emptyMsg);
         historyList.style.justifyContent = 'center'; // 當只有提示時，使其垂直居中
    } else {
        historyList.style.justifyContent = 'flex-start'; // 有內容時，恢復正常佈局
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
    updateHistoryDisplay(); // 確保在載入後調用一次以處理空列表情況
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
    const allElementsPresent = wheelCanvas && prizeInputsWrapper && addPrizeInputBtn &&
                             updatePrizesBtn && spinButton && resultDiv && ctx &&
                             historyList && clearHistoryBtn && removeAfterHitCheckbox;

    if (allElementsPresent) {
        initializePrizeInputs();
        loadHistory(); // 確保在 resizeCanvas 前載入歷史，因為 updateHistoryDisplay 會被調用
        resizeCanvas();
    } else {
        console.error("一個或多個必要的DOM元素在DOMContentLoaded時未找到。");
        setTimeout(() => {
             const stillMissingCheck = !document.getElementById('wheel') || !document.getElementById('prize-inputs-wrapper') ||
                                 !document.getElementById('add-prize-input-btn') || !document.getElementById('update-prizes-btn') ||
                                 !document.getElementById('spin-button') || !document.getElementById('result') ||
                                 !document.getElementById('history-list') || !document.getElementById('clear-history-btn') ||
                                 !document.getElementById('remove-after-hit') || !wheelCanvas.getContext('2d');
            if(stillMissingCheck){
                console.error("關鍵DOM元素在重試後仍然缺失。請檢查HTML檔案中的ID是否正確。");
            } else {
               initializePrizeInputs();
               loadHistory();
               resizeCanvas();
            }
        }, 200);
    }
});