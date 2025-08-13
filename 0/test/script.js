document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const board = document.getElementById('game-board');
    const ball = document.getElementById('ball');
    const flipperLeft = document.getElementById('flipper-left');
    const flipperRight = document.getElementById('flipper-right');
    const bumpers = document.querySelectorAll('.bumper');
    const scoreDisplay = document.getElementById('score');
    const gameOverDisplay = document.getElementById('game-over');

    // 遊戲參數
    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;
    const ballSize = ball.clientWidth;

    // 球的物理屬性
    let ballX = 190;
    let ballY = 50;
    let velocityX = 2;
    let velocityY = 2;
    const gravity = 0.2;
    const friction = 0.99; // 摩擦力使球稍微減速
    const flipperPower = -12; // 擋板擊球力道

    // 遊戲狀態
    let score = 0;
    let gameOver = false;

    // 主遊戲迴圈
    function gameLoop() {
        if (gameOver) {
            gameOverDisplay.style.display = 'block';
            return;
        }

        // 1. 更新球的位置
        velocityY += gravity; // 套用重力
        velocityX *= friction; // 套用摩擦力
        
        ballX += velocityX;
        ballY += velocityY;

        // 2. 碰撞偵測
        // 牆壁碰撞
        if (ballX <= 0 || ballX >= boardWidth - ballSize) {
            velocityX *= -1; // 水平反彈
            ballX = Math.max(0, Math.min(ballX, boardWidth - ballSize)); // 確保球在界內
        }
        if (ballY <= 0) {
            velocityY *= -1; // 頂部反彈
            ballY = 0;
        }

        // 擋板碰撞
        checkCollision(flipperLeft);
        checkCollision(flipperRight);

        // 緩衝器碰撞
        bumpers.forEach(bumper => {
            if (isColliding(ball, bumper)) {
                // 計算反彈角度
                const bumperRect = bumper.getBoundingClientRect();
                const ballRect = ball.getBoundingClientRect();
                const dx = (ballRect.left + ballRect.width / 2) - (bumperRect.left + bumperRect.width / 2);
                const dy = (ballRect.top + ballRect.height / 2) - (bumperRect.top + bumperRect.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 施加反彈力道
                velocityX = (dx / distance) * 8;
                velocityY = (dy / distance) * 8;

                // 增加分數
                score += 10;
                updateScore();
            }
        });

        // 掉落偵測 (遊戲結束)
        if (ballY >= boardHeight) {
            gameOver = true;
        }

        // 3. 更新畫面
        ball.style.left = ballX + 'px';
        ball.style.top = ballY + 'px';

        // 4. 請求下一幀
        requestAnimationFrame(gameLoop);
    }

    // 更新分數顯示
    function updateScore() {
        scoreDisplay.textContent = `分數: ${score}`;
    }

    // 檢查球和物件是否碰撞
    function isColliding(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    // 專門檢查與擋板的碰撞
    function checkCollision(flipper) {
        if (flipper.classList.contains('active') && isColliding(ball, flipper)) {
             // 根據擋板給予強大的向上力道
            velocityY = flipperPower;

            // 根據碰撞位置給予一些水平力道
            const flipperRect = flipper.getBoundingClientRect();
            const ballCenter = ballX + ballSize / 2;
            const flipperCenter = flipperRect.left + flipperRect.width / 2;
            
            velocityX += (ballCenter - flipperCenter) / 10;
        }
    }


    // 鍵盤事件監聽
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            flipperLeft.classList.add('active');
        } else if (e.key === 'ArrowRight') {
            flipperRight.classList.add('active');
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') {
            flipperLeft.classList.remove('active');
        } else if (e.key === 'ArrowRight') {
            flipperRight.classList.remove('active');
        }
    });

    // 啟動遊戲
    updateScore();
    requestAnimationFrame(gameLoop);
});
