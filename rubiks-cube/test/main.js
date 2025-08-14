// 引入 Three.js 和控制器
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- 基本 Three.js 設定 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 控制項 ---
const controls = new TrackballControls(camera, renderer.domElement);
controls.noRotate = false;
controls.noPan = true;
controls.noZoom = true;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.2;
controls.rotateSpeed = 3.0;

// --- Gizmo 設定 ---
let gizmoRenderer, labelRenderer, gizmoScene, gizmoCamera, gizmo, gizmoRaycaster;

function initGizmo() {
    const gizmoContainer = document.getElementById('gizmo-container');
    if (!gizmoContainer) {
        console.error("Gizmo container not found!");
        return;
    }

    // WebGL Renderer for Gizmo
    gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    gizmoRenderer.setSize(gizmoContainer.clientWidth, gizmoContainer.clientHeight);
    gizmoRenderer.setClearAlpha(0);
    gizmoContainer.appendChild(gizmoRenderer.domElement);

    // CSS2D Renderer for Labels
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(gizmoContainer.clientWidth, gizmoContainer.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    gizmoContainer.appendChild(labelRenderer.domElement);
    
    gizmoScene = new THREE.Scene();
    gizmoScene.add(new THREE.AmbientLight(0xffffff, 3.0));

    // Gizmo Camera
    const aspect = gizmoContainer.clientWidth / gizmoContainer.clientHeight;
    gizmoCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    gizmoCamera.position.set(0, 0, 3.5);
    gizmoCamera.lookAt(0, 0, 0);
    
    // Parent Group for all Gizmo objects
    gizmo = new THREE.Group();
    gizmoScene.add(gizmo);

    const axisLength = 1;
    const headLength = 0.2;
    const headWidth = 0.15;

    const axes = [
        { dir: new THREE.Vector3(1, 0, 0), color: 0xff0000, name: 'X' },
        { dir: new THREE.Vector3(0, 1, 0), color: 0x00ff00, name: 'Y' },
        { dir: new THREE.Vector3(0, 0, 1), color: 0x0000ff, name: 'Z' }
    ];

    axes.forEach(axisInfo => {
        // Visual Arrow
        const arrow = new THREE.ArrowHelper(axisInfo.dir, new THREE.Vector3(0,0,0), axisLength, axisInfo.color, headLength, headWidth);
        gizmo.add(arrow);

        // Visual Label
        const labelDiv = document.createElement('div');
        labelDiv.textContent = axisInfo.name;
        labelDiv.style.color = `#${axisInfo.color.toString(16).padStart(6, '0')}`;
        labelDiv.style.fontFamily = 'monospace';
        labelDiv.style.fontSize = '16px';
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.textShadow = '0 0 3px #000';
        labelDiv.style.pointerEvents = 'none';
        const label = new CSS2DObject(labelDiv);
        label.position.copy(axisInfo.dir).multiplyScalar(axisLength * 1.3);
        gizmo.add(label);

        // Invisible Hitbox
        const hitboxGeom = new THREE.CylinderGeometry(0.25, 0.25, axisLength, 8);
        const hitboxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 });
        const hitbox = new THREE.Mesh(hitboxGeom, hitboxMat);
        hitbox.name = axisInfo.name;
        hitbox.position.copy(axisInfo.dir).multiplyScalar(axisLength / 2);
        hitbox.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisInfo.dir.clone().normalize());
        gizmo.add(hitbox);
    });
    
    // Gizmo Interaction
    gizmoRaycaster = new THREE.Raycaster();
    gizmoRenderer.domElement.addEventListener('pointerdown', onGizmoClick);
}

function onGizmoClick(event) {
    resetIdleTimer();
    if (isAnimating) return;

    const gizmoBounds = gizmoRenderer.domElement.getBoundingClientRect();
    const gizmoMouse = new THREE.Vector2();
    gizmoMouse.x = ((event.clientX - gizmoBounds.left) / gizmoBounds.width) * 2 - 1;
    gizmoMouse.y = -((event.clientY - gizmoBounds.top) / gizmoBounds.height) * 2 + 1;
    
    gizmoRaycaster.setFromCamera(gizmoMouse, gizmoCamera);
    const intersects = gizmoRaycaster.intersectObjects(gizmo.children, true);

    if (intersects.length > 0) {
        // Find the named hitbox
        const hit = intersects.find(i => i.object.name);
        if (hit) {
            const axisName = hit.object.name;
            snapCameraToView(axisName);
        }
    }
}

