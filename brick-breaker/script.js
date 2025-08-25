const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- DOM Elements ---
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const launchBtn = document.getElementById('launch-btn');
// --- 新增：說明視窗的元素 ---
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModalBtn = document.getElementById('close-modal-btn');


// --- Global Variables ---
let ball = {};
let paddle = {};
const bricks = [];
const powerUps = [];
const lasers = [];

const powerUpTypes = {
    LONGER_PADDLE: 'longer-paddle',
    STICKY_PADDLE: 'sticky-paddle',
    LASER_PADDLE: 'laser-paddle',
    SHORTER_PADDLE: 'shorter-paddle',
    FAST_BALL: 'fast-ball',
    REVERSE_CONTROLS: 'reverse-controls'
};

let score = 0;
let lives = 3;
let level = 1; // Add level variable
let rightPressed = false;
let leftPressed = false;
let gameState = 'paused';
let brickCount = 0;
let activePowerUps = {};


// --- Timing for Delta Time ---
let lastTime = 0;

// --- Responsive Design & Scaling ---
const originalCanvasWidth = 480;
const originalCanvasHeight = 320;
let scale = 1;

const brickConfig = {
    rowCount: 3,
    columnCount: 5,
    originalWidth: 75,
    originalHeight: 20,
    originalPadding: 10,
    offsetTop: 40,
    offsetLeft: 30,
    colors: {
        red: ['#d32f2f', '#ff6659'],
        orange: ['#f57c00', '#ffb04c'],
        yellow: ['#fbc02d', '#fff263'],
        silver: ['#bdc3c7', '#ecf0f1'],
        gold: ['#f1c40f', '#f39c12']
    },
    originalCornerRadius: 5,
    powerUpColors: {
        'longer-paddle': '#2ecc71', // green
        'sticky-paddle': '#3498db', // blue
        'laser-paddle': '#e74c3c', // red
        'shorter-paddle': '#f1c40f', // yellow
        'fast-ball': '#9b59b6', // purple
        'reverse-controls': '#e67e22' // orange
    }
};

// --- Game Setup & Reset ---
function setup() {
    let newWidth = canvas.parentElement.clientWidth;
    scale = newWidth / originalCanvasWidth;
    canvas.width = newWidth;
    canvas.height = (originalCanvasHeight / originalCanvasWidth) * newWidth;

    paddle.originalWidth = 80;
    paddle.originalHeight = 12;
    paddle.width = paddle.originalWidth * scale;
    paddle.height = paddle.originalHeight * scale;
    paddle.originalSpeed = 350; // Speed in pixels per second
    paddle.speed = paddle.originalSpeed * scale;
    paddle.cornerRadius = 4 * scale;
    paddle.controlsReversed = false;
    paddle.isSticky = false;
    paddle.ballStuck = false;
    paddle.hasLasers = false;

    ball.originalRadius = 8;
    ball.radius = ball.originalRadius * scale;
    ball.originalSpeedX = 180; // Speed in pixels per second
    ball.originalSpeedY = -180; // Speed in pixels per second

    brickConfig.width = brickConfig.originalWidth * scale;
    brickConfig.height = brickConfig.originalHeight * scale;
    brickConfig.padding = brickConfig.originalPadding * scale;
    brickConfig.scaledOffsetTop = brickConfig.offsetTop * scale;
    brickConfig.scaledOffsetLeft = brickConfig.offsetLeft * scale;
    brickConfig.cornerRadius = brickConfig.originalCornerRadius * scale;
    
    if (bricks.length === 0) {
        createBricks();
    }
    
    resetBallAndPaddle();
    draw();
}

function resetBallAndPaddle() {
    clearAllPowerUps();
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.ballStuck = false;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = canvas.height - paddle.height - ball.radius - 2 * scale;
    ball.dx = ball.originalSpeedX * scale * (Math.random() < 0.5 ? 1 : -1);
    ball.dy = ball.originalSpeedY * scale;
}

