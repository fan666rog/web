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

// --- 新增：酷炫的內部材質 ---
const insideMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
        u_time: { value: 0.0 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        varying vec2 vUv;

        // 2D隨機函數
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // 雜訊函數
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
        }

        void main() {
            vec2 st = vUv * 5.0; 
            st.x += u_time * 0.1; // 水平流動
            
            // 產生流動的雜訊圖案
            float n = noise(st * vec2(1.0, 3.0) + vec2(0.0, u_time * 0.2));
            
            // 增強對比度，形成閃電般的線條
            float intensity = pow(n, 20.0);
            
            // 定義電流顏色 (藍紫色系)
            vec3 color1 = vec3(0.1, 0.0, 0.3); // 深藍紫
            vec3 color2 = vec3(0.8, 0.5, 1.0); // 亮紫
            
            // 根據強度混合顏色
            vec3 finalColor = mix(color1, color2, intensity);

            // 加上隨時間閃爍的效果
            float flash = sin(u_time * 3.0) * 0.5 + 0.5;
            finalColor *= 0.5 + (flash * intensity * 1.5); // 只有亮部會閃爍

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
});


const materials = {
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Red
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }), // Orange
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }), // White
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Yellow
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }), // Blue
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }), // Green
    inside: insideMaterial // 使用新的 ShaderMaterial
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
let lastInteractionTime = Date.now(); // 新增：用於追蹤使用者最後操作時間

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
    if (isAnimating) return;
    lastInteractionTime = Date.now(); // 新增：更新使用者操作時間
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
    lastInteractionTime = Date.now(); // 新增：更新使用者操作時間
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

// --- 按鈕功能 ---
async function scrambleCube() {
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
    animateCamera(new THREE.Vector3(4, 4, 6), new THREE.Vector3(0, 1, 0));
}

function invertCamera() {
    const newUp = camera.up.clone().negate();
    animateCamera(camera.position.clone(), newUp);
}

function rotateCameraView() {
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
controls.addEventListener('change', () => { lastInteractionTime = Date.now(); }); // 新增：監聽視角操作


// --- 動畫循環 ---
const clock = new THREE.Clock(); // 新增：用於追蹤時間
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    
    const elapsedTime = clock.getElapsedTime(); // 新增：取得經過的時間
    insideMaterial.uniforms.u_time.value = elapsedTime; // 新增：更新shader時間

    // 新增：閒置時自動旋轉
    if (!isAnimating && Date.now() - lastInteractionTime > 12000) {
        rubiksCube.rotation.y += 0.002;
        rubiksCube.rotation.x += 0.0005;
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
initGizmo();
animate();

// --- 新增：設定版權年份 ---
const yearSpan = document.getElementById('copyright-year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// --- For Testing ---
window.camera = camera;