let cameraAnimationId = null;
function animateCamera(targetPosition, targetUp) {
    if (cameraAnimationId) {
        cancelAnimationFrame(cameraAnimationId);
    }
    setControlsEnabled(false);

    const startPosition = camera.position.clone();
    const startUp = camera.up.clone();
    const duration = 500;
    const startTime = performance.now();

    function animate() {
        const t = Math.min(1, (performance.now() - startTime) / duration);
        const easedT = 0.5 * (1 - Math.cos(t * Math.PI)); // Ease-in-out

        camera.position.lerpVectors(startPosition, targetPosition, easedT);
        camera.up.lerpVectors(startUp, targetUp, easedT).normalize();
        camera.lookAt(scene.position);

        if (t < 1) {
            cameraAnimationId = requestAnimationFrame(animate);
        } else {
            camera.position.copy(targetPosition);
            camera.up.copy(targetUp).normalize();
            camera.lookAt(scene.position);
            cameraAnimationId = null;
            setControlsEnabled(true);
        }
    }
    animate();
}

function snapCameraToView(axis) {
    resetIdleTimer();
    const distance = camera.position.length();
    let position, up;

    switch (axis) {
        case 'X': // Right face (Red)
            position = new THREE.Vector3(distance, 0, 0);
            up = new THREE.Vector3(0, 1, 0);
            break;
        case '-X': // Left face (from gizmo perspective)
             position = new THREE.Vector3(-distance, 0, 0);
             up = new THREE.Vector3(0, 1, 0);
             break;
        case 'Y': // Top face (Green)
            position = new THREE.Vector3(0, distance, 0);
            up = new THREE.Vector3(0, 0, -1);
            break;
        case '-Y':
            position = new THREE.Vector3(0, -distance, 0);
            up = new THREE.Vector3(0, 0, 1);
            break;
        case 'Z': // Front face (Blue)
            position = new THREE.Vector3(0, 0, distance);
            up = new THREE.Vector3(0, 1, 0);
            break;
        case '-Z':
            position = new THREE.Vector3(0, 0, -distance);
            up = new THREE.Vector3(0, 1, 0);
            break;
    }
    if (position) {
        animateCamera(position, up);
    }
}


// --- UI 按鈕 ---
const scrambleBtn = document.getElementById('scramble-btn');
const resetBtn = document.getElementById('reset-btn');
const undoBtn = document.getElementById('undo-btn');
const resetViewBtn = document.getElementById('reset-view-btn');
const invertViewBtn = document.getElementById('invert-view-btn');
const rotateViewBtn = document.getElementById('rotate-view-btn');

// --- 光源 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- 魔術方塊 ---
const rubiksCube = new THREE.Group();
const CUBIE_SIZE = 1;
const CUBIE_GAP = 0.1;
const positionOffset = CUBIE_SIZE + CUBIE_GAP;

const materials = {
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Red
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }), // Orange
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }), // White
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Yellow
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }), // Blue
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }), // Green
    inside: new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
};

const cubies = [];
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            if (x === 0 && y === 0 && z === 0) continue;
            const cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
            const cubieMaterials = [
                x === 1 ? materials.right : materials.inside,
                x === -1 ? materials.left : materials.inside,
                y === 1 ? materials.top : materials.inside,
                y === -1 ? materials.bottom : materials.inside,
                z === 1 ? materials.front : materials.inside,
                z === -1 ? materials.back : materials.inside
            ];
            const cubie = new THREE.Mesh(cubieGeometry, cubieMaterials);
            cubie.position.set(x * positionOffset, y * positionOffset, z * positionOffset);
            rubiksCube.add(cubie);
            cubies.push(cubie);
        }
    }
}
scene.add(rubiksCube);

// --- 旋轉與歷史紀錄邏輯 ---
let moveHistory = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCubie = null, selectedFaceNormal = null, isDragging = false, dragStartPoint = new THREE.Vector2();
let isAnimating = false;

function setControlsEnabled(enabled) {
    isAnimating = !enabled;
    controls.enabled = enabled;
    scrambleBtn.disabled = !enabled;
    resetBtn.disabled = !enabled;
    undoBtn.disabled = !enabled || moveHistory.length === 0;
    if(resetViewBtn) resetViewBtn.disabled = !enabled;
    if(invertViewBtn) invertViewBtn.disabled = !enabled;
    if(rotateViewBtn) rotateViewBtn.disabled = !enabled;
}

