// Aliases for Matter.js modules
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Create an engine
const engine = Engine.create();
const world = engine.world;

// Get the viewport dimensions
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

// Create a renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: viewportWidth,
        height: viewportHeight,
        wireframes: false, // Set to false to see solid colors
        background: '#111'
    }
});

// Create a runner
const runner = Runner.create();

// Adjust gravity
engine.world.gravity.y = 0.8;

// --- Game Objects ---

const wallOptions = {
    isStatic: true,
    render: { fillStyle: '#4c4c4c' }
};

const pinballWidth = 600;
const pinballHeight = 800;
const wallThickness = 20;

// Center the pinball table in the viewport
const offsetX = (viewportWidth - pinballWidth) / 2;
const offsetY = (viewportHeight - pinballHeight) / 2;

// Create walls
const walls = [
    // Left wall
    Bodies.rectangle(offsetX + wallThickness / 2, offsetY + pinballHeight / 2, wallThickness, pinballHeight, wallOptions),
    // Right wall (with a gap for the launch lane)
    Bodies.rectangle(offsetX + pinballWidth - wallThickness / 2, offsetY + (pinballHeight - 150) / 2, wallThickness, pinballHeight - 150, wallOptions),
    // Top wall
    Bodies.rectangle(offsetX + pinballWidth / 2, offsetY + wallThickness / 2, pinballWidth, wallThickness, wallOptions),
    // Launch lane wall
    Bodies.rectangle(offsetX + pinballWidth - 80, offsetY + pinballHeight - 75, wallThickness, 150, wallOptions),
    // Slanted walls for the bottom
    Bodies.rectangle(offsetX + pinballWidth * 0.25, offsetY + pinballHeight * 0.85, pinballWidth * 0.5, 20, { ...wallOptions, angle: Math.PI * 0.18 }),
    Bodies.rectangle(offsetX + pinballWidth * 0.75, offsetY + pinballHeight * 0.85, pinballWidth * 0.5, 20, { ...wallOptions, angle: -Math.PI * 0.18 })
];

// Bumpers
const bumpers = [
    Bodies.circle(offsetX + pinballWidth / 2, offsetY + 250, 25, { isStatic: true, label: 'bumper', render: { fillStyle: '#f21' }, restitution: 1.5 }),
    Bodies.circle(offsetX + pinballWidth * 0.3, offsetY + 350, 20, { isStatic: true, label: 'bumper', render: { fillStyle: '#ff0' }, restitution: 1.5 }),
    Bodies.circle(offsetX + pinballWidth * 0.7, offsetY + 350, 20, { isStatic: true, label: 'bumper', render: { fillStyle: '#ff0' }, restitution: 1.5 }),
];

// The Ball
const ball = Bodies.circle(offsetX + pinballWidth - 50, offsetY + pinballHeight - 50, 15, {
    restitution: 0.5,
    friction: 0.05,
    render: { fillStyle: '#fff' }
});

// Flippers
const flipperY = offsetY + pinballHeight - 180;
const flipperWidth = 100;
const flipperHeight = 20;
const flipperOptions = {
    density: 0.005,
    restitution: 0.5,
    friction: 0.5,
    render: { fillStyle: '#d430eb' }
};

// Left Flipper
const leftFlipperPivot = Bodies.circle(offsetX + pinballWidth * 0.35, flipperY, 5, { isStatic: true, render: { visible: false } });
const leftFlipper = Bodies.rectangle(leftFlipperPivot.position.x - flipperWidth / 2, flipperY, flipperWidth, flipperHeight, { ...flipperOptions, label: 'leftFlipper' });
const leftFlipperConstraint = Matter.Constraint.create({
    bodyA: leftFlipper,
    pointA: { x: flipperWidth / 2 - 10, y: 0 },
    bodyB: leftFlipperPivot,
    pointB: { x: 0, y: 0 },
    stiffness: 0.01,
    length: 0,
    render: { visible: false }
});

// Right Flipper
const rightFlipperPivot = Bodies.circle(offsetX + pinballWidth * 0.65, flipperY, 5, { isStatic: true, render: { visible: false } });
const rightFlipper = Bodies.rectangle(rightFlipperPivot.position.x + flipperWidth / 2, flipperY, flipperWidth, flipperHeight, { ...flipperOptions, label: 'rightFlipper' });
const rightFlipperConstraint = Matter.Constraint.create({
    bodyA: rightFlipper,
    pointA: { x: -flipperWidth / 2 + 10, y: 0 },
    bodyB: rightFlipperPivot,
    pointB: { x: 0, y: 0 },
    stiffness: 0.01,
    length: 0,
    render: { visible: false }
});

