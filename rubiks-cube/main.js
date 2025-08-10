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

// --- 停用平移與縮放 ---
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
const CUBIE_GAP = 0.1; // 方塊間的間隙
const CUBE_DIMENSION = 3; // 3x3x3 魔術方塊

// 面板材質
const materials = {
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }),  // 紅色 (+X)
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }),   // 橘色 (-X)
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }),    // 白色 (+Y)
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }), // 黃色 (-Y)
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }),  // 藍色 (+Z)
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }),   // 綠色 (-Z)
    inside: new THREE.MeshStandardMaterial({ color: 0x111111 })  // 內部為深灰色
};

// 創建並定位27個小方塊
const cubies = [];
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
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
            const positionOffset = CUBIE_SIZE + CUBIE_GAP;
            cubie.position.set(x * positionOffset, y * positionOffset, z * positionOffset);
            
            // 跳過中心看不見的方塊
            if (x === 0 && y === 0 && z === 0) {
                 continue;
            }

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
let isRotating = false; // 動畫進行中標記

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
        - (pointer.clientY / window.innerHeight) * 2 + 1
    );

    const dragVector = currentPoint.clone().sub(dragStartPoint);

    if (dragVector.length() > 0.05) { // 設置一個閾值來觸發旋轉
        const worldNormal = selectedFaceNormal.clone().transformDirection(selectedCubie.matrixWorld);

        let majorAxis;
        if (Math.abs(worldNormal.x) > 0.5) majorAxis = 'x';
        else if (Math.abs(worldNormal.y) > 0.5) majorAxis = 'y';
        else majorAxis = 'z';

        let moveAxis;
        let direction;

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        let projectedDrag = new THREE.Vector3(dragVector.x, dragVector.y, 0);

        // 旋轉軸與方向的判斷 (這是整個功能最複雜的部分)
        switch(majorAxis) {
            case 'x':
                moveAxis = Math.abs(projectedDrag.y) > Math.abs(projectedDrag.x) ? 'y' : 'z';
                if (moveAxis === 'y') {
                    direction = projectedDrag.y > 0 ? -1 : 1;
                    if(worldNormal.x < 0) direction *= -1;
                } else { // 'z'
                    direction = projectedDrag.x > 0 ? 1 : -1;
                    if(worldNormal.x < 0) direction *= -1;
                }
                break;
            case 'y':
                 moveAxis = Math.abs(projectedDrag.x) > Math.abs(projectedDrag.y) ? 'x' : 'z';
                 if (moveAxis === 'x') {
                     direction = projectedDrag.x > 0 ? -1 : 1;
                     if(worldNormal.y < 0) direction *= -1;
                 } else { // 'z'
                     direction = projectedDrag.y > 0 ? 1 : -1;
                     if(worldNormal.y < 0) direction *= -1;
                 }
                break;
            case 'z':
                moveAxis = Math.abs(projectedDrag.x) > Math.abs(projectedDrag.y) ? 'x' : 'y';
                if (moveAxis === 'x') {
                    direction = projectedDrag.x > 0 ? 1 : -1;
                     if(worldNormal.z < 0) direction *= -1;
                } else { // 'y'
                    direction = projectedDrag.y > 0 ? 1 : -1;
                    if(worldNormal.z < 0) direction *= -1;
                }
                break;
        }

        rotateLayer(selectedCubie.position, moveAxis, direction);
        isDragging = false;
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

    const layer = [];
    const threshold = 0.5; // 用於判斷方塊是否在同一層
    
    cubies.forEach(cubie => {
        if (Math.abs(cubie.position[axis] - pivotPoint[axis]) < threshold) {
            layer.push(cubie);
        }
    });

    const pivot = new THREE.Object3D();
    scene.add(pivot);
    layer.forEach(cubie => pivot.attach(cubie));

    const targetQuaternion = new THREE.Quaternion();
    const targetAngle = (Math.PI / 2) * direction;
    const rotationAxis = new THREE.Vector3();
    if(axis === 'x') rotationAxis.set(1, 0, 0);
    if(axis === 'y') rotationAxis.set(0, 1, 0);
    if(axis === 'z') rotationAxis.set(0, 0, 1);
    targetQuaternion.setFromAxisAngle(rotationAxis, targetAngle);

    const animationDuration = 500; // 500ms
    const startTime = performance.now();

    function animateRotation() {
        const elapsedTime = performance.now() - startTime;
        const t = Math.min(1, elapsedTime / animationDuration);
        
        // 使用 Slerp (球面線性插值) 產生平滑動畫
        THREE.Quaternion.slerp(pivot.quaternion, targetQuaternion, pivot.quaternion, 0.15);

        if (t < 1) {
            requestAnimationFrame(animateRotation);
        } else {
            pivot.quaternion.copy(targetQuaternion); // 確保到達最終位置
            
            // 動畫結束後，更新方塊的世界座標並放回場景
            scene.remove(pivot);
            layer.forEach(cubie => {
                const worldPosition = new THREE.Vector3();
                const worldQuaternion = new THREE.Quaternion();
                cubie.getWorldPosition(worldPosition);
                cubie.getWorldQuaternion(worldQuaternion);
                
                rubiksCube.attach(cubie); // 放回 Group 中
                cubie.position.copy(worldPosition);
                cubie.quaternion.copy(worldQuaternion);

                // 四捨五入位置以校正浮點數誤差
                const positionOffset = CUBIE_SIZE + CUBIE_GAP;
                cubie.position.x = Math.round(cubie.position.x / positionOffset) * positionOffset;
                cubie.position.y = Math.round(cubie.position.y / positionOffset) * positionOffset;
                cubie.position.z = Math.round(cubie.position.z / positionOffset) * positionOffset;
            });
            isRotating = false;
        }
    }
    
    // 改用不同的動畫方式來避免抖動問題
    let currentAngle = 0;
    const step = () => {
        const angleStep = targetAngle * 0.1; // 每次旋轉目標角度的 10%
        pivot.rotateOnAxis(rotationAxis, angleStep);
        currentAngle += angleStep;

        if (Math.abs(currentAngle) < Math.abs(targetAngle)) {
            requestAnimationFrame(step);
        } else {
            // 動畫結束，校正最終位置
            pivot.setRotationFromAxisAngle(rotationAxis, targetAngle);

            scene.remove(pivot);
            layer.forEach(cubie => {
                const worldPosition = new THREE.Vector3();
                const worldQuaternion = new THREE.Quaternion();
                cubie.getWorldPosition(worldPosition);
                cubie.getWorldQuaternion(worldQuaternion);
                
                rubiksCube.attach(cubie);
                cubie.position.copy(worldPosition);
                cubie.quaternion.copy(worldQuaternion);

                const positionOffset = CUBIE_SIZE + CUBIE_GAP;
                cubie.position.x = Math.round(cubie.position.x / positionOffset) * positionOffset;
                cubie.position.y = Math.round(cubie.position.y / positionOffset) * positionOffset;
                cubie.position.z = Math.round(cubie.position.z / positionOffset) * positionOffset;
            });
            isRotating = false;
        }
    };
    step();
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