function createLevel3Layout() {
    const layout = [];
    const rows = 5;
    const cols = 10;
    const powerUpPool = [
        powerUpTypes.LONGER_PADDLE,
        powerUpTypes.STICKY_PADDLE,
        powerUpTypes.LASER_PADDLE,
        powerUpTypes.SHORTER_PADDLE,
        powerUpTypes.FAST_BALL,
        powerUpTypes.REVERSE_CONTROLS
    ];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            // 70% chance to place a brick
            if (Math.random() > 0.3) {
                let brickType = 1;
                let powerUp = null;

                // 20% chance for a multi-life brick
                if (Math.random() < 0.2) {
                    brickType = Math.random() < 0.5 ? 2 : 3; // 50/50 chance for 2 or 3 lives
                }

                // 15% chance for a power-up
                if (Math.random() < 0.15) {
                    powerUp = powerUpPool[Math.floor(Math.random() * powerUpPool.length)];
                }
                
                if (powerUp) {
                    row.push({ type: brickType, powerUp: powerUp });
                } else {
                    row.push(brickType);
                }
            } else {
                row.push(0); // No brick
            }
        }
        layout.push(row);
    }
    return layout;
}

function createBricks() {
    bricks.length = 0;
    brickCount = 0;
    const levelLayouts = [
        // Level 1
        [
            [1,1,1,1,1],
            [1,1,1,1,1],
            [1,1,1,1,1]
        ],
        // Level 2
        [
            [2, 2, {type: 2, powerUp: powerUpTypes.LONGER_PADDLE}, 3, 3, {type: 2, powerUp: powerUpTypes.SHORTER_PADDLE}, 2, 2, 2, 2],
            [1, 1, 1, {type: 2, powerUp: powerUpTypes.LASER_PADDLE}, 2, 2, {type: 1, powerUp: powerUpTypes.REVERSE_CONTROLS}, 1, 1, 1],
            [1, {type: 1, powerUp: powerUpTypes.FAST_BALL}, 1, 1, 1, 1, 1, 1, {type: 1, powerUp: powerUpTypes.STICKY_PADDLE}, 1]
        ],
        // Level 3
        createLevel3Layout()
    ];

    const layout = levelLayouts[level - 1];
    if (!layout) return;

    let levelBrickWidth = brickConfig.width;
    let levelBrickPadding = brickConfig.padding;

    if (level === 2 || level === 3) {
        // Adjust width for 10-column layouts
        const totalWidth = (brickConfig.originalWidth * 5) + (brickConfig.originalPadding * 4);
        const newTotalPadding = brickConfig.originalPadding * 9;
        levelBrickWidth = ((totalWidth - newTotalPadding) / 10) * scale;
    }

    for (let r = 0; r < layout.length; r++) {
        bricks[r] = [];
        for (let c = 0; c < layout[r].length; c++) {
            const brickData = layout[r][c];
            const brickType = typeof brickData === 'object' ? brickData.type : brickData;
            const powerUpType = typeof brickData === 'object' ? brickData.powerUp : null;

            if (brickType > 0) {
                const currentBrickWidth = (level === 2 || level === 3) ? levelBrickWidth : brickConfig.width;
                const brickX = (c * (currentBrickWidth + brickConfig.padding)) + brickConfig.scaledOffsetLeft;
                const brickY = (r * (brickConfig.height + brickConfig.padding)) + brickConfig.scaledOffsetTop;
                let color;
                switch(brickType) {
                    case 3: color = brickConfig.colors.gold; break;
                    case 2: color = brickConfig.colors.silver; break;
                    default: color = brickConfig.colors.red;
                }

                bricks[r][c] = {
                    x: brickX,
                    y: brickY,
                    width: currentBrickWidth,
                    height: brickConfig.height,
                    status: 1,
                    lives: brickType,
                    originalColor: color,
                    color: color,
                    powerUp: powerUpType
                };
                brickCount++;
            } else {
                bricks[r][c] = { status: 0 };
            }
        }
    }
}