function onPointerDown(event) {
    resetIdleTimer();
    if (isAnimating) return;
    // Ignore clicks on the gizmo
    const gizmoContainer = document.getElementById('gizmo-container');
    if (gizmoContainer && gizmoContainer.contains(event.target)) {
        return;
    }
    const pointer = (event.touches) ? event.touches[0] : event;
    mouse.x = (pointer.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(pointer.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubies);
    if (intersects.length > 0) {
        controls.enabled = false;
        selectedCubie = intersects[0].object;
        selectedFaceNormal = intersects[0].face.normal.clone();
        isDragging = true;
        dragStartPoint.set(mouse.x, mouse.y);
    }
}

function onPointerMove(event) {
    if (!isDragging || isAnimating) return;
    const pointer = (event.touches) ? event.touches[0] : event;
    const currentPoint = new THREE.Vector2((pointer.clientX / window.innerWidth) * 2 - 1, -(pointer.clientY / window.innerHeight) * 2 + 1);
    const dragVector = currentPoint.clone().sub(dragStartPoint);

    if (dragVector.length() > 0.05) {
        isDragging = false;
        const worldNormal = selectedFaceNormal.clone().applyQuaternion(selectedCubie.quaternion).normalize();
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        const dragDir3D = cameraRight.clone().multiplyScalar(dragVector.x).add(cameraUp.clone().multiplyScalar(dragVector.y));
        const rotationAxis = new THREE.Vector3().crossVectors(worldNormal, dragDir3D).normalize();
        let mainAxis = 'x', maxDot = 0;
        ['x', 'y', 'z'].forEach(axis => {
            const axisVec = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
            const dot = Math.abs(axisVec.dot(rotationAxis));
            if (dot > maxDot) { maxDot = dot; mainAxis = axis; }
        });
        const direction = Math.sign(new THREE.Vector3(mainAxis === 'x' ? 1 : 0, mainAxis === 'y' ? 1 : 0, mainAxis === 'z' ? 1 : 0).dot(rotationAxis));
        rotateLayer({ pivot: selectedCubie.position.clone(), axis: mainAxis, direction: direction }, true);
    }
}

function onPointerUp() {
    controls.enabled = true;
    isDragging = false;
}

function rotateLayer(move, recordMove = false) {
    return new Promise(resolve => {
        if (recordMove) {
            moveHistory.push(move);
        }
        setControlsEnabled(false);
        const { pivot: pivotPoint, axis, direction } = move;
        const layer = cubies.filter(c => Math.abs(c.position[axis] - pivotPoint[axis]) < 0.5);
        const pivot = new THREE.Object3D();
        scene.add(pivot);
        layer.forEach(c => pivot.attach(c));
        const targetAngle = (Math.PI / 2) * direction;
        const rotationAxisVec = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
        const animationDuration = 300, startTime = performance.now();
        const animateRotation = (time) => {
            const t = Math.min(1, (time - startTime) / animationDuration);
            const easedT = 1 - Math.pow(1 - t, 3);
            pivot.setRotationFromAxisAngle(rotationAxisVec, targetAngle * easedT);
            if (t < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                pivot.setRotationFromAxisAngle(rotationAxisVec, targetAngle);
                scene.remove(pivot);
                layer.forEach(c => {
                    const worldPos = new THREE.Vector3(), worldQuat = new THREE.Quaternion();
                    c.getWorldPosition(worldPos);
                    c.getWorldQuaternion(worldQuat);
                    rubiksCube.attach(c);
                    c.position.copy(worldPos).divideScalar(positionOffset).round().multiplyScalar(positionOffset);
                    c.quaternion.copy(worldQuat);
                });
                setControlsEnabled(true);
                resolve();
            }
        };
        requestAnimationFrame(animateRotation);
    });
}

// --- 新增：閒置動畫功能 ---
function startIdleAnimation() {
    if (isAnimating) return; // 如果正在進行其他動畫，則不啟動閒置動畫
    isIdleAnimationActive = true;
    controls.enabled = false; // 禁用手動控制
}

function stopIdleAnimation() {
    isIdleAnimationActive = false;
    
    // 將方塊旋轉歸零並還原內部材質
    rubiksCube.rotation.set(0, 0, 0);
    materials.inside.color.set(0x111111);
    materials.inside.emissive.set(0x000000);
    materials.inside.emissiveIntensity = 1.0; // 確保重設發光強度

    // 這裡不需要手動設定 setControlsEnabled(true)，因為 resetIdleTimer 會在互動開始時被呼叫，
    // 而互動函數（如 onPointerDown）本身會管理人機介面的啟用狀態。
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (isIdleAnimationActive) {
        stopIdleAnimation();
    }
    // 當用戶再次開始互動時，確保控制項是啟用的
    if (!isAnimating) {
        setControlsEnabled(true);
    }
    idleTimer = setTimeout(startIdleAnimation, IDLE_TIMEOUT);
}

// --- 按鈕功能 ---
async function scrambleCube() {
    resetIdleTimer();
    setControlsEnabled(false);
    moveHistory = []; // Scramble clears history
    const moves = 25, axes = ['x', 'y', 'z'], layers = [-1, 0, 1];
    for (let i = 0; i < moves; i++) {
        const axis = axes[Math.floor(Math.random() * 3)];
        const layerIndex = layers[Math.floor(Math.random() * 3)];
        const direction = Math.random() < 0.5 ? 1 : -1;
        const pivotPoint = new THREE.Vector3();
        pivotPoint[axis] = layerIndex * positionOffset;
        await rotateLayer({ pivot: pivotPoint, axis: axis, direction: direction }, false); // Don't record scramble moves for undo
    }
    setControlsEnabled(true);
}

async function undoMove() {
    resetIdleTimer();
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    const reversedMove = {
        pivot: lastMove.pivot,
        axis: lastMove.axis,
        direction: -lastMove.direction
    };
    await rotateLayer(reversedMove, false);
}

function resetCameraOrientation() {
    resetIdleTimer();
    animateCamera(new THREE.Vector3(4, 4, 6), new THREE.Vector3(0, 1, 0));
}

function invertCamera() {
    resetIdleTimer();
    const newUp = camera.up.clone().negate();
    animateCamera(camera.position.clone(), newUp);
}

function rotateCameraView() {
    resetIdleTimer();
    const lookDirection = new THREE.Vector3();
    camera.getWorldDirection(lookDirection);
    const quaternion = new THREE.Quaternion().setFromAxisAngle(lookDirection, -Math.PI / 2);
    const newUp = camera.up.clone().applyQuaternion(quaternion);
    animateCamera(camera.position.clone(), newUp);
}

// --- 事件監聽 ---
renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerup', onPointerUp);
scrambleBtn.addEventListener('click', scrambleCube);
resetBtn.addEventListener('click', () => { window.location.reload(); });
undoBtn.addEventListener('click', undoMove);
if(resetViewBtn) resetViewBtn.addEventListener('click', resetCameraOrientation);
if(invertViewBtn) invertViewBtn.addEventListener('click', invertCamera);
if(rotateViewBtn) rotateViewBtn.addEventListener('click', rotateCameraView);


// --- 動畫循環 ---
function animate() {
    requestAnimationFrame(animate);

    if (isIdleAnimationActive) {
        // 自動旋轉視角
        rubiksCube.rotation.y += 0.002;
        rubiksCube.rotation.x += 0.0005;

        // 內部顏色變化
        const time = performance.now() * 0.001;
        // 使用 HSL 色彩空間，僅變更色相(H)值，保持飽和度(S)與亮度(L)
        const hue = (time * 0.1) % 1;
        materials.inside.color.setHSL(hue, 0.8, 0.15);

        // 電流閃現特效
        if (Math.random() < 0.03) { // 約每秒 1-2 次
            materials.inside.emissive.setHSL(hue, 1, 0.6);
            materials.inside.emissiveIntensity = 2.0;
        } else {
            materials.inside.emissive.set(0x000000);
        }
    } else {
        controls.update(); 
    }
    
    if (gizmoRenderer) {
        gizmo.quaternion.copy(camera.quaternion);
        
        gizmoRenderer.render(gizmoScene, gizmoCamera);
        labelRenderer.render(gizmoScene, gizmoCamera);
    }
    
    renderer.render(scene, camera);
}

// --- 處理視窗大小變更 ---
window.addEventListener('resize', () => {
    // Main scene
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();

    // Gizmo
    if (gizmoRenderer) {
        const gizmoContainer = document.getElementById('gizmo-container');
        gizmoCamera.aspect = gizmoContainer.clientWidth / gizmoContainer.clientHeight;
        gizmoCamera.updateProjectionMatrix();
        gizmoRenderer.setSize(gizmoContainer.clientWidth, gizmoContainer.clientHeight);
        labelRenderer.setSize(gizmoContainer.clientWidth, gizmoContainer.clientHeight);
    }
});

// --- 初始化執行 ---
setControlsEnabled(true);
resetIdleTimer(); // 新增：初始化閒置計時器
initGizmo();
animate();

// --- 新增：設定版權年份 ---
const yearSpan = document.getElementById('copyright-year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// --- 新增：閒置動畫變數 ---
let idleTimer;
let isIdleAnimationActive = false;
const IDLE_TIMEOUT = 12000; // 12 seconds

// --- For Testing ---
window.camera = camera;
