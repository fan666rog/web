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
let gizmoRenderer, labelRenderer, gizmoScene, gizmoCamera, gizmo;

function initGizmo() {
    const gizmoContainer = document.getElementById('gizmo-container');
    if (!gizmoContainer) {
        console.error("Gizmo container not found!");
        return;
    }

    gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    gizmoRenderer.setSize(gizmoContainer.clientWidth, gizmoContainer.clientHeight);
    gizmoRenderer.setClearAlpha(0);
    gizmoContainer.appendChild(gizmoRenderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(gizmoContainer.clientWidth, gizmoContainer.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    gizmoContainer.appendChild(labelRenderer.domElement);
    
    gizmoScene = new THREE.Scene();
    gizmoScene.add(new THREE.AmbientLight(0xffffff, 3.0));

    const aspect = gizmoContainer.clientWidth / gizmoContainer.clientHeight;
    gizmoCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    gizmoCamera.position.set(0, 0, 4);
    gizmoCamera.lookAt(0, 0, 0);
    
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
        const arrow = new THREE.ArrowHelper(axisInfo.dir, new THREE.Vector3(0,0,0), axisLength, axisInfo.color, headLength, headWidth);
        gizmo.add(arrow);

        const labelDiv = document.createElement('div');
        labelDiv.textContent = axisInfo.name;
        labelDiv.style.color = `#${axisInfo.color.toString(16).padStart(6, '0')}`;
        labelDiv.style.fontFamily = 'monospace';
        labelDiv.style.fontSize = '16px';
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.textShadow = '0 0 3px #000';
        const label = new CSS2DObject(labelDiv);
        label.position.copy(axisInfo.dir).multiplyScalar(axisLength * 1.3);
        gizmo.add(label);
    });
}

// --- Idle Rotation & Effects ---
let idleTimer = null;
let isAutoRotating = false;
const electricMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0.0 },
        u_active: { value: 0.0 }
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
        uniform float u_active;
        varying vec2 vUv;

        // 2D Random function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // 2D Voronoi function
        vec2 voronoi(vec2 x, float time) {
            vec2 n = floor(x);
            vec2 f = fract(x);
            float min_dist = 1.0;
            float sec_min_dist = 1.0;

            for (int j = -1; j <= 1; j++) {
                for (int i = -1; i <= 1; i++) {
                    vec2 neighbor = vec2(float(i), float(j));
                    vec2 point = n + neighbor;
                    vec2 p_pos = point + 0.5 + 0.4 * sin(time + random(point) * 2.0 * 3.14159);
                    float dist = length(p_pos - x);
                    
                    if (dist < min_dist) {
                        sec_min_dist = min_dist;
                        min_dist = dist;
                    } else if (dist < sec_min_dist) {
                        sec_min_dist = dist;
                    }
                }
            }
            return vec2(min_dist, sec_min_dist);
        }

        void main() {
            vec3 baseColor = vec3(0.07);
            vec3 finalColor = baseColor;

            if (u_active > 0.5) {
                vec2 uv = vUv * 5.0; // Scale UV
                float t = u_time * 0.2;

                // Get Voronoi distances
                vec2 dists = voronoi(uv, t);
                
                // Create glowing lines from the difference of the two closest distances
                float voronoi_val = dists.y - dists.x;
                
                // Make the lines sharp and animated
                float lines = smoothstep(0.01, 0.02, voronoi_val);
                lines *= 0.5 + 0.5 * sin(dists.x * 10.0 + t * 5.0);
                
                // Time-varying color
                vec3 dynamicColor = 0.5 + 0.5 * cos(u_time * 0.8 + vec3(0.0, 1.5, 3.0));

                finalColor = mix(baseColor, dynamicColor, lines);
            }
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    side: THREE.DoubleSide
});

function startAutoRotation() {
    isAutoRotating = true;
    electricMaterial.uniforms.u_active.value = 1.0;
}

function stopAutoRotation() {
    isAutoRotating = false;
    electricMaterial.uniforms.u_active.value = 0.0;
}

function resetIdleTimer() {
    stopAutoRotation();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startAutoRotation, 12000);
}

// --- Camera Control Functions ---
function resetCameraOrientation() {
    camera.position.set(4, 4, 6);
    camera.up.set(0, 1, 0);
    camera.lookAt(scene.position);
}

function invertCamera() {
    camera.up.negate();
    camera.lookAt(scene.position);
}

function rotateCameraView() {
    const lookDirection = new THREE.Vector3();
    camera.getWorldDirection(lookDirection);
    const quaternion = new THREE.Quaternion().setFromAxisAngle(lookDirection, -Math.PI / 2);
    camera.up.applyQuaternion(quaternion);
    camera.lookAt(scene.position);
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
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }),
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }),
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }),
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }),
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }),
    inside: electricMaterial
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
    if (isAnimating) return;
    resetIdleTimer();
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
    resetIdleTimer();
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
function handleButton(action) {
    resetIdleTimer();
    action();
}

scrambleBtn.addEventListener('click', () => handleButton(async () => {
    setControlsEnabled(false);
    moveHistory = [];
    const moves = 25, axes = ['x', 'y', 'z'], layers = [-1, 0, 1];
    for (let i = 0; i < moves; i++) {
        const axis = axes[Math.floor(Math.random() * 3)];
        const layerIndex = layers[Math.floor(Math.random() * 3)];
        const direction = Math.random() < 0.5 ? 1 : -1;
        const pivotPoint = new THREE.Vector3();
        pivotPoint[axis] = layerIndex * positionOffset;
        await rotateLayer({ pivot: pivotPoint, axis: axis, direction: direction }, false);
    }
    setControlsEnabled(true);
}));

undoBtn.addEventListener('click', () => handleButton(async () => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    const reversedMove = { pivot: lastMove.pivot, axis: lastMove.axis, direction: -lastMove.direction };
    await rotateLayer(reversedMove, false);
}));

resetBtn.addEventListener('click', () => { window.location.reload(); });
if(resetViewBtn) resetViewBtn.addEventListener('click', () => handleButton(resetCameraOrientation));
if(invertViewBtn) invertViewBtn.addEventListener('click', () => handleButton(invertCamera));
if(rotateViewBtn) rotateViewBtn.addEventListener('click', () => handleButton(rotateCameraView));


// --- 事件監聽 ---
controls.addEventListener('start', resetIdleTimer);
renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerup', onPointerUp);


// --- 動畫循環 ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    controls.update(); 
    
    electricMaterial.uniforms.u_time.value += deltaTime;

    if (isAutoRotating) {
        const rotationSpeed = 0.2; // Radians per second
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed * deltaTime);
        camera.up.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed * deltaTime);
        camera.lookAt(scene.position);
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
resetIdleTimer();
animate();

// --- 新增：設定版權年份 ---
const yearSpan = document.getElementById('copyright-year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// --- For Testing ---
window.camera = camera;
window.electricMaterial = electricMaterial;