// --- Drawing Functions ---
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001a2e');
    gradient.addColorStop(1, '#003d6b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBall() {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(ball.x, ball.y, ball.radius * 0.1, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.8, '#c3fdff');
    gradient.addColorStop(1, '#94daff');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(148, 218, 255, 0.7)';
    ctx.shadowBlur = 15 * scale;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
    gradient.addColorStop(0, '#8e9eab');
    gradient.addColorStop(1, '#eef2f3');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.roundRect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height, paddle.cornerRadius);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let r = 0; r < bricks.length; r++) {
        for (let c = 0; c < bricks[r].length; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                const gradient = ctx.createLinearGradient(b.x, b.y, b.x + b.width, b.y + b.height);
                gradient.addColorStop(0, b.color[0]);
                gradient.addColorStop(1, b.color[1]);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, b.width, b.height, brickConfig.cornerRadius);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawUI() {
    const fontSize = 18 * scale;
    ctx.font = `bold ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3 * scale;
    ctx.fillText(`分數: ${score}`, 10 * scale, 25 * scale);
    ctx.fillText(`生命: ${lives}`, canvas.width - 80 * scale, 25 * scale);
    ctx.shadowBlur = 0;

    if (gameState === 'paused') {
        const promptFontSize = 24 * scale;
        ctx.font = `bold ${promptFontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5 * scale;
        ctx.fillText('按空白鍵或發射鈕開始', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
    }
}

// --- Game Logic ---
function spawnPowerUp(brick) {
    const powerUp = {
        x: brick.x + brickConfig.width / 2,
        y: brick.y,
        width: 15 * scale,
        height: 15 * scale,
        speed: 100 * scale,
        type: brick.powerUp,
        color: brickConfig.powerUpColors[brick.powerUp]
    };
    powerUps.push(powerUp);
}

function collisionDetection() {
    for (let r = 0; r < bricks.length; r++) {
        for (let c = 0; c < bricks[r].length; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                // Find the closest point on the brick to the ball's center
                const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.width));
                const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.height));

                // Calculate the distance between the ball's center and this closest point
                const distX = ball.x - closestX;
                const distY = ball.y - closestY;
                const distanceSquared = (distX * distX) + (distY * distY);

                // Check for collision
                if (distanceSquared < (ball.radius * ball.radius)) {
                    // Collision occurred, handle it
                    
                    b.lives--;
                    score++;

                    if (b.lives === 0) {
                        b.status = 0;
                        brickCount--;
                        if (b.powerUp) {
                            spawnPowerUp(b);
                        }
                        if (brickCount === 0) {
                            nextLevel();
                            return; // Exit since the level is over
                        }
                    } else {
                        // Update color based on remaining lives
                        switch(b.lives) {
                            case 2: b.color = brickConfig.colors.silver; break;
                            case 1: b.color = brickConfig.colors.red; break;
                        }
                    }

                    // --- Handle collision response ---
                    // Calculate overlap to determine collision axis
                    const overlapX = ball.radius - Math.abs(distX);
                    const overlapY = ball.radius - Math.abs(distY);

                    if (overlapX > overlapY) {
                        // Vertical collision
                        ball.dy = -ball.dy;
                        ball.y += Math.sign(distY) * overlapY;
                    } else {
                        // Horizontal collision
                        ball.dx = -ball.dx;
                        ball.x += Math.sign(distX) * overlapX;
                    }

                    // Exit the function after handling one collision to prevent multi-hits in one frame
                    return;
                }
            }
        }
    }
}

function nextLevel() {
    level++;
    if (level > 3) { // Now there are 3 levels
        alert('恭喜你，你贏了！');
        document.location.reload();
    } else {
        gameState = 'paused';
        createBricks();
        resetBallAndPaddle();
    }
}

