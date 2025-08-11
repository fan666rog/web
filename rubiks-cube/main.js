import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 基本 Three.js 設定 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 控制項 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;

// --- UI 按鈕 ---
const scrambleBtn = document.getElementById('scramble-btn');
const resetBtn = document.getElementById('reset-btn');
const undoBtn = document.getElementById('undo-btn'); // 新增：上一步按鈕

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
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }),
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }),
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }),
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }),
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }),
    inside: new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
};

const cubies = [];
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            if (x === 0 && y === 0 && z === 0) continue;
            const cubie = new THREE.Mesh(new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE), [
                x === 1 ? materials.right : materials.inside, x === -1 ? materials.left : materials.inside,
                y === 1 ? materials.top : materials.inside, y === -1 ? materials.bottom : materials.inside,
                z === 1 ? materials.front : materials.inside, z === -1 ? materials.back : materials.inside
            ]);
            cubie.position.set(x * positionOffset, y * positionOffset, z * positionOffset);
            rubiksCube.add(cubie);
            cubies.push(cubie);
        }
    }
}
scene.add(rubiksCube);

// --- 旋轉與歷史紀錄邏輯 ---
let moveHistory = []; // *** 新增：動作儲存器 ***
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCubie = null, selectedFaceNormal = null, isDragging = false, dragStartPoint = new THREE.Vector2();
let isAnimating = false;

function setAllControlsEnabled(enabled) {
    isAnimating = !enabled;
    controls.enabled = enabled;
    scrambleBtn.disabled = !enabled;
    resetBtn.disabled = !enabled;
    undoBtn.disabled = !enabled || moveHistory.length === 0; // 如果沒有歷史紀錄，也禁用
}

function onPointerDown(event) {
    if (isAnimating) return;
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
        const worldNormal = selectedFaceNormal.clone().applyQuaternion(selectedCubie.quaternion);
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        const dragDir3D = cameraRight.clone().multiplyScalar(dragVector.x).add(cameraUp.clone().multiplyScalar(dragVector.y));
        const rotationAxis = new THREE.Vector3().crossVectors(worldNormal, dragDir3D).normalize();
        let mainAxis = 'x', maxDot = 0;
        ['x', 'y', 'z'].forEach(axis => {
            const dot = Math.abs(new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0).dot(rotationAxis));
            if (dot > maxDot) { maxDot = dot; mainAxis = axis; }
        });
        const direction = Math.sign(new THREE.Vector3(mainAxis === 'x' ? 1 : 0, mainAxis === 'y' ? 1 : 0, mainAxis === 'z' ? 1 : 0).dot(rotationAxis));
        rotateLayer(selectedCubie.position, mainAxis, direction, true); // true 代表需要記錄
    }
}

function onPointerUp() {
    if (!isAnimating) controls.enabled = true;
    isDragging = false;
}

function rotateLayer(pivotPoint, axis, direction, recordMove = false) {
    return new Promise(resolve => {
        if (recordMove) {
            const layer = Math.round(pivotPoint[axis] / positionOffset);
            moveHistory.push({ axis, layer, direction });
        }
        setAllControlsEnabled(false);
        const layerCubies = cubies.filter(c => Math.abs(c.position[axis] - pivotPoint[axis]) < 0.5);
        const pivot = new THREE.Object3D();
        scene.add(pivot);
        layerCubies.forEach(c => pivot.attach(c));
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
                layerCubies.forEach(c => {
                    const worldPos = new THREE.Vector3(), worldQuat = new THREE.Quaternion();
                    c.getWorldPosition(worldPos);
                    c.getWorldQuaternion(worldQuat);
                    rubiksCube.attach(c);
                    c.position.copy(worldPos).divideScalar(positionOffset).round().multiplyScalar(positionOffset);
                    c.quaternion.copy(worldQuat);
                });
                setAllControlsEnabled(true);
                resolve();
            }
        };
        requestAnimationFrame(animateRotation);
    });
}

// --- 按鈕功能 ---
async function scrambleCube() {
    setAllControlsEnabled(false);
    const moves = 25, axes = ['x', 'y', 'z'], layers = [-1, 0, 1];
    for (let i = 0; i < moves; i++) {
        const axis = axes[Math.floor(Math.random() * 3)];
        const layer = layers[Math.floor(Math.random() * 3)];
        const direction = Math.random() < 0.5 ? 1 : -1;
        const pivotPoint = new THREE.Vector3();
        pivotPoint[axis] = layer * positionOffset;
        await rotateLayer(pivotPoint, axis, direction, true);
    }
    setAllControlsEnabled(true);
}

// *** 關鍵修正：採用歷史回溯法的 Reset ***
async function resetCube() {
    setAllControlsEnabled(false);
    while (moveHistory.length > 0) {
        await undoMove(false); // 傳入 false 避免在重置過程中重複鎖定解鎖
    }
    setAllControlsEnabled(true);
}

// *** 新增：上一步功能 ***
async function undoMove(enableControls = true) {
    if (moveHistory.length === 0) return;
    if (enableControls) setAllControlsEnabled(false);
    const lastMove = moveHistory.pop();
    const pivotPoint = new THREE.Vector3();
    pivotPoint[lastMove.axis] = lastMove.layer * positionOffset;
    await rotateLayer(pivotPoint, lastMove.axis, -lastMove.direction, false); // 反向旋轉，且不記錄
    if (enableControls) setAllControlsEnabled(true);
}

// --- 事件監聽 ---
renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerup', onPointerUp);
scrambleBtn.addEventListener('click', scrambleCube);
resetBtn.addEventListener('click', resetCube);
undoBtn.addEventListener('click', () => undoMove());

// --- 動畫循環 ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- 處理視窗大小變更 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 初始狀態 ---
setAllControlsEnabled(true);
