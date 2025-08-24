const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 全域變數 ---
let ball = {};
let paddle = {};
const bricks = [];

let score = 0;
let lives = 3;
let rightPressed = false;
let leftPressed = false;
let gameState = 'paused'; // 'paused', 'running', 'gameOver'

// --- 響應式設計與縮放 ---
const originalCanvasWidth = 480;
const originalCanvasHeight = 320;
let scale = 1;

const brickConfig = {
    rowCount: 3,
    columnCount: 5,
    originalWidth: 75,
    originalHeight: 20,
    originalPadding: 10,
    offsetTop: 40, // More space for UI
    offsetLeft: 30,
    // 美化：磚塊顏色
    colors: [
        ['#d32f2f', '#ff6659'], // Row 1
        ['#f57c00', '#ffb04c'], // Row 2
        ['#fbc02d', '#fff263']  // Row 3
    ],
    originalCornerRadius: 5
};

// --- 遊戲物件設定與重設 ---
function setup() {
    let newWidth = canvas.parentElement.clientWidth;
    scale = newWidth / originalCanvasWidth;
    canvas.width = newWidth;
    canvas.height = (originalCanvasHeight / originalCanvasWidth) * newWidth;

    paddle.originalWidth = 80;
    paddle.originalHeight = 12;
    paddle.width = paddle.originalWidth * scale;
    paddle.height = paddle.originalHeight * scale;
    paddle.originalSpeed = 8;
    paddle.speed = paddle.originalSpeed * scale;
    paddle.cornerRadius = 4 * scale;

    ball.originalRadius = 8;
    ball.radius = ball.originalRadius * scale;
    ball.originalSpeedX = 2.5;
    ball.originalSpeedY = -2.5;

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
    paddle.x = (canvas.width - paddle.width) / 2;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = canvas.height - paddle.height - ball.radius - 2 * scale; // A small gap
    ball.dx = ball.originalSpeedX * scale * (Math.random() < 0.5 ? 1 : -1);
    ball.dy = ball.originalSpeedY * scale;
}

function createBricks() {
    bricks.length = 0;
    for (let c = 0; c < brickConfig.columnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickConfig.rowCount; r++) {
            const brickX = (c * (brickConfig.width + brickConfig.padding)) + brickConfig.scaledOffsetLeft;
            const brickY = (r * (brickConfig.height + brickConfig.padding)) + brickConfig.scaledOffsetTop;
            bricks[c][r] = { x: brickX, y: brickY, status: 1, color: brickConfig.colors[r] };
        }
    }
}

// --- 繪圖函式 (美化版) ---
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
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // Reset shadow
}

function drawPaddle() {
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
    gradient.addColorStop(0, '#8e9eab');
    gradient.addColorStop(1, '#eef2f3');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 * scale;
    ctx.roundRect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height, paddle.cornerRadius);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                const b = bricks[c][r];
                const gradient = ctx.createLinearGradient(b.x, b.y, b.x + brickConfig.width, b.y + brickConfig.height);
                gradient.addColorStop(0, b.color[0]);
                gradient.addColorStop(1, b.color[1]);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, brickConfig.width, brickConfig.height, brickConfig.cornerRadius);
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
        ctx.fillText('按空白鍵開始', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
    }
}

// --- 遊戲邏輯 (與之前相同) ---
function collisionDetection() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + brickConfig.width && ball.y > b.y && ball.y < b.y + brickConfig.height) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score++;
                    if (score === brickConfig.rowCount * brickConfig.columnCount) {
                        alert('恭喜你，你贏了！');
                        document.location.reload();
                    }
                }
            }
        }
    }
}

function update() {
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (gameState === 'paused') {
        ball.x = paddle.x + paddle.width / 2;
    }
    if (gameState === 'running') {
        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - ball.radius) {
            if (ball.x > paddle.x - ball.radius && ball.x < paddle.x + paddle.width + ball.radius) {
                ball.dy = -ball.dy;
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
        ball.x += ball.dx;
        ball.y += ball.dy;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    drawUI();
}

function gameLoop() {
    update();
    draw();
    if (gameState === 'running') {
        collisionDetection();
    }
    requestAnimationFrame(gameLoop);
}

// --- 事件監聽 ---
function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
    else if (e.code === 'Space' || e.key === ' ') {
        if (gameState === 'paused') gameState = 'running';
    }
}

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// --- 初始化 ---
window.addEventListener('resize', setup);
setup();
gameLoop();