function update(deltaTime) {
    const moveRight = paddle.controlsReversed ? leftPressed : rightPressed;
    const moveLeft = paddle.controlsReversed ? rightPressed : leftPressed;

    if (moveRight && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed * deltaTime;
    } else if (moveLeft && paddle.x > 0) {
        paddle.x -= paddle.speed * deltaTime;
    }

    if (gameState === 'paused') {
        ball.x = paddle.x + paddle.width / 2;
    }

    if (gameState === 'running') {
        let nextBallX = ball.x + ball.dx * deltaTime;
        let nextBallY = ball.y + ball.dy * deltaTime;
        
        if (nextBallX > canvas.width - ball.radius || nextBallX < ball.radius) {
            ball.dx = -ball.dx;
        }
        if (nextBallY < ball.radius) {
            ball.dy = -ball.dy;
        } else if (nextBallY > canvas.height - ball.radius - paddle.height) {
            // Check if the ball's horizontal span overlaps with the paddle's span
            if (nextBallX + ball.radius > paddle.x && nextBallX - ball.radius < paddle.x + paddle.width) {
                if (paddle.isSticky) {
                    paddle.ballStuck = true;
                    gameState = 'paused';
                } else {
                    ball.dy = -ball.dy;
                    // Reset ball speed if fast ball power-up was active
                    if (activePowerUps[powerUpTypes.FAST_BALL]) {
                        ball.dx /= 1.5;
                        ball.dy /= 1.5;
                        clearTimeout(activePowerUps[powerUpTypes.FAST_BALL]);
                        deactivatePowerUp(powerUpTypes.FAST_BALL);
                    }
                }
            } else {
                lives--;
                if (!lives) {
                    gameState = 'gameOver';
                    alert('遊戲結束');
                    document.location.reload();
                } else {
                    gameState = 'paused';
                    resetBallAndPaddle();
                }
            }
        }
        ball.x += ball.dx * deltaTime;
        ball.y += ball.dy * deltaTime;
    }
}