// Flipper stoppers
const stopperOptions = { isStatic: true, render: { visible: false } };
const leftStopper = Bodies.rectangle(leftFlipperPivot.position.x - 20, flipperY + 50, 80, 20, { ...stopperOptions, angle: Math.PI * 0.25 });
const rightStopper = Bodies.rectangle(rightFlipperPivot.position.x + 20, flipperY + 50, 80, 20, { ...stopperOptions, angle: -Math.PI * 0.25 });

// Drain sensor
const drain = Bodies.rectangle(offsetX + pinballWidth / 2, offsetY + pinballHeight + 20, pinballWidth, 50, {
    isSensor: true,
    isStatic: true,
    label: 'drain'
});

// Add all of the bodies to the world
World.add(world, [
    ...walls, 
    ...bumpers, 
    ball,
    leftFlipper, leftFlipperPivot, leftFlipperConstraint, leftStopper,
    rightFlipper, rightFlipperPivot, rightFlipperConstraint, rightStopper,
    drain
]);

// Run the renderer
Render.run(render);

// Run the engine
Runner.run(runner, engine);

// Handle window resizing
window.addEventListener('resize', () => {
    // Update renderer and canvas size
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;

    // In a real game, you would need to reposition all the bodies.
    // For this simple example, we'll just let the canvas resize.
});

// --- Controls ---
const keyState = {};

document.addEventListener('keydown', ({ code }) => {
    keyState[code] = true;
});

document.addEventListener('keyup', ({ code }) => {
    keyState[code] = false;
});

const leftFlipperDownAngle = 0.25;
const leftFlipperUpAngle = -0.5;
const rightFlipperDownAngle = -0.25;
const rightFlipperUpAngle = 0.5;

Events.on(engine, 'beforeUpdate', () => {
    // Left Flipper Control
    if (keyState['ArrowLeft']) {
        Body.setAngularVelocity(leftFlipper, -0.55);
    } else {
        Body.setAngularVelocity(leftFlipper, 0.55);
    }
    // Clamp left flipper angle
    if (leftFlipper.angle > leftFlipperDownAngle) {
        Body.setAngle(leftFlipper, leftFlipperDownAngle);
    } else if (leftFlipper.angle < leftFlipperUpAngle) {
        Body.setAngle(leftFlipper, leftFlipperUpAngle);
    }
    
    // Right Flipper Control
    if (keyState['ArrowRight']) {
        Body.setAngularVelocity(rightFlipper, 0.55);
    } else {
        Body.setAngularVelocity(rightFlipper, -0.55);
    }
    // Clamp right flipper angle
    if (rightFlipper.angle < rightFlipperDownAngle) {
        Body.setAngle(rightFlipper, rightFlipperDownAngle);
    } else if (rightFlipper.angle > rightFlipperUpAngle) {
        Body.setAngle(rightFlipper, rightFlipperUpAngle);
    }


    // Launch ball
    if (keyState['Space']) {
        // Only launch if the ball is in the launch lane
        if (ball.position.x > offsetX + pinballWidth - 80) {
             Body.applyForce(ball, ball.position, { x: -0.01, y: -0.08 });
        }
    }
});

// --- Scoring and Collision ---
let score = 0;
const scoreElement = document.getElementById('score');

function updateScore(amount) {
    score += amount;
    scoreElement.innerText = `Score: ${score}`;
}

function resetBall() {
    Body.setPosition(ball, { x: offsetX + pinballWidth - 50, y: offsetY + pinballHeight - 50 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
}

Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check for bumper collision
        if ((bodyA.label === 'bumper' && bodyB === ball) || (bodyB.label === 'bumper' && bodyA === ball)) {
            updateScore(10);
        }

        // Check for drain collision
        if ((bodyA.label === 'drain' && bodyB === ball) || (bodyB.label === 'drain' && bodyA === ball)) {
            updateScore(-50); // Penalty for losing the ball
            if (score < 0) score = 0;
            updateScore(0); // Update display
            resetBall();
        }
    }
});
