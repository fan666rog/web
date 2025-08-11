import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 基本 Three.js 設定 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222); // 深灰色背景

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6); // 移動相機到更好的視角

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 控制項 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;

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
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }),  // 紅色 (+X)
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }),   // 橘色 (-X)
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }),    // 白色 (+Y)
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }), // 黃色 (-Y)
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }),  // 藍色 (+Z)
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }),   // 綠色 (-Z)
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

// --- 旋轉邏輯 ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCubie = null;
let selectedFaceNormal = null;
let isDragging = false;
let dragStartPoint = new THREE.Vector2();
let isRotating = false;

function onPointerDown(event) {
    if (isRotating) return;
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
    if (!isDragging || isRotating) return;

    const pointer = (event.touches) ? event.touches[0] : event;
    const currentPoint = new THREE.Vector2(
        (pointer.clientX / window.innerWidth) * 2 - 1,
        -(pointer.clientY / window.innerHeight) * 2 + 1
    );
    const dragVector = currentPoint.clone().sub(dragStartPoint);

    if (dragVector.length() > 0.05) { // 拖曳偵測的靈敏度
        const worldNormal = selectedFaceNormal.clone().applyQuaternion(selectedCubie.quaternion);
        
        // 取得相機視角的右方與上方向量
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        
        // 將2D拖曳向量轉換為3D空間中的拖曳方向
        const dragDir3D = cameraRight.multiplyScalar(dragVector.x).add(cameraUp.multiplyScalar(dragVector.y));
        
        // 透過叉積計算出垂直於「表面法線」和「拖曳方向」的旋轉軸
        const rotationAxis = new THREE.Vector3().crossVectors(worldNormal, dragDir3D).normalize();
        
        // 將計算出的旋轉軸，校正到最接近的X, Y, Z主軸上
        let mainAxis = 'x';
        let maxDot = 0;
        ['x', 'y', 'z'].forEach(axis => {
            const axisVec = new THREE.Vector3(axis === 'x' ? 1:0, axis === 'y' ? 1:0, axis === 'z' ? 1:0);
            const dot = Math.abs(axisVec.dot(rotationAxis));
            if (dot > maxDot) {
                maxDot = dot;
                mainAxis = axis;
            }
        });
        
        // 判斷旋轉方向 (順時針/逆時針)
        const mainRotationVec = new THREE.Vector3(mainAxis === 'x' ? 1:0, mainAxis === 'y' ? 1:0, mainAxis === 'z' ? 1:0);
        const direction = Math.sign(mainRotationVec.dot(rotationAxis));
        
        // 執行旋轉
        rotateLayer(selectedCubie.position, mainAxis, direction);
        isDragging = false; // 觸發一次後就停止，防止重複旋轉
    }
}


function onPointerUp() {
    controls.enabled = true;
    isDragging = false;
    selectedCubie = null;
    selectedFaceNormal = null;
}

function rotateLayer(pivotPoint, axis, direction) {
    if (isRotating) return;
    isRotating = true;

    const layer = cubies.filter(cubie => Math.abs(cubie.position[axis] - pivotPoint[axis]) < 0.5);
    const pivot = new THREE.Object3D();
    scene.add(pivot);
    layer.forEach(cubie => pivot.attach(cubie));

    const targetAngle = (Math.PI / 2) * direction;
    const rotationAxisVec = new THREE.Vector3(
        axis === 'x' ? 1 : 0,
        axis === 'y' ? 1 : 0,
        axis === 'z' ? 1 : 0
    );
    const animationDuration = 300; // ms
    const startTime = performance.now();

    const animateRotation = (time) => {
        const elapsed = time - startTime;
        const t = Math.min(1, elapsed / animationDuration);
        const easedT = 1 - Math.pow(1 - t, 3); // EaseOutCubic 緩動效果
        
        pivot.setRotationFromAxisAngle(rotationAxisVec, targetAngle * easedT);

        if (t < 1) {
            requestAnimationFrame(animateRotation);
        } else {
            pivot.setRotationFromAxisAngle(rotationAxisVec, targetAngle);
            scene.remove(pivot);
            layer.forEach(cubie => {
                const worldPosition = new THREE.Vector3();
                const worldQuaternion = new THREE.Quaternion();
                cubie.getWorldPosition(worldPosition);
                cubie.getWorldQuaternion(worldQuaternion);
                
                rubiksCube.attach(cubie);
                cubie.position.copy(worldPosition).divideScalar(positionOffset).round().multiplyScalar(positionOffset);
                cubie.quaternion.copy(worldQuaternion);
            });
            isRotating = false;
        }
    };
    requestAnimationFrame(animateRotation);
}


// --- 事件監聽 ---
renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerup', onPointerUp);

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

animate();