function drawPowerUps() {
    const powerUpText = {
        'longer-paddle': '+',
        'shorter-paddle': '-',
        'sticky-paddle': 'S',
        'laser-paddle': 'L',
        'fast-ball': 'F',
        'reverse-controls': 'R'
    };

    for (let i = 0; i < powerUps.length; i++) {
        const p = powerUps[i];
        // Draw background
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.width / 2, p.y, p.width, p.height);

        // Draw text
        const text = powerUpText[p.type] || '?';
        const fontSize = 12 * scale;
        ctx.font = `bold ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, p.x, p.y + p.height / 2);
    }
    // Reset alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function activatePowerUp(type) {
    // Clear any existing timer for this power-up type
    if (activePowerUps[type]) {
        clearTimeout(activePowerUps[type]);
    }

    const duration = 10000; // 10 seconds

    switch(type) {
        case powerUpTypes.LONGER_PADDLE:
            paddle.width = paddle.originalWidth * scale * 1.5;
            break;
        case powerUpTypes.SHORTER_PADDLE:
            paddle.width = paddle.originalWidth * scale * 0.5;
            break;
        case powerUpTypes.FAST_BALL:
            ball.dx *= 1.5;
            ball.dy *= 1.5;
            break;
        case powerUpTypes.REVERSE_CONTROLS:
            paddle.controlsReversed = true;
            break;
        case powerUpTypes.STICKY_PADDLE:
            paddle.isSticky = true;
            break;
        case powerUpTypes.LASER_PADDLE:
            paddle.hasLasers = true;
            break;
    }

    activePowerUps[type] = setTimeout(() => deactivatePowerUp(type), duration);
}

function deactivatePowerUp(type) {
    switch(type) {
        case powerUpTypes.LONGER_PADDLE:
        case powerUpTypes.SHORTER_PADDLE:
            paddle.width = paddle.originalWidth * scale;
            break;
        case powerUpTypes.FAST_BALL:
            // This will be reset when ball hits paddle or a new life starts
            break;
        case powerUpTypes.REVERSE_CONTROLS:
            paddle.controlsReversed = false;
            break;
        case powerUpTypes.STICKY_PADDLE:
            paddle.isSticky = false;
            break;
        case powerUpTypes.LASER_PADDLE:
            paddle.hasLasers = false;
            break;
    }
    delete activePowerUps[type];
}

function clearAllPowerUps() {
    // Clear all scheduled deactivations
    for (const type in activePowerUps) {
        clearTimeout(activePowerUps[type]);
    }
    activePowerUps = {};

    // Reset all paddle properties to default
    paddle.width = paddle.originalWidth * scale;
    paddle.controlsReversed = false;
    paddle.isSticky = false;
    paddle.hasLasers = false;
}

function updatePowerUps(deltaTime) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.y += p.speed * deltaTime;

        // Collision with paddle
        if (p.x > paddle.x && p.x < paddle.x + paddle.width && p.y + p.height > canvas.height - paddle.height && p.y < canvas.height) {
            activatePowerUp(p.type);
            powerUps.splice(i, 1);
            continue;
        }

        // Remove if off-screen
        if (p.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    drawPowerUps();
    drawLasers();
    drawUI();
}

function updateLasers(deltaTime) {
    for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.y -= l.speed * deltaTime;

        // Check for collision with bricks
        for (let r = 0; r < bricks.length; r++) {
            for (let c = 0; c < bricks[r].length; c++) {
                const b = bricks[r][c];
                if (b.status === 1 && l.x > b.x && l.x < b.x + b.width && l.y > b.y && l.y < b.y + b.height) {
                    b.lives--;
                    score++;
                    if (b.lives === 0) {
                        b.status = 0;
                        brickCount--;
                        if (b.powerUp) {
                            spawnPowerUp(b);
                        }
                        if (brickCount === 0) {
                            nextLevel();
                        }
                    } else {
                        switch(b.lives) {
                            case 2: b.color = brickConfig.colors.silver; break;
                            case 1: b.color = brickConfig.colors.red; break;
                        }
                    }
                    lasers.splice(i, 1);
                    return; // Stop checking for this laser
                }
            }
        }
        
        if (l.y < 0) {
            lasers.splice(i, 1);
        }
    }
}

function drawLasers() {
    ctx.fillStyle = '#ff0000';
    for(const laser of lasers) {
        ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
    }
}

function fireLasers() {
    lasers.push({
        x: paddle.x + 5 * scale,
        y: canvas.height - paddle.height,
        width: 4 * scale,
        height: 10 * scale,
        speed: 300 * scale
    });
    lasers.push({
        x: paddle.x + paddle.width - 5 * scale,
        y: canvas.height - paddle.height,
        width: 4 * scale,
        height: 10 * scale,
        speed: 300 * scale
    });
}

function gameLoop(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 1000; // deltaTime in seconds

    update(deltaTime);
    if (gameState === 'running') {
        updatePowerUps(deltaTime);
        updateLasers(deltaTime);
    }
    draw();
    if (gameState === 'running') {
        collisionDetection();
    }
    
    lastTime = timestamp;
    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
function startGame() {
    // If ball is in play and we have lasers, fire lasers
    if (gameState === 'running' && paddle.hasLasers) {
        fireLasers();
        return;
    }

    // If game is paused, start it
    if (gameState === 'paused') {
        if (paddle.ballStuck) {
            // Ensure the ball moves upwards on launch from a sticky state
            ball.dy = -Math.abs(ball.dy);
            // Make sticky paddle a one-time use per catch
            paddle.isSticky = false;
            if (activePowerUps[powerUpTypes.STICKY_PADDLE]) {
                clearTimeout(activePowerUps[powerUpTypes.STICKY_PADDLE]);
                delete activePowerUps[powerUpTypes.STICKY_PADDLE];
            }
        }
        gameState = 'running';
        paddle.ballStuck = false;
    }
}

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
    else if (e.code === 'Space' || e.key === ' ') startGame();
});

// Touch Controls
leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); leftPressed = true; }, { passive: false });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); leftPressed = false; }, { passive: false });
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); rightPressed = true; }, { passive: false });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); rightPressed = false; }, { passive: false });
launchBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startGame(); }, { passive: false });

// --- Initialization ---
window.addEventListener('resize', setup);
setup();
requestAnimationFrame(gameLoop);


// --- 新增：說明視窗的事件監聽 ---
helpBtn.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => {
    helpModal.classList.add('hidden');
});
helpModal.addEventListener('click', (e) => {
    // 如果點擊的是半透明的背景，而不是內容區域，就關閉視窗
    if (e.target === helpModal) {
        helpModal.classList.add('hidden');
    }
});
